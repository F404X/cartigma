import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import worker from "../src/index.js";
import {dayUTC,sha256} from "../src/lib.js";

const schema=readFileSync(new URL("../schema.sql",import.meta.url),"utf8");
const origin="https://cartigma.example";
async function setup(t){
  const sql=new DatabaseSync(":memory:");
  t.after(()=>sql.close());
  sql.exec(schema);
  const DB={
    prepare(query){
      return {
        bind(...args){
          const statement=sql.prepare(query);
          return {
            async first(){return statement.get(...args)??null;},
            async all(){return {results:statement.all(...args)};},
            run(){
              if(/^SELECT/.test(query.trimStart()))return {results:statement.all(...args)};
              return {meta:statement.run(...args)};
            }
          };
        }
      };
    },
    async batch(statements){
      sql.exec("BEGIN");
      try{
        const results=statements.map(statement=>statement.run());
        sql.exec("COMMIT");
        return results;
      }catch(error){
        sql.exec("ROLLBACK");
        throw error;
      }
    }
  };
  const tokens={first:"A".repeat(43),second:"B".repeat(43)};
  const now=Math.floor(Date.now()/1000);
  for(const [user,token] of Object.entries(tokens)){
    sql.prepare("INSERT INTO users(id,username,email,password_hash,password_salt,created_at) VALUES(?,?,?,?,?,?)")
      .run(user,user,user+"@example.org","unused","unused",now);
    sql.prepare("INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)")
      .run(await sha256(token),user,now,now+86400);
  }
  const env={DB,APP_ORIGIN:origin,GAME_SECRET:"S".repeat(32)};
  async function call(action,body,user="first"){
    const headers={Origin:origin,"Content-Type":"application/json"};
    if(tokens[user])headers.Cookie="__Host-cartigma_session="+tokens[user];
    const response=await worker.fetch(new Request(origin+"/v1/games/"+action,{
      method:"POST",headers,body:JSON.stringify(body)
    }),env);
    return {status:response.status,data:await response.json()};
  }
  async function leaderboard(){
    const response=await worker.fetch(new Request(origin+"/v1/leaderboards"),env);
    assert.equal(response.status,200);
    return (await response.json()).boards;
  }
  return {sql,call,leaderboard};
}

test("a ranked case resumes for its owner, unlocks evidence after purchases, and saves exactly once",async t=>{
  const {sql,call}=await setup(t);
  const parameters={mode:"free",difficulty:"normal"};
  const {status,data:game}=await call("start",parameters);
  assert.equal(status,201);
  assert.equal(game.rulesVersion,8);
  assert.equal(game.clues.length,2);
  assert.equal("target" in game,false);
  const {target_code:target}=sql.prepare("SELECT target_code FROM game_sessions WHERE id=?").get(game.id);
  const session={id:game.id};
  assert.equal((await call("resume",parameters)).data.game.id,game.id);
  assert.deepEqual((await call("resume",{...parameters,mode:"daily"})).data,{game:null,claimed:false});
  assert.equal((await call("state",session,"second")).status,404);
  assert.equal((await call("state",session,null)).status,401);

  const reveal=await call("reveal",session);
  assert.equal(reveal.data.penalty,game.nextHintCost);
  assert.equal(reveal.data.revealed,3);
  const wrong={...session,code:target==="BR"?"AR":"BR"};
  const miss=await call("guess",wrong);
  assert.equal(miss.data.revealed,4);
  assert.equal(miss.data.guesses.length,1);
  assert.ok(Number.isInteger(miss.data.guesses[0].feedback.direction));
  assert.equal("target" in miss.data,false);
  assert.equal((await call("guess",wrong)).data.error,"country_already_guessed");
  const overlay=await call("overlay",{...session,key:"continent"});
  assert.equal(overlay.data.sectorMapPenalty,500);
  assert.equal((await call("overlay",{...session,key:"continent"})).status,409);

  const {data:win}=await call("guess",{...session,code:target});
  assert.equal(win.won,true);
  assert.equal(win.target,target);
  assert.equal(win.saved,true);
  assert.equal(win.score,3900-game.nextHintCost-500);
  assert.equal((await call("save",session)).data.saved,true);
  assert.deepEqual((await call("resume",parameters)).data,{game:null,claimed:false});
  const total=sql.prepare("SELECT points,games FROM player_stats WHERE period_type='total'").get();
  assert.equal(total.points,win.score);
  assert.equal(total.games,1);
  assert.equal(sql.prepare("SELECT COUNT(*) AS count FROM game_results").get().count,1);
});

test("a ranked Rush timeout finalizes on state and preserves the actual duration",async t=>{
  const {sql,call}=await setup(t);
  const {data:game}=await call("start",{mode:"daily",difficulty:"rush"});
  assert.equal(game.finished,false);
  sql.prepare("UPDATE game_rules SET started_at_ms=? WHERE game_id=?").run(Date.now()-61000,game.id);
  const {data:expired}=await call("state",{id:game.id});
  assert.equal(expired.won,false);
  assert.equal(expired.finished,true);
  assert.equal(expired.saved,true);
  assert.equal(expired.elapsedMs,60000);
  assert.equal(expired.remainingMs,0);
  assert.equal(expired.score,0);
  assert.match(expired.target,/^[A-Z]{2}$/);
});

