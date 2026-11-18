import test from "node:test";
import assert from "node:assert/strict";
import {periodKeys,dayUTC,constantTimeEqual} from "../src/lib.js";
import {points,clueSet} from "../src/games.js";
import {validNewPassword} from "../src/auth.js";
import {countries,countryByCode} from "../src/catalog.js";

test("catalogue and country codes are unique",()=>{
  assert.equal(countries.length,195);
  assert.equal(new Set(countries.map(x=>x.code)).size,195);
  assert.ok(countryByCode.has("LS"));
  for(const c of countries)assert.equal(clueSet(c).length,10);
});
test("week starts on UTC Monday, including year boundary",()=>{
  assert.deepEqual(periodKeys("2026-11-17"),{week:"2026-11-16",month:"2026-11"});
  assert.deepEqual(periodKeys("2027-01-01"),{week:"2026-12-28",month:"2027-01"});
});
test("result score follows normal/hard and rush formulas",()=>{
  assert.equal(points({difficulty:"normal",guesses:1,penalty:0,won:true,elapsedMs:1000}),5000);
  assert.equal(points({difficulty:"hard",guesses:2,penalty:450,won:true,elapsedMs:1000}),3450);
  assert.equal(points({difficulty:"rush",guesses:1,penalty:0,won:true,elapsedMs:30000}),2500);
  assert.equal(points({difficulty:"rush",guesses:1,penalty:0,won:true,elapsedMs:60000}),0);
  assert.equal(points({difficulty:"normal",guesses:6,penalty:9999,won:true,elapsedMs:0}),250);
  assert.equal(points({difficulty:"normal",guesses:1,penalty:0,won:false,elapsedMs:0}),0);
});
test("password comparison is constant-output and rejects different lengths",()=>{
  assert.equal(constantTimeEqual("abc","abc"),true);
  assert.equal(constantTimeEqual("abc","abd"),false);
  assert.equal(constantTimeEqual("abc","ab"),false);
});

test("new passwords require 8+ ASCII alphanumerics, uppercase, lowercase and digits",()=>{
  for(const password of ["Ab123456","Abc12345","Cartigma2026","A1bcdefg"])
    assert.equal(validNewPassword(password),true,password);
  for(const password of ["aB12345","abcdefgh","ABCDEFGH","12345678",
    "Aaaabbbb","A1234567","a1234567","Ab12345!","Ab12345_",
    "Ab12345é","Ab12345 ","",null])
    assert.equal(validNewPassword(password),false,String(password));
});
