import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {DatabaseSync} from "node:sqlite";
import worker from "../src/index.js";
import {FREE_ROUNDS_PER_DAY} from "../src/games.js";
import {sha256} from "../src/lib.js";

const schema=readFileSync(new URL("../schema.sql",import.meta.url),"utf8");
const origin="https://cartigma.example";
const token="A".repeat(43);

async function setup(t,extraEnv={}){
  const sql=new DatabaseSync(":memory:");
  t.after(()=>sql.close());
  sql.exec(schema);
  const queries={count:0};
  const DB={
    prepare(query){
      return {
        bind(...args){
          const statement=sql.prepare(query);
          return {
            async first(){queries.count++;return statement.get(...args)??null;},
            async all(){queries.count++;return {results:statement.all(...args)};},
            run(){
              queries.count++;
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
  const now=Math.floor(Date.now()/1000);
  sql.prepare("INSERT INTO users(id,username,email,password_hash,password_salt,created_at) VALUES(?,?,?,?,?,?)")
    .run("first","first","first@example.org","unused","AAAAAAAAAAAAAAAAAAAAAA",now);
  sql.prepare("INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)")
    .run(await sha256(token),"first",now,now+86400);
  const env={DB,APP_ORIGIN:origin,GAME_SECRET:"S".repeat(32),
    AUTH_PEPPER:"P".repeat(32),...extraEnv};
  const pending=[];
  const ctx={waitUntil:promise=>pending.push(promise)};
  async function post(path,body,{session=true,ctx:context=ctx}={}){
    const headers={Origin:origin,"Content-Type":"application/json"};
    if(session)headers.Cookie="__Host-cartigma_session="+token;
    const response=await worker.fetch(new Request(origin+"/v1"+path,{
      method:"POST",headers,body:JSON.stringify(body)
    }),env,context);
    const data=await response.json();
    await Promise.all(pending.splice(0));
    return {status:response.status,data};
  }
  return {sql,env,ctx,pending,post,queries};
}

test("Freeplay allows a bounded number of draws per day and difficulty",async t=>{
  const {post}=await setup(t);
  const parameters={mode:"free",difficulty:"normal"};
  for(let round=0;round<FREE_ROUNDS_PER_DAY;round++){
    const started=await post("/games/start",parameters);
    assert.equal(started.status,201,"round "+round);
    // Giving up scores zero; without a cap this would be a free re-draw.
    assert.equal((await post("/games/finish",{id:started.data.id})).status,200);
  }
  const blocked=await post("/games/start",parameters);
  assert.equal(blocked.status,409);
  assert.equal(blocked.data.error,"free_daily_limit");
  // Other difficulties and the Daily case keep their own allowance.
  assert.equal((await post("/games/start",{...parameters,difficulty:"hard"})).status,201);
  assert.equal((await post("/games/start",{mode:"daily",difficulty:"normal"})).status,201);
});

test("an unfinished Freeplay round still resumes after the limit is reached",async t=>{
  const {post,sql}=await setup(t);
  const parameters={mode:"free",difficulty:"normal"};
  for(let round=0;round<FREE_ROUNDS_PER_DAY-1;round++){
    const started=await post("/games/start",parameters);
    await post("/games/finish",{id:started.data.id});
  }
  const last=await post("/games/start",parameters);
  assert.equal(last.status,201);
  const again=await post("/games/start",parameters);
  assert.equal(again.status,409);
  assert.equal(again.data.error,"ranked_attempt_already_started");
  assert.equal((await post("/games/resume",parameters)).data.game.id,last.data.id);
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM ranked_matches WHERE mode='free'").get().n,FREE_ROUNDS_PER_DAY);
});

test("the public leaderboard is served from the edge cache and rate limited per IP",async t=>{
  const store=new Map();
  const cache={
    async match(request){return store.get(request.url)?.clone();},
    async put(request,response){store.set(request.url,response);}
  };
  const original=Object.getOwnPropertyDescriptor(globalThis,"caches");
  Object.defineProperty(globalThis,"caches",{value:{default:cache},configurable:true,writable:true});
  t.after(()=>{
    if(original)Object.defineProperty(globalThis,"caches",original);
    else delete globalThis.caches;
  });
  const limits=[];
  const READ_LIMIT={async limit({key}){limits.push(key);return {success:limits.length<=3};}};
  const {env,ctx,pending,queries}=await setup(t,{READ_LIMIT});
  const read=headers=>worker.fetch(new Request(origin+"/v1/leaderboards",{headers}),env,ctx);

  const first=await read({"CF-Connecting-IP":"203.0.113.9"});
  assert.equal(first.status,200);
  assert.equal(first.headers.get("cache-control"),"no-store");
  await Promise.all(pending.splice(0));
  const afterFirst=queries.count;
  assert.ok(afterFirst>=9);
  assert.equal(store.size,1);
  assert.match([...store.values()][0].headers.get("cache-control"),/^public, max-age=15$/);

  const second=await read({"CF-Connecting-IP":"203.0.113.9"});
  assert.equal(second.status,200);
  assert.equal(queries.count,afterFirst,"a cached board must not touch D1");
  assert.deepEqual((await second.json()).boards.normal.week,[]);
  assert.equal(second.headers.get("cache-control"),"no-store");

  await read({"CF-Connecting-IP":"203.0.113.9"});
  const limited=await read({"CF-Connecting-IP":"203.0.113.9"});
  assert.equal(limited.status,429);
  assert.deepEqual(limits,Array(4).fill("board:203.0.113.9"));
});

test("login performs the same password derivation for unknown and known accounts",async t=>{
  const {post}=await setup(t);
  const derive=t.mock.method(crypto.subtle,"deriveBits");
  const unknown=await post("/auth/login",{email:"nobody@example.org",password:"Wrong1234"},{session:false});
  assert.equal(unknown.status,401);
  assert.equal(derive.mock.callCount(),1);
  const known=await post("/auth/login",{email:"first@example.org",password:"Wrong1234"},{session:false});
  assert.equal(known.status,401);
  assert.equal(derive.mock.callCount(),2);
  assert.deepEqual(known.data,unknown.data);
});

test("password reset emails are limited per account and answered the same for unknown addresses",async t=>{
  let current=Date.parse("2026-11-17T12:00:00Z");
  t.mock.method(Date,"now",()=>current);
  const {post,sql}=await setup(t,{RESEND_API_KEY:"re_test",RESET_FROM_EMAIL:"noreply@example.org"});
  const sent=[];
  t.mock.method(globalThis,"fetch",async(url,options)=>{
    sent.push(JSON.parse(options.body).to[0]);
    return new Response("{}",{status:200});
  });
  const request=email=>post("/auth/request-reset",{email},{session:false});

  const known=await request("first@example.org");
  const unknown=await request("nobody@example.org");
  assert.equal(known.status,202);
  assert.deepEqual(unknown,known);
  assert.deepEqual(sent,["first@example.org"]);

  await request("first@example.org");
  await request("FIRST@example.org");
  assert.equal(sent.length,1,"repeat requests inside the cooldown send nothing");
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM password_resets").get().n,1);

  current+=121_000;
  await request("first@example.org");
  assert.equal(sent.length,2);
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM password_resets").get().n,2);
});

test("reset email is sent after the response when a Worker context is available",async t=>{
  const {env,ctx,pending}=await setup(t,{RESEND_API_KEY:"re_test",RESET_FROM_EMAIL:"noreply@example.org"});
  let delivered=0,release;
  const gate=new Promise(resolve=>{release=resolve;});
  t.mock.method(globalThis,"fetch",async()=>{await gate;delivered++;return new Response("{}");});
  const response=await worker.fetch(new Request(origin+"/v1/auth/request-reset",{
    method:"POST",headers:{Origin:origin,"Content-Type":"application/json"},
    body:JSON.stringify({email:"first@example.org"})
  }),env,ctx);
  assert.equal(response.status,202);
  assert.equal(delivered,0,"the HTTP response does not wait for the mail provider");
  assert.equal(pending.length,1);
  release();
  await Promise.all(pending.splice(0));
  assert.equal(delivered,1);
});
