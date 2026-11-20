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
    constructor(){this.attributes={};this.handlers={};this.children=[];this.textContent="";this.open=false;}
    setAttribute(name,value){this.attributes[name]=String(value);}
    getAttribute(name){return this.attributes[name]??null;}
    addEventListener(type,cb){this.handlers[type]=cb;}
    append(...children){this.children.push(...children);}
    click(){this.handlers.click?.();}
    showModal(){this.open=true;}
    close(){this.open=false;this.handlers.close?.();}
    focus(){this.focused=true;}
  }
  const document={
    documentElement:new Element(),
    getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},
    createElement:()=>new Element(),
    querySelector(query){return query==='meta[name="theme-color"]'?meta:null;}
  };
  document.documentElement.lang="en";
  const meta=new Element();
  class FakeEvent{
    constructor(type,options){this.type=type;this.detail=options?.detail;}
  }
  const window={
    dispatchEvent(event){events.push(event);},
    getComputedStyle(node){
      const id=node.getAttribute("data-palette");
      const colors=paletteColors()[id];
      return {getPropertyValue:key=>colors[key]};
    }
  };
  const localStorage={
    getItem:key=>storage.get(key)||null,
    setItem:(key,val)=>storage.set(key,val)
  };
  runInNewContext(script,{document,window,localStorage,CustomEvent:FakeEvent,console},{filename:"theme.js"});
  return {window,document,meta,storage,events,get:document.getElementById.bind(document)};
}

