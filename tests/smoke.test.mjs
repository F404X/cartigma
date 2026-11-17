import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const names=["country-catalog.js","continent-borders.js","i18n.js",
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
function boot({storage=new Map(),map=false,randomValue=0.42,mobile=false,clock=Date,countryData=null}={}){
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
  if(mobile)window.matchMedia=()=>({matches:true});
  if(map){
    window.maplibregl=libre;
    window.GeoMapLoader={load:async style=>style==="osm"?{...libre,isFallback:true}:libre};
  }
  const math=Object.create(Math);math.random=()=>randomValue;
  const perf={distanceCalls:0};
  math.atan2=(...args)=>{perf.distanceCalls++;return Math.atan2(...args)};
  const context={
    window,document,localStorage,navigator:{},Math:math,Number,String,Array,Set,Map,JSON,Date:clock,Intl,
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
  const difficulty=value=>get("difficultySelect").handlers.change({target:{value}});
  const language=value=>get("langSelect").handlers.change({target:{value}});
  return {get,window,document,storage,select,difficulty,language,mapState,mobileCase,perf,
    tick(){for(const callback of clockCallbacks)callback()}};
}


const CATALOG_KEY="cartigma-country-daily-v6-";
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
  assert.equal($("atlasNormalEvidence").children.length,10);
  assert.equal($("atlasHardEvidence").children.length,10);
  assert.ok($("atlasHistory").textContent.length>10);
  assert.ok($("atlasCountryStats").children.length>=4);
  $("atlasSearch").value="Vatican";
  $("atlasSearch").handlers.input();
  assert.equal($("atlasOptions").children.length,1);
  $("atlasOptions").children[0].click();
  assert.equal($("atlasCountryCode").textContent,"VA");
});
test("Each country and difficulty always gets ten sourced non-landscape clues",()=>{
  const g=boot(),$=g.get;
  $("atlasBtn").click();
  const buttons=$("atlasOptions").children;
  for(let i=0;i<195;i++){
    buttons.find(b=>b.dataset.index===String(i)).click();
    for(const level of ["Normal","Hard"]){
      const rows=$("atlas"+level+"Evidence").children;
      assert.equal(rows.length,10,"Missing evidence at country "+i+" / "+level);
      const text=rows.map(x=>x.children[1].textContent);
      assert.equal(new Set(text).size,10,"Duplicate clue at "+i+" / "+level);
      assert.ok(text.every(x=>!/(landscape|paisagem|national capital:|distance to coast|distance to capital|latitude sector:)/i.test(x)),
        "Forbidden city/landscape clue "+i+" / "+text.join(" | "));
    }
  }
});
test("Country-spanning latitude hints show a representative band plus more",()=>{
  const g=boot(),$=g.get;
  $("atlasBtn").click();
  const values=code=>{
    $("atlasOptions").children.find(b=>b.children[1].children[1].textContent===code).click();
    return $("atlasNormalEvidence").children.map(x=>x.children[1].textContent);
  };
  assert.ok(values("MX").some(t=>t==="Latitude belt: Subtropical +another"));
  assert.ok(values("BR").some(t=>t==="Latitude belt: Tropical +others"));
  assert.ok(values("CA").some(t=>t==="Latitude belt: Subpolar +others"));
  g.language("pt");
  const br=$("atlasOptions").children.find(b=>
    b.children[1].children[1].textContent==="BR");
  br.click();
  assert.ok($("atlasNormalEvidence").children.some(row=>
    row.children[1].textContent.includes(" +outras")));
  assert.ok(!$("atlasNormalEvidence").children.some(row=>
    /\(\+\d+\)/.test(row.children[1].textContent)));
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
    assert.equal($("feedback").textContent,"Wrong country. Try another.");
    g.select(target.name);
    $("guessBtn").click();
    assert.equal($("reportDialog").open,true);
    assert.equal($("reportCoordinates").textContent,"—");
    assert.equal($("reportBest").textContent,"—");
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
  assert.equal($("hintCount").textContent,"1 / 10");
  assert.equal($("clueList").classList.contains("hidden"),false);
  assert.equal($("clueList").children.length,10);
  Clock.ms+=12000;g.tick();
  assert.equal($("hintCount").textContent,"3 / 10");
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
  assert.equal(g("hintCount").textContent,"1 / 10");
  assert.equal(JSON.parse(storage.get(key)).revealed,1);
});
test("Freeplay independently samples from every country without persistent history",()=>{
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
    assert.ok(g.mapState.markers.some(m=>
      m.coordinate[0]===-50&&m.coordinate[1]===-15&&
      m.element.children[0].textContent==="+"),
      "A map click must also display the unconfirmed Rush pin");
  }
  g.tick();
  assert.ok(g.mapState.markers.some(m=>m.element.children[0].textContent==="1"));
});
test("No latitude-sector clue is used alongside country latitude belt in any locale",()=>{
  const g=boot(),$=g.get;
  $("atlasBtn").click();
  const options=$("atlasOptions").children;
  for(const level of ["Normal","Hard"]){
    for(let index=0;index<195;index++){
      options.find(b=>b.dataset.index===String(index)).click();
      const clues=$("atlas"+level+"Evidence").children.map(row=>row.children[1].textContent);
      assert.equal(clues.length,10);
      assert.ok(clues.some(v=>v.startsWith("Latitude belt:")));
      assert.ok(clues.every(v=>!v.startsWith("Latitude sector:")));
    }
  }
  for(const [lang,pack] of Object.entries(g.window.GeoI18n.PACKS)){
    assert.ok(pack.latitudeOtherOne&&pack.latitudeOtherMany,lang);
  }
  for(const [lang,pack] of Object.entries(g.window.GeoCountryClueI18n)){
    assert.ok(pack.countryBorders.includes("{value}"),lang);
  }
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
