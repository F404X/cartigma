import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const names=["country-catalog.js","shared-clues.js","continent-borders.js","i18n.js",
  "map-filters-i18n.js","clues-i18n.js","report-i18n.js","atlas-i18n.js",
  "country-insights.js","country-clues-i18n.js","currency-denominations.js",
  "country-profile-i18n.js","compass-i18n.js","app.js","index.html","styles.css",
  "map-bootstrap.js","map-fallback.js"];
const files=Object.fromEntries(names.map(n=>[n,readFileSync(new URL("../"+n,import.meta.url),"utf8")]));

class Element {
  constructor(id=""){
    this.id=id;this.className="";this.textContent="";this.innerHTML="";this.value="";
    this.children=[];this.handlers={};this.disabled=false;this.dataset={};this.placeholder="";
    this.attributes={};this._open=false;
    this.style={setProperty(){}};
    this.classes=new Set();
    this.classList={
      add:k=>this.classes.add(k),remove:k=>this.classes.delete(k),
      toggle:(k,v)=>{const on=v===undefined?!this.classes.has(k):v;if(on)this.classes.add(k);else this.classes.delete(k);return on},
      contains:k=>this.classes.has(k)
    };
  }
  get open(){return this._open}
  get outerHTML(){return "<span></span>"}
  addEventListener(name,fn){this.handlers[name]=fn}
  click(){this.handlers.click?.({target:this})}
  focus(){this.focused=true}
  setAttribute(k,v){this.attributes[k]=v}
  removeAttribute(k){delete this.attributes[k]}
  replaceChildren(...nodes){this.children=nodes}
  append(...nodes){this.children.push(...nodes);for(const node of nodes)node.parentElement=this}
  querySelector(selector){if(selector==="button.suggestion")return this.children.find(x=>x.className==="suggestion")||null;return null}
  scrollIntoView(){this.scrolled=true}
  showModal(){this._open=true}
  show(){this._open=true}
  close(){this._open=false}
  closest(){return null}
}
const hash=input=>{let h=2166136261;for(const c of input){h ^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
function boot({storage=new Map(),map=false,randomValue=0.42,mobile=false,clock=Date,countryData=null,autoStart=true,ranking=null,intl=Intl}={}){
  const clockCallbacks=[],nodes=new Map(),window={},mobileCase=new Element("mobile-case"),mapState={fits:[],eases:[],styles:[],zoomRanges:[],markers:[],layers:new Map(),sources:new Map(),events:{},canvas:new Element("canvas")};
  const document={
    readyState:"complete",documentElement:{lang:"en",dir:"ltr"},hidden:false,
    getElementById(id){if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id)},
    createElement(name){return new Element(name)},
    createTextNode(text){const n=new Element();n.textContent=text;return n},
    querySelectorAll(){return []},querySelector(selector){return selector===".case-card"?mobileCase:new Element()},body:new Element("body"),addEventListener(){}
  };
  const localStorage={
    getItem:k=>storage.get(k)||null,
    setItem:(k,v)=>storage.set(k,v)
  };
  const mapInstance={
    on(name,fn){mapState.events[name]=fn;if(name==="style.load")fn();return this},
    touchZoomRotate:{disableRotation(){mapState.touchRotationDisabled=true}},
    keyboard:{disableRotation(){mapState.keyboardRotationDisabled=true}},
    getCanvas(){return mapState.canvas},
    addControl(){return this},
    getStyle(){return {layers:[
      {id:"label_country_1",type:"symbol",layout:{"text-field":["get","name"]}},
      {id:"label_city",type:"symbol",layout:{"text-field":["get","name"]}},
      {id:"road_shield",type:"symbol",layout:{"text-field":["get","ref"]}},
      {id:"boundary_country",type:"line",layout:{}},
      {id:"boundary_state",type:"line",layout:{}},
      {id:"park_green",type:"fill",layout:{}},
      {id:"waterway",type:"line",layout:{}},
      {id:"poi_museum",type:"symbol",layout:{"text-field":["get","name"]}},
      {id:"case-hemisphere-arrows",type:"symbol",layout:{"text-field":"↑"}}
    ]}},
    setLayoutProperty(id,key,expr){mapState.styles.push({id,key,expr})},
    setLayerZoomRange(id,min,max){mapState.zoomRanges.push({id,min,max})},
    easeTo(options){mapState.eases.push(options);return this},
    fitBounds(bounds,options){mapState.fits.push({bounds,options});return this},
    getZoom(){return 3},
    getCenter(){return {lng:8,lat:15}},
    remove(){mapState.removed=(mapState.removed||0)+1;mapState.layers.clear();mapState.sources.clear()},
    getLayer(id){return mapState.layers.get(id)||null},
    removeLayer(id){mapState.layers.delete(id)},
    addLayer(layer){mapState.layers.set(layer.id,layer)},
    getSource(id){return mapState.sources.get(id)||null},
    removeSource(id){mapState.sources.delete(id)},
    addSource(id,source){mapState.sources.set(id,source)}
  };
  const libre={
    supported(){return true},
    Map:class{constructor(options){mapState.options=options;return mapInstance}},
    NavigationControl:class{},
    Marker:class{
      constructor(options){this.element=options.element}
      setLngLat(coordinate){this.coordinate=coordinate;return this}
      addTo(){mapState.markers.push(this);return this}
      remove(){mapState.markers=mapState.markers.filter(m=>m!==this);return this}
      setPopup(){return this}
    },
    Popup:class{
      setDOMContent(){return this}
    }
  };
  if(ranking)window.CartigmaRanking=ranking;
  if(mobile)window.matchMedia=()=>({matches:true});
  if(map){
    window.maplibregl=libre;
    window.GeoMapLoader={load:async style=>style==="osm"?{...libre,isFallback:true}:libre};
  }
  const math=Object.create(Math);
  let draw=0;
  math.random=()=>{
    const engine=window.CartigmaClueEngine,countries=window.CartigmaCountries;
    const country=countries[Math.floor(randomValue*countries.length)];
    const continent=engine.clueContinent(country);
    const value=draw++%2===0?engine.CONTINENTS.indexOf(continent):
      countries.filter(item=>engine.clueContinent(item)===continent).indexOf(country);
    return value/2**32;
  };
  const perf={distanceCalls:0};
  math.atan2=(...args)=>{perf.distanceCalls++;return Math.atan2(...args)};
  const context={
    window,document,localStorage,navigator:{},Math:math,Number,String,Array,Set,Map,JSON,Date:clock,Intl:intl,
    AbortController,console,setTimeout(){return 0},clearTimeout(){},
    setInterval(fn){clockCallbacks.push(fn);return clockCallbacks.length},clearInterval(){},
    fetch:async url=>String(url).includes("admin_0_countries.geojson")
      ?{ok:true,json:async()=>countryData||{features:[]}}
      :{ok:true,json:async()=>({results:[]})}
  };
  for(const n of names.filter(n=>n.endsWith(".js")&&n!=="map-bootstrap.js"))
    runInNewContext(files[n],context,{filename:n});
  const get=id=>document.getElementById(id);
  function select(name){
    get("countrySearch").value=name;
    get("countrySearch").handlers.input({target:get("countrySearch")});
    const choice=get("suggestions").children.find(x=>x.className==="suggestion");
    assert.ok(choice,"Missing search result for "+name);
    choice.handlers.click();
  }
  // Most existing tests describe active game behavior. Opt into their
  // legacy "already started" fixture, while dedicated tests verify the new gate.
  const startActiveFixture=()=>{
    if(autoStart&&get("difficultySelect").value!=="rush"&&
       !get("rushIntro").classList.contains("hidden"))get("rushStartBtn").click();
  };
  for(const id of ["dailyBtn","freeBtn"]){
    const original=get(id).handlers.click;
    get(id).handlers.click=e=>{original(e);startActiveFixture();};
  }
  startActiveFixture();
  const difficulty=value=>{
    get("difficultySelect").handlers.change({target:{value}});
    startActiveFixture();
  };
  const language=value=>get("langSelect").handlers.change({target:{value}});
  return {get,window,document,storage,select,difficulty,language,mapState,mobileCase,perf,
    tick(){for(const callback of clockCallbacks)callback()}};
}


const CATALOG_KEY="cartigma-country-daily-v7-";
const FREE_BAG_KEY="cartigma-freeplay-country-bag-v1";
function clueTexts(g){
  return g.get("clueList").children.map(row=>row.children[1].children[1].textContent);
}
function fakeClock(iso="2026-11-17T12:00:00.000Z"){
  return class Clock extends Date{
    static ms=Date.parse(iso);
    static now(){return Clock.ms}
    constructor(...a){super(...(a.length?a:[Clock.ms]))}
  };
}
function countryIndex(g,code){
  return g.window.CartigmaCountries.findIndex(c=>c.code===code);
}
test("Country data loads 195 unique states with no city database",()=>{
  const g=boot(),countries=g.window.CartigmaCountries,profile=g.window.GeoCountryInsights;
  assert.equal(countries.length,195);
  assert.equal(new Set(countries.map(x=>x.code)).size,195);
  assert.equal(Object.keys(profile).length,195);
  for(const country of countries){
    assert.ok(/^[A-Z]{2}$/.test(country.code),country.code);
    assert.ok(country.name&&country.flag&&Number.isFinite(country.lat)&&
      Number.isFinite(country.lng)&&country.mask>0,country.code);
    assert.ok(profile[country.code]?.area>0,country.code);
    assert.ok(profile[country.code]?.history?.en,country.code);
  }
  const html=files["index.html"];
  assert.match(html,/country-catalog\.js/);
  for(const path of ["places.js","cities-extended.js","facts.js","references.js",
     "urban-2025.js","city-indicators.js","city-clues-i18n.js"])
    assert.ok(!html.includes('src="'+path),'No legacy city source: '+path);
  assert.match(html,/195 of 195 countries/);
  assert.equal(g.get("placeCount").textContent,"195");
});
test("A searchable country dossier lists all 195 unique countries",()=>{
  const g=boot(),$=g.get;
  $("atlasBtn").click();
  assert.equal($("atlasOptions").children.length,195);
  assert.equal($("atlasCount").textContent,"195 of 195 countries");
  assert.equal($("atlasDialog").open,true);
  const brazil=$("atlasOptions").children.find(x=>
    x.children[1]?.children[1]?.textContent==="BR");
  assert.ok(brazil);
  brazil.click();
  assert.equal($("atlasCountryName").textContent,"Brazil");
  assert.equal($("atlasCountryCode").textContent,"BR");
  assert.ok($("atlasNormalEvidence").children.length>=6);
  assert.ok($("atlasHardEvidence").children.length>=6);
  assert.ok($("atlasHistory").textContent.length>10);
  assert.ok($("atlasCountryStats").children.length>=4);
  $("atlasSearch").value="Vatican";
  $("atlasSearch").handlers.input();
  assert.equal($("atlasOptions").children.length,1);
  $("atlasOptions").children[0].click();
  assert.equal($("atlasCountryCode").textContent,"VA");
});
test("All countries have valid evidence without latitude belts or UTM and no continent/hemisphere overlap",()=>{
  const g=boot(),$=g.get;
  $("atlasBtn").click();
  const buttons=$("atlasOptions").children;
  for(let i=0;i<195;i++){
    buttons.find(b=>b.dataset.index===String(i)).click();
    for(const level of ["Normal","Hard"]){
      const rows=$("atlas"+level+"Evidence").children;
      assert.ok(rows.length>=6&&rows.length<=10,"Available facts at country "+i+" / "+level);
      const values=rows.map(x=>x.children[1].textContent);
      assert.equal(new Set(values).size,values.length,"Duplicate clue at "+i+" / "+level);
      assert.ok(values.every(x=>!/(latitude belt|latitude band|utm zone|utm latitude band|landscape|national capital:|distance to coast|distance to capital)/i.test(x)),
        "Forbidden clue at country "+i+" / "+values.join(" | "));
    }
  }
  for(const [level,code] of [["normal","BR"],["hard","TR"],["rush","VA"]]){
    const country=g.window.CartigmaCountries.find(c=>c.code===code);
    const clues=g.window.CartigmaClueEngine.buildClues(country,
      g.window.GeoCountryInsights[code],level,g.window.GeoCurrencyDenominations,g.window.CartigmaCountries);
    const keys=clues.map(x=>x.key);
    assert.equal(keys.includes("continent")&&keys.includes("hemisphere"),false);
    assert.equal(keys.some(x=>["zone","utmZone","utmBand","latitude"].includes(x)),false);
  }
});
test("Signed-in account automatically uses the native map in ranked mode",async()=>{
  const events=[];
  const state={
    id:"b1592f31-fc31-4189-aebf-1d2ee615d877",
    mode:"daily",day:"2026-11-17",difficulty:"normal",
    startedAt:Date.parse("2026-11-17T12:00:00Z"),
    clues:[{key:"continent",continents:["southAmerica"]}],clueCount:10,nextHintCost:300,
    revealed:1,guesses:[],finished:false,won:false,score:null,
    penalty:0,hints:0,saved:false
  };
  const ranking={
    mayRank:()=>true,
    resumeRanked:async()=>null,
    beginRanked:async args=>{events.push("start:"+args.mode);return {...state};},
    gameAction:async(name,payload)=>{
      events.push(name+":"+(payload.code||""));
      return {...state,guesses:[{code:"BR",elapsedMs:1000}],
        clues:[...state.clues,{key:"countryBorders",value:3}],
        revealed:10,finished:true,won:true,score:5000,saved:true,target:"BR"};
    }
  };
  const g=boot({ranking,autoStart:false}),$=g.get;
  assert.equal($("rushIntro").classList.contains("hidden"),false);
  $("rushStartBtn").click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal($("rushIntro").classList.contains("hidden"),true);
  assert.equal($("caseTitle").textContent,"Unknown location");
  assert.equal($("hintCount").textContent,"1 / "+$("clueList").children.length);
  g.select("Brazil");
  assert.equal($("guessBtn").disabled,false);
  $("guessBtn").click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal($("reportHeading").textContent,"Brazil");
  assert.equal($("finalScore").textContent,"5,000");
  assert.deepEqual(events,["start:daily","guess:BR"]);
});
test("Start card displays actual mode and finite attempts in Normal and Hard",()=>{
  for(const level of ["normal","hard","rush"]){
    const g=boot({autoStart:false}),$=g.get;
    g.difficulty(level);
    const expected=level==="normal"?"6":level==="hard"?"4":null;
    assert.ok($("rushIntroEyebrow").textContent.includes(level==="rush"?"RUSH":"DAILY")||
      $("rushIntroEyebrow").textContent.includes(level==="rush"?"Rush":"DAILY CASE"));
    assert.equal($("rushIntroTitle").textContent,level==="rush"?"Rush mode":level==="hard"?"Hard":"Normal");
    if(expected){
      assert.equal($("rushIntroText").textContent,"Attempts left: "+expected);
      assert.equal($("attemptCount").textContent,expected+" / "+expected);
      assert.doesNotMatch($("rushIntroText").textContent,/unlimited/i);
      $("freeBtn").click();
      assert.match($("rushIntroEyebrow").textContent,/FREE PLAY/);
      assert.equal($("rushIntroText").textContent,"Attempts left: "+expected);
    }else{
      assert.match($("rushIntroText").textContent,/60 seconds/i);
    }
  }
});
test("Completed ranked free case permits another free case and changing to Daily",async()=>{
  let starts=0;
  const origin=Date.parse("2026-11-17T12:00:00Z");
  const initial={
    id:"b1592f31-fc31-4189-aebf-1d2ee615d877",mode:"free",difficulty:"normal",
    day:"2026-11-17",startedAt:origin,
    clues:[{key:"continent",continents:["southAmerica"]}],clueCount:10,nextHintCost:300,
    revealed:1,guesses:[],finished:false,won:false,score:null,
    penalty:0,hints:0,saved:false
  };
  const ranked={
    mayRank:()=>true,
    resumeRanked:async(mode)=>{
      // Simulate a stale response arriving after the player switched modes.
      return mode==="daily"?{...initial,finished:true,target:"BR"}:null;
    },
    beginRanked:async({mode})=>{
      starts++;
      return {...initial,mode,id:initial.id.slice(0,-1)+starts};
    },
    gameAction:async()=>({...initial,guesses:[{code:"BR",elapsedMs:1000}],
      finished:true,won:true,score:5000,saved:true,rankingPoints:5000,target:"BR",revealed:10})
  };
  const g=boot({ranking:ranked,autoStart:false}),$=g.get;
  $("freeBtn").click();
  $("rushStartBtn").click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal($("rushIntro").classList.contains("hidden"),true);
  assert.equal($("freeBtn").classList.contains("active"),true);
  g.select("Brazil");$("guessBtn").click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal($("resultCard").classList.contains("hidden"),false);
  assert.equal($("reportRanking").textContent,"+5,000 pts to the ranking");
  $("reportNextBtn").click();
  assert.equal($("reportDialog").open,false);
  assert.equal($("rushIntro").classList.contains("hidden"),false);
  assert.equal($("freeBtn").classList.contains("active"),true);
  $("rushStartBtn").click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(starts,2);
  assert.equal($("rushIntro").classList.contains("hidden"),true,
    "A new ranked Freeplay round should start after the first one ends");
  assert.match($("modeCaption").textContent,/RANKED/);
  assert.equal($("guessBtn").disabled,true);
  g.select("Brazil");
  assert.equal($("guessBtn").disabled,false);
  $("dailyBtn").click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal($("dailyBtn").classList.contains("active"),true);
  assert.equal($("rushIntro").classList.contains("hidden"),false);
  $("rushStartBtn").click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(starts,3);
  assert.equal($("rushIntro").classList.contains("hidden"),true);
  assert.equal($("dailyBtn").classList.contains("active"),true);
});
test("A finished Free case offers a one-click return to Daily from the result dialog",()=>{
  const g=boot({autoStart:false}),$=g.get;
  $("freeBtn").click();
  $("rushStartBtn").click();
  const target=g.window.CartigmaCountries[Math.floor(0.42*195)];
  g.select(target.name);
  $("guessBtn").click();
  assert.equal($("reportDialog").open,true);
  assert.equal($("reportAlternateBtn").classList.contains("hidden"),false);
  assert.equal($("reportAlternateBtn").textContent,"Daily case");
  $("reportAlternateBtn").click();
  assert.equal($("reportDialog").open,false);
  assert.equal($("dailyBtn").classList.contains("active"),true);
  assert.equal($("rushIntro").classList.contains("hidden"),false);
});
test("Normal, Hard, and Rush all require explicit Start before revealing clues",()=>{
  for(const level of ["normal","hard","rush"]){
    const g=boot({autoStart:false}),$=g.get;
    g.difficulty(level);
    assert.equal($("clueList").children.length,0);
    assert.equal($("rushIntro").classList.contains("hidden"),false);
    assert.equal($("countrySearch").disabled,true);
    $("rushStartBtn").click();
    assert.equal($("rushIntro").classList.contains("hidden"),true);
    const total=$("clueList").children.length;
    assert.ok(total>=6&&total<=10);
    assert.equal($("hintCount").textContent,
      (level==="normal"?2:1)+" / "+total);
  }
});
test("Normal and Hard accept country names, with correct attempts and results",()=>{
  for(const level of ["normal","hard"]){
    const g=boot(),$=g.get;g.difficulty(level);$("freeBtn").click();
    assert.equal($("attemptCount").textContent,level==="normal"?"6 / 6":"4 / 4");
    const daily=g.window.CartigmaCountries.length;
    assert.equal(daily,195);
    const targetIndex=Math.floor(0.42*195);
    const target=g.window.CartigmaCountries[targetIndex];
    assert.ok(target);
    const wrong=g.window.CartigmaCountries.find(x=>x.code!==target.code).name;
    g.select(wrong);$("guessBtn").click();
    assert.equal($("guessHistory").children.length,1);
    assert.match($("feedback").textContent,/km/);
    assert.equal(/[↑↗→↘↓↙←↖]/.test($("feedback").textContent),level==="normal");
    $("countrySearch").value=wrong;
    $("countrySearch").handlers.input({target:$("countrySearch")});
    assert.equal($("suggestions").children[0]?.className,"suggestion-empty");
    g.select(target.name);
    $("guessBtn").click();
    assert.equal($("reportDialog").open,true);
    assert.equal($("reportCoordinates").textContent,"—");
    assert.equal($("reportBest").textContent,"✓");
    assert.equal($("reportHeading").textContent,target.name);
    assert.equal($("finalScore").textContent,"3,900");
  }
});
test("Rush reveals nothing before Start, including categories and first hint",()=>{
  const Clock=fakeClock(),g=boot({clock:Clock}),$=g.get;
  g.difficulty("rush");
  assert.equal($("gameTimer").textContent,"01:00");
  assert.equal($("hintCount").textContent,"0 / 10");
  assert.equal($("clueList").children.length,0);
  assert.equal($("clueList").classList.contains("hidden"),true);
  assert.equal($("rushIntro").classList.contains("hidden"),false);
  assert.equal($("countrySearch").disabled,true);
  Clock.ms+=120000;g.tick();
  assert.equal($("gameTimer").textContent,"01:00");
  assert.equal($("reportDialog").open,false);
  assert.equal($("clueList").children.length,0);
  $("rushStartBtn").click();
  assert.equal($("rushIntro").classList.contains("hidden"),true);
  const total=$("clueList").children.length;
  assert.ok(total>=6);
  assert.equal($("hintCount").textContent,"1 / "+total);
  assert.equal($("clueList").classList.contains("hidden"),false);
  Clock.ms+=12000;g.tick();
  assert.equal($("hintCount").textContent,"3 / "+total);
  Clock.ms+=48000;g.tick();
  assert.equal($("reportDialog").open,true);
  assert.equal($("finalScore").textContent,"0");
});
test("Rush daily waiting state survives reload without hint leaks",()=>{
  const Clock=fakeClock(),storage=new Map();
  storage.set("geodetective-difficulty",JSON.stringify("rush"));
  const a=boot({clock:Clock,storage}),$=a.get;
  const key=CATALOG_KEY+"2026-11-17-rush";
  assert.equal(JSON.parse(storage.get(key)).revealed,0);
  Clock.ms+=75000;
  const b=boot({clock:Clock,storage}),g=b.get;
  assert.equal(g("clueList").children.length,0);
  assert.equal(g("rushIntro").classList.contains("hidden"),false);
  assert.equal(g("gameTimer").textContent,"01:00");
  g("rushStartBtn").click();
  assert.equal(g("hintCount").textContent,"1 / "+g("clueList").children.length);
  assert.equal(JSON.parse(storage.get(key)).revealed,1);
});
test("Freeplay can repeat countries without persistent history",()=>{
  const first=boot({randomValue:0}),a=first.get;
  const low=first.window.CartigmaCountries[0];
  for(let i=0;i<4;i++){
    a("freeBtn").click();
    first.select(low.name);a("guessBtn").click();
    assert.equal(a("reportHeading").textContent,low.name);
  }
  assert.equal(first.storage.has(FREE_BAG_KEY),false);
  const last=boot({randomValue:0.99999}),b=last.get,
    high=last.window.CartigmaCountries.at(-1);
  b("freeBtn").click();
  last.select(high.name);b("guessBtn").click();
  assert.equal(b("reportHeading").textContent,high.name);
  assert.equal(last.storage.has(FREE_BAG_KEY),false);
});
test("Daily country is shared and deterministic per UTC day, without a no-repeat cycle",()=>{
  const Clock=fakeClock("2026-01-01T12:00:00.000Z");
  for(let i=0;i<75;i++){
    const date=new Clock().toISOString().slice(0,10);
    const left=new Map(),right=new Map();
    boot({clock:Clock,storage:left});boot({clock:Clock,storage:right});
    const first=JSON.parse(left.get(CATALOG_KEY+date+"-normal"));
    const second=JSON.parse(right.get(CATALOG_KEY+date+"-normal"));
    assert.equal(first.index,second.index);
    assert.ok(first.index>=0&&first.index<195);
    Clock.ms+=86400000;
  }
});
test("Country search supports translated names and codes, without city geocoding",()=>{
  const g=boot(),$=g.get;
  g.language("pt");
  g.select("Brasil");assert.equal($("selectedText").textContent,"Brasil");
  $("countrySearch").value="BR";$("countrySearch").handlers.input({target:$("countrySearch")});
  assert.ok($("suggestions").children.some(x=>x.textContent==="Brasil"));
  $("countrySearch").value="São Paulo";$("countrySearch").handlers.input({target:$("countrySearch")});
  assert.ok(!$("suggestions").children.some(x=>x.textContent==="São Paulo"));
});
test("A map click selects a country via real geographic polygons",async()=>{
  const polygon=(west,south,east,north)=>({type:"Polygon",coordinates:[
    [[west,south],[east,south],[east,north],[west,north],[west,south]]]});
  const data={features:[
    ...Array.from({length:101},()=>({properties:{ISO_A2:"ZZ"},geometry:polygon(0,0,1,1)})),
    {properties:{ISO_A2:"BR"},geometry:polygon(-75,-35,-34,6)}
  ]};
  const g=boot({map:true,countryData:data}),$=g.get;
  g.mapState.events.click({lngLat:{lat:-15,lng:-50}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal($("selectedText").textContent,"Brazil");
  assert.equal($("guessBtn").disabled,false);
});
test("All localizations have country dossier labels and no 500-city count",()=>{
  const g=boot(),packs=g.window.CartigmaAtlasI18n;
  assert.equal(Object.keys(packs).length,19);
  for(const [lang,pack] of Object.entries(packs)){
    for(const key of ["title","subtitle","search","count","geoDetails","countryPlural"])
      assert.ok(typeof pack[key]==="string"&&pack[key].length>0,lang+" missing "+key);
    assert.ok(!pack.count.includes("500"),lang+" old cities count");
  }
});


test("Rush pins show selected names, map-click positions and numbered guess history",async()=>{
  const Clock=fakeClock();
  const poly=(west,south,east,north)=>({
    type:"Polygon",coordinates:[[[west,south],[east,south],[east,north],
      [west,north],[west,south]]]});
  const features={features:[
    ...Array.from({length:101},()=>({
      properties:{ISO_A2:"ZZ"},geometry:poly(0,0,1,1)})),
    {properties:{ISO_A2:"BR"},geometry:poly(-74,-34,-34,6)}
  ]};
  const g=boot({clock:Clock,map:true,countryData:features}),$=g.get;
  g.difficulty("rush");
  $("rushStartBtn").click();
  const save=JSON.parse(g.storage.get(CATALOG_KEY+"2026-11-17-rush"));
  const target=g.window.CartigmaCountries[save.index];
  const guessCode=target.code==="BR"?"MX":"BR";
  const guess=g.window.CartigmaCountries.find(c=>c.code===guessCode);
  g.select(guess.name);
  assert.equal($("selectedText").textContent,guess.name);
  assert.equal($("guessBtn").disabled,false);
  assert.ok(g.mapState.markers.some(m=>
    m.coordinate[0]===guess.lng&&m.coordinate[1]===guess.lat&&
    m.element.children[0].textContent==="+"),
    "Typing and selecting a suggestion must show a pin immediately");
  $("guessBtn").click();
  assert.equal($("guessHistory").children.length,1);
  assert.ok(g.mapState.markers.some(m=>
    m.coordinate[0]===guess.lng&&m.coordinate[1]===guess.lat&&
    m.element.children[0].textContent==="1"),
    "Submitted Rush guesses must stay visible as numbered pins");
  if(target.code!=="BR"){
    g.mapState.events.click({lngLat:{lat:-15,lng:-50}});
    await new Promise(resolve=>setImmediate(resolve));
    assert.ok(!g.mapState.markers.some(m=>m.element.children[0].textContent==="+"),
      "Clicking a country already guessed must leave the guess unselected");
    assert.equal($("guessBtn").disabled,true);
  }
  g.tick();
  assert.ok(g.mapState.markers.some(m=>m.element.children[0].textContent==="1"));
});
test("Every locale keeps border-count localization while evidence omits latitude and UTM",()=>{
  const g=boot(),$=g.get;$("atlasBtn").click();
  for(const lang of ["en","pt","fr","de","ja"]){
    g.language(lang);
    const row=$("atlasNormalEvidence").children;
    assert.ok(row.length>=6&&row.length<=10);
    assert.equal(row.some(x=>/\bUTM\b/i.test(x.children[1].textContent)),false);
  }
  for(const [lang,pack] of Object.entries(g.window.GeoCountryClueI18n))
    assert.ok(pack.countryBorders.includes("{value}"),lang);
});
test("Confirmed Rush pins keep their identity across guesses, map redraws, and timeout",()=>{
  const Clock=fakeClock();
  const g=boot({clock:Clock,map:true}),$=g.get;
  g.difficulty("rush");
  $("rushStartBtn").click();
  const saved=JSON.parse(g.storage.get(CATALOG_KEY+"2026-11-17-rush"));
  const country=g.window.CartigmaCountries[saved.index];
  const guesses=["BR","MX","CA"]
    .filter(code=>code!==country.code)
    .slice(0,2)
    .map(code=>g.window.CartigmaCountries.find(c=>c.code===code));
  const pinWithNumber=n=>g.mapState.markers.find(m=>
    m.element.children[0]?.textContent===String(n));
  assert.equal(guesses.length,2);
  // First wrong guess: the temporary plus becomes a numbered marker.
  g.select(guesses[0].name);
  const current=g.mapState.markers.find(m=>
    m.element.children[0]?.textContent==="+");
  assert.ok(current);
  $("guessBtn").click();
  const firstPin=pinWithNumber(1);
  assert.ok(firstPin,"first Rush guess must remain as a numbered pin");
  assert.ok(!g.mapState.markers.includes(current),
    "only the unconfirmed plus marker should be removed");
  // Selecting another country must not remove or replace the old marker.
  g.select(guesses[1].name);
  assert.equal(pinWithNumber(1),firstPin);
  $("guessBtn").click();
  const secondPin=pinWithNumber(2);
  assert.ok(secondPin,"second Rush guess must remain a numbered pin");
  assert.equal(pinWithNumber(1),firstPin);
  assert.equal(g.mapState.markers.filter(m=>
    ["1","2"].includes(m.element.children[0]?.textContent)).length,2);
  // Map style/clue redraw must not remove or re-create already confirmed pins.
  g.mapState.events["style.load"]();
  g.tick();
  assert.equal(pinWithNumber(1),firstPin);
  assert.equal(pinWithNumber(2),secondPin);
  // Even after Rush times out, pins remain for reviewing the case.
  Clock.ms+=60001;
  g.tick();
  assert.equal($("reportDialog").open,true);
  assert.equal(pinWithNumber(1),firstPin);
  assert.equal(pinWithNumber(2),secondPin);
  // A genuinely new case, unlike a redraw, clears the old case's pins.
  $("freeBtn").click();
  assert.equal(pinWithNumber(1),undefined);
  assert.equal(pinWithNumber(2),undefined);
});

test("Other difficulties also retain numbered pins across consecutive guesses",()=>{
  const g=boot({map:true}),$=g.get;
  $("freeBtn").click();
  const target=g.window.CartigmaCountries[Math.floor(.42*195)];
  const guesses=["BR","MX","CA"].filter(code=>code!==target.code)
    .slice(0,2).map(code=>g.window.CartigmaCountries.find(c=>c.code===code));
  g.select(guesses[0].name);$("guessBtn").click();
  const first=g.mapState.markers.find(m=>m.element.children[0]?.textContent==="1");
  assert.ok(first);
  g.select(guesses[1].name);$("guessBtn").click();
  assert.ok(g.mapState.markers.includes(first));
  assert.ok(g.mapState.markers.some(m=>m.element.children[0]?.textContent==="2"));
});


test("Country autocomplete confirms the first result on Enter, without a mouse click",()=>{
  const g=boot({map:true}),$=g.get;
  const field=$("countrySearch"),list=$("suggestions");
  field.value="United";
  field.handlers.input({target:field});
  assert.ok(list.children.length>=3);
  const first=list.children[0].textContent;
  assert.equal(list.children[0].classList.contains("active"),true);
  assert.equal(field.attributes["aria-expanded"],"true");
  assert.equal(field.attributes["aria-activedescendant"],list.children[0].id);
  let prevented=false;
  field.handlers.keydown({key:"Enter",preventDefault(){prevented=true}});
  assert.equal(prevented,true);
  assert.equal($("guessHistory").children.length,1);
  const committed=$("guessHistory").children[0].children[0].children[1].textContent;
  assert.equal(committed,first);
  assert.equal(list.classList.contains("hidden"),true);
  assert.equal(field.attributes["aria-expanded"],"false");
  assert.ok(g.mapState.markers.some(m=>m.element.children[0].textContent==="1"));
});

test("Arrow keys select the highlighted country and Enter submits that country",()=>{
  const g=boot(),$=g.get;
  const field=$("countrySearch"),list=$("suggestions");
  field.value="United";
  field.handlers.input({target:field});
  assert.ok(list.children.length>=3);
  const first=list.children[0].textContent;
  const second=list.children[1].textContent;
  let prevented=0;
  const press=(key,extra={})=>field.handlers.keydown({
    key,preventDefault(){prevented++},...extra
  });
  press("ArrowDown");
  assert.equal(list.children[1].classList.contains("active"),true);
  assert.equal(list.children[0].classList.contains("active"),false);
  assert.equal(field.attributes["aria-activedescendant"],list.children[1].id);
  press("ArrowUp");
  assert.equal(list.children[0].classList.contains("active"),true);
  press("ArrowDown");
  const active=list.children[1].textContent;
  assert.equal(active,second);
  assert.notEqual(active,first);
  press("Enter",{isComposing:true});
  assert.equal($("guessHistory").children.length,1); // empty-history placeholder
  press("Enter");
  const committed=$("guessHistory").children[0].children[0].children[1].textContent;
  assert.equal(committed,second);
  assert.equal(prevented,4);
});

test("Autocomplete with no matches cannot submit a guess; clicking suggestion only selects",()=>{
  const g=boot({map:true}),$=g.get;
  const field=$("countrySearch");
  field.value="not-a-real-country-xyz";
  field.handlers.input({target:field});
  let prevented=false;
  field.handlers.keydown({key:"Enter",preventDefault(){prevented=true}});
  assert.equal(prevented,true);
  assert.equal($("guessHistory").children[0].className,"empty-history");
  field.value="United";
  field.handlers.input({target:field});
  const first=$("suggestions").children[0];
  first.click();
  assert.equal($("guessHistory").children[0].className,"empty-history");
  assert.equal($("guessBtn").disabled,false);
  assert.ok(g.mapState.markers.some(m=>m.element.children[0].textContent==="+"));
});

test("Rush reveals a distinct result pin only after victory or time limit",()=>{
  const Clock=fakeClock();
  const g=boot({clock:Clock,map:true}),$=g.get;
  g.difficulty("rush");
  const marker=label=>g.mapState.markers.find(m=>
    m.element.children[0]?.textContent===label);
  assert.equal(marker("★"),undefined);
  $("rushStartBtn").click();
  const saved=JSON.parse(g.storage.get(CATALOG_KEY+"2026-11-17-rush"));
  const target=g.window.CartigmaCountries[saved.index];
  const wrong=g.window.CartigmaCountries.find(c=>c.code!==target.code);
  g.select(wrong.name);
  $("guessBtn").click();
  const guessPin=marker("1");
  assert.ok(guessPin);
  assert.equal(marker("★"),undefined,"Answer must stay hidden during Rush");
  // Timeout reveals the correct country's reference position and leaves
  // numbered guess markers intact, even after the map's style reloads.
  Clock.ms+=60001;
  g.tick();
  const resultPin=marker("★");
  assert.ok(resultPin,"A correct-country result pin must appear after timeout");
  assert.deepEqual(Array.from(resultPin.coordinate),[target.lng,target.lat]);
  assert.equal(marker("1"),guessPin);
  g.mapState.events["style.load"]();
  assert.equal(marker("★"),resultPin);
  assert.equal(marker("1"),guessPin);
  $("reportMapBtn").click();
  assert.equal($("reportDialog").open,false);
  assert.deepEqual(Array.from(g.mapState.eases.at(-1).center),[target.lng,target.lat]);
  $("freeBtn").click();
  assert.equal(marker("★"),undefined,"New games must remove old answer pins");
  assert.equal(marker("1"),undefined,"New games must remove old guess pins");
});

test("Rush success shows the answer pin and preserves the winning guess pin",()=>{
  const Clock=fakeClock();
  const g=boot({clock:Clock,map:true}),$=g.get;
  g.difficulty("rush");
  $("rushStartBtn").click();
  const saved=JSON.parse(g.storage.get(CATALOG_KEY+"2026-11-17-rush"));
  const target=g.window.CartigmaCountries[saved.index];
  g.select(target.name);
  $("guessBtn").click();
  assert.equal($("reportDialog").open,true);
  assert.ok(g.mapState.markers.some(m=>m.element.children[0]?.textContent==="1"));
  const result=g.mapState.markers.find(m=>m.element.children[0]?.textContent==="★");
  assert.ok(result);
  assert.deepEqual(Array.from(result.coordinate),[target.lng,target.lat]);
  const markerCount=g.mapState.markers.length;
  g.tick();g.mapState.events["style.load"]();
  assert.equal(g.mapState.markers.length,markerCount,
    "Repeated renders must not duplicate result markers");
});


test("A historical fact is not duplicated as Did you know? in the Kiribati dossier",()=>{
  const reference=boot();
  const index=countryIndex(reference,"KI");
  assert.ok(index>=0);
  const g=boot({randomValue:(index+.25)/195}),$=g.get;
  $("freeBtn").click();
  g.language("pt");
  g.select("Kiribati");$("guessBtn").click();
  assert.equal($("reportDialog").open,true);
  assert.equal($("reportHistory").textContent,
    "Kiribati conquistou a independência em 1979.");
  assert.equal($("reportFact").textContent,"");
  assert.equal($("reportFactSection").classList.contains("hidden"),true);
  assert.match(files["index.html"],/id="reportFactSection"/);
});

test("Dossier shows genuinely distinct trivia and hides duplicate or empty trivia",()=>{
  const g=boot(),$=g.get;
  $("freeBtn").click();
  const country=g.window.CartigmaCountries[Math.floor(.42*195)];
  const detail=g.window.GeoCountryInsights[country.code];
  const originalTrivia=detail.trivia;
  try{
    const history=detail.history.en;
    assert.ok(history);
    detail.trivia={en:"An independent fact about the country's geography."};
    g.select(country.name);$("guessBtn").click();
    assert.equal($("reportDialog").open,true);
    assert.equal($("reportFactSection").classList.contains("hidden"),false);
    assert.equal($("reportFact").textContent,detail.trivia.en);
    assert.equal($("reportHistory").textContent,history);

    detail.trivia={en:"   "+history.toUpperCase().replaceAll("."," ! ")+"  "};
    $("reportOpenBtn").click(); // Refresh dossier with source-like duplicate.
    assert.equal($("reportFactSection").classList.contains("hidden"),true);
    assert.equal($("reportFact").textContent,"");

    detail.trivia={en:" "};
    $("reportOpenBtn").click();
    assert.equal($("reportFactSection").classList.contains("hidden"),true);
  }finally{
    if(originalTrivia===undefined)delete detail.trivia;
    else detail.trivia=originalTrivia;
  }
});

test("None of the 195 source profiles reuse history as separate trivia",()=>{
  const g=boot();
  for(const [code,info] of Object.entries(g.window.GeoCountryInsights)){
    const trivia=info.trivia;
    const history=info.history;
    if(!trivia)continue;
    for(const lang of ["en","pt"]){
      const value=typeof trivia==="string"?trivia:trivia[lang];
      const source=history?.[lang]||history?.en||"";
      if(value)assert.notEqual(value.trim().toLocaleLowerCase(),
        source.trim().toLocaleLowerCase(),code+" has duplicated "+lang+" trivia");
    }
  }
});


test("Rush has no purchasable evidence overlays, including on old saved cases",()=>{
  const Clock=fakeClock();
  const storage=new Map();
  const initial=boot({clock:Clock,map:true,storage}),$=initial.get;
  initial.difficulty("rush");
  $("rushStartBtn").click();
  const key=CATALOG_KEY+"2026-11-17-rush";
  const saved=JSON.parse(storage.get(key));
  assert.equal(saved.revealed,1);
  assert.ok($("clueList").children.length>0);
  assert.equal($("clueList").children.filter(row=>
    row.children[1]?.children?.some(child=>
      child.className?.includes("sector-map-btn"))).length,0);
  assert.equal($("revealBtn").classList.contains("hidden"),true);
  saved.sectorReveals=["zone","longitude","utmZone","utmBand","hemisphere","continent"];
  storage.set(key,JSON.stringify(saved));
  storage.set("geodetective-difficulty",JSON.stringify("rush"));
  const reloaded=boot({clock:Clock,map:true,storage}),layers=reloaded.mapState.layers;
  assert.ok(![...layers.keys()].some(id=>id.startsWith("case-")),
    "Old saved Rush overlays must not be rendered");
  Clock.ms+=54000;reloaded.tick();
  const $r=reloaded.get;
  const total=$r("clueList").children.length;
  assert.equal($r("hintCount").textContent,total+" / "+total);
  assert.ok($r("clueList").children.every(row=>
    !row.children[1]?.children?.some(child=>
      child.className?.includes("sector-map-btn"))));
});

test("Normal and Hard still offer overlay buttons for available clues",()=>{
  for(const level of ["normal","hard"]){
    const g=boot({map:true}),$=g.get;
    g.difficulty(level);
    // Evidence starts with the continent/latitude, which can be mapped.
    assert.ok($("clueList").children.some(row=>
      row.children[1]?.children?.some(child=>
        child.className?.includes("sector-map-btn"))),
      level+" must keep optional overlays");
  }
});

test("Mobile controls toggle compact evidence/guess windows and update counts",()=>{
  const g=boot({mobile:true,map:true}),$=g.get;
  assert.equal($("mobileEvidenceBtn").attributes["aria-expanded"],"true");
  assert.equal($("mobileEvidencePanel").classList.contains("mobile-open"),true);
  assert.equal($("mobileGuessPanel").classList.contains("mobile-open"),false);
  assert.equal($("mobileEvidencePreview").textContent,"2 / "+$("clueList").children.length);
  assert.equal($("mobileGuessPreview").textContent,"0 / 6");
  $("mobileGuessBtn").click();
  assert.equal($("mobileEvidencePanel").classList.contains("mobile-open"),false);
  assert.equal($("mobileGuessPanel").classList.contains("mobile-open"),true);
  assert.equal($("mobileGuessBtn").attributes["aria-expanded"],"true");
  $("mobileGuessBtn").click();
  assert.equal($("mobileGuessPanel").classList.contains("mobile-open"),false);
  $("mobileEvidenceBtn").click();
  assert.equal($("mobileEvidencePanel").classList.contains("mobile-open"),true);
  const target=g.window.CartigmaCountries[Math.floor(.42*195)];
  const wrong=g.window.CartigmaCountries.find(c=>c.code!==target.code);
  g.select(wrong.name);
  $("guessBtn").click();
  assert.equal($("mobileEvidencePanel").classList.contains("mobile-open"),true);
  assert.equal($("mobileEvidencePreview").textContent,"3 / "+$("clueList").children.length);
  assert.equal($("mobileGuessPreview").textContent,"1 / 6");
});

test("Mobile Rush reveals no clues before Start and shows evidence popup after Start",()=>{
  const Clock=fakeClock();
  const g=boot({mobile:true,clock:Clock,map:true}),$=g.get;
  g.difficulty("rush");
  assert.equal($("mobileEvidenceBtn").disabled,true);
  assert.equal($("mobileGuessBtn").disabled,true);
  assert.equal($("mobileEvidencePanel").classList.contains("mobile-open"),false);
  assert.equal($("mobileEvidencePreview").textContent,"0 / 10");
  $("mobileEvidenceBtn").click();
  $("mobileGuessBtn").click();
  assert.equal($("mobileEvidencePanel").classList.contains("mobile-open"),false);
  assert.equal($("mobileGuessPanel").classList.contains("mobile-open"),false);
  $("rushStartBtn").click();
  assert.equal($("mobileEvidenceBtn").disabled,false);
  assert.equal($("mobileEvidencePanel").classList.contains("mobile-open"),true);
  assert.equal($("mobileEvidencePreview").textContent,"1 / "+$("clueList").children.length);
  Clock.ms+=6000;g.tick();
  assert.equal($("mobileEvidencePreview").textContent,"2 / "+$("clueList").children.length);
  $("mobileGuessBtn").click();
  assert.equal($("mobileGuessPanel").classList.contains("mobile-open"),true);
  const saved=JSON.parse(g.storage.get(CATALOG_KEY+"2026-11-17-rush"));
  const target=g.window.CartigmaCountries[saved.index];
  const wrong=g.window.CartigmaCountries.find(c=>c.code!==target.code);
  g.select(wrong.name);$("guessBtn").click();
  assert.equal($("mobileEvidencePanel").classList.contains("mobile-open"),true);
  assert.equal($("mobileGuessPreview").textContent,"1 / ∞");
  Clock.ms+=60000;g.tick();
  assert.equal($("reportDialog").open,true);
  assert.equal($("mobileEvidencePanel").classList.contains("mobile-open"),false);
  assert.equal($("mobileGuessPanel").classList.contains("mobile-open"),false);
});

test("On desktop, both original evidence and guess panels remain available",()=>{
  const g=boot(),$=g.get;
  assert.equal($("mobileEvidenceBtn").attributes["aria-expanded"],"false");
  assert.equal($("mobileGuessBtn").attributes["aria-expanded"],"false");
  assert.equal($("mobileEvidencePanel").classList.contains("mobile-open"),false);
  assert.equal($("mobileGuessPanel").classList.contains("mobile-open"),false);
  assert.ok(!$("mobileEvidencePanel").attributes["aria-hidden"]);
  assert.ok(!$("mobileGuessPanel").attributes["aria-hidden"]);
  // Hidden mobile-only buttons must not affect desktop behavior.
  $("mobileGuessBtn").click();
  assert.equal($("mobileGuessPanel").classList.contains("mobile-open"),false);
});


test("mobile Rush evidence follows newest unlocked clue and is fully scrollable",()=>{
  const Clock=fakeClock();
  const g=boot({mobile:true,clock:Clock,map:true}),$=g.get;
  const list=$("clueList");
  Object.defineProperty(list,"scrollHeight",{get(){
    return this.children.filter(row=>!row.className.split(" ").includes("locked")).length*64;
  }});
  list.scrollTop=0;
  g.difficulty("rush");
  $("rushStartBtn").click();
  assert.equal($("hintCount").textContent,"1 / "+$("clueList").children.length);
  assert.equal(list.scrollTop,64);
  assert.equal(list.children[0].classList.contains("latest"),true);
  Clock.ms+=18000;g.tick();
  assert.equal($("hintCount").textContent,"4 / "+$("clueList").children.length);
  assert.equal(list.scrollTop,256);
  assert.equal(list.children[3].classList.contains("latest"),true);
  assert.equal(list.children[4].classList.contains("latest"),false);
  $("mobileEvidenceBtn").click(); // Close to browse the map.
  list.scrollTop=14;
  Clock.ms+=12000;g.tick();
  assert.equal($("hintCount").textContent,"6 / "+$("clueList").children.length);
  assert.equal(list.scrollTop,14,"Closed popovers must not be scrolled");
  $("mobileEvidenceBtn").click();
  assert.equal(list.scrollTop,384,"Reopening follows the newest revealed clue");
  assert.equal(list.children[5].classList.contains("latest"),true);
  assert.equal(list.children[5].classList.contains("locked"),false);
});

test("the full-sized desktop evidence list never auto-scrolls on new clues",()=>{
  const g=boot({map:true}),$=g.get;
  const list=$("clueList");
  Object.defineProperty(list,"scrollHeight",{get(){return 500}});
  list.scrollTop=42;
  $("freeBtn").click();
  assert.equal(list.scrollTop,42);
  const target=g.window.CartigmaCountries[Math.floor(.42*195)];
  const other=g.window.CartigmaCountries.find(c=>c.code!==target.code);
  g.select(other.name);$("guessBtn").click();
  assert.equal($("hintCount").textContent,"3 / "+$("clueList").children.length);
  assert.equal(list.scrollTop,42);
});


test("mobile clue scrolling keeps the entire most recent card above its footer",()=>{
  const g=boot({mobile:true,map:true}),$=g.get;
  const list=$("clueList");
  list.getBoundingClientRect=()=>({top:100,bottom:200,height:100});
  $("freeBtn").click();
  const latest=list.children.find(row=>row.classList.contains("latest"));
  assert.ok(latest,"Newest clue must be marked for scrolling");
  latest.getBoundingClientRect=()=>({
    top:260-list.scrollTop,bottom:316-list.scrollTop,height:56
  });
  list.scrollTop=0;
  $("mobileEvidenceBtn").click(); // close
  $("mobileEvidenceBtn").click(); // open and scroll
  assert.equal(list.scrollTop,128,"Last card should have a 12px gap below it");
  assert.equal(latest.getBoundingClientRect().bottom,188);
  assert.equal($("mobileEvidencePanel").classList.contains("mobile-open"),true);
});


test("Lesotho has a valid geographic reference and Normal reveals its star result pin on mobile",()=>{
  const catalogue=boot(),index=countryIndex(catalogue,"LS");
  assert.ok(index>=0,"Lesotho must be available as a country");
  const expected=catalogue.window.CartigmaCountries[index];
  assert.equal(expected.code,"LS");
  assert.ok(expected.lat < -28 && expected.lat > -32);
  assert.ok(expected.lng > 27 && expected.lng < 30);
  const g=boot({map:true,mobile:true,randomValue:(index+.5)/195}),$=g.get;
  $("freeBtn").click();
  const resultPin=()=>g.mapState.markers.find(m=>
    m.element.children[0]?.textContent==="★");
  assert.equal(resultPin(),undefined,"Do not reveal the country during a game");
  g.select("Lesotho");
  assert.equal(resultPin(),undefined,"Unconfirmed selection must not reveal result");
  $("guessBtn").click();
  assert.equal($("reportDialog").open,true);
  assert.equal($("reportHeading").textContent,"Lesotho");
  const pin=resultPin();
  assert.ok(pin,"Normal-mode Lesotho must have a result pin");
  assert.deepEqual(Array.from(pin.coordinate),[expected.lng,expected.lat]);
  assert.ok(g.mapState.markers.some(m=>m.element.children[0]?.textContent==="1"),
    "The confirmed guess pin must remain available");
  g.mapState.events["style.load"]();
  assert.equal(resultPin(),pin,"Map redraw must not discard the result pin");
  $("reportMapBtn").click();
  assert.equal($("reportDialog").open,false);
  const camera=g.mapState.eases.at(-1);
  assert.deepEqual(Array.from(camera.center),[expected.lng,expected.lat]);
  assert.ok(camera.zoom>=4,"Center and zoom so small countries are discoverable");
  assert.equal(resultPin(),pin,"Opening the map must preserve the result pin");
  $("freeBtn").click();
  assert.equal(resultPin(),undefined,"A new case should clear the previous answer pin");
});

test("Normal and Hard reveal the result pin on victory AND after failed attempts",()=>{
  const marker=(game,label)=>game.mapState.markers.find(m=>
    m.element.children[0]?.textContent===label);
  const country=boot(),index=countryIndex(country,"LS");
  for(const difficulty of ["normal","hard"]){
    const g=boot({map:true,randomValue:(index+.5)/195}),$=g.get;
    g.difficulty(difficulty);
    $("freeBtn").click();
    assert.equal(marker(g,"★"),undefined);
    const wrongGuesses=g.window.CartigmaCountries.filter(c=>c.code!=="LS");
    for(let i=0;i<(difficulty==="normal"?6:4);i++){
      g.select(wrongGuesses[i].name);
      $("guessBtn").click();
      if(i<(difficulty==="normal"?5:3))
        assert.equal(marker(g,"★"),undefined, "Result must remain hidden before completion");
    }
    assert.equal($("reportDialog").open,true);
    assert.equal($("reportHeading").textContent,"Lesotho");
    assert.equal($("finalScore").textContent,"0");
    const pin=marker(g,"★");
    assert.ok(pin,difficulty+" must reveal answer on loss");
    assert.deepEqual(Array.from(pin.coordinate),[28.5,-29.5]);
    assert.equal(g.mapState.markers.filter(m=>
      /^\d+$/.test(m.element.children[0]?.textContent)).length,
      difficulty==="normal"?6:4,"Previous guesses remain visible");
    $("reportMapBtn").click();
    assert.deepEqual(Array.from(g.mapState.eases.at(-1).center),[28.5,-29.5]);
    g.mapState.events["style.load"]();
    assert.equal(marker(g,"★"),pin);
  }
});

test("result marker appears for every country, not just Lesotho or Rush",()=>{
  const all=boot().window.CartigmaCountries;
  for(const code of ["BR","LS","VA","KI","RU"]){
    const index=all.findIndex(c=>c.code===code);
    assert.ok(index>=0);
    const g=boot({map:true,randomValue:(index+.5)/195}),$=g.get;
    $("freeBtn").click();
    const target=g.window.CartigmaCountries[index];
    g.select(target.name);
    $("guessBtn").click();
    assert.equal($("reportDialog").open,true);
    const pin=g.mapState.markers.find(m=>m.element.children[0]?.textContent==="★");
    assert.ok(pin,"Missing result pin for "+code);
    assert.deepEqual(Array.from(pin.coordinate),[target.lng,target.lat]);
  }
});


test("Mobile Normal can return from View map to guesses, clues and the case file",()=>{
  const g=boot({mobile:true,map:true}),$=g.get;
  $("freeBtn").click();
  const target=g.window.CartigmaCountries[Math.floor(.42*195)];
  g.select(target.name);$("guessBtn").click();
  assert.equal($("reportDialog").open,true);
  assert.equal($("mobilePanelTabs").classList.contains("finished"),true);
  assert.equal($("mobileReportBtn").hidden,false);
  assert.equal($("mobileReportBtn").disabled,false);
  assert.equal($("mobileEvidenceBtn").disabled,false);
  assert.equal($("mobileGuessBtn").disabled,false);
  assert.equal($("mobileEvidencePanel").classList.contains("mobile-open"),false);
  $("reportMapBtn").click();
  assert.equal($("reportDialog").open,false);
  assert.deepEqual(Array.from(g.mapState.eases.at(-1).center),[target.lng,target.lat]);
  assert.equal($("mobileReportBtn").hidden,false);
  $("mobileGuessBtn").click();
  assert.equal($("mobileGuessPanel").classList.contains("mobile-open"),true);
  assert.equal($("mobileGuessBtn").attributes["aria-expanded"],"true");
  assert.equal($("mobileGuessPanel").attributes["aria-hidden"],"false");
  assert.equal($("mobileGuessPanel").classList.contains("mobile-case-finished"),true);
  assert.equal($("guessHistory").children.length,1);
  assert.equal($("resultCard").classList.contains("hidden"),false);
  $("mobileEvidenceBtn").click();
  assert.equal($("mobileGuessPanel").classList.contains("mobile-open"),false);
  assert.equal($("mobileEvidencePanel").classList.contains("mobile-open"),true);
  assert.ok($("clueList").children.length>=6);
  $("mobileReportBtn").click();
  assert.equal($("reportDialog").open,true);
  assert.equal($("mobileEvidencePanel").classList.contains("mobile-open"),false);
  $("reportCloseBtn").click();
  assert.equal($("reportDialog").open,false);
  $("mobileGuessBtn").click();
  assert.equal($("mobileGuessPanel").classList.contains("mobile-open"),true);
  $("newCaseBtn").click();
  assert.equal($("mobileReportBtn").hidden,true);
  assert.equal($("mobilePanelTabs").classList.contains("finished"),false);
  assert.equal($("mobileGuessPanel").classList.contains("mobile-case-finished"),false);
});

test("Mobile failed Hard case also keeps history and Case-file navigation",()=>{
  const g=boot({mobile:true,map:true}),$=g.get;
  g.difficulty("hard");
  $("freeBtn").click();
  const target=g.window.CartigmaCountries[Math.floor(.42*195)];
  const wrongGuesses=g.window.CartigmaCountries.filter(c=>c.code!==target.code).slice(0,4);
  for(const other of wrongGuesses){g.select(other.name);$("guessBtn").click()}
  assert.equal($("reportDialog").open,true);
  $("reportMapBtn").click();
  assert.equal($("reportDialog").open,false);
  $("mobileGuessBtn").click();
  assert.equal($("mobileGuessPanel").classList.contains("mobile-open"),true);
  assert.equal($("guessHistory").children.length,4);
  $("mobileReportBtn").click();
  assert.equal($("reportDialog").open,true);
});

test("Mobile Rush after timeout can reopen its guesses and result dossier",()=>{
  const Clock=fakeClock();
  const g=boot({mobile:true,map:true,clock:Clock}),$=g.get;
  g.difficulty("rush");$("rushStartBtn").click();
  const stored=JSON.parse(g.storage.get(CATALOG_KEY+"2026-11-17-rush"));
  const target=g.window.CartigmaCountries[stored.index];
  const wrong=g.window.CartigmaCountries.find(c=>c.code!==target.code);
  g.select(wrong.name);$("guessBtn").click();
  Clock.ms+=60001;g.tick();
  assert.equal($("reportDialog").open,true);
  $("reportMapBtn").click();
  assert.equal($("reportDialog").open,false);
  assert.ok(g.mapState.markers.some(m=>
    m.element.children[0]?.textContent==="★"));
  $("mobileGuessBtn").click();
  assert.equal($("mobileGuessPanel").classList.contains("mobile-open"),true);
  assert.equal($("guessHistory").children.length,1);
  assert.equal($("mobileGuessPreview").textContent,"1 / ∞");
  $("mobileReportBtn").click();
  assert.equal($("reportDialog").open,true);
});

test("Mobile postgame button is not offered while a case is active",()=>{
  const g=boot({mobile:true,map:true}),$=g.get;
  assert.equal($("mobileReportBtn").hidden,true);
  assert.equal($("mobileReportBtn").disabled,true);
  assert.equal($("mobilePanelTabs").classList.contains("finished"),false);
  $("mobileReportBtn").click();
  assert.equal($("reportDialog").open,false);
  $("mobileGuessBtn").click();
  assert.equal($("mobileGuessPanel").classList.contains("mobile-open"),true);
});

test("Caribbean evidence resolves both padded and numeric M49 codes",async()=>{
  const mockIntl={DisplayNames:class{
    constructor(...args){this.formatter=new Intl.DisplayNames(...args);}
    of(code){return code==="029"?"29":this.formatter.of(code);}
  }};
  const ranking={
    mayRank:()=>true,
    resumeRanked:async()=>null,
    beginRanked:async()=>({
      id:"b1592f31-fc31-4189-aebf-1d2ee615d877",mode:"daily",difficulty:"normal",
      startedAt:Date.now(),revealed:2,clueCount:8,
      clues:[{key:"countrySubregion",region:"029"},{key:"countrySubregion",region:29}],
      guesses:[]
    })
  };
  const g=boot({ranking,autoStart:false,intl:mockIntl});
  g.get("rushStartBtn").click();
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(clueTexts(g).slice(0,2),["Subregion: Caribbean","Subregion: Caribbean"]);
  g.language("pt");
  assert.deepEqual(clueTexts(g).slice(0,2),["Sub-região: Caribe","Sub-região: Caribe"]);
});

test("the ranking opens all nine boards and refreshes an open panel after saving a result",async()=>{
  class RankElement extends Element {
    querySelectorAll(selector){return selector==="[data-rank-tab]"?tabs:[]}
  }
  const tabs=["boards","account"].map(name=>{
    const button=new RankElement();
    button.dataset.rankTab=name;
    return button;
  });
  const dossier={id:"free-match",target:"BR",finished:true};
  let opened=null;
  const window={CartigmaCaseArchive:{open(game){opened=game;return true;}}};
  const nodes=new Map(),cache=new Map();
  const body=new RankElement("body");
  const get=id=>{
    const attached=body.children.find(node=>node.id===id);
    if(attached)return attached;
    if(!nodes.has(id))nodes.set(id,new RankElement(id));
    return nodes.get(id);
  };
  const document={body,readyState:"complete",getElementById:get,
    createElement:()=>new RankElement(),querySelectorAll:()=>tabs,addEventListener(){}};
  let score=0,requests=0;
  const valueResponse=data=>({ok:true,json:async()=>data});
  const context={window,document,URL,Date,location:new URL("https://cartigma.workers.dev/"),setInterval(){},
    localStorage:{getItem:key=>cache.get(key),setItem:(key,value)=>cache.set(key,value),removeItem:key=>cache.delete(key)},
    fetch:async url=>{
      if(url.includes("ranking-panel.html"))return {ok:true,text:async()=>""};
      if(url.endsWith("/auth/me"))return valueResponse({user:{id:"account-id",username:"Tester"}});
      if(url.endsWith("/games/guess")){
        score=5000;
        return valueResponse({finished:true,saved:true,rankingPoints:score});
      }
      if(url.endsWith("/me/games"))return valueResponse({games:[{
        id:dossier.id,target:"BR",mode:"free",difficulty:"normal",won:true,score:5000,finishedAt:Date.now()
      }],nextCursor:null});
      if(url.endsWith("/me/games/"+dossier.id))return valueResponse({game:dossier});
      assert.ok(url.endsWith("/leaderboards"));
      requests++;
      const periods=Object.fromEntries(["week","month","total"].map(period=>[period,[{username:"Tester",points:score,solve_time_ms:score?82345:null}]]));
      return valueResponse({updatedAt:Date.now(),boards:{normal:periods,hard:{},rush:{}}});
    }
  };
  const code=readFileSync(new URL("../ranking-client.js",import.meta.url),"utf8");
  runInNewContext(code,context,{filename:"ranking-client.js"});
  await new Promise(resolve=>setImmediate(resolve));
  await get("rank-launch").onclick();
  const groups=get("rank-groups");
  assert.deepEqual(groups.children.map(section=>section.children[0].textContent),["Normal","Difícil","Rush"]);
  for(const section of groups.children){
    assert.deepEqual(section.children[1].children.map(card=>card.children[0].textContent),["Semanal","Mensal","Total"]);
  }
  const firstRow=groups.children[0].children[1].children[0].children[1].children[0];
  assert.equal(firstRow.children[2].children[1].textContent,"—");
  await window.CartigmaRanking.gameAction("guess",{id:"free-match",mode:"free",difficulty:"normal",code:"BR"});
  await new Promise(resolve=>setImmediate(resolve));
  const normal=groups.children[0].children[1].children;
  for(const card of normal){
    const [points,time]=card.children[1].children[0].children[2].children;
    assert.equal(points.textContent,(5000).toLocaleString("pt-BR")+" pts");
    assert.equal(time.textContent,"1:22,345");
  }
  assert.equal(requests,2);
  tabs[1].onclick();
  await new Promise(resolve=>setImmediate(resolve));
  const historyButton=get("rank-history-list").children[0].children[0];
  assert.equal(historyButton.children[0].textContent,"Brasil");
  await historyButton.onclick();
  assert.deepEqual(opened,dossier);
});

test("an archived dossier renders the original clues and country profile without changing the current game",()=>{
  const g=boot({map:true}),$=g.get;
  const activeCode=$("caseCode").textContent;
  const archived={
    id:"00000000-0000-4000-8000-000000000001",caseNumber:7,day:"2026-11-15",
    difficulty:"hard",mode:"free",finished:true,won:true,saved:true,score:3900,
    rankingPoints:3900,hints:1,target:"BR",startedAt:Date.parse("2026-11-15T16:00:00Z"),elapsedMs:82000,
    clues:[{key:"countrySubregion",region:"005"}],
    guesses:[{code:"AR",elapsedMs:50000,feedback:{min:500,max:1000}},{code:"BR",elapsedMs:82000}],
    profile:{capital:"Saved capital",continent:"southAmerica",
      details:{history:{en:"Saved country history."},trivia:{en:"Saved trivia."},population:100,populationYear:2020}}
  };
  assert.equal(g.window.CartigmaCaseArchive.open(archived),true);
  assert.equal($("reportDialog").open,true);
  assert.equal($("reportDialog").attributes["data-archive"],"");
  assert.equal($("reportCode").textContent,"#H-20261115-07");
  assert.equal($("reportHeading").textContent,"Brazil");
  assert.equal($("reportHistory").textContent,"Saved country history.");
  assert.equal($("reportFact").textContent,"Saved trivia.");
  assert.equal($("reportDuration").textContent,"01:22");
  assert.equal($("reportAttempts").textContent,"2 / 4");
  assert.equal($("reportTimeline").children.length,2);
  assert.equal($("reportEvidenceList").children[0].children[1].textContent,"Subregion: South America");
  assert.equal($("caseCode").textContent,activeCode);
  $("reportCloseBtn").click();
  assert.equal($("reportDialog").open,false);
  assert.equal($("reportDialog").attributes["data-archive"],undefined);
  assert.equal(Boolean($("countrySearch").disabled),false);
  assert.equal($("caseCode").textContent,activeCode);
});
