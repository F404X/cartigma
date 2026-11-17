import {now,dayUTC,periodKeys,randomToken,sha256,hmac,json,readJSON,fail,difficulty,rate,ipOf} from "./lib.js";
import {requireUser} from "./auth.js";
import {countries,countryByCode} from "./catalog.js";
const LIMITS={normal:6,hard:4,rush:30};
const INITIAL={normal:2,hard:1,rush:1};
const RUSH_MS=60000;
export function clueSet(country){
  const lat=country.lat,lng=country.lng,area=country.area;
  const latAbs=Math.abs(lat);
  const hemisphere=lat>1?"Norte":lat<(-1)?"Sul":"Equador";
  const longSide=lng>=0?"Leste":"Oeste";
  return [
    {key:"continent",label:"Continente",value:{
      africa:"África",asia:"Ásia",europe:"Europa",oceania:"Oceania",
      northAmerica:"América do Norte",southAmerica:"América do Sul"
    }[country.continent]||"Desconhecido"},
    {key:"hemisphere",label:"Hemisfério de referência",value:hemisphere},
    {key:"landlocked",label:"Saída para o mar",value:country.landlocked?"Sem litoral":"Possui litoral"},
    {key:"area",label:"Área territorial",value:area<1000?"Menos de 1 mil km²":area<100000?"Entre 1 mil e 100 mil km²":area<1000000?"Entre 100 mil e 1 milhão de km²":"Mais de 1 milhão de km²"},
    {key:"latitude",label:"Latitude de referência",value:latAbs<15?"Próxima ao Equador":latAbs<35?"Baixa ou média latitude":latAbs<60?"Latitude média":"Alta latitude"},
    {key:"neighbors",label:"Fronteiras terrestres",value:country.borders===0?"Sem fronteiras terrestres":country.borders<=2?"Até 2 países":country.borders<=5?"Entre 3 e 5 países":"Mais de 5 países"},
    {key:"longitude",label:"Hemisfério longitudinal",value:longSide},
    {key:"currency",label:"Código da moeda",value:country.currency||"Não registrado"},
    {key:"longitudeZone",label:"Faixa de longitude",value:Math.abs(lng)<30?"Até 30° de Greenwich":Math.abs(lng)<90?"Entre 30° e 90° de Greenwich":"Além de 90° de Greenwich"},
    {key:"language",label:"Língua de referência",value:country.language||"Não registrada"}
  ];
}
export function points({difficulty:d,guesses,penalty,elapsedMs,won}){
  if(!won)return 0;
  if(d==="rush")return Math.max(0,Math.round(5000*(1-Math.min(RUSH_MS,elapsedMs)/RUSH_MS)));
  return Math.max(0,Math.max(250,Math.round(5000*Math.pow(.78,guesses-1)-penalty)));
}
async function targetFor(env,day,d){
  if(!env.GAME_SECRET||env.GAME_SECRET.length<32)fail(503,"game_not_configured");
  const digest=await hmac(env.GAME_SECRET,"country-daily-v1:"+day+":"+d);
  const number=(((digest[0]*256+digest[1])*256+digest[2])*256+digest[3])>>>0;
  return countries[number%countries.length].code;
}
function state(g,includeToken=false){
  const elapsed=Math.max(0,Date.now()-g.created_at*1000);
  const guesses=JSON.parse(g.guesses_json);
  const isFinished=g.finished_at!==null&&g.finished_at!==undefined;
  const accessible=g.difficulty==="rush"
    ?Math.min(10,INITIAL.rush+Math.floor(elapsed/6000)):g.revealed;
  const clues=clueSet(countryByCode.get(g.target_code));
  const response={
    id:g.id,day:g.day,difficulty:g.difficulty,startedAt:g.created_at*1000,
    remainingMs:g.difficulty==="rush"?Math.max(0,RUSH_MS-elapsed):null,
    revealed:accessible,clues:g.difficulty==="rush"&&!isFinished?clues:clues.slice(0,accessible),
    guesses:guesses.map(x=>x.code),finished:isFinished,won:Boolean(g.won),
    score:isFinished?g.score:null,penalty:g.penalty,hints:g.hints_bought,
    saved:Boolean(g.saved_user_id)
  };
  if(isFinished)response.target=g.target_code;
  return response;
}
async function lookup(request,env,body){
  const id=body.id,token=body.playToken;
  if(typeof id!=="string"||id.length!==36||typeof token!=="string"||token.length!==43)
    fail(401,"invalid_game_session");
  const hash=await sha256(token);
  const g=await env.DB.prepare("SELECT * FROM game_sessions WHERE id=? AND play_hash=?").bind(id,hash).first();
  if(!g)fail(404,"game_not_found");
  if(now()-g.created_at>2*86400)fail(410,"game_expired");
  return g;
}
function finished(g,won,elapsed){
  const count=JSON.parse(g.guesses_json).length;
  g.finished_at=now();g.won=won?1:0;
  g.score=points({difficulty:g.difficulty,guesses:count,penalty:g.penalty,
    elapsedMs:elapsed,won});
}
async function persist(env,g,previous){
  const result=await env.DB.prepare("UPDATE game_sessions SET guesses_json=?,revealed=?,penalty=?,hints_bought=?,finished_at=?,won=?,score=? WHERE id=? AND guesses_json=? AND revealed=? AND finished_at IS NULL")
    .bind(g.guesses_json,g.revealed,g.penalty,g.hints_bought,g.finished_at,g.won,g.score,
      g.id,previous.guesses_json,previous.revealed).run();
  if(result.meta?.changes!==1)fail(409,"game_state_conflict");
}
export async function gameRoute(request,env,path){
  if(request.method!=="POST")fail(405,"method_not_allowed");
  await rate(env,"GAME_LIMIT","game:"+ipOf(request));
  const body=await readJSON(request);
  if(path==="/v1/games/start"){
    const d=difficulty(body.difficulty);
    const day=dayUTC();
    const code=await targetFor(env,day,d);
    const playToken=randomToken();
    const g={id:crypto.randomUUID(),day,difficulty:d,target_code:code,created_at:now(),
      finished_at:null,guesses_json:"[]",revealed:INITIAL[d],
      penalty:0,hints_bought:0,won:0,score:0,saved_user_id:null};
    await env.DB.prepare("INSERT INTO game_sessions(id,play_hash,day,difficulty,target_code,created_at,guesses_json,revealed) VALUES(?,?,?,?,?,?,?,?)")
      .bind(g.id,await sha256(playToken),g.day,d,code,g.created_at,g.guesses_json,g.revealed).run();
    return json({...state(g),playToken},201);
  }
  const g=await lookup(request,env,body);
  const previous={...g};
  const elapsed=Math.max(0,Date.now()-g.created_at*1000);
  if(path==="/v1/games/save"){
    const user=await requireUser(request,env);
    if(!g.finished_at)fail(409,"game_unfinished");
    if(g.saved_user_id){
      if(g.saved_user_id!==user.id)fail(409,"game_already_saved");
      return json({...state(g),saved:true});
    }
    const keys=periodKeys(g.day),guesses=JSON.parse(g.guesses_json);
    try{
      await env.DB.batch([
        env.DB.prepare("INSERT INTO game_results(game_id,user_id,challenge_day,difficulty,week_key,month_key,score,won,guesses,hints,duration_ms,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
          .bind(g.id,user.id,g.day,g.difficulty,keys.week,keys.month,g.score,g.won,guesses.length,g.hints_bought,
            Math.max(0,(g.finished_at-g.created_at)*1000),now()),
        env.DB.prepare("UPDATE game_sessions SET saved_user_id=? WHERE id=? AND saved_user_id IS NULL").bind(user.id,g.id)
      ]);
    }catch(e){
      if(/UNIQUE constraint failed/i.test(String(e)))fail(409,"daily_score_already_saved");
      throw e;
    }
    g.saved_user_id=user.id;
    return json({...state(g),saved:true});
  }
  if(g.finished_at)return json(state(g));
  if(g.difficulty==="rush"&&elapsed>=RUSH_MS){
    finished(g,false,elapsed);await persist(env,g,previous);return json(state(g));
  }
  if(path==="/v1/games/guess"){
    const code=String(body.code||"").toUpperCase();
    if(!countryByCode.has(code))fail(400,"invalid_country");
    const guesses=JSON.parse(g.guesses_json);
    if(guesses.length>=LIMITS[g.difficulty])fail(409,"too_many_guesses");
    guesses.push({code,elapsedMs:elapsed});
    g.guesses_json=JSON.stringify(guesses);
    const won=code===g.target_code;
    if(won||guesses.length>=LIMITS[g.difficulty])finished(g,won,elapsed);
    else if(g.difficulty!=="rush")g.revealed=Math.min(10,Math.max(g.revealed,INITIAL[g.difficulty]+guesses.length));
    await persist(env,g,previous);
    return json(state(g));
  }
  if(path==="/v1/games/reveal"){
    if(g.difficulty==="rush")fail(409,"rush_auto_hints");
    if(g.revealed>=10)fail(409,"all_hints_revealed");
    g.revealed++;g.hints_bought++;
    g.penalty+=g.difficulty==="hard"?450:300;
    await persist(env,g,previous);
    return json(state(g));
  }
  if(path==="/v1/games/finish"){
    finished(g,false,elapsed);
    await persist(env,g,previous);
    return json(state(g));
  }
  fail(404,"not_found");
}