function paletteColors(){
  const blocks=Array.from(stylesheet.matchAll(/\[data-palette="([a-z]+)"\]\{([^}]+)\}/g));
  return Object.fromEntries(blocks.map(([,id,block])=>[id,
    Object.fromEntries(Array.from(block.matchAll(/(--[a-z0-9]+):(#(?:[a-f0-9]{6}|[a-f0-9]{3}))\b/g),match=>match.slice(1)))
  ]));
}

test("the trigger opens a catalog with six dark and four light live previews",()=>{
  const e=environment(),root=e.document.documentElement;
  assert.equal(e.window.GeoTheme.current(),"midnight");
  assert.equal(e.meta.getAttribute("content"),"#0b1018");
  assert.equal(root.getAttribute("data-color-mode"),"dark");
  const dark=e.get("darkThemeOptions").children;
  const light=e.get("lightThemeOptions").children;
  assert.equal(dark.length,6);
  assert.equal(light.length,4);
  assert.equal(new Set([...dark,...light].map(card=>card.children[0].getAttribute("data-palette"))).size,10);
  assert.equal(dark[0].getAttribute("aria-pressed"),"true");
  e.get("themeToggle").click();
  assert.ok(e.get("themeCatalog").open);
  assert.ok(dark[0].focused);
  light[1].click();
  assert.equal(e.window.GeoTheme.current(),"linen");
  assert.equal(e.storage.get("geodetective-theme"),"linen");
  assert.equal(root.getAttribute("data-palette"),"linen");
  assert.equal(root.getAttribute("data-color-mode"),"light");
  assert.equal(e.meta.getAttribute("content"),"#fff1e5");
  assert.equal(light[1].getAttribute("aria-pressed"),"true");
  assert.equal(dark[0].getAttribute("aria-pressed"),"false");
  assert.equal(e.events[0].detail.previousColorMode,"dark");
  assert.equal(e.events[0].detail.colorMode,"light");
  assert.ok(e.get("themeCatalog").open,"Keep the catalog open so the palettes can be compared");
  e.get("themeClose").click();
  assert.equal(e.get("themeCatalog").open,false);
  assert.ok(e.get("themeToggle").focused);
});

test("restores legacy and current preferences and localizes the catalog in each supported language",()=>{
  assert.equal(environment("dark").window.GeoTheme.current(),"midnight");
  assert.equal(environment("light").window.GeoTheme.current(),"porcelain");
  assert.equal(environment("forest").window.GeoTheme.current(),"forest");
  const e=environment("invalid-theme");
  assert.equal(e.window.GeoTheme.current(),"midnight");
  for(const lang of ["en","pt","es","zh","ja","ru","fr","de","it","nl","pl","sv","tr","ar","he","ko","th","vi","id"]){
    e.document.documentElement.lang=lang==="pt"?"pt-BR":lang;
    e.window.GeoTheme.sync();
    for(const id of ["themeLabel","darkThemesTitle","lightThemesTitle"])assert.ok(e.get(id).textContent,lang);
    assert.ok(e.get("themeToggle").getAttribute("aria-label").includes("Midnight")||lang==="pt",lang);
  }
  e.document.documentElement.lang="pt-BR";
  e.window.GeoTheme.sync();
  assert.equal(e.get("themeLabel").textContent,"Temas");
  assert.equal(e.get("themeToggle").getAttribute("aria-label"),"Temas — Meia-noite");
  e.window.GeoTheme.set("forest");
  e.window.GeoTheme.set("forest");
  e.window.GeoTheme.set("invalid");
  assert.equal(e.events.length,1);
  assert.equal(e.events[0].detail.previousColorMode,"dark");
  assert.equal(e.events[0].detail.colorMode,"dark");
});

function luminance(hex){
  const full=hex.length===4?hex.slice(1).split("").map(c=>c+c).join(""):hex.slice(1);
  const [red,green,blue]=[0,2,4].map(index=>{
    const value=Number.parseInt(full.slice(index,index+2),16)/255;
    return value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4;
  });
  return 0.2126*red+0.7152*green+0.0722*blue;
}
function contrast(a,b){
  const values=[luminance(a),luminance(b)].sort((left,right)=>right-left);
  return (values[0]+0.05)/(values[1]+0.05);
}
test("all palettes keep text, controls and ranking colors readable",()=>{
  const palettes=paletteColors();
  const e=environment();
  const light=new Set(e.get("lightThemeOptions").children.map(card=>card.children[0].getAttribute("data-palette")));
  const rankingCss=readFileSync(new URL("ranking.css",root),"utf8");
  assert.equal(Object.keys(palettes).length,10);
  for(const [id,colors] of Object.entries(palettes)){
    for(const background of ["--bg","--surface","--surface2"]){
      for(const foreground of ["--text","--muted","--accent"]){
        assert.ok(contrast(colors[foreground],colors[background])>=4.5,id+" "+foreground+" "+background);
      }
    }
    assert.ok(contrast(colors["--accent"],light.has(id)?"#fff":"#15121a")>=4.5,id+" button");
  }
  assert.match(stylesheet,/:root\[data-color-mode="light"\] \.leaflet-tile-pane\{filter:none\}/);
  assert.match(rankingCss,/background:var\(--surface\);color:var\(--text\)/);
  assert.match(mapCss,/\.compass-rose/);
});

test("vector map keeps the light and dark base styles and skips tile reloads within a mode",()=>{
  assert.match(game,/activeMapTheme\(\)==="light"\?"positron":"dark"/);
  assert.match(game,/previousColorMode===activeMapTheme\(\)/);
  assert.match(game,/map\.setStyle\(vectorMapStyle\(\),\{diff:false\}\)/);
  assert.match(game,/window\.addEventListener\?\.\("geodetective:themechange",updateMapTheme\)/);
  assert.match(game,/style:vectorMapStyle\(\)/);
  assert.match(html,/id="themeToggle"[^>]+aria-haspopup="dialog"/);
  assert.match(html,/id="themeCatalog"/);
  assert.match(html,/href="themes\.css(?:\?[^"]+)?"/);
  assert.match(html,/src="theme\.js(?:\?[^"]+)?"/);
  assert.match(workflow,/themes\.css mobile\.css theme\.js/);
});

test("mobile header list icon is not followed by a duplicate question mark",()=>{
  // Before this fix a generic .header-button::after rule injected '?' below
  // the inline SVG in the country-list button on phones.
  const small=stylesheet.slice(stylesheet.indexOf("@media(max-width:520px){"),stylesheet.indexOf("@media(max-width:390px){",stylesheet.indexOf("@media(max-width:520px){")));
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
