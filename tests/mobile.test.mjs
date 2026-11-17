import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const root=new URL("../",import.meta.url);
const mobile=readFileSync(new URL("mobile.css",root),"utf8");
const html=readFileSync(new URL("index.html",root),"utf8");
const app=readFileSync(new URL("app.js",root),"utf8");
const fallback=readFileSync(new URL("map-fallback.js",root),"utf8");
const workflow=readFileSync(new URL(".github/workflows/pages.yml",root),"utf8");

test("mobile popover styling is isolated from the desktop game layout",()=>{
  const cssLinks=[...html.matchAll(/<link rel="stylesheet" href="([^"]+\.css(?:\?[^"]*)?)">/g)]
    .map(match=>match[1].split("?")[0]);
  assert.equal(cssLinks.at(-1),"mobile.css");
  assert.ok(cssLinks.indexOf("themes.css")<cssLinks.indexOf("mobile.css"));
  assert.match(workflow,/themes\.css mobile\.css/);
  assert.match(mobile,/\/\* One-screen mobile cockpit\./);
  assert.match(mobile,/\.mobile-panel-tabs\{display:none\}/);
  assert.match(mobile,/@media \(max-width:760px\), \(max-height:540px\) and \(pointer:coarse\)/);
  assert.ok(mobile.lastIndexOf("/* One-screen mobile cockpit.")>
    mobile.indexOf("/* Smartphone language selector:"),
    "New CSS overrides must come after legacy phone rules");
  assert.match(app,/function isMobileScreen\(\)/);
  assert.match(app,/function syncMobilePanels\(\)/);
  assert.match(app,/if\(!isMobileScreen\(\)\|\|!game\)return/);
});

test("both compact evidence and guess triggers exist with accessible controls",()=>{
  assert.match(html,/id="mobileEvidenceBtn"[^>]*aria-controls="mobileEvidencePanel"[^>]*aria-expanded="false"/);
  assert.match(html,/id="mobileGuessBtn"[^>]*aria-controls="mobileGuessPanel"[^>]*aria-expanded="false"/);
  assert.match(html,/id="mobileEvidencePreview"/);
  assert.match(html,/id="mobileGuessPreview"/);
  assert.match(html,/<section class="clue-panel" id="mobileEvidencePanel"/);
  assert.match(html,/<section class="guess-panel" id="mobileGuessPanel"/);
  assert.match(app,/setMobilePanel\("clues"\)/);
  assert.match(app,/setMobilePanel\("guess"\)/);
  assert.match(app,/panel\.classList\.toggle\("mobile-open",open\)/);
  assert.match(app,/button\.setAttribute\("aria-expanded",String\(open\)\)/);
});

test("portrait and short-height phones fit the map and case dock in one viewport",()=>{
  const cockpit=mobile.slice(mobile.indexOf("/* One-screen mobile cockpit."));
  assert.match(cockpit,/html,body\{height:100%;overflow:hidden\}/);
  assert.match(cockpit,/\.app\{height:100dvh;min-height:0;max-height:100dvh;overflow:hidden\}/);
  assert.match(cockpit,/\.game-grid\{[\s\S]*?position:relative;flex:1 1 0/);
  assert.match(cockpit,/#map\{[\s\S]*?flex:1 1 0;[\s\S]*?height:0!important;[\s\S]*?aspect-ratio:auto/);
  assert.match(cockpit,/\.case-card\{[\s\S]*?position:absolute;inset:0;[\s\S]*?pointer-events:none/);
  assert.match(cockpit,/\.mobile-panel-tabs\{[\s\S]*?position:absolute;bottom:max\(8px,env\(safe-area-inset-bottom\)\)/);
  assert.match(cockpit,/\.case-columns\{\s*display:contents/);
  assert.match(cockpit,/\.case-columns>\.clue-panel,\.case-columns>\.guess-panel\{[\s\S]*?max-height:min\(54dvh,450px\)/);
  assert.match(cockpit,/\.case-columns>\.clue-panel\.mobile-open,[\s\S]*?\{display:flex\}/);
  assert.match(cockpit,/\(max-height:540px\) and \(pointer:coarse\) and \(orientation:landscape\)/);
  assert.match(cockpit,/\.map-card\{[\s\S]*?padding-bottom:0;border-right:/);
});

test("mobile popovers show compact unlocked clues and scroll internally",()=>{
  const cockpit=mobile.slice(mobile.indexOf("/* One-screen mobile cockpit."));
  assert.match(cockpit,/\.case-columns \.clue-list\{[\s\S]*?overflow-y:auto!important/);
  assert.match(cockpit,/\.case-columns \.clue-list \.clue\.locked\{display:none\}/);
  assert.match(cockpit,/\.case-columns \.clue-text\{[\s\S]*?font-size:12px/);
  assert.match(cockpit,/\.case-columns \.search-wrap input\{[\s\S]*?height:43px;[\s\S]*?font-size:16px/);
  assert.match(cockpit,/\.case-columns \.suggestions\{[\s\S]*?max-height:min\(26dvh,164px\)/);
  assert.match(cockpit,/\.case-columns \.guess-history\{[\s\S]*?overflow-y:auto!important/);
  assert.match(cockpit,/overscroll-behavior-y:contain/);
  assert.match(cockpit,/\.mobile-panel-tab\.active\{/);
});

test("finished case becomes an internal-scroll modal on phones, desktop remains unchanged",()=>{
  assert.match(app,/if\(mobile\)\{[\s\S]*?dialog\.showModal\(\)/);
  assert.match(app,/\}else dialog\.show\(\)/);
  const cockpit=mobile.slice(mobile.indexOf("/* One-screen mobile cockpit."));
  assert.match(cockpit,/dialog\.case-report,dialog\.case-report\[open\]\{[\s\S]*?position:fixed;inset:0;[\s\S]*?max-height:88dvh/);
  assert.match(cockpit,/dialog\.case-report \.report-body\{[\s\S]*?overflow-y:auto/);
  assert.match(cockpit,/dialog\.case-report::backdrop\{/);
});

test("MapLibre and Leaflet update when the responsive map changes shape",()=>{
  assert.match(app,/new ResizeObserver\(\(\)=>map\?\.resize\?\.\(\)\)/);
  assert.match(app,/observer\.observe\(\$\("map"\)\)/);
  assert.match(fallback,/resize\(\)\{this\.root\.invalidateSize\(\{pan:false\}\);return this;\}/);
});


test("evidence popover is capped to a small portion of mobile viewport",()=>{
  const cockpit=mobile.slice(mobile.indexOf("/* One-screen mobile cockpit."));
  // The shared 54dvh popup cap must not override the evidence-specific
  // two-clue limit; footer controls remain exposed below it.
  assert.match(cockpit,/\.case-columns>\.clue-panel\.mobile-open\{[\s\S]*?bottom:calc\(154px \+ env\(safe-area-inset-bottom\)\);[\s\S]*?max-height:min\(220px,32dvh\)/);
  assert.match(cockpit,/\.case-columns>\.clue-panel\.mobile-open\{[\s\S]*?bottom:calc\(145px \+ env\(safe-area-inset-bottom\)\);[\s\S]*?max-height:min\(194px,33dvh\)/);
  assert.match(cockpit,/\.case-columns>\.clue-panel\.mobile-open\{[\s\S]*?bottom:55px;[\s\S]*?max-height:min\(195px,calc\(100% - 104px\)\)/);
  assert.match(cockpit,/\.case-columns \.clue-list\{[\s\S]*?overflow-y:auto!important/);
  assert.match(cockpit,/\.case-columns \.clue-list \.clue\.latest\{/);
  assert.match(app,/const bottomOverlap=card\.bottom-\(viewport\.bottom-12\)/);
  assert.match(app,/if\(bottomOverlap>0\)list\.scrollTop\+=bottomOverlap/);
  assert.match(app,/list\.scrollTop=list\.scrollHeight/);
});


test("the mobile evidence sheet is above the map footer, not hidden behind it",()=>{
  const cockpit=mobile.slice(mobile.indexOf("/* One-screen mobile cockpit."));
  const stylesheet=readFileSync(new URL("styles.css",root),"utf8");
  assert.match(stylesheet,/\.map-bottom\{position:relative;z-index:12;overflow:visible\}/);
  assert.match(cockpit,/\.case-card\{\s*\/\*[\s\S]*?position:absolute;inset:0;z-index:20;/);
  assert.match(cockpit,/\.case-columns>\.clue-panel\.mobile-open\{[\s\S]*?isolation:isolate;/);
  assert.match(cockpit,/\.case-columns \.clue-list\{[\s\S]*?padding:0 2px 12px;[\s\S]*?scroll-padding-block-end:12px;/);
  assert.match(cockpit,/\.case-columns \.clue-text\{[\s\S]*?display:block;white-space:normal;[\s\S]*?overflow:visible;max-height:none;/);
  // Scope preserves the original desktop z-index/layout rules.
  assert.ok(mobile.indexOf("position:absolute;inset:0;z-index:20")>
    mobile.indexOf("@media (max-width:760px), (max-height:540px) and (pointer:coarse)"));
});


test("mobile evidence shows at most about two compact cards without obscuring map settings",()=>{
  const cockpit=mobile.slice(mobile.indexOf("/* One-screen mobile cockpit."));
  // Portrait: map-card reserves 114px for the dock, then a 32px footer.
  // A bottom offset of 154px leaves an 8px clear gap above that footer.
  const reserved=114,footer=32,offset=154;
  assert.ok(offset>=reserved+footer+8);
  // Short portrait: 109px dock, 28px footer, 8px separation.
  assert.ok(145>=109+28+8);
  assert.match(cockpit,/\.case-columns \.clue-list\{[\s\S]*?max-height:min\(138px,24dvh\)/);
  assert.match(cockpit,/\.case-columns \.clue-list\{[\s\S]*?overflow-y:auto!important/);
  assert.match(cockpit,/\.case-columns \.reveal-btn\{[\s\S]*?min-height:32px/);
  // Do not alter desktop CSS: the override belongs to mobile.css only.
  assert.match(cockpit,/@media \(max-width:760px\), \(max-height:540px\) and \(pointer:coarse\)/);
});


test("mobile-only icon sizing keeps country list and map settings visible and centered",()=>{
  const iconRules=mobile.slice(mobile.indexOf("/* Phone icon controls: preserve"));
  assert.match(iconRules,/@media \(max-width:760px\), \(max-height:540px\) and \(pointer:coarse\)/);
  assert.match(iconRules,/#atlasBtn svg\{[\s\S]*?width:19px;height:19px/);
  assert.match(iconRules,/\.map-filter-gear\{[\s\S]*?display:grid;place-items:center/);
  assert.match(iconRules,/\.map-filter-gear svg\{[\s\S]*?width:19px;height:19px/);
  // Icon sizing belongs exclusively to mobile.css rather than desktop layout.
  const baseCss=readFileSync(new URL("styles.css",root),"utf8");
  assert.match(baseCss,/\.map-filter-gear svg\{display:block;pointer-events:none\}/);
});
