import {now,dayUTC,periodKeys,randomToken,sha256,hmac,json,readJSON,fail,difficulty,rate,ipOf} from "./lib.js";
import {requireUser} from "./auth.js";
import {countries,countryByCode} from "./catalog.js";
import {insights,denominations} from "./clue-data.js";
import "../../shared-clues.js";
const EVIDENCE=globalThis.CartigmaClueEngine;
const LIMITS={normal:6,hard:4,rush:Infinity};
const INITIAL={normal:2,hard:1,rush:1};
const RUSH_MS=60000;
export function clueSet(country,difficulty="normal"){
  return EVIDENCE.buildClues(country,insights[country.code],difficulty,denominations);
}
export function points({difficulty,guesses,penalty,sectorMapPenalty=0,elapsedMs,won}){
  return EVIDENCE.scoreFor({difficulty,guesses,penalty,sectorMapPenalty,elapsedMs,won});
}
function purchasedPenalty(game){
  return (game._overlays||[]).reduce((sum,key)=>
    sum+EVIDENCE.overlayCost(key,game.difficulty),0);
}
async function targetFor(env,day,d){
  if(!env.GAME_SECRET||env.GAME_SECRET.length<32)fail(503,"game_not_configured");
  const digest=await hmac(env.GAME_SECRET,"country-daily-v1:"+day+":"+d);
  const number=(((digest[0]*256+digest[1])*256+digest[2])*256+digest[3])>>>0;
  return countries[number%countries.length].code;
}
function state(g){
  const elapsed=Math.max(0,Date.now()-g.created_at*1000);
  const guesses=JSON.parse(g.guesses_json);
  const isFinished=g.finished_at!==null&&g.finished_at!==undefined;
  const clues=clueSet(countryByCode.get(g.target_code),g.difficulty);
  const accessible=Math.min(clues.length,isFinished?clues.length:g.difficulty==="rush"
    ?INITIAL.rush+Math.floor(elapsed/6000):g.revealed);
  const nextHintCost=!isFinished&&g.difficulty!=="rush"&&accessible<clues.length
    ?EVIDENCE.clueCost(clues[accessible],g.difficulty):0;
  const response={
    id:g.id,day:g.day,difficulty:g.difficulty,startedAt:g.created_at*1000,
    remainingMs:g.difficulty==="rush"?Math.max(0,RUSH_MS-elapsed):null,
    revealed:accessible,clues:clues.slice(0,accessible),
    clueCount:clues.length,nextHintCost,mode:g.mode||"daily",
    overlays:g._overlays||[],sectorMapPenalty:purchasedPenalty(g),
    guesses:guesses.map(x=>({code:x.code,elapsedMs:x.elapsedMs})),finished:isFinished,won:Boolean(g.won),
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
  const g=await env.DB.prepare("SELECT g.*,r.mode,r.user_id AS owner_user_id FROM game_sessions g JOIN ranked_reservations r ON r.game_id=g.id WHERE g.id=? AND g.play_hash=?").bind(id,hash).first();
  if(!g)fail(404,"game_not_found");
  const user=await requireUser(request,env);
  if(user.id!==g.owner_user_id)fail(403,"not_your_game");
  if(now()-g.created_at>2*86400)fail(410,"game_expired");
  const overlays=await env.DB.prepare("SELECT clue_key FROM game_overlays WHERE game_id=?")
    .bind(g.id).all();
  g._overlays=(overlays.results||[]).map(row=>row.clue_key);
  return g;
}
function finished(g,won,elapsed){
  const count=JSON.parse(g.guesses_json).length;
  g.finished_at=now();g.won=won?1:0;
  g.score=points({difficulty:g.difficulty,guesses:count,penalty:g.penalty,
    sectorMapPenalty:purchasedPenalty(g),elapsedMs:elapsed,won});
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
    const user=await requireUser(request,env);
    const d=difficulty(body.difficulty);
    const mode=body.mode==="free"?"free":"daily";
    const day=dayUTC();
    const code=mode==="daily"?await targetFor(env,day,d):countries[crypto.getRandomValues(new Uint32Array(1))[0]%countries.length].code;
    const playToken=randomToken();
    const g={id:crypto.randomUUID(),day,difficulty:d,mode,owner_user_id:user.id,target_code:code,created_at:now(),
      finished_at:null,guesses_json:"[]",revealed:INITIAL[d],
      penalty:0,hints_bought:0,won:0,score:0,saved_user_id:null,_overlays:[]};
    try{
      await env.DB.batch([
        env.DB.prepare("INSERT INTO game_sessions(id,play_hash,day,difficulty,target_code,created_at,guesses_json,revealed) VALUES(?,?,?,?,?,?,?,?)")
          .bind(g.id,await sha256(playToken),g.day,d,code,g.created_at,g.guesses_json,g.revealed),
        env.DB.prepare("INSERT INTO ranked_reservations(user_id,game_id,challenge_day,difficulty,mode) VALUES(?,?,?,?,?)")
          .bind(user.id,g.id,day,d,mode)
      ]);
    }catch(error){
      if(/UNIQUE constraint failed/i.test(String(error)))fail(409,"ranked_attempt_already_started");
      throw error;
    }
    return json({...state(g),playToken},201);
  }
  const g=await lookup(request,env,body);
  if(path==="/v1/games/state")return json(state(g));
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
  if(path==="/v1/games/overlay"){
    if(g.difficulty==="rush")fail(409,"rush_no_overlays");
    const key=String(body.key||"");
    if(!["continent","hemisphere","longitude"].includes(key))fail(400,"invalid_overlay");
    const clues=clueSet(countryByCode.get(g.target_code),g.difficulty);
    if(!clues.slice(0,Math.min(g.revealed,clues.length)).some(clue=>clue.key===key))
      fail(409,"overlay_clue_locked");
    if(g._overlays.includes(key))fail(409,"overlay_already_purchased");
    try{
      await env.DB.prepare("INSERT INTO game_overlays(game_id,clue_key) VALUES(?,?)")
        .bind(g.id,key).run();
    }catch(error){
      if(/UNIQUE constraint failed/i.test(String(error)))fail(409,"overlay_already_purchased");
      throw error;
    }
    g._overlays.push(key);
    return json(state(g));
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
    else if(g.difficulty!=="rush"){
      const limit=clueSet(countryByCode.get(g.target_code),g.difficulty).length;
      g.revealed=Math.min(limit,Math.max(g.revealed,INITIAL[g.difficulty]+guesses.length));
    }
    await persist(env,g,previous);
    return json(state(g));
  }
  if(path==="/v1/games/reveal"){
    if(g.difficulty==="rush")fail(409,"rush_auto_hints");
    const clues=clueSet(countryByCode.get(g.target_code),g.difficulty);
    if(g.revealed>=clues.length)fail(409,"all_hints_revealed");
    g.penalty+=EVIDENCE.clueCost(clues[g.revealed],g.difficulty);
    g.revealed++;g.hints_bought++;
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
