import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const root=new URL("../",import.meta.url);
const mobile=readFileSync(new URL("mobile.css",root),"utf8");
const html=readFileSync(new URL("index.html",root),"utf8");
const app=readFileSync(new URL("app.js",root),"utf8");
const fallback=readFileSync(new URL("map-fallback.js",root),"utf8");
const workflow=readFileSync(new URL(".github/workflows/pages.yml",root),"utf8");

test("smartphone layout is loaded last and leaves desktop styling unchanged",()=>{
  const cssLinks=[...html.matchAll(/<link rel="stylesheet" href="([^"]+\.css(?:\?[^"]*)?)">/g)].map(m=>m[1].split("?")[0]);
  assert.equal(cssLinks.at(-1),"mobile.css");
  assert.ok(cssLinks.indexOf("themes.css")<cssLinks.indexOf("mobile.css"));
  assert.ok(mobile.startsWith("/* Cartigma"));
  assert.match(mobile,/@media \(max-width:760px\)/);
  assert.match(workflow,/themes\.css mobile\.css/);
});
test("phone map occupies a true square and lower case becomes the only scroll surface",()=>{
  assert.match(mobile,/#map\{\s*display:block;[\s\S]*?width:100%;[\s\S]*?aspect-ratio:1 \/ 1/);
  assert.match(mobile,/\.map-card\{\s*position:relative;[\s\S]*?flex:0 0 auto/);
  assert.match(mobile,/\.case-card\{[\s\S]*?overflow-y:auto;/);
  assert.match(mobile,/overscroll-behavior-y:contain/);
  assert.match(mobile,/-webkit-overflow-scrolling:touch/);
  assert.match(mobile,/\.case-columns\{[\s\S]*?flex-direction:column/);
  assert.match(mobile,/\.case-columns \.clue-list\{[\s\S]*?overflow:visible!important/);
  assert.match(mobile,/\.case-columns \.guess-history\{[\s\S]*?overflow:visible!important/);
  assert.match(mobile,/\.result-card\{\s*position:relative/);
});
test("small phone layout has readable text and touch-friendly actions",()=>{
  assert.match(mobile,/\.clue-text\{[\s\S]*?font-size:13px/);
  assert.match(mobile,/\.search-wrap input\{[\s\S]*?height:46px;[\s\S]*?font-size:16px/);
  assert.match(mobile,/\.primary-btn,\.secondary-btn\{[\s\S]*?min-height:45px/);
  assert.match(mobile,/\.reveal-btn\{[\s\S]*?min-height:43px/);
  assert.match(mobile,/\.suggestion\{min-height:44px/);
  assert.match(mobile,/@media\(max-width:390px\)/);
});
test("very short and wider mobile screens can scroll entire page rather than clipping the square",()=>{
  assert.match(mobile,/@media\(max-width:760px\) and \(max-height:730px\),/);
  assert.match(mobile,/\(min-aspect-ratio:11\/20\)/);
  assert.match(mobile,/\(pointer:coarse\)/);
  assert.match(mobile,/orientation:landscape/);
  assert.match(mobile,/overflow-y:auto;/);
  assert.match(mobile,/\.app\{[\s\S]*?min-height:100dvh;[\s\S]*?max-height:none;[\s\S]*?overflow:visible/);
});
test("completed case report is inline in mobile scroller, never obscures the map",()=>{
  assert.match(app,/const mobile=window\.matchMedia\?\.\("\(max-width: 760px\)"\)\?\.matches===true/);
  assert.match(app,/mobile\?document\.querySelector\("\.case-card"\):document\.body/);
  assert.match(app,/dialog\.scrollIntoView\?\.\(\{behavior:"smooth",block:"start"\}\)/);
  assert.match(mobile,/dialog\.case-report,dialog\.case-report\[open\]\{[\s\S]*?position:relative;[\s\S]*?height:auto/);
  assert.match(mobile,/dialog\.case-report:not\(\[open\]\)\{display:none!important\}/);
  assert.match(mobile,/dialog\.case-report \.report-body\{[\s\S]*?overflow:visible/);
});
test("MapLibre and Leaflet resize appropriately after mobile map changes size",()=>{
  assert.match(app,/new ResizeObserver\(\(\)=>map\?\.resize\?\.\(\)\)/);
  assert.match(app,/observer\.observe\(\$\("map"\)\)/);
  assert.match(fallback,/resize\(\)\{this\.root\.invalidateSize\(\{pan:false\}\);return this;\}/);
});
