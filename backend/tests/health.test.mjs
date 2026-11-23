import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index.js";

const ORIGIN="https://cartigma.f404x.net";
const makeDB=(healthy=true)=>({
  prepare(sql){
    assert.match(sql,/SELECT (id FROM users|user_id FROM player_stats)/);
    return {first:async()=>{
      if(!healthy)throw Error("D1 unavailable");
      return null; // An empty, correctly migrated database is healthy.
    }};
  }
});
const environment=(overrides={})=>({
  APP_ORIGIN:ORIGIN,
  AUTH_PEPPER:"a".repeat(64),
  GAME_SECRET:"b".repeat(64),
  DB:makeDB(),
  ...overrides
});
const request=()=>new Request("https://api.cartigma.f404x.net/v1/health",{
  headers:{Origin:ORIGIN}
});

test("health confirms DB tables and required Worker secrets",async()=>{
  const response=await worker.fetch(request(),environment());
  assert.equal(response.status,200);
  assert.equal(response.headers.get("access-control-allow-origin"),ORIGIN);
  const payload=await response.json();
  assert.equal(payload.ok,true);
  assert.deepEqual(payload.checks,{database:true,auth:true,games:true,turnstile:true});
});
test("health fails when D1 is unconfigured or schema missing",async()=>{
  for(const DB of [undefined,makeDB(false)]){
    const response=await worker.fetch(request(),environment({DB}));
    assert.equal(response.status,503);
    assert.equal((await response.json()).checks.database,false);
  }
});
test("health fails if authentication/game secrets are missing",async()=>{
  for(const missing of ["AUTH_PEPPER","GAME_SECRET"]){
    const response=await worker.fetch(request(),environment({[missing]:undefined}));
    assert.equal(response.status,503);
    assert.equal((await response.json()).ok,false);
  }
});
test("health requires Turnstile key and secret to be configured together",async()=>{
  for(const change of [{TURNSTILE_SITE_KEY:"0xabc"},{TURNSTILE_SECRET:"secret"}]){
    const response=await worker.fetch(request(),environment(change));
    assert.equal(response.status,503);
    assert.equal((await response.json()).checks.turnstile,false);
  }
  const response=await worker.fetch(request(),environment({
    TURNSTILE_SITE_KEY:"0xabc",TURNSTILE_SECRET:"secret"
  }));
  assert.equal(response.status,200);
});
test("browser login CORS preflight is allowed only for the app origin",async()=>{
  const good=new Request("https://api.cartigma.f404x.net/v1/auth/login",{
    method:"OPTIONS",headers:{Origin:ORIGIN,"Access-Control-Request-Method":"POST"}
  });
  const success=await worker.fetch(good,environment());
  assert.equal(success.status,204);
  assert.equal(success.headers.get("access-control-allow-origin"),ORIGIN);
  assert.equal(success.headers.get("access-control-allow-credentials"),"true");
  const bad=new Request(good.url,{
    method:"OPTIONS",headers:{Origin:"https://other.example"}
  });
  const denied=await worker.fetch(bad,environment());
  assert.equal(denied.status,403);
  assert.equal(denied.headers.get("access-control-allow-origin"),null);
});