test("a daily reservation from the previous ruleset keeps its clues after migration",async t=>{
  const {sql,call}=await setup(t);
  const id="00000000-0000-4000-8000-000000000000",day=dayUTC();
  sql.prepare(`INSERT INTO game_sessions(id,play_hash,day,difficulty,target_code,created_at,revealed)
    VALUES(?,?,?,?,?,?,?)`).run(id,"unused",day,"hard","TR",Math.floor(Date.now()/1000),1);
  sql.prepare("INSERT INTO ranked_reservations(user_id,game_id,challenge_day,difficulty,mode) VALUES(?,?,?,?,?)")
    .run("first",id,day,"hard","daily");
  sql.exec(schema);
  const {data}=await call("resume",{mode:"daily",difficulty:"hard"});
  assert.equal(data.game.id,id);
  assert.equal(data.game.rulesVersion,7);
  const {data:guess}=await call("guess",{id,code:"BR"});
  assert.equal(guess.revealed,2);
  assert.equal(guess.guesses[0].feedback,null);
});


test("a simultaneous overlay and win cannot desynchronize the saved score",async t=>{
  const {sql,call}=await setup(t);
  const {data:game}=await call("start",{mode:"daily",difficulty:"normal"});
  const {target_code:target}=sql.prepare("SELECT target_code FROM game_sessions WHERE id=?").get(game.id);
  const session={id:game.id};
  const actions=await Promise.all([
    call("overlay",{...session,key:"continent"}),
    call("guess",{...session,code:target})
  ]);
  for(const response of actions)assert.ok([200,409].includes(response.status));
  let {data:state}=await call("state",session);
  if(!state.finished)({data:state}=await call("guess",{...session,code:target}));
  assert.equal(state.won,true);
  assert.equal(state.saved,true);
  assert.equal(state.score,5000-state.sectorMapPenalty);
  const total=sql.prepare("SELECT points,games FROM player_stats WHERE period_type='total'").get();
  assert.equal(total.points,state.score);
  assert.equal(total.games,1);
});


test("a new Freeplay win replaces the day’s zero score and appears in all three boards",async t=>{
  const {sql,call,leaderboard}=await setup(t);
  const parameters={mode:"free",difficulty:"normal"};
  const {data:daily}=await call("start",{...parameters,mode:"daily"});
  assert.equal((await call("finish",{id:daily.id})).data.rankingPoints,0);
  const loss=(await leaderboard()).normal.week[0];
  assert.equal(loss.points,0);
  assert.equal(loss.solve_time_ms,null);

  const {data:first}=await call("start",parameters);
  assert.equal((await call("start",parameters)).status,409);
  const targetFor=id=>sql.prepare("SELECT target_code FROM game_sessions WHERE id=?").get(id).target_code;
  const {data:win}=await call("guess",{id:first.id,code:targetFor(first.id)});
  assert.equal(win.score,5000);
  assert.equal(win.rankingPoints,5000);
  const boards=await leaderboard();
  for(const period of ["week","month","total"]){
    assert.deepEqual(boards.normal[period],[{username:"first",points:5000,wins:1,games:1,solve_time_ms:win.elapsedMs}]);
  }

  const {data:second}=await call("start",parameters);
  assert.notEqual(second.id,first.id);
  const {data:repeat}=await call("guess",{id:second.id,code:targetFor(second.id)});
  assert.equal(repeat.score,5000);
  assert.equal(repeat.rankingPoints,0);
  assert.equal((await call("state",{id:daily.id})).data.rankingPoints,0);
  assert.equal((await call("state",{id:first.id})).data.rankingPoints,5000);
  const bestTime=Math.min(win.elapsedMs,repeat.elapsedMs);
  assert.deepEqual((await leaderboard()).normal.total,[{...boards.normal.total[0],solve_time_ms:bestTime}]);
});

test("equal points use the lower total solve time on all boards and faster replays keep the same points",async t=>{
  let current=Date.parse("2026-11-17T12:00:00Z");
  t.mock.method(Date,"now",()=>current);
  const {sql,call,leaderboard}=await setup(t);
  const parameters={mode:"free",difficulty:"normal"};
  async function win(user,time){
    const {data:game}=await call("start",parameters,user);
    const {target_code}=sql.prepare("SELECT target_code FROM game_sessions WHERE id=?").get(game.id);
    current+=time;
    const {data:result}=await call("guess",{id:game.id,code:target_code},user);
    assert.equal(result.elapsedMs,time);
    return result;
  }
  async function assertBoards(expected){
    const boards=(await leaderboard()).normal;
    for(const board of Object.values(boards)){
      assert.deepEqual(board.map(({username,points,solve_time_ms})=>[username,points,solve_time_ms]),expected);
    }
  }

  await win("first",20100);
  await win("second",10025);
  await assertBoards([["second",5000,10025],["first",5000,20100]]);
  assert.equal((await win("first",5100)).rankingPoints,0);
  await win("first",9000);
  await assertBoards([["first",5000,5100],["second",5000,10025]]);

  current=Date.parse("2026-11-18T08:00:00Z");
  await win("first",7600);
  const {data:loss}=await call("start",parameters,"second");
  current+=5400;
  await call("finish",{id:loss.id},"second");
  const expected=[["first",10000,12700],["second",5000,10025]];
  await assertBoards(expected);

  // Simulate an existing database when the new time table is installed.
  sql.exec("DROP TABLE player_solve_times");
  sql.exec(schema);
  sql.exec(schema);
  await assertBoards(expected);
});
