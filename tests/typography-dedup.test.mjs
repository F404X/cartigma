import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync} from "node:fs";
const file=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");

test("the entire game and ranking use the new type system",()=>{
  const html=file("index.html"),css=file("styles.css"),ranking=file("ranking.css");
  for(const family of ["family=Inter","family=JetBrains+Mono","family=Space+Grotesk"]){
    assert.ok(html.includes(family),family);
  }
  for(const font of ['--font:"Inter"','--display:"Space Grotesk"','--mono:"JetBrains Mono"']){
    assert.ok(css.includes(font),font);
  }
  assert.ok(ranking.includes("font:14px/1.45 var(--font)"));
  assert.ok(ranking.includes("font:600 12px var(--mono)"));
  assert.ok(!ranking.includes("IBM Plex"));
});

test("the game and country dossier no longer display repeated or empty details",()=>{
  const html=file("index.html"),app=file("app.js");
  assert.match(html,/id="caseCode" hidden aria-hidden="true"/);
  assert.equal((html.match(/id="caseNumber"/g)||[]).length,1);
  assert.ok(!html.includes('id="reportCountry"'));
  assert.ok(!html.includes('id="reportStamp"'));
  assert.match(html,/id="reportBestRow"/);
  assert.match(html,/<div hidden><dt data-i18n="reportCoordinates">/);
  assert.match(html,/id="statusBar"/);
  assert.ok(app.includes('$("reportBestRow").classList.toggle("hidden",record.won)'));
  assert.ok(app.includes('$("statusBar").classList.toggle("hidden",!(game.ranked||game.practice))'));
  assert.ok(app.includes('if(targets.list!=="atlasCountryStats")add("capital"'));
  assert.ok(app.includes('if(targets.list!=="atlasCountryStats"&&typeof info?.landlocked'));
  assert.ok(app.includes('$("mapTitle").textContent=t("map")'));
  assert.ok(!app.includes('$("reportCountry")'));
  assert.ok(!app.includes('$("reportStamp")'));
  new Function(app);
});