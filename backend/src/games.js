import {now,dayUTC,periodKeys,randomToken,sha256,hmac,json,readJSON,fail,difficulty,rate} from "./lib.js";
import {requireUser} from "./auth.js";
import {countries,countryByCode} from "./catalog.js";
import {insights,denominations} from "./clue-data.js";
import "../../shared-clues.js";
const EVIDENCE=globalThis.CartigmaClueEngine;
const {DIFFICULTIES,RULES_VERSION,RUSH_DURATION_MS,RUSH_CLUE_INTERVAL_MS}=EVIDENCE;
const decks=new Map();
const pickCountry=EVIDENCE.countryPicker(countries);
const randomWord=()=>crypto.getRandomValues(new Uint32Array(1))[0];
const sessionQuery=`SELECT g.*,r.mode,r.user_id AS owner_user_id,r.duration_ms,r.awarded_points,
  v.version AS rules_version,v.started_at_ms
  FROM ranked_matches r JOIN game_sessions g ON g.id=r.game_id
  LEFT JOIN game_rules v ON v.game_id=g.id`;

export function clueSet(country,level="normal",version=RULES_VERSION){
  const key=country.code+":"+level+":"+version;
  if(!decks.has(key)){
    decks.set(key,EVIDENCE.buildClues(country,insights[country.code],level,
      denominations,countries,version));
  }
  return decks.get(key);
}
export function points(args){
  return EVIDENCE.scoreFor(args);
}
function purchasedPenalty(game){
  return game._overlays.reduce((sum,key)=>sum+EVIDENCE.overlayCost(key,game.difficulty),0);
}
async function targetFor(env,day,level){
  // Keep the same Daily answer for accounts playing a case already issued
  // before the continental draw was deployed.
  const legacy=await env.DB.prepare(`SELECT g.target_code FROM ranked_reservations r
    JOIN game_sessions g ON g.id=r.game_id WHERE r.challenge_day=? AND r.difficulty=?
      AND r.mode='daily' LIMIT 1`).bind(day,level).first();
  if(legacy)return legacy.target_code;
  if(!env.GAME_SECRET||env.GAME_SECRET.length<32)fail(503,"game_not_configured");
  // Draw the continent and country independently from the secret daily seed.
  const digest=await hmac(env.GAME_SECRET,"country-daily-v2:"+day+":"+level);
  const words=new DataView(digest.buffer);
  let offset=0;
  return pickCountry(()=>{
    const value=offset<words.byteLength?words.getUint32(offset):EVIDENCE.hash(day+":"+level+":"+words.getUint32(0)+":"+offset);
    offset+=4;
    return value;
  }).code;
}
const startTime=g=>g.started_at_ms??g.created_at*1000;
const elapsedTime=g=>Math.max(0,Date.now()-startTime(g));
const versionOf=g=>g.rules_version??7;
const cluesFor=g=>clueSet(countryByCode.get(g.target_code),g.difficulty,versionOf(g));
function state(g){
  const elapsed=elapsedTime(g);
  const guesses=JSON.parse(g.guesses_json);
  const isFinished=g.finished_at!==null;
  const clues=cluesFor(g);
  const rush=g.difficulty==="rush";
  const accessible=Math.min(clues.length,isFinished?clues.length:rush
    ?DIFFICULTIES.rush.initial+Math.floor(elapsed/RUSH_CLUE_INTERVAL_MS):g.revealed);
  const nextHintCost=!isFinished&&!rush&&accessible<clues.length
    ?EVIDENCE.clueCost(clues[accessible],g.difficulty):0;
  const target=countryByCode.get(g.target_code);
  const duration=g.duration_ms??Math.max(0,g.finished_at*1000-startTime(g));
  const response={
    id:g.id,day:g.day,difficulty:g.difficulty,startedAt:startTime(g),
    elapsedMs:isFinished?duration:elapsed,
    remainingMs:rush?Math.max(0,RUSH_DURATION_MS-elapsed):null,
    revealed:accessible,clues:clues.slice(0,accessible),rulesVersion:versionOf(g),
    clueCount:clues.length,nextHintCost,mode:g.mode,
    overlays:g._overlays,sectorMapPenalty:purchasedPenalty(g),
    guesses:guesses.map(({code,elapsedMs})=>({code,elapsedMs,
      feedback:versionOf(g)===7?null:EVIDENCE.guessFeedback(countryByCode.get(code),target,g.difficulty)})),
    finished:isFinished,won:Boolean(g.won),score:isFinished?g.score:null,
    penalty:g.penalty,hints:g.hints_bought,saved:Boolean(g.saved_user_id)
  };
  if(isFinished){
    response.target=g.target_code;
    response.rankingPoints=g.awarded_points??null;
  }
  return response;
}
async function loadOverlays(env,g){
  const overlays=await env.DB.prepare("SELECT clue_key FROM game_overlays WHERE game_id=?")
    .bind(g.id).all();
  g._overlays=(overlays.results||[]).map(row=>row.clue_key);
  return g;
}
async function lookup(env,user,body){
  const {id,playToken}=body;
  if(typeof id!=="string"||id.length!==36||
    (playToken!==undefined&&(typeof playToken!=="string"||playToken.length!==43)))
    fail(401,"invalid_game_session");
  const hash=playToken===undefined?null:await sha256(playToken);
  const g=await env.DB.prepare(sessionQuery+" WHERE g.id=? AND r.user_id=? AND (? IS NULL OR g.play_hash=?)")
    .bind(id,user.id,hash,hash).first();
  if(!g)fail(404,"game_not_found");
  if(now()-g.created_at>2*86400)fail(410,"game_expired");
  return loadOverlays(env,g);
}
function finish(g,won,elapsed){
  g.finished_at=now();
  g.won=won?1:0;
  g.duration_ms=elapsed;
  g.score=points({difficulty:g.difficulty,guesses:JSON.parse(g.guesses_json).length,
    penalty:g.penalty,sectorMapPenalty:purchasedPenalty(g),elapsedMs:elapsed,won});
}
function resultStatements(env,g){
  const keys=periodKeys(g.day);
  return [
    env.DB.prepare(`UPDATE ranked_matches SET duration_ms=?,awarded_points=(
        SELECT CASE WHEN g.saved_user_id IS NOT NULL THEN g.score
          ELSE MAX(0,g.score-COALESCE(b.score,0)) END FROM game_sessions g
        LEFT JOIN game_results b ON b.user_id=? AND b.challenge_day=g.day AND b.difficulty=g.difficulty
        WHERE g.id=ranked_matches.game_id)
      WHERE game_id=? AND duration_ms IS NULL
        AND EXISTS(SELECT 1 FROM game_sessions WHERE id=? AND finished_at IS NOT NULL)`)
      .bind(g.duration_ms??(g.finished_at-g.created_at)*1000,g.owner_user_id,g.id,g.id),
    env.DB.prepare(`INSERT INTO game_results(game_id,user_id,challenge_day,difficulty,week_key,
      month_key,score,won,guesses,hints,duration_ms,created_at)
      SELECT g.id,?,g.day,g.difficulty,?,?,g.score,g.won,json_array_length(g.guesses_json),
        g.hints_bought,r.duration_ms,?
      FROM game_sessions g JOIN ranked_matches r ON r.game_id=g.id
      WHERE g.id=? AND g.finished_at IS NOT NULL AND g.saved_user_id IS NULL
      ON CONFLICT(user_id,challenge_day,difficulty) DO UPDATE SET
        game_id=excluded.game_id,score=excluded.score,won=excluded.won,guesses=excluded.guesses,
        hints=excluded.hints,duration_ms=excluded.duration_ms,created_at=excluded.created_at
      WHERE excluded.score>game_results.score OR (
        excluded.score=game_results.score AND excluded.won=1
        AND (game_results.won=0 OR excluded.duration_ms<game_results.duration_ms)
      )`)
      .bind(g.owner_user_id,keys.week,keys.month,now(),g.id),
    env.DB.prepare(`UPDATE game_sessions SET saved_user_id=? WHERE id=? AND saved_user_id IS NULL
      AND finished_at IS NOT NULL`).bind(g.owner_user_id,g.id)
  ];
}
async function loadSavedResult(env,g){
  const result=await env.DB.prepare("SELECT awarded_points,duration_ms FROM ranked_matches WHERE game_id=?")
    .bind(g.id).first();
  g.awarded_points=result.awarded_points;
  g.duration_ms=result.duration_ms;
  g.saved_user_id=g.owner_user_id;
}
async function save(env,g){
  if(g.saved_user_id&&g.duration_ms!==null)return;
  await env.DB.batch(resultStatements(env,g));
  await loadSavedResult(env,g);
}
async function persist(env,g,previous){
  const update=env.DB.prepare(`UPDATE game_sessions
    SET guesses_json=?,revealed=?,penalty=?,hints_bought=?,finished_at=?,won=?,score=?
    WHERE id=? AND guesses_json=? AND revealed=? AND finished_at IS NULL
    AND (SELECT COUNT(*) FROM game_overlays WHERE game_id=?)=?`)
    .bind(g.guesses_json,g.revealed,g.penalty,g.hints_bought,g.finished_at,g.won,g.score,
      g.id,previous.guesses_json,previous.revealed,g.id,previous._overlays.length);
  const [result]=g.finished_at
    ?await env.DB.batch([update,...resultStatements(env,g)])
    :[await update.run()];
  if(result.meta?.changes!==1)fail(409,"game_state_conflict");
  if(g.finished_at)await loadSavedResult(env,g);
}
async function reservation(env,user,day,level,mode){
  const activeOnly=mode==="free"?" AND r.duration_ms IS NULL":"";
  return env.DB.prepare(sessionQuery+" WHERE r.user_id=? AND r.challenge_day=? AND r.difficulty=? AND r.mode=?"+activeOnly)
    .bind(user.id,day,level,mode).first();
}
export async function gameRoute(request,env,path){
  if(request.method!=="POST")fail(405,"method_not_allowed");
  const user=await requireUser(request,env);
  await rate(env,"GAME_LIMIT","game:"+user.id);
  const body=await readJSON(request);
  if(path==="/v1/games/start"||path==="/v1/games/resume"){
    const level=difficulty(body.difficulty);
    const mode=body.mode==="free"?"free":"daily";
    const day=dayUTC();
    if(path==="/v1/games/resume"){
      const existing=await reservation(env,user,day,level,mode);
      if(!existing)return json({game:null,claimed:false});
      await loadOverlays(env,existing);
      await settle(env,existing);
      const game=state(existing);
      return json(mode==="free"&&game.finished?{game:null,claimed:false}:{game,claimed:true});
    }
    const code=mode==="daily"?await targetFor(env,day,level):pickCountry(randomWord).code;
    const playToken=randomToken();
    const startedAt=Date.now();
    const g={id:crypto.randomUUID(),day,difficulty:level,mode,owner_user_id:user.id,
      target_code:code,created_at:Math.floor(startedAt/1000),started_at_ms:startedAt,
      rules_version:RULES_VERSION,finished_at:null,guesses_json:"[]",revealed:DIFFICULTIES[level].initial,
      penalty:0,hints_bought:0,won:0,score:0,saved_user_id:null,_overlays:[]};
    try{
      await env.DB.batch([
        env.DB.prepare("INSERT INTO game_sessions(id,play_hash,day,difficulty,target_code,created_at,guesses_json,revealed) VALUES(?,?,?,?,?,?,?,?)")
          .bind(g.id,await sha256(playToken),g.day,level,code,g.created_at,g.guesses_json,g.revealed),
        env.DB.prepare("INSERT INTO ranked_matches(user_id,game_id,challenge_day,difficulty,mode) VALUES(?,?,?,?,?)")
          .bind(user.id,g.id,day,level,mode),
        env.DB.prepare("INSERT INTO game_rules(game_id,version,started_at_ms) VALUES(?,?,?)")
          .bind(g.id,RULES_VERSION,startedAt)
      ]);
    }catch(error){
      if(/UNIQUE constraint failed/i.test(String(error)))fail(409,"ranked_attempt_already_started");
      throw error;
    }
    return json({...state(g),playToken},201);
  }
  const g=await lookup(env,user,body);
  if(path==="/v1/games/save"&&!g.finished_at)fail(409,"game_unfinished");
  const elapsed=elapsedTime(g);
  if(await settle(env,g,elapsed))return json(state(g));
  if(path==="/v1/games/state")return json(state(g));
  const previous={...g};
  if(path==="/v1/games/overlay"){
    if(g.difficulty==="rush")fail(409,"rush_no_overlays");
    const key=String(body.key||"");
    if(!["continent","hemisphere","longitude"].includes(key))fail(400,"invalid_overlay");
    if(!cluesFor(g).slice(0,g.revealed).some(clue=>clue.key===key))fail(409,"overlay_clue_locked");
    if(g._overlays.includes(key))fail(409,"overlay_already_purchased");
    const inserted=await env.DB.prepare(`INSERT INTO game_overlays(game_id,clue_key)
      SELECT id,? FROM game_sessions WHERE id=? AND finished_at IS NULL
      ON CONFLICT(game_id,clue_key) DO NOTHING`).bind(key,g.id).run();
    if(inserted.meta?.changes!==1)fail(409,"game_state_conflict");
    g._overlays.push(key);
    return json(state(g));
  }
  if(path==="/v1/games/guess"){
    const code=String(body.code||"").toUpperCase();
    if(!countryByCode.has(code))fail(400,"invalid_country");
    const guesses=JSON.parse(g.guesses_json);
    const limit=DIFFICULTIES[g.difficulty].attempts;
    if(guesses.length>=limit)fail(409,"too_many_guesses");
    if(guesses.some(guess=>guess.code===code))fail(409,"country_already_guessed");
    guesses.push({code,elapsedMs:elapsed});
    g.guesses_json=JSON.stringify(guesses);
    const won=code===g.target_code;
    if(won||guesses.length>=limit)finish(g,won,elapsed);
    else if(g.difficulty!=="rush"){
      g.revealed=EVIDENCE.revealAfterMiss(g.revealed,g.difficulty,guesses.length,
        cluesFor(g).length,versionOf(g));
    }
  }else if(path==="/v1/games/reveal"){
    if(g.difficulty==="rush")fail(409,"rush_auto_hints");
    const clues=cluesFor(g);
    if(g.revealed>=clues.length)fail(409,"all_hints_revealed");
    g.penalty+=EVIDENCE.clueCost(clues[g.revealed],g.difficulty);
    g.revealed++;g.hints_bought++;
  }else if(path==="/v1/games/finish"){
    finish(g,false,elapsed);
  }else{
    fail(404,"not_found");
  }
  await persist(env,g,previous);
  return json(state(g));
}
async function settle(env,g,elapsed=elapsedTime(g)){
  if(g.finished_at){
    await save(env,g);
    return true;
  }
  if(g.difficulty==="rush"&&elapsed>=RUSH_DURATION_MS){
    const previous={...g};
    finish(g,false,RUSH_DURATION_MS);
    await persist(env,g,previous);
    return true;
  }
  return false;
}
