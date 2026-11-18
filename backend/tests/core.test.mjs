import test from "node:test";
import assert from "node:assert/strict";
import {periodKeys,dayUTC,constantTimeEqual} from "../src/lib.js";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {points,clueSet} from "../src/games.js";
import {validNewPassword} from "../src/auth.js";
import {countries,countryByCode} from "../src/catalog.js";
import {insights,denominations} from "../src/clue-data.js";

test("catalogue and country codes are unique",()=>{
  assert.equal(countries.length,195);
  assert.equal(new Set(countries.map(x=>x.code)).size,195);
  assert.ok(countryByCode.has("LS"));
  for(const c of countries)for(const level of ["normal","hard","rush"]){
    const clues=clueSet(c,level);
    assert.ok(clues.length>=6&&clues.length<=10,c.code+" "+level);
    const keys=clues.map(c=>c.key);
    assert.equal(new Set(keys).size,clues.length,c.code);
    assert.equal(keys[0],"continent");
    assert.equal(keys.some(k=>["hemisphere","zone","utmZone","utmBand","latitude"].includes(k)),false);
    assert.ok(clues.slice(0,4).every(clue=>["continent","countrySubregion",
      "countryLandlocked","longitude","countryAreaBand","countryBorders"].includes(clue.key)));
    assert.ok(clues.every(clue=>clue.key!=="countryCurrency"||clue.family));
  }
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

test("shared source snapshots and clue payloads match the browser for all 195 countries",()=>{
  const front={};
  const root=new URL("../../",import.meta.url);
  for(const file of ["country-catalog.js","country-insights.js","currency-denominations.js"]){
    runInNewContext(readFileSync(new URL(file,root),"utf8"),{window:front},{filename:file});
  }
  assert.equal(front.CartigmaCountries.length,195);
  for(const country of front.CartigmaCountries){
    const server=countryByCode.get(country.code);
    assert.ok(server,"Missing server country "+country.code);
    for(const field of ["code","continent","lat","lng","borders","area","landlocked"])
      assert.equal(server[field],country[field],country.code+" "+field);
    const source=front.GeoCountryInsights[country.code];
    const backend=insights[country.code];
    for(const field of ["currency","currencyName","languageFamily","flagColor",
      "population","populationYear","gdpPerCapita","gdpYear","area","landlocked"])
      assert.equal(backend[field],source[field],country.code+" "+field);
    for(const difficulty of ["normal","hard","rush"]){
      const sourceClues=globalThis.CartigmaClueEngine.buildClues(
        country,source,difficulty,front.GeoCurrencyDenominations,front.CartigmaCountries);
      const serverClues=clueSet(server,difficulty);
      assert.deepEqual(JSON.parse(JSON.stringify(serverClues)),
        JSON.parse(JSON.stringify(sourceClues)),country.code+" "+difficulty);
    }
  }
  assert.deepEqual(denominations.codes,JSON.parse(JSON.stringify(front.GeoCurrencyDenominations.codes)));
  assert.deepEqual(denominations.labels.en,JSON.parse(JSON.stringify(front.GeoCurrencyDenominations.labels.en)));
});
test("server score and overlay prices match offline shared formulas",()=>{
  const engine=globalThis.CartigmaClueEngine;
  for(const difficulty of ["normal","hard","rush"]){
    for(const sectorMapPenalty of [0,250,500,1500]){
      const args={difficulty,guesses:3,penalty:700,
        sectorMapPenalty,elapsedMs:11000,won:true};
      assert.equal(points(args),engine.scoreFor(args));
    }
    for(const key of ["continent","hemisphere","longitude"]){
      const cost=engine.overlayCost(key,difficulty);
      assert.ok(cost>0);
      if(difficulty==="hard")assert.ok(cost>engine.OVERLAY_PRICES[key]);
    }
  }
  assert.equal(engine.clueCost({key:"countryCurrency"},"normal"),250);
  assert.equal(engine.clueCost({key:"countryCurrency"},"hard"),400);
});

test("new misses always unlock one more available clue, even after a purchase",()=>{
  const engine=globalThis.CartigmaClueEngine;
  assert.equal(engine.revealAfterMiss(3,"normal",1,8,8),4);
  assert.equal(engine.revealAfterMiss(3,"normal",1,8,7),3);
  assert.equal(engine.revealAfterMiss(8,"normal",1,8,8),8);
});

test("guess feedback uses reference points and omits the direction in Hard",()=>{
  const engine=globalThis.CartigmaClueEngine;
  const from=countryByCode.get("IE"),target=countryByCode.get("GB");
  assert.deepEqual(engine.guessFeedback(from,target,"normal"),{min:250,max:500,direction:2});
  assert.deepEqual(engine.guessFeedback(from,target,"hard"),{min:250,max:500});
  assert.equal(engine.guessFeedback(from,target,"rush"),null);
  assert.equal(engine.guessFeedback(target,target,"normal"),null);
});
