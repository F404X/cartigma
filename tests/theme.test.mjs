import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const root=new URL("../",import.meta.url);
const script=readFileSync(new URL("theme.js",root),"utf8");
const stylesheet=readFileSync(new URL("themes.css",root),"utf8");
const html=readFileSync(new URL("index.html",root),"utf8");
const game=readFileSync(new URL("app.js",root),"utf8");
const workflow=readFileSync(new URL(".github/workflows/pages.yml",root),"utf8");
const mapCss=readFileSync(new URL("styles.css",root),"utf8");

function environment(initialTheme=null) {
  const storage=new Map();
  if(initialTheme)storage.set("geodetective-theme",initialTheme);
  const events=[];
  const elements=new Map();
  class Element {
    constructor(){this.attributes={};this.handlers={};this.textContent="";this.title="";}
    setAttribute(name,value){this.attributes[name]=String(value);}
    getAttribute(name){return this.attributes[name]??null;}
    addEventListener(type,cb){this.handlers[type]=cb;}
    click(){this.handlers.click?.();}
  }
  const document={
    documentElement:new Element(),
    getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id)},
    querySelector(query){return query==='meta[name="theme-color"]'?meta:null}
  };
  document.documentElement.lang="en";
  const meta=new Element();
  class FakeEvent{
    constructor(type,options){this.type=type;this.detail=options?.detail;}
  }
  const window={
    dispatchEvent(event){events.push(event);return true}
  };
  const localStorage={
    getItem:key=>storage.get(key)||null,
    setItem:(key,val)=>storage.set(key,val)
  };
  runInNewContext(script,{document,window,localStorage,CustomEvent:FakeEvent,console},{filename:"theme.js"});
  return {window,document,meta,storage,events,get:document.getElementById.bind(document)};
}

test("defaults to navy dark mode; button can switch to white mode and persist it",()=>{
  const e=environment();
  assert.equal(e.window.GeoTheme.current(),"dark");
  assert.equal(e.document.documentElement.getAttribute("data-theme"),"dark");
  assert.equal(e.meta.getAttribute("content"),"#0b1018");
  assert.equal(e.get("themeToggle").getAttribute("aria-pressed"),"false");
  assert.equal(e.get("themeLabel").textContent,"Light mode");
  e.get("themeToggle").click();
  assert.equal(e.window.GeoTheme.current(),"light");
  assert.equal(e.storage.get("geodetective-theme"),"light");
  assert.equal(e.document.documentElement.getAttribute("data-theme"),"light");
  assert.equal(e.meta.getAttribute("content"),"#f3f6fb");
  assert.equal(e.get("themeToggle").getAttribute("aria-pressed"),"true");
  assert.equal(e.get("themeLabel").textContent,"Dark mode");
  assert.equal(e.events.length,1);
  assert.equal(e.events[0].detail.theme,"light");
  e.get("themeToggle").click();
  assert.equal(e.window.GeoTheme.current(),"dark");
  assert.equal(e.events.length,2);
});

test("restores saved preference and translates theme action for each of 19 locales",()=>{
  const e=environment("light");
  assert.equal(e.window.GeoTheme.current(),"light");
  for(const lang of ["en","pt","es","zh","ja","ru","fr","de","it","nl","pl","sv","tr","ar","he","ko","th","vi","id"]){
    e.document.documentElement.lang=lang==="pt"?"pt-BR":lang;
    e.window.GeoTheme.sync();
    assert.ok(e.get("themeLabel").textContent.length>2,lang);
    assert.ok(e.get("themeToggle").getAttribute("aria-label").length>3,lang);
  }
  e.document.documentElement.lang="pt-BR";
  e.window.GeoTheme.sync();
  assert.equal(e.get("themeLabel").textContent,"Modo escuro");
  e.window.GeoTheme.set("dark");
  assert.equal(e.get("themeLabel").textContent,"Modo claro");
  e.window.GeoTheme.set("dark");
  assert.equal(e.events.length,1,"a no-op theme action should not dispatch an extra map update");
});

test("dark backgrounds are blue-black, white mode has light surfaces, yellow is an accent",()=>{
  assert.match(stylesheet,/--bg:#0b1018/);
  assert.match(stylesheet,/--surface:#111827/);
  assert.match(stylesheet,/--bg:#f3f6fb/);
  assert.match(stylesheet,/--surface:#ffffff/);
  assert.match(stylesheet,/--accent-fill:#f5c84d/);
  assert.match(stylesheet,/\.guess-panel\{background:var\(--surface\)\}/);
  assert.match(stylesheet,/\.language-menu\{background:var\(--surface\)/);
  assert.match(stylesheet,/\.clue:nth-child\(even\):not\(\.locked\)\{background:var\(--surface2\)\}/);
  assert.match(stylesheet,/:root\[data-theme="light"\] \.leaflet-tile-pane\{filter:none\}/);
  assert.match(stylesheet,/\.report-grid>div,\.report-fact\{background:var\(--surface2\)\}/);
  assert.match(stylesheet,/\.theme-toggle/);
  assert.match(mapCss,/\.compass-rose/);
});

test("vector map follows dark/light appearance while keeping keyless OpenStreetMap fallback",()=>{
  assert.match(game,/activeMapTheme\(\)==="light"\?"positron":"dark"/);
  assert.match(game,/map\.setStyle\(vectorMapStyle\(\)\)/);
  assert.match(game,/window\.addEventListener\?\.\("geodetective:themechange",updateMapTheme\)/);
  assert.match(game,/style:vectorMapStyle\(\)/);
  assert.match(html,/id="themeToggle"/);
  assert.match(html,/href="themes\.css(?:\?[^"]+)?"/);
  assert.match(html,/src="theme\.js"/);
  assert.match(workflow,/themes\.css mobile\.css theme\.js/);
});


test("mobile header list icon is not followed by a duplicate question mark",()=>{
  // Before this fix a generic .header-button::after rule injected '?' below
  // the inline SVG in the country-list button on phones.
  const small=stylesheet.match(/@media\(max-width:520px\)\{([\s\S]*?)\n\}/)?.[1]||"";
  assert.ok(small,"Mobile header media query should be present");
  assert.match(small,/#helpBtn::after\{content:"\?"/);
  assert.match(small,/\.atlas-trigger::after\{content:none\}/);
  assert.doesNotMatch(small,/\.header-button::after\{content:"\?"/);
  const archive=html.match(/<button[^>]*id="atlasBtn"[\s\S]*?<\/button>/)?.[0];
  assert.ok(archive,"Country archive header control must exist");
  assert.match(archive,/<svg[^>]*aria-hidden="true"/);
  assert.match(archive,/aria-label="Country archive"/);
  assert.ok(!archive.includes("?"),"Country-list button must not embed help icon text");
  const help=html.match(/<button[^>]*id="helpBtn"[^>]*>/)?.[0];
  assert.ok(help,"Help must remain a separate labeled control");
});

test("map-layer settings control uses a centered, recognizable gear glyph",()=>{
  const button=html.match(/<button[^>]*id="mapFiltersButton"[\s\S]*?<\/button>/)?.[0];
  assert.ok(button,"Map settings trigger must exist");
  assert.match(button,/aria-controls="mapFiltersPopover"/);
  assert.match(button,/aria-label="Map filters"/);
  assert.match(button,/<svg viewBox="0 0 24 24" width="18" height="18"/);
  assert.match(button,/<path d="M10\.6 2h2\.8l\.5 2\.25/);
  assert.match(button,/<circle cx="12" cy="12" r="3"/);
  assert.doesNotMatch(button,/M10 2h4l\.6 2\.4/,
    "The original distorted gear path must not return");
});
