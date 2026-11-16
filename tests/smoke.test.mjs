import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const names=["places.js","continent-borders.js","references.js","i18n.js","map-filters-i18n.js","clues-i18n.js","report-i18n.js","facts.js","cities-extended.js","city-indicators.js","urban-2025.js","city-clues-i18n.js","country-insights.js","country-clues-i18n.js","country-profile-i18n.js","compass-i18n.js","app.js","index.html","styles.css","map-bootstrap.js","map-fallback.js"];
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
function boot({storage=new Map(),map=false,randomValue=0,mobile=false,clock=Date}={}){
  const nodes=new Map(),window={},mobileCase=new Element("mobile-case"),mapState={fits:[],eases:[],styles:[],zoomRanges:[],markers:[],layers:new Map(),sources:new Map(),events:{},canvas:new Element("canvas")};
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
    fetch:async()=>({ok:true,json:async()=>({results:[]})})
  };
  for(const n of names.filter(n=>n.endsWith(".js")&&n!=="map-bootstrap.js"))
    runInNewContext(files[n],context,{filename:n});
  const get=id=>document.getElementById(id);
  function select(name){
    get("citySearch").value=name;
    get("citySearch").handlers.input({target:get("citySearch")});
    const choice=get("suggestions").children.find(x=>x.className==="suggestion");
    assert.ok(choice,"Missing search result for "+name);
    choice.handlers.click();
  }
  const difficulty=value=>get("difficultySelect").handlers.change({target:{value}});
  const language=value=>get("langSelect").handlers.change({target:{value}});
  return {get,window,document,storage,select,difficulty,language,mapState,mobileCase,perf};
}
function normalIndexForDay(date,window){
  const places=window.GEODETECTIVE_PLACES,extra=window.GeoExtendedPlaceMetadata;
  const preferred=places.map((_,i)=>i).filter(i=>i<74||
    Boolean(extra[i-74]?.capital)||Number(extra[i-74]?.populationRank)<=2);
  const h=hash("GEODETECTIVE-v3|"+date+"|normal");
  return h%10!==0&&preferred.length?preferred[h%preferred.length]:h%places.length;
}
function continentForTest(index,world){
  if(index>=74)return world.GeoExtendedPlaceMetadata[index-74].continent;
  if(index<=12)return "europe";
  if(index<=20)return "africa";
  if(index<=41)return "asia";
  if(index<=49)return "oceania";
  if(index<=58)return "northAmerica";
  return "southAmerica";
}
const equatorRegions=new Set(["asia","africa","southAmerica","oceania"]);
function clueTexts(g){
  return g.get("clueList").children.map(row=>row.children[1].children[1].textContent);
}
function revealAll(g){
  for(let i=0;i<10&&!g.get("revealBtn").disabled;i++)g.get("revealBtn").handlers.click();
  return clueTexts(g);
}
function unlockClue(g,pattern){
  for(let i=0;i<11;i++){
    const index=clueTexts(g).findIndex(value=>pattern.test(value));
    if(index>=0){
      const button=g.get("clueList").children[index].children[1].children[2];
      return {index,button,clue:clueTexts(g)[index]};
    }
    if(g.get("revealBtn").disabled)break;
    g.get("revealBtn").handlers.click();
  }
  throw Error("Clue not found for "+pattern);
}
function makeWrong(g,tries,name){
  for(let i=0;i<tries;i++){g.select(name);g.get("guessBtn").handlers.click()}
}

test("city catalogue, trivia and report translations remain aligned",()=>{
  const g=boot();
  assert.equal(g.window.GEODETECTIVE_PLACES.length,500);
  assert.equal(g.window.GEODETECTIVE_FACTS.length,500);
  assert.equal(g.window.GeoExtendedPlaceMetadata.length,426);
  for(const facts of g.window.GEODETECTIVE_FACTS){
    assert.equal(facts.length,2);
    assert.ok(facts[0].length>22);
    assert.ok(facts[1].length>22);
  }
  const languages=["en","pt","es","zh","ja","ru","fr","de","it","nl","pl","sv","tr","ar","he","ko","th","vi","id"];
  assert.deepEqual(Object.keys(g.window.GeoI18n.PACKS).sort(),languages.sort());
  assert.deepEqual(Object.keys(g.window.GeoReportI18n).sort(),languages.sort());
  for(const lang of languages){
    assert.ok(g.window.GeoReportI18n[lang].reportArchive);
    assert.ok(g.window.GeoCluesI18n[lang].continents.oceania);
    assert.doesNotMatch(g.window.GeoCluesI18n[lang].continents.oceania,/^\d+$/);
  }
});


test("500 locations preserve the original 74 and all aligned catalog metadata",()=>{
  const g=boot(),places=g.window.GEODETECTIVE_PLACES;
  const extras=g.window.GeoExtendedPlaceMetadata;
  assert.equal(places.length,500);
  assert.equal(extras.length,426);
  const originalKeys=files["places.js"].split("\n").filter(line=>line.startsWith("[")).length;
  assert.equal(originalKeys,74);
  assert.equal(g.window.GEODETECTIVE_FACTS.length,500);
  const unique=new Set();
  for(let i=0;i<places.length;i++){
    const place=places[i];
    assert.equal(place.length,7,"All city entries need seven fields: "+i);
    assert.ok(place[0]&&place[1]&&place[2],i+" needs meaningful locality metadata");
    assert.ok(Number.isFinite(place[3])&&Math.abs(place[3])<=90);
    assert.ok(Number.isFinite(place[4])&&Math.abs(place[4])<=180);
    assert.ok(place[5]&&place[6]);
    assert.ok(g.window.GEODETECTIVE_FACTS[i].every(x=>x.length>22));
    if(i>=74){
      const meta=extras[i-74];
      assert.match(meta.countryCode,/^[A-Z]{2}$/);
      assert.ok(["europe","asia","africa","oceania","northAmerica","southAmerica"].includes(meta.continent));
      const id=meta.countryCode+":"+place[0].toLowerCase();
      assert.ok(!unique.has(id),"Duplicate supplemental city "+id);
      unique.add(id);
    }
  }
  assert.equal(g.get("placeCount").textContent,"500");
  assert.equal(g.window.GeoCluesI18n.pt.features.urban,"Paisagem urbana");
  assert.ok(g.window.GeoCluesI18n.en.templates.adminRegion.includes("{value}"));
});

test("Eastern Thrace lies in Europe, Anatolia in Asia, and Istanbul is transcontinental",()=>{
  const g=boot(),p=g.window.GEODETECTIVE_PLACES,borders=g.window.GeoContinentBorders;
  function inRing(x,y,ring){
    let hit=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const a=ring[i],b=ring[j];
      if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;
    }
    return hit;
  }
  function inside(x,y,key){
    return borders[key].geometry.coordinates.some(poly=>
      inRing(x,y,poly[0])&&!poly.slice(1).some(hole=>inRing(x,y,hole)));
  }
  assert.equal(inside(26.5557,41.6771,"europe"),true,"Edirne is in Europe");
  assert.equal(inside(26.5557,41.6771,"asia"),false,"Edirne must no longer be Asian");
  assert.equal(inside(28.85,41.06,"europe"),true,"Western Istanbul lies in Europe");
  assert.equal(inside(29.2,41.06,"asia"),true,"Eastern Istanbul lies in Asia");
  assert.equal(inside(32.8624,39.9292,"asia"),true,"Ankara lies in Asia");
  for(const [city,region] of [["Edirne","europe"],["Tekirdağ","europe"],
    ["Ankara","asia"],["İzmir","asia"],["Bursa","asia"]]){
    const i=p.findIndex(x=>x[0]===city);
    assert.ok(i>=0,city+" missing");
    assert.equal(g.window.GeoExtendedPlaceMetadata[i-74]?.continent,region,city);
  }
  const ist=p.findIndex(x=>x[0]==="Istambul");
  assert.equal(ist,12);
  const forced=boot({randomValue:(ist+.25)/p.length});
  forced.get("freeBtn").handlers.click();
  assert.equal(clueTexts(forced)[1],"Continent: Europe / Asia");
  forced.language("pt");
  assert.equal(clueTexts(forced)[1],"Continente: Europa / Ásia");
});

test("Normal selection favors capitals and major cities; Hard retains the full catalogue",()=>{
  const g=boot(),w=g.window,places=w.GEODETECTIVE_PLACES;
  const capitalCities=["Ankara","Moscow","Madrid","Berlin","Manila"];
  for(const name of capitalCities){
    const i=places.findIndex(x=>x[0]===name);
    assert.ok(i>=74,"Missing additional national capital "+name);
    assert.equal(w.GeoExtendedPlaceMetadata[i-74].capital,true,name);
  }
  let inPriority=0;
  const normalPriority=new Set(places.map((_,i)=>i).filter(i=>i<74||
    w.GeoExtendedPlaceMetadata[i-74]?.capital||
    Number(w.GeoExtendedPlaceMetadata[i-74]?.populationRank)<=2));
  for(let i=0;i<100;i++){
    const date=new Date(Date.UTC(2027,0,i+1)).toISOString().slice(0,10);
    if(normalPriority.has(normalIndexForDay(date,w)))inPriority++;
  }
  assert.ok(inPriority>=90,"Most Normal daily locations should be major or capital cities");
  assert.ok(normalPriority.size<places.length,"Hard mode must retain less-known cities");
  const lesser=places.findIndex((_,i)=>i>=74&&!normalPriority.has(i));
  assert.ok(lesser>=74);
  const forced=boot({randomValue:(lesser+.25)/places.length});
  forced.difficulty("hard");
  forced.get("freeBtn").handlers.click();
  for(let n=0;n<6;n++)forced.get("revealBtn").handlers.click();
  assert.equal(clueTexts(forced).length,10);
  const difficultClues=revealAll(forced);
  assert.ok(difficultClues.some(x=>/^UTM zone: \d+$/.test(x)));
  assert.ok(difficultClues.some(x=>/^UTM latitude band: [A-Z]$/.test(x)));
});

test("new cities have ten meaningful clues without a redundant distance comparison",()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  for(const city of ["Berlin","Moscow","Manila","Ankara","İzmir","Edirne","Los Angeles","Abidjan","Canberra"]){
    const index=places.findIndex(p=>p[0]===city);
    assert.ok(index>=74,city);
    const g=boot({randomValue:(index+.25)/places.length});
    g.get("freeBtn").handlers.click();
    const clues=revealAll(g);
    assert.equal(clues.length,10);
    assert.match(clues[1],/Continent:/);
    assert.ok(clues.some(text=>/^Longitude sector:/.test(text)),city);
    assert.ok(clues.some(text=>/^Latitude sector:/.test(text)),city);
    assert.doesNotMatch(clues.join(" "),/Closer to |Distance clue|from [^\n]+ km/i);
    const national=clues.filter(text=>["Currency:","Language family","One flag color", "Population (","GDP per capita","Country / territory area:","No access to the sea.","Has access to the sea."].some(x=>text.startsWith(x)));
    assert.ok(national.length>=2&&national.length<=5,
      city+" must keep the original two country facts");
    if(g.window.GeoExtendedPlaceMetadata[index-74].capital)
      assert.ok(clues.some(x=>x==="National capital: Yes"),city);
  }
});
test("every playable country has sourced metadata, a flag, and its own historical note",()=>{
  const g=boot(),countries=g.window.GeoCountryInsights;
  const codes=files["app.js"].match(/const COUNTRY_CODES = "([^"]+)"/)[1].split(" ");
  const extra=g.window.GeoExtendedPlaceMetadata.map(m=>m.countryCode);
  const needed=new Set([...codes,...extra]);
  assert.equal(needed.size,165);
  assert.equal(Object.keys(countries).length,165);
  for(const code of needed){
    const data=countries[code];
    assert.ok(data,code+" missing country metadata");
    assert.ok(data.currency,code+" missing currency");
    assert.ok(typeof data.landlocked==="boolean",code+" missing landlocked status");
    assert.ok(Number.isFinite(data.area)&&data.area>0,code+" missing area");
    assert.ok(data.flag,code+" missing flag");
    assert.ok(data.history.en?.length>35&&data.history.pt?.length>35,
      code+" needs source-grounded historical context");
    if(data.gdpPerCapita!==null){
      assert.ok(Number.isInteger(data.gdpYear)&&data.gdpYear<=2025);
      assert.ok(data.gdpPerCapita>0);
    }
  }
  assert.equal(Object.keys(g.window.GeoCountryClueI18n).length,19);
  assert.equal(g.window.GeoCountryClueI18n.pt.countryHistory,"Um pouco de história");
});

test("landlocked evidence and case profiles use affirmative sentences in all languages",()=>{
  const g=boot(),langs=g.window.GeoCountryClueI18n;
  assert.equal(Object.keys(langs).length,19);
  for(const [language,pack] of Object.entries(langs)){
    assert.equal(pack.countryLandlocked,"{value}",language);
    assert.ok(pack.countryLandlockedYes.length>3,language);
    assert.ok(pack.countryLandlockedNo.length>3,language);
    assert.ok(!/[{}]/.test(pack.countryLandlockedYes+pack.countryLandlockedNo),language);
  }
  assert.equal(langs.pt.countryLandlockedYes,"Sem acesso ao mar.");
  assert.equal(langs.pt.countryLandlockedNo,"Tem acesso ao mar.");
  for(const [city,expected] of [["São Paulo","Tem acesso ao mar."],["Catmandu","Sem acesso ao mar."]]){
    const index=g.window.GEODETECTIVE_PLACES.findIndex(p=>p[0]===city);
    assert.ok(index>=0);
    const run=boot({randomValue:(index+.25)/g.window.GEODETECTIVE_PLACES.length});
    run.get("freeBtn").handlers.click();
    run.select(city);run.get("guessBtn").handlers.click();
    run.language("pt");
    const fields=run.get("reportCountryStats").children;
    const cell=fields.find(x=>x.children[0]?.textContent==="Sem acesso ao mar");
    assert.ok(cell,city+" sea-access field missing");
    assert.equal(cell.children[1]?.textContent,expected);
    assert.equal(cell.children[0]?.className,"visually-hidden");
  }
});
test("sea-access cards never render the raw 'Região: Não' state",()=>{
  for(const [city,want] of [["Lisboa","Tem acesso ao mar."],["Catmandu","Sem acesso ao mar."]]){
    const places=boot().window.GEODETECTIVE_PLACES;
    const index=places.findIndex(place=>place[0]===city);
    assert.ok(index>=0,city+" missing");
    const g=boot({randomValue:(index+.25)/places.length});
    g.get("freeBtn").handlers.click();
    g.language("pt");
    revealAll(g);
    const rows=g.get("clueList").children.filter(row=>
      row.children[1].children[0].textContent==="Acesso ao mar");
    assert.equal(rows.length,1,city+" must show one sea-access clue");
    assert.equal(rows[0].children[1].children[1].textContent,want);
    assert.notEqual(rows[0].children[1].children[1].textContent,"Não");
    assert.notEqual(rows[0].children[1].children[1].textContent,"Sim");
    g.language("en");
    const translated=g.get("clueList").children.filter(row=>
      row.children[1].children[0].textContent==="Sea access");
    assert.equal(translated.length,1);
    assert.equal(translated[0].children[1].children[1].textContent,
      want==="Tem acesso ao mar."?"Has access to the sea.":"No access to the sea.");
  }
  const langs=boot().window.GeoCountryClueI18n;
  for(const [language,pack] of Object.entries(langs)){
    assert.ok(pack.countryLandlockedLabel,language+" needs a specific category");
    assert.ok(pack.countryLandlockedYes&&pack.countryLandlockedNo,language);
  }
  assert.ok(files["app.js"].includes("const authoritative=COUNTRY_INSIGHTS[COUNTRY_CODES[game.index]]?.landlocked"));
  assert.ok(files["index.html"].includes('src="country-clues-i18n.js?v=20261116-currency-names"'));
});
test("obsolete hemisphere map purchases in northern-only daily cases are refunded",()=>{
  const world=boot().window,places=world.GEODETECTIVE_PLACES;
  const day=Array.from({length:200},(_,j)=>
    new Date(Date.UTC(2027,0,1+j)).toISOString().slice(0,10)).find(d=>{
    const idx=normalIndexForDay(d,world);
    return !equatorRegions.has(continentForTest(idx,world));
  });
  assert.ok(day,"Need a daily case in Europe or North America");
  class FakeDate extends Date{
    constructor(...args){super(...(args.length?args:[day+"T12:00:00Z"]));}
  }
  const index=normalIndexForDay(day,world);
  const key="geodetective-daily-v3-"+day+"-normal";
  const storage=new Map([[key,JSON.stringify({
    mode:"daily",index,difficulty:"normal",date:day,serial:1,guesses:[],
    revealed:2,penalty:0,sectorMapPenalty:600,sectorReveals:["hemisphere"],
    finished:false,won:false,score:0
  })]]);
  const g=boot({storage,clock:FakeDate});
  const saved=JSON.parse(storage.get(key));
  assert.equal(saved.sectorMapPenalty,0);
  assert.deepEqual(saved.sectorReveals,[]);
  assert.ok(!clueTexts(g).some(text=>text.startsWith("Hemisphere:")));
});
test("hint costs follow the NEXT clue, are deducted once, and saved hint count remains exact",()=>{
  const world=boot().window,places=world.GEODETECTIVE_PLACES;
  const priceTypes=new Set();
  for(const name of ["Reykjavík","Tóquio","São Paulo","Paris","Ankara","Catmandu"]){
    const i=places.findIndex(p=>p[0]===name);
    const g=boot({randomValue:(i+.25)/places.length}),$=g.get;
    $("freeBtn").handlers.click();
    const cost=Number($("revealCost").textContent.replace(/[^0-9]/g,""));
    assert.ok(cost>=150&&cost<=500,name+" price");
    priceTypes.add(cost);
    $("revealBtn").handlers.click();
    g.select(name);$("guessBtn").handlers.click();
    assert.equal(Number($("reportScore").textContent.split(" / ")[0].replace(/,/g,"")),5000-cost,name);
    assert.equal($("reportHints").textContent,"1",name);
  }
  assert.ok(priceTypes.size>=3,"Hint pricing should reflect the nature of each clue");
  const storage=new Map(),day=new Date().toISOString().slice(0,10);
  const daily=boot({storage}),$=daily.get;
  const cost=Number($("revealCost").textContent.replace(/[^0-9]/g,""));
  $("revealBtn").handlers.click();
  const saved=JSON.parse(storage.get("geodetective-daily-v3-"+day+"-normal"));
  assert.equal(saved.penalty,cost);
  assert.equal(saved.paidHints,1);
  const loaded=boot({storage});
  loaded.select(loaded.window.GEODETECTIVE_PLACES[normalIndexForDay(day,loaded.window)][0]);
  loaded.get("guessBtn").handlers.click();
  assert.equal(loaded.get("reportHints").textContent,"1");
});
test("country-data slots separate numeric and cultural facts through the five remaining positions",()=>{
  const world=boot().window,places=world.GEODETECTIVE_PLACES;
  const civic=["Currency:","Language family:","One flag color:","No access to the sea.","Has access to the sea."];
  const numeric=["Population (","GDP per capita (","Country / territory area:"];
  const hit=new Set();
  for(let i=0;i<places.length;i+=11){
    const g=boot({randomValue:(i+.25)/places.length});
    g.get("freeBtn").handlers.click();
    const lines=revealAll(g);
    const positions=[];
    for(let j=2;j<7;j++){
      if(civic.some(x=>lines[j].startsWith(x))||numeric.some(x=>lines[j].startsWith(x)))
        positions.push(j);
    }
    assert.equal(positions.length,2,places[i][0]);
    assert.ok(positions[1]-positions[0]>1,"Country data must be separated: "+places[i][0]);
    assert.equal(positions.filter(j=>civic.some(x=>lines[j].startsWith(x))).length,1);
    assert.equal(positions.filter(j=>numeric.some(x=>lines[j].startsWith(x))).length,1);
    for(const j of positions)hit.add(j);
  }
  assert.deepEqual([...hit].sort(),[2,3,4,5,6]);
});
test("country-data evidence is distributed among positions three to seven",()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  const counts={},positions=new Set();
  for(let index=0;index<places.length;index+=17){
    const g=boot({randomValue:(index+.25)/places.length});
    g.get("freeBtn").handlers.click();
    const clues=revealAll(g),country=[];
    assert.equal(clues.length,10);
    for(let j=0;j<clues.length;j++){
      const type=["Currency:","Language family:","One flag color:","Population (",
        "GDP per capita (","Country / territory area:","No access to the sea.","Has access to the sea."].find(prefix=>clues[j].startsWith(prefix));
      if(type){counts[type]=(counts[type]||0)+1;positions.add(j);country.push(type);}
    }
    assert.ok(country.length>=4&&country.length<=5,
      "Four or five distinct country facts per case: "+index);
    assert.equal(new Set(country).size,country.length,"Country facts must differ: "+index);
    assert.ok(!clues.some(text=>/Closer to |Distance from reference/.test(text)));
  }
  assert.ok(Object.keys(counts).length>=6,"Country evidence must be varied by type");
  assert.ok(positions.has(2)&&positions.has(3)&&positions.has(4)&&positions.has(5)&&positions.has(6),
    "Country facts should reach each of the last five positions");
});
test("a solved dossier shows the flag and a historical paragraph for every country tested",()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  for(const city of ["Reykjavík","Taipé","Papeete","Istambul","Ankara","São Paulo"]){
    const index=places.findIndex(x=>x[0]===city);
    assert.ok(index>=0);
    const g=boot({randomValue:(index+.25)/places.length}),$=g.get;
    $("freeBtn").handlers.click();
    g.select(city);$("guessBtn").handlers.click();
    assert.equal($("reportDialog").open,true);
    assert.ok($("reportHistory").textContent.length>35,city);
    assert.ok($("reportHistorySource").textContent.includes("World Factbook"));
    const iso=city==="Taipé"?"tw":city==="Papeete"?"pf":city==="Ankara"||city==="Istambul"?"tr":city==="São Paulo"?"br":"is";
    assert.equal($("reportFlag").src,"https://flagcdn.com/w160/"+iso+".png",city);
    assert.ok($("reportFlag").alt.length>2);
    assert.equal($("reportEvidenceList").children.length,10);
    if(city==="Taipé"){
      g.language("pt");
      assert.match($("reportHistory").textContent,/Taiwan esteve sob administração japonesa/);
      assert.equal($("reportHistoryTitle").textContent,"Um pouco de história");
      $("reportFlag").onerror();
      assert.equal($("reportFlag").classList.contains("hidden"),true);
      assert.equal($("reportFlagFallback").classList.contains("hidden"),false);
    }
  }
});

test("currency evidence and case dossier use translated currency names instead of codes",()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  const sample=[
    ["São Paulo","BRL","Moeda: Real brasileiro","Currency: Brazilian Real"],
    ["Ōsaka","JPY","Moeda: Iene japonês","Currency: Japanese Yen"],
    ["Paris","EUR","Moeda: Euro","Currency: Euro"]
  ];
  for(const [city,code,portuguese,english] of sample){
    const index=places.findIndex(p=>p[0]===city);
    assert.ok(index>=0,city+" missing");
    const g=boot({randomValue:(index+.25)/places.length});
    g.get("freeBtn").handlers.click();
    g.language("pt");
    assert.ok(revealAll(g).includes(portuguese),city+" needs a localized currency name");
    g.language("en");
    assert.ok(clueTexts(g).includes(english),city+" English currency name missing");
    assert.ok(!clueTexts(g).some(t=>t.includes("Currency code: "+code)));
  }
  const g=boot({randomValue:(68+.25)/places.length});
  g.get("freeBtn").handlers.click();
  g.select("São Paulo");g.get("guessBtn").handlers.click();
  g.language("pt");
  const profile=g.get("reportCountryStats").children;
  const field=profile.find(cell=>cell.children[0]?.textContent==="Moeda");
  assert.ok(field,"Missing currency in case file");
  assert.equal(field.children[1].textContent,"Real brasileiro");
  assert.notEqual(field.children[1].textContent,"BRL");
  const db=g.window.GeoCountryInsights;
  assert.equal(Object.keys(db).length,165);
  for(const [iso,record] of Object.entries(db))
    assert.ok(record.currencyName&&record.currencyName!==record.currency,
      iso+" needs a descriptive currency-name fallback");
  for(const [lang,pack] of Object.entries(g.window.GeoCountryClueI18n)){
    assert.ok(pack.countryCurrency.includes("{name}"),lang);
    assert.ok(!pack.countryCurrency.includes("{code}"),lang);
  }
});
test("all 19 country clue templates keep required values and annual provenance",()=>{
  const g=boot(),packs=g.window.GeoCountryClueI18n;
  const keys=["countryCurrency","countryLanguageFamily","countryFlagColor","countryPopulation",
    "countryGDP","countryArea","countryLandlocked","countryHistory","countryHistorySource"];
  for(const [lang,t] of Object.entries(packs)){
    for(const key of keys)assert.ok(t[key],lang+" missing "+key);
    for(const key of ["countryPopulation","countryGDP"])
      assert.match(t[key],/{year}/,lang+" must disclose the economic data year");
    assert.match(t.countryCurrency,/{name}/);
    assert.match(t.countryGDP,/{value}/);
    assert.match(t.countryArea,/{value}/);
    assert.equal(Object.keys(t.colors).length,7);
  }
  assert.ok(files["index.html"].includes('id="reportFlag"'));
  assert.ok(files["index.html"].includes('id="reportHistory"'));
  assert.ok(files["index.html"].includes('src="country-insights.js?v=20261116-currency-names"'));
});
test("national-capital metadata remains correct even with shuffled evidence",()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  for(const [name,expected] of [["Taipé",true],["Brasília",true],["Goiânia",false]]){
    const index=places.findIndex(p=>p[0]===name);
    assert.ok(index>=0);
    const g=boot({randomValue:(index+.25)/places.length});
    g.get("freeBtn").handlers.click();
    g.language("pt");
    g.select(name);g.get("guessBtn").handlers.click();
    const fields=g.get("reportCountryStats").children;
    const capital=fields.find(row=>row.children[0].textContent==="Capital nacional");
    assert.equal(capital?.children[1].textContent,expected?"Sim":"Não",name);
  }
});

test("country-area metrics always identify the country or territory in all locales",()=>{
  const g=boot();
  const clue=g.window.GeoCountryClueI18n;
  const profile=g.window.GeoCountryProfileI18n;
  assert.equal(Object.keys(clue).length,19);
  for(const locale of Object.keys(clue)){
    assert.ok(profile[locale],locale+" missing profile translation");
    assert.ok(clue[locale].countryArea.includes("{value}"),locale);
    assert.ok(profile[locale].area.length>=2,locale);
  }
  assert.match(clue.pt.countryArea,/Área do país ou território:/);
  assert.equal(profile.pt.area,"Área do país ou território");
  assert.ok(clue.en.countryArea.includes("Country / territory area:"));
  assert.equal(profile.en.area,"Country / territory area");
  assert.ok(files["index.html"].includes('src="country-clues-i18n.js?v=20261116-currency-names"'));
  assert.ok(files["index.html"].includes('src="country-profile-i18n.js?v=20261116-area-scope"'));
});
test("daily case file offers the other unfinished difficulty and a clear Free Play action",()=>{
  const g=boot(),$=g.get,day=new Date().toISOString().slice(0,10);
  const index=normalIndexForDay(day,g.window);
  g.select(g.window.GEODETECTIVE_PLACES[index][0]);
  $("guessBtn").handlers.click();
  assert.equal($("reportDialog").open,true);
  assert.equal($("reportAlternateBtn").classList.contains("hidden"),false);
  assert.equal($("reportAlternateBtn").textContent,"Play daily: Hard");
  assert.equal($("reportNextBtn").textContent,"New Free Play case");
  assert.equal($("newCaseBtn").textContent,"New Free Play case");
  g.language("pt");
  assert.equal($("reportAlternateBtn").textContent,"Jogar diário: Difícil");
  assert.equal($("reportNextBtn").textContent,"Novo caso no jogo livre");
  $("reportAlternateBtn").handlers.click();
  assert.equal($("difficultySelect").value,"hard");
  assert.equal($("dailyBtn").classList.contains("active"),true);
  assert.equal($("reportDialog").open,false);
  assert.equal($("resultCard").classList.contains("hidden"),true);
  assert.equal($("reportAlternateBtn").classList.contains("hidden"),true);
});
test("finished daily alternate is not offered again, even after a lost case",()=>{
  const day=new Date().toISOString().slice(0,10);
  const hardIndex=hash("GEODETECTIVE-v3|"+day+"|hard")%500;
  for(const won of [true,false]){
    const storage=new Map([["geodetective-daily-v3-"+day+"-hard",
      JSON.stringify({mode:"daily",date:day,difficulty:"hard",index:hardIndex,
        serial:1,guesses:[],revealed:1,finished:true,won,score:won?5000:0})]]);
    const g=boot({storage}),$=g.get,normal=normalIndexForDay(day,g.window);
    g.select(g.window.GEODETECTIVE_PLACES[normal][0]);
    $("guessBtn").handlers.click();
    assert.equal($("reportAlternateBtn").classList.contains("hidden"),true);
    assert.equal($("reportAlternateBtn").disabled,true);
    assert.equal($("reportNextBtn").textContent,"New Free Play case");
    $("reportNextBtn").handlers.click();
    assert.equal($("freeBtn").classList.contains("active"),true);
    assert.equal($("reportAlternateBtn").classList.contains("hidden"),true);
    assert.equal($("reportNextBtn").textContent,"New case");
  }
});
test("the case file displays all country facts including GDP per capita and source year",()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  for(const name of ["Reykjavík","Taipé","São Paulo","Istambul","Ankara"]){
    const index=places.findIndex(x=>x[0]===name);
    const g=boot({randomValue:(index+.25)/places.length}),$=g.get;
    $("freeBtn").handlers.click();g.language("pt");
    g.select(name);$("guessBtn").handlers.click();
    const data=g.window.GeoCountryInsights[(name==="Taipé"?"TW":name==="Reykjavík"?"IS":name==="São Paulo"?"BR":"TR")];
    const fields=$("reportCountryStats").children;
    assert.ok(fields.length>=7,name);
    const byLabel=label=>fields.find(row=>row.children[0].textContent===label)?.children[1].textContent;
    assert.ok(byLabel("Código ISO"),name);
    assert.ok(byLabel("Moeda"),name);
    assert.ok(byLabel("Área do país ou território")?.includes("km²"),name);
    if(data.gdpPerCapita){
      assert.ok(byLabel("PIB per capita")?.includes("US$"),name);
      assert.ok(byLabel("PIB per capita")?.includes(String(data.gdpYear)),name);
    }else assert.equal(byLabel("PIB per capita"),undefined);
    if(data.population)
      assert.ok(byLabel("População")?.includes(String(data.populationYear)),name);
    assert.ok(byLabel("Sem acesso ao mar"),name);
    assert.equal($("reportCountryStatsTitle").textContent,"Perfil do país");
  }
  assert.ok(files["styles.css"].includes("border:0;border-radius:0;overflow:visible;background:transparent"));
  assert.ok(files["styles.css"].includes("flex:0 0 82px"));
  assert.equal(Object.keys(boot().window.GeoCountryProfileI18n).length,19);
});
test("case file footer aligns two equal actions and full-width follow-up buttons",()=>{
  const css=files["styles.css"];
  assert.match(css,/\.report-footer\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(css,/\.report-footer\{display:grid;grid-template-columns:1fr 1fr 1\.3fr/);
  assert.match(css,/\.report-footer #reportMapBtn\{grid-column:1\}/);
  assert.match(css,/\.report-footer #reportShareBtn\{grid-column:2\}/);
  assert.match(css,/\.report-footer #reportAlternateBtn:not\(\.hidden\)\{grid-column:1\/-1\}/);
  assert.match(css,/\.report-footer #reportNextBtn\{grid-column:1\/-1\}/);
});

test("new case replaces Share on the result card while dossier retains Share and New case",()=>{
  const g=boot(),$=g.get;
  assert.ok(!files["index.html"].includes('id="shareBtn"'));
  assert.ok(files["index.html"].includes('id="newCaseBtn"'));
  assert.ok(files["index.html"].includes('id="reportShareBtn"'));
  assert.ok(files["index.html"].includes('id="reportNextBtn"'));
  $("freeBtn").handlers.click();
  g.select("Reykjavík");$("guessBtn").handlers.click();
  const original=$("caseCode").textContent;
  $("newCaseBtn").handlers.click();
  assert.equal($("resultCard").classList.contains("hidden"),true);
  assert.notEqual($("caseCode").textContent,original);
  assert.equal($("freeBtn").classList.contains("active"),true);
});
test("touch, mouse and keyboard map rotation are all disabled",()=>{
  const g=boot({map:true});
  assert.equal(g.mapState.options.dragRotate,false);
  assert.equal(g.mapState.options.touchPitch,false);
  assert.equal(g.mapState.options.pitchWithRotate,false);
  assert.equal(g.mapState.options.bearing,0);
  assert.equal(g.mapState.options.maxPitch,0);
  assert.equal(g.mapState.touchRotationDisabled,true);
  assert.equal(g.mapState.keyboardRotationDisabled,true);
  assert.ok(files["map-fallback.js"].includes("L.map("));
});
test("all 10 evidence cards are purchasable before the first guess without consuming attempts",()=>{
  const base=boot().window.GEODETECTIVE_PLACES;
  for(const [level,initial,attempts] of [["normal",2,6],["hard",1,4]]){
    const idx=base.findIndex(x=>x[0]==="Lisboa"),g=boot({randomValue:(idx+.25)/base.length}),$=g.get;
    g.difficulty(level);$("freeBtn").handlers.click();
    assert.equal($("hintCount").textContent,initial+" / 10");
    assert.equal($("attemptCount").textContent,attempts+" / "+attempts);
    const costBeforeReveal=[];
    for(let i=initial;i<10;i++){
      const cost=Number($("revealCost").textContent.replace(/[^0-9]/g,""));
      assert.ok(cost>=150&&cost<=(level==="hard"?750:500),
        "Expected a priced clue "+(i+1));
      costBeforeReveal.push(cost);
      $("revealBtn").handlers.click();
      assert.equal($("hintCount").textContent,(i+1)+" / 10");
      assert.equal($("attemptCount").textContent,attempts+" / "+attempts,
        "Revealing clues must not use guesses");
    }
    assert.equal($("revealBtn").disabled,true);
    assert.equal(clueTexts(g).length,10);
    const newFacts=clueTexts(g).slice(7);
    assert.equal(newFacts.length,3);
    assert.equal(new Set(newFacts).size,3,"New clues should not repeat each other");
    assert.ok(!newFacts.some(x=>/Closer to|Distance clue/i.test(x)));
    g.select("Lisboa");$("guessBtn").handlers.click();
    assert.equal($("reportEvidenceList").children.length,10);
    assert.equal($("reportHints").textContent,String(10-initial));
    assert.equal($("reportScore").textContent,
      new Intl.NumberFormat("en-US").format(Math.max(250,
        5000-costBeforeReveal.reduce((a,b)=>a+b,0)))+" / 5,000");
  }
});

test("reloading a seven-clue saved daily case preserves its first seven and unlocks three more",()=>{
  const date=new Date().toISOString().slice(0,10);
  const world=boot().window,index=normalIndexForDay(date,world);
  const dayKey="geodetective-daily-v3-"+date+"-normal";
  const storage=new Map([[dayKey,JSON.stringify({
    mode:"daily",index,difficulty:"normal",date,serial:1,guesses:[],
    revealed:7,penalty:1100,paidHints:5,sectorMapPenalty:0,sectorReveals:[],
    finished:false,won:false,score:0
  })]]);
  const g=boot({storage}),$=g.get;
  assert.equal($("hintCount").textContent,"7 / 10");
  assert.equal($("attemptCount").textContent,"6 / 6");
  assert.equal(clueTexts(g).length,10);
  const previouslyVisible=clueTexts(g).slice(0,7);
  for(let i=0;i<3;i++)$("revealBtn").handlers.click();
  assert.equal($("hintCount").textContent,"10 / 10");
  assert.deepEqual(clueTexts(g).slice(0,7),previouslyVisible);
  const saved=JSON.parse(storage.get(dayKey));
  assert.equal(saved.revealed,10);
  assert.equal(saved.paidHints,8);
  assert.equal(saved.guesses.length,0);
  const reopened=boot({storage});
  assert.equal(reopened.get("hintCount").textContent,"10 / 10");
  assert.equal(reopened.get("attemptCount").textContent,"6 / 6");
});

test("ten clue types are unique and complete across representative cities and both difficulties",()=>{
  const world=boot().window,p=world.GEODETECTIVE_PLACES;
  const national=["Currency:","Language family:","One flag color:",
    "No access to the sea.","Has access to the sea.","Population (",
    "GDP per capita (","Country / territory area:"];
  for(const level of ["normal","hard"]){
    for(let i=0;i<p.length;i+=17){
      const g=boot({randomValue:(i+.25)/p.length});
      g.difficulty(level);g.get("freeBtn").handlers.click();
      const all=revealAll(g);
      assert.equal(all.length,10,p[i][0]);
      assert.equal(new Set(all).size,10,"Duplicate evidence text for "+p[i][0]);
      const factCount=all.filter(x=>national.some(prefix=>x.startsWith(prefix))).length;
      assert.ok(factCount>=2&&factCount<=5,
        p[i][0]+" should keep two country facts and fill missing city hints");
      assert.equal(all[1].startsWith("Continent:"),true,p[i][0]);
      assert.ok(!all.some(x=>/Closer to|Distance clue/i.test(x)));
      if(level==="hard"){
        assert.ok(all.some(x=>x.startsWith("UTM zone:")),p[i][0]);
        assert.ok(all.some(x=>x.startsWith("UTM latitude band:")),p[i][0]);
      }else{
        assert.ok(all.some(x=>x.startsWith("Longitude sector:")),p[i][0]);
        assert.ok(all.some(x=>x.startsWith("Latitude sector:")||
          x.startsWith("Associated landmark:")),p[i][0]);
      }
    }
  }
});

test("five city-specific evidence types are sourced, dated, and conditional",()=>{
  const g=boot(),w=g.window,geo=w.CartigmaCityIndicators,urban=w.CartigmaUrban2025;
  const places=w.GEODETECTIVE_PLACES;
  assert.equal(geo.length,500);
  assert.equal(Object.keys(urban).length,21);
  const full=(index,level="normal")=>{
    const play=boot({randomValue:(index+.25)/places.length});
    play.difficulty(level);play.get("freeBtn").handlers.click();
    return {play,clues:revealAll(play)};
  };
  const sao=full(places.findIndex(p=>p[0]==="São Paulo"));
  assert.ok(sao.clues.some(x=>x.includes("inhabitants (est. 2025)")&&
    x.includes("18,950,000")),"São Paulo: verified 2025 UN agglomeration population");
  assert.ok(sao.clues.some(x=>/^≈ 875 km to Brasília \(2026\)/.test(x)),
    "São Paulo: capital distance as calculated in 2026");
  assert.ok(sao.clues.some(x=>/^UTC-3 \(2026\)$/.test(x)),
    "São Paulo: correct IANA time zone for the 2026 reference date");
  const goiania=full(places.findIndex(p=>p[0]==="Goiânia"));
  assert.ok(goiania.clues.some(x=>x.startsWith("≈ 175 km to Brasília (2026)")));
  assert.ok(goiania.clues.some(x=>x.startsWith("≈ 900 km to the ocean coast (2026)")));
  assert.ok(!goiania.clues.some(x=>x.includes("inhabitants (est. 2025)")),
    "No city census may be invented from country or old metropolitan figures");
  const mumbai=full(places.findIndex(p=>p[0]==="Mumbai"));
  assert.ok(mumbai.clues.some(x=>x.includes("20,203,000")&&x.includes("2025")));
  assert.ok(mumbai.clues.some(x=>x.includes("27,000")&&x.includes("2025")),
    "UN 2025 urban density must be available for Mumbai");
  const papeete=full(places.findIndex(p=>p[0]==="Papeete"));
  assert.equal(papeete.clues.length,10);
  assert.ok(!papeete.clues.some(x=>x.includes("inhabitants (est. 2025)")||
    x.includes("people/km²")||x.includes("to the ocean coast")),
    "Sparse island must never receive false coastal or city-population values");
  for(const entry of geo){
    if(entry.cap)assert.ok(entry.cap[0]>0&&entry.cap[1]);
    if(entry.coast)assert.ok(entry.coast>=150);
    if(entry.tz)assert.doesNotThrow(()=>new Intl.DateTimeFormat("en-US",{timeZone:entry.tz}));
  }
  for(const [idx,facts] of Object.entries(urban)){
    assert.ok(+idx>=0&&+idx<500);
    assert.equal(facts.year,2025);
    assert.ok(facts.population>0||facts.density>0);
  }
  for(const [lang,p] of Object.entries(w.CartigmaCityClueI18n)){
    assert.equal(Object.keys(p.templates).length,5);
    for(const key of Object.keys(p.templates)){
      assert.ok(p.templates[key].includes("{year}"),lang+" "+key);
      assert.ok(p.categories[key],lang+" "+key);
    }
  }
});

test("city-specific clues remain 10 and translated on Normal and Hard",()=>{
  const all=boot().window.GEODETECTIVE_PLACES;
  const i=all.findIndex(x=>x[0]==="São Paulo");
  for(const difficulty of ["normal","hard"]){
    const g=boot({randomValue:(i+.25)/all.length});
    g.difficulty(difficulty);g.get("freeBtn").handlers.click();
    g.language("pt");
    const clues=revealAll(g);
    assert.equal(clues.length,10);
    assert.ok(clues.some(x=>x.includes("até Brasília (2026)")));
    assert.ok(clues.some(x=>x.includes("18.950.000")&&x.includes("2025")));
    assert.ok(clues.some(x=>x.includes("UTC-3 (2026)")));
    assert.equal(new Set(clues).size,10);
    assert.equal(g.get("attemptCount").textContent,
      difficulty==="normal"?"6 / 6":"4 / 4");
    g.language("en");
    assert.ok(clueTexts(g).some(x=>x.includes("to Brasília (2026)")));
  }
});

test("closest guess is underlined live and in final dossier, not other guesses",()=>{
  const g=boot(),$=g.get;
  $("freeBtn").handlers.click();
  g.select("Tóquio");$("guessBtn").handlers.click();
  assert.equal($("guessHistory").children.length,1);
  assert.equal($("guessHistory").children[0].classList.contains("closest"),true);
  g.select("Oslo");$("guessBtn").handlers.click();
  assert.equal($("guessHistory").children.length,2);
  assert.equal($("guessHistory").children[0].classList.contains("closest"),true);
  assert.equal($("guessHistory").children[1].classList.contains("closest"),false);
  // Winning the case with a 0-km guess should update the closest marker.
  g.select("Reykjavík");$("guessBtn").handlers.click();
  assert.equal($("guessHistory").children[0].classList.contains("closest"),true);
  assert.equal($("guessHistory").children[1].classList.contains("closest"),false);
  assert.equal($("reportTimeline").children[2].classList.contains("closest"),true);
  assert.equal($("reportTimeline").children[1].classList.contains("closest"),false);
  assert.match(files["styles.css"],/\.history-item\.closest>span:first-child/);
  assert.match(files["styles.css"],/\.report-log-row\.closest \.report-log-place/);
});

test("old eight-hint daily games keep original evidence without new source substitutions",()=>{
  const day=new Date().toISOString().slice(0,10);
  const tmp=boot().window,idx=normalIndexForDay(day,tmp);
  const key="geodetective-daily-v3-"+day+"-normal";
  const storage=new Map([[key,JSON.stringify({
    mode:"daily",index:idx,difficulty:"normal",date:day,serial:1,
    guesses:[],revealed:8,penalty:1500,paidHints:6,
    sectorMapPenalty:0,sectorReveals:[],finished:false,won:false,score:0
  })]]);
  const g=boot({storage}),$=g.get;
  assert.equal($("hintCount").textContent,"8 / 10");
  assert.equal(JSON.parse(storage.get(key)).evidenceVersion,1);
  assert.ok(!clueTexts(g).slice(7).some(x=>
    /Urban population:|Urban density:|to the ocean coast|to .* \(2026\)|UTC.*2026/.test(x)));
  const prior=clueTexts(g).slice(0,8);
  g.get("revealBtn").handlers.click();
  assert.deepEqual(clueTexts(g).slice(0,8),prior);
  const loaded=boot({storage});
  assert.deepEqual(clueTexts(loaded).slice(0,8),prior);
  assert.equal(JSON.parse(storage.get(key)).evidenceVersion,1);
});
test("Normal and Hard have ten translated clues with unchanged guess limits",()=>{
  const g=boot(),$=g.get;
  assert.doesNotMatch(files["index.html"],/value="easy"/);
  assert.equal($("attemptCount").textContent,"6 / 6");
  assert.equal($("hintCount").textContent,"2 / 10");
  assert.equal(clueTexts(g).length,10);
  assert.equal(g.document.documentElement.lang,"en");
  g.difficulty("hard");
  assert.equal($("attemptCount").textContent,"4 / 4");
  assert.equal($("hintCount").textContent,"1 / 10");
  for(let i=0;i<9;i++)$("revealBtn").handlers.click();
  assert.equal($("hintCount").textContent,"10 / 10");
  assert.ok(clueTexts(g).every(x=>x.length));
  assert.doesNotMatch(clueTexts(g).join(" "),/Country \/ territory:/);
  g.difficulty("normal");
  assert.equal($("attemptCount").textContent,"6 / 6");
});

test("case IDs use English difficulty letter, full date and per-day case sequence",()=>{
  const g=boot(),$=g.get;
  const date=new Date().toISOString().slice(0,10).replaceAll("-","");
  assert.equal($("caseCode").textContent,"#N-"+date+"-01");
  $("freeBtn").handlers.click();
  assert.equal($("caseCode").textContent,"#N-"+date+"-02");
  $("freeBtn").handlers.click();
  assert.equal($("caseCode").textContent,"#N-"+date+"-03");
  g.difficulty("hard");
  assert.equal($("caseCode").textContent,"#H-"+date+"-04");
  $("dailyBtn").handlers.click();
  assert.equal($("caseCode").textContent,"#H-"+date+"-05");
  g.difficulty("normal");
  assert.equal($("caseCode").textContent,"#N-"+date+"-01");
  const again=boot({storage:g.storage});
  assert.equal(again.get("caseCode").textContent,"#N-"+date+"-01");
});

test("Hard mode never exposes bearing during live play or in the report",()=>{
  const g=boot(),$=g.get;
  g.difficulty("hard");
  const day=new Date().toISOString().slice(0,10),places=g.window.GEODETECTIVE_PLACES;
  const idx=hash("GEODETECTIVE-v3|"+day+"|hard")%places.length;
  const far=places.find(p=>Math.abs(p[3]-places[idx][3])>50);
  assert.ok(far);
  g.select(far[0]);$("guessBtn").handlers.click();
  assert.match($("feedback").textContent,/km/);
  assert.doesNotMatch($("feedback").textContent,/\b(?:NE|NW|SW|SE|N|E|S|W)\b/);
  assert.doesNotMatch($("guessHistory").children[0].children[1].textContent,/[·]/);
  makeWrong(g,3,far[0]);
  assert.equal($("reportDialog").open,true);
  assert.equal($("reportTimeline").children.length,4);
  assert.ok($("reportTimeline").children.every(x=>!x.children[2].textContent.includes("·")));
  assert.equal($("reportDifficulty").textContent,"Hard");
  assert.equal($("reportAttempts").textContent,"4 / 4");
});

test("Normal mode shows direction and switches language without losing the dossier",()=>{
  const g=boot(),$=g.get;
  g.select("London");$("guessBtn").handlers.click();
  const day=new Date().toISOString().slice(0,10);
  const index=normalIndexForDay(day,g.window);
  if(g.window.GEODETECTIVE_PLACES[index][0]!=="Londres")
    assert.match($("feedback").textContent,/ · (?:North|South|East|West)[a-z]* [↑↗→↘↓↙←↖]/);
  for(const code of Object.keys(g.window.GeoI18n.PACKS)){
    g.language(code);
    assert.equal(g.document.documentElement.lang,g.window.GeoI18n.langNames[code]);
    assert.equal(g.document.documentElement.dir,["ar","he"].includes(code)?"rtl":"ltr");
  }
  g.language("pt");
  assert.equal($("citySearch").placeholder,"Cidade ou região...");
  assert.ok(clueTexts(g).some(text=>text.length>3));
});

test("final dossier records all guesses, fact, continent, score and coordinate",()=>{
  const g=boot({map:true}),$=g.get;
  $("freeBtn").handlers.click(); // seeded RNG picks first location, Reykjavík
  g.select("Reykjavík");$("guessBtn").handlers.click();
  assert.equal($("resultCard").classList.contains("hidden"),false);
  assert.equal($("reportDialog").open,true);
  assert.equal($("reportHeading").textContent,"Reykjavík");
  assert.equal($("reportScore").textContent,"5,000 / 5,000");
  assert.ok($("reportFact").textContent.length>30);
  assert.match($("reportCoordinates").textContent,/64\.1466/);
  assert.equal($("reportEvidenceList").children.length,10);
  assert.equal($("reportTimeline").children.length,1);
  assert.equal($("reportBest").textContent,"0 km");
  assert.ok(g.mapState.fits.at(-1).options.maxZoom>=6);
  $("reportMapBtn").handlers.click();
  assert.equal($("reportDialog").open,false);
  $("reportOpenBtn").handlers.click();
  assert.equal($("reportDialog").open,true);
  $("reportNextBtn").handlers.click();
  assert.equal($("reportDialog").open,false);
  assert.equal($("guessHistory").children[0].textContent,"No guesses yet");
});

test("on loss the map frames best guess and the correct target, not the final guess",()=>{
  const g=boot({map:true}),$=g.get;
  $("freeBtn").handlers.click(); // index 0 -> Reykjavík
  g.select("Oslo");$("guessBtn").handlers.click();
  makeWrong(g,5,"Tokyo");
  assert.equal($("reportDialog").open,true);
  const fit=g.mapState.fits.at(-1);
  assert.ok(fit);
  assert.ok(Math.abs(fit.bounds[0][1]-59.9139)<.05,"best guess should be Oslo");
  assert.ok(Math.abs(fit.bounds[1][1]-64.1466)<.05,"target should be Reykjavík");
  assert.ok(fit.options.maxZoom>=4&&fit.options.maxZoom<=6.2);
  assert.equal($("reportBest").textContent.match(/km/)!==null,true);
});

test("evidence styling is compact and location pins use the tip as anchor",()=>{
  assert.match(files["styles.css"],/clue\{flex:0 0 auto/);
  assert.match(files["styles.css"],/clue-category/);
  assert.match(files["styles.css"],/\.pin::after/);
  assert.match(files["app.js"],/anchor:"bottom"/);
  assert.match(files["app.js"],/head\.className="pin-head"/);
  assert.match(files["styles.css"],/maplibregl-marker\.pin/);
  assert.match(files["styles.css"],/height:100dvh/);
  assert.match(files["app.js"],/tiles\.openfreemap\.org\/styles\//);
  assert.match(files["app.js"],/activeMapTheme\(\)==="light"\?"positron":"dark"/);
  assert.match(files["map-bootstrap.js"],/maplibre-gl@6\.18\.0/);
  assert.doesNotMatch(files["app.js"],/basemaps\.cartocdn\.com/);
});


const distanceKm=(a,b)=>{
  const rad=n=>n*Math.PI/180;
  const dlat=rad(b[0]-a[0]),dlon=rad(b[1]-a[1]);
  const h=Math.sin(dlat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dlon/2)**2;
  return 6371.0088*2*Math.asin(Math.sqrt(h));
};
test("all 74 cities have at least two named reference locations within 1,000 km",()=>{
  const g=boot(),p=g.window.GEODETECTIVE_PLACES,refs=g.window.GEODETECTIVE_NEARBY_REFERENCES;
  assert.equal(p.length,500);
  for(let i=0;i<74;i++){
    const origin=[p[i][3],p[i][4]];
    const catalog=p.filter((q,j)=>j!==i&&distanceKm(origin,[q[3],q[4]])<=1000
      &&distanceKm(origin,[q[3],q[4]])>=10).length;
    const additional=(refs[i]||[]).filter(r=>distanceKm(origin,[r[2],r[3]])<=1000
      &&distanceKm(origin,[r[2],r[3]])>=10);
    assert.ok(catalog+additional.length>=2,p[i][0]+" has too few nearby references");
    for(const ref of additional)
      assert.ok(distanceKm(origin,[ref[2],ref[3]])<=1000,p[i][0]+" -> "+ref[0]);
  }
  assert.ok((refs[13]||[]).some(x=>x[0]==="Casablanca"),"Marrakech should reference nearby Moroccan cities");
  assert.match(files["app.js"],/regionalHintRadius\(index,level\)/);
  assert.match(files["app.js"],/km<=radius/);
});
test("map labels react to all language changes and fall back to native names",()=>{
  const g=boot({map:true});
  assert.ok(g.mapState.styles.some(x=>x.id==="label_city"));
  g.language("ja");
  const field=g.mapState.styles.filter(x=>x.id==="label_city").at(-1).expr;
  assert.ok(JSON.stringify(field).includes("name:ja"));
  assert.ok(JSON.stringify(field).includes('"name"'));
  assert.ok(g.mapState.styles.every(x=>!(x.id==="road_shield"&&x.key==="text-field")),
    "Road shields must not be translated; their layer visibility may be filtered");
  g.language("pt");
  assert.equal(g.get("languageFlag").textContent,"🇧🇷");
  g.language("en");
  assert.equal(g.get("languageFlag").textContent,"🇺🇸");
  assert.match(files["index.html"],/language-globe/);
});
test("drag gestures do not create a pin, while a clean click does",()=>{
  const g=boot({map:true});
  assert.equal(g.get("guessBtn").disabled,true);
  const canvas=g.mapState.canvas;
  canvas.handlers.pointerdown({button:0,pointerType:"mouse",clientX:100,clientY:100});
  canvas.handlers.pointermove({clientX:150,clientY:100});
  canvas.handlers.pointerup({clientX:150,clientY:100});
  g.mapState.events.click({lngLat:{lat:32,lng:-5}});
  assert.equal(g.get("guessBtn").disabled,true);
  canvas.handlers.pointerdown({button:0,pointerType:"mouse",clientX:100,clientY:100});
  canvas.handlers.pointerup({clientX:101,clientY:101});
  g.mapState.events.click({lngLat:{lat:31.62,lng:-7.98}});
  assert.equal(g.get("guessBtn").disabled,false);
});
test("report opens in non-modal side panel without blocking the map",()=>{
  const g=boot({map:true});
  g.get("freeBtn").handlers.click();
  g.select("Reykjavík");g.get("guessBtn").handlers.click();
  assert.equal(g.get("reportDialog").open,true);
  assert.match(files["app.js"],/dialog\.show\(\)/);
  assert.match(files["styles.css"],/dialog\.case-report/);
  assert.match(files["styles.css"],/inset:108px/);
});

test("map labels appear gradually with zoom instead of all at once",()=>{
  const g=boot({map:true});
  const ranges=g.mapState.zoomRanges;
  const country=ranges.find(x=>x.id==="label_country_1");
  const city=ranges.find(x=>x.id==="label_city");
  const road=ranges.find(x=>x.id==="road_shield");
  assert.ok(country&&city&&road,"Country, city and road layers should have zoom rules");
  assert.ok(country.min<=2,"Countries remain visible at world scale");
  assert.ok(city.min>=2.5&&city.min<=3.3,"City names should appear at moderate zoom");
  assert.ok(road.min>=9,"Road labels should remain at local zoom");
  assert.ok(city.min<road.min,"Different labels need progressively higher zoom");
  assert.equal(country.max,24);
  assert.equal(city.max,24);
  assert.match(files["app.js"],/configureMapLabelDensity/);
  assert.ok(files["index.html"].includes("mapVectorBtn")&&files["index.html"].includes("mapOsmBtn"));
});



test("gear opens a localized map layer popover above the map selector",()=>{
  const g=boot({map:true}),$=g.get;
  assert.ok(files["index.html"].includes('id="mapFiltersButton"'));
  assert.ok(files["index.html"].includes('id="mapFiltersPopover"'));
  assert.ok(files["styles.css"].includes("bottom:calc(100% + 10px)"));
  assert.equal(Object.keys(g.window.GeoMapFilterLabels).length,19);
  assert.equal($("mapFiltersButton").disabled,false);
  $("mapFiltersButton").handlers.click();
  assert.equal($("mapFiltersButton").attributes["aria-expanded"],"true");
  assert.equal($("mapFiltersPopover").classList.contains("hidden"),false);
  g.language("pt");
  assert.equal($("mapFiltersTitle").textContent,"Camadas do mapa");
  assert.equal($("mapFiltersReset").textContent,"Restaurar");
  $("mapFiltersClose").handlers.click();
  assert.equal($("mapFiltersPopover").classList.contains("hidden"),true);
});

test("map settings affect only basemap layers, and no longer include continents",()=>{
  const g=boot({map:true}),$=g.get;
  assert.ok(!files["index.html"].includes('id="mapFilterContinents"'));
  assert.equal(g.get("mapFilterContinents").handlers.change,undefined);
  const change=(id,checked)=>{
    const input=$(id);input.checked=checked;input.handlers.change({target:input});
  };
  for(const [id,layer] of [
    ["mapFilterBorders","boundary_country"],["mapFilterRegions","boundary_state"],
    ["mapFilterCountryNames","label_country_1"],["mapFilterCityNames","label_city"],
    ["mapFilterRoads","road_shield"],["mapFilterAreas","park_green"],
    ["mapFilterWater","waterway"],["mapFilterPoi","poi_museum"]
  ]){
    change(id,false);
    assert.ok(g.mapState.styles.some(x=>x.id===layer&&x.key==="visibility"&&x.expr==="none"));
  }
  assert.equal(g.mapState.layers.has("map-filter-continents"),false);
  assert.ok(!g.mapState.styles.some(x=>x.id.startsWith("case-")&&x.key==="visibility"));
  change("mapFilterRoads",true);
  assert.equal(g.mapState.styles.filter(x=>x.id==="road_shield"&&x.key==="visibility").at(-1).expr,"visible");
});
test("filter settings persist without the old continents toggle",async()=>{
  const storage=new Map(),g=boot({map:true,storage}),$=g.get;
  $("mapFiltersButton").handlers.click();
  const input=$("mapFilterPoi");input.checked=false;input.handlers.change({target:input});
  const saved=JSON.parse(storage.get("cartigma-map-filters-v1"));
  assert.equal(saved.poi,false);
  assert.ok(!("continents" in saved));
  await $("mapOsmBtn").handlers.click();
  assert.equal($("mapFiltersButton").disabled,true);
  await $("mapVectorBtn").handlers.click();
  assert.equal($("mapFiltersButton").disabled,false);
  const next=boot({map:true,storage});
  assert.equal(next.get("mapFilterPoi").checked,false);
  assert.ok(next.mapState.styles.some(x=>x.id==="poi_museum"&&x.expr==="none"));
  next.get("mapFiltersReset").handlers.click();
  assert.equal(next.get("mapFilterPoi").checked,true);
  assert.equal(next.get("clueList").children[1].children[1].children[2].textContent,"Map −500");
});
test("longitude stays accurate but moves to different evidence positions",()=>{
  const places=boot().window.GEODETECTIVE_PLACES,seen=new Set();
  for(const [name,want] of [["Taipé","120° to 150°"],["Papeete","-150° to -120°"],["Reykjavík","-30° to 0°"]]){
    const i=places.findIndex(x=>x[0]===name);
    const g=boot({randomValue:(i+.25)/places.length});
    g.get("freeBtn").handlers.click();
    const clues=revealAll(g);
    const idx=clues.findIndex(x=>x.startsWith("Longitude sector:"));
    assert.ok(idx>=2&&idx<10,name);
    assert.ok(clues[idx].includes(want),name);
    seen.add(idx);
    assert.doesNotMatch(clues.join(" "),/Closer to |Distance clue:/);
  }
  assert.ok(seen.size>=2,"Longitude should not be a fixed fourth clue");
});
test("revealing landmarks never leaks the answer through the place name",()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  for(const name of ["Tóquio","Taipé","Antananarivo","Sydney","Papeete"]){
    const i=places.findIndex(x=>x[0]===name);
    const g=boot({randomValue:(i+.25)/places.length});
    g.get("freeBtn").handlers.click();
    const clues=revealAll(g);
    assert.ok(clues.some(x=>/^Latitude sector: -?\d+° to -?\d+°$/.test(x)),name);
  }
  const i=places.findIndex(x=>x[0]==="Paris"),g=boot({randomValue:(i+.25)/places.length});
  g.get("freeBtn").handlers.click();
  assert.ok(revealAll(g).includes("Associated landmark: Eiffel Tower"));
});
test("Hard mode still uses UTM zone and latitude bands without city giveaways",()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  for(const [name,zone,band] of [["Taipé",51,"R"],["Tóquio",54,"S"],["Longyearbyen",33,"X"]]){
    const i=places.findIndex(x=>x[0]===name);
    const g=boot({randomValue:(i+.25)/places.length});
    g.difficulty("hard");g.get("freeBtn").handlers.click();
    const clues=revealAll(g);
    assert.ok(clues.includes("UTM zone: "+zone),name);
    assert.ok(clues.includes("UTM latitude band: "+band),name);
    assert.equal(clues.length,10);
    assert.doesNotMatch(clues.join(" "),/Closer to |Associated landmark:/);
  }
});
test("exact guesses omit distance and direction in history and final dossier",()=>{
  const g=boot({map:true}),$=g.get;
  $("freeBtn").handlers.click(); // Reykjavík is index 0.
  g.select("Reykjavík");
  $("guessBtn").handlers.click();
  assert.equal($("reportBest").textContent,"0 km"); // The summary still reports exact accuracy.
  assert.equal($("guessHistory").children[0].children.length,1);
  assert.equal($("reportTimeline").children[0].children.length,2);
  assert.doesNotMatch($("guessHistory").children[0].textContent,/km|·|↑|↗|→/);
});

test("a correct fifth guess in Cape Town has no distance or bearing in history or dossier",()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  const target=places.findIndex(p=>p[0]==="Cidade do Cabo");
  assert.ok(target>=0);
  const g=boot({randomValue:(target+.25)/places.length}),$=g.get;
  $("freeBtn").handlers.click();
  g.language("pt");
  for(let i=0;i<4;i++){g.select("Oslo");$("guessBtn").handlers.click();}
  g.select("Cidade do Cabo");$("guessBtn").handlers.click();
  assert.equal($("historyCount").textContent,"05");
  assert.equal($("guessHistory").children[0].children.length,1);
  assert.equal($("reportTimeline").children[4].children.length,2);
  assert.doesNotMatch($("guessHistory").children[0].textContent,/km|Norte|↑/);
  assert.ok($("guessHistory").children[1].children[1].textContent.includes("km"),
    "Incorrect guesses must keep their useful distance");
});

test("fresh deployments fingerprint both game engine and translated clues",()=>{
  assert.ok(files["index.html"].includes('src="map-bootstrap.js?v=20261116-city-evidence"'));
  assert.ok(files["index.html"].includes('src="clues-i18n.js?v=20261116-profile-diversity"'));
  assert.ok(files["map-bootstrap.js"].includes('new URL(import.meta.url).searchParams.get("v")'));
  assert.ok(files["app.js"].includes("function guessMetricText(g)"));
  const deploy=readFileSync(new URL("../.github/workflows/pages.yml",import.meta.url),"utf8");
  assert.ok(deploy.includes("GITHUB_SHA"));
});

test("Hard mode charges 50 percent more for all clue reveals and map overlays",()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  const i=places.findIndex(p=>p[0]==="Reykjavík");
  const normal=boot({map:true,randomValue:(i+.25)/places.length});
  normal.get("freeBtn").handlers.click();
  const initialNormal=Number(normal.get("revealCost").textContent.replace(/[^0-9]/g,""));
  assert.equal(normal.get("clueList").children[1].children[1].children[2].textContent,"Map −500");
  const hard=boot({map:true,randomValue:(i+.25)/places.length});
  hard.difficulty("hard");hard.get("freeBtn").handlers.click();
  const hardCost=Number(hard.get("revealCost").textContent.replace(/[^0-9]/g,""));
  assert.equal(hardCost,Math.ceil(300*1.5/50)*50,"Second clue is the continent");
  hard.get("revealBtn").handlers.click();
  assert.equal(hard.get("clueList").children[1].children[1].children[2].textContent,"Map −750");
  const before=Number(hard.get("revealCost").textContent.replace(/[^0-9]/g,""));
  assert.ok(before>=Math.ceil(initialNormal*1.5/50)*50||before>=300);
  hard.get("clueList").children[1].children[1].children[2].handlers.click();
  hard.select("Reykjavík");hard.get("guessBtn").handlers.click();
  const spent=hardCost;
  assert.equal(hard.get("reportScore").textContent,
    new Intl.NumberFormat("en-US").format(5000-spent-750)+" / 5,000");
  assert.equal(hard.get("reportHints").textContent,"1");
});

test("paid UTM zone draws correct Norwegian and Svalbard exceptions with labeled ruler",()=>{
  const cities=boot().window.GEODETECTIVE_PLACES;
  for(const [city,expectedZone,west,east,south,north] of [
    ["Oslo",32,3,12,56,64],["Longyearbyen",33,9,21,72,84]
  ]){
    const idx=cities.findIndex(x=>x[0]===city);
    const g=boot({map:true,randomValue:(idx+.25)/cities.length}),$=g.get;
    g.difficulty("hard");$("freeBtn").handlers.click();
    const {button}=unlockClue(g,/^UTM zone:/);
    assert.equal(button.textContent,"Map −1,800");
    assert.equal(button.disabled,false);
    button.handlers.click();
    assert.equal($("clueList").children.find(row=>row.children[1].children[1].textContent==="UTM zone: "+expectedZone)
      .children[1].children[2].disabled,true);
    const shape=g.mapState.sources.get("case-utm-zone").data.geometry;
    assert.equal(shape.type,"MultiPolygon");
    assert.ok(shape.coordinates.some(poly=>poly[0].some(p=>p[0]===west&&p[1]===south)
      &&poly[0].some(p=>p[0]===east&&p[1]===north)),
      city+" must include correct special UTM borders");
    assert.ok(g.mapState.sources.has("case-utm-grid"));
    const grid=g.mapState.sources.get("case-utm-grid").data.geometry;
    assert.equal(grid.type,"MultiLineString");
    assert.ok(grid.coordinates.some(line=>line[0][0]===west
      &&line[0][1]===south&&line[1][1]===north),
      city+" should draw the corrected UTM zone ruler");
    const labels=g.mapState.sources.get("case-utm-annotations").data.features;
    assert.equal(labels.length,60);
    assert.ok(labels.some(f=>f.properties.label===String(expectedZone)));
    assert.equal(g.mapState.layers.get("case-utm-grid").paint["line-opacity"],.36);
    assert.equal(g.mapState.layers.get("case-utm-zone").paint["fill-opacity"],.10);
    assert.equal(g.mapState.fits.length>0,true);
    button.handlers.click();
  }
});

test("UTM latitude-band purchase shows the correct 8 and 12 degree ranges",async()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  for(const [city,band,south,north] of [
    ["Tóquio","S",32,40],["Longyearbyen","X",72,84]
  ]){
    const index=places.findIndex(p=>p[0]===city);
    const g=boot({map:true,randomValue:(index+.25)/places.length}),$=g.get;
    g.difficulty("hard");$("freeBtn").handlers.click();
    const {button}=unlockClue(g,/^UTM latitude band:/);
    assert.equal(button.textContent,"Map −1,950");
    button.handlers.click();
    const geo=g.mapState.sources.get("case-utm-band").data.geometry;
    assert.equal(geo.type,"MultiPolygon");
    assert.equal(geo.coordinates.length,6);
    assert.equal(geo.coordinates[0][0][0][1],south);
    assert.equal(geo.coordinates[0][0][2][1],north);
    assert.equal(g.mapState.sources.get("case-utm-annotations").data.features.length,120);
    assert.ok(g.mapState.sources.get("case-utm-annotations").data.features.some(
      f=>f.properties.label===band));
    await $("mapOsmBtn").handlers.click();
    assert.ok(g.mapState.sources.has("case-utm-grid"));
    assert.ok(g.mapState.sources.has("case-utm-band"));
    await $("mapVectorBtn").handlers.click();
    assert.ok(g.mapState.sources.has("case-utm-band"));
  }
});

test("both UTM overlays persist in daily Hard games without charging twice",()=>{
  const storage=new Map(),cities=boot().window.GEODETECTIVE_PLACES;
  const date=new Date().toISOString().slice(0,10);
  const g=boot({map:true,storage}),$=g.get;
  g.difficulty("hard");
  const {button:zone}=unlockClue(g,/^UTM zone:/);
  zone.handlers.click();
  const {button:band}=unlockClue(g,/^UTM latitude band:/);
  band.handlers.click();
  const key="geodetective-daily-v3-"+date+"-hard";
  const saved=JSON.parse(storage.get(key));
  assert.deepEqual(saved.sectorReveals,["utmZone","utmBand"]);
  assert.equal(saved.sectorMapPenalty,3750);
  assert.equal(saved.guesses.length,0);
  assert.ok(g.mapState.sources.has("case-utm-zone"));
  assert.ok(g.mapState.sources.has("case-utm-band"));
  assert.equal(g.mapState.sources.get("case-utm-annotations").data.features.length,180);
  const loaded=boot({map:true,storage});
  assert.equal(unlockClue(loaded,/^UTM zone:/).button.disabled,true);
  assert.equal(unlockClue(loaded,/^UTM latitude band:/).button.disabled,true);
  assert.ok(loaded.mapState.sources.has("case-utm-zone"));
  assert.ok(loaded.mapState.sources.has("case-utm-band"));
  assert.equal(JSON.parse(storage.get(key)).sectorMapPenalty,3750);
  loaded.difficulty("normal");
  assert.ok(!loaded.mapState.sources.has("case-utm-zone"));
  assert.equal(loaded.get("clueList").children[1].children[1].children[2]?.textContent,"Map −500");
});

test("paid longitude sector remains available regardless of shuffled evidence order",()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  const index=places.findIndex(p=>p[0]==="Taipé");
  const g=boot({map:true,randomValue:(index+.25)/places.length}),$=g.get;
  $("freeBtn").handlers.click();
  let spentHintCost=0;
  while(!clueTexts(g).some(text=>/^Longitude sector:/.test(text))){
    assert.equal($("revealBtn").disabled,false);
    spentHintCost+=Number($("revealCost").textContent.replace(/[^0-9]/g,""));
    $("revealBtn").handlers.click();
  }
  const {index:slot,button}=unlockClue(g,/^Longitude sector:/);
  assert.ok(slot>=2&&slot<=9&&button&&!button.disabled);
  const revealed=Number($("hintCount").textContent.split("/")[0]);
  button.handlers.click();
  const geo=g.mapState.sources.get("case-sector-longitude").data.geometry;
  assert.equal(geo.type,"Polygon");
  assert.equal(geo.coordinates[0][0][0],120);
  assert.equal(geo.coordinates[0][1][0],150);
  assert.equal(g.mapState.layers.get("case-sector-longitude").paint["fill-color"],"#ffd449");
  assert.equal(g.mapState.layers.get("case-sector-longitude").paint["fill-opacity"],.1);
  assert.equal($("clueList").children[slot].children[1].children[2].disabled,true);
  assert.ok(g.mapState.fits.length>0);
  g.language("pt");
  assert.match($("clueList").children[slot].children[1].children[2].textContent,/No mapa/);
  g.select("Taipé");$("guessBtn").handlers.click();
  const expected=5000-1000-spentHintCost;
  assert.equal($("reportScore").textContent,new Intl.NumberFormat("pt-BR").format(expected)+" / 5,000");
  assert.equal($("reportHints").textContent,String(revealed-2));
});
test("paid latitude band survives map changes even after evidence shuffling",async()=>{
  const places=boot().window.GEODETECTIVE_PLACES,index=places.findIndex(p=>p[0]==="Tóquio");
  const g=boot({map:true,randomValue:(index+.25)/places.length}),$=g.get;
  $("freeBtn").handlers.click();
  const {button}=unlockClue(g,/^Latitude sector:/);
  assert.ok(button&&!button.disabled);button.handlers.click();
  const geo=g.mapState.sources.get("case-sector-latitude").data.geometry;
  assert.equal(geo.type,"MultiPolygon");
  assert.equal(geo.coordinates.length,6);
  assert.equal(geo.coordinates[0][0][0][1],30);
  assert.equal(geo.coordinates[0][0][2][1],45);
  assert.equal(g.mapState.layers.get("case-sector-latitude").paint["fill-opacity"],.1);
  await $("mapOsmBtn").handlers.click();
  assert.equal(g.mapState.layers.get("case-sector-latitude").paint["fill-opacity"],.1);
  await $("mapVectorBtn").handlers.click();
  assert.ok(g.mapState.sources.has("case-sector-latitude"));
});
test("late map initialization enables a shuffled paid-sector action",()=>{
  const g=boot({map:true}),$=g.get;
  const {index}=unlockClue(g,/^(Longitude sector|Latitude sector):/);
  let button=$("clueList").children[index].children[1].children[2];
  assert.ok(button&&!button.disabled);
  button.disabled=true;
  g.mapState.events["style.load"]();
  button=$("clueList").children[index].children[1].children[2];
  assert.equal(button.disabled,false);
});
test("daily paid sectors are saved and do not charge twice",()=>{
  const storage=new Map(),g=boot({map:true,storage}),$=g.get;
  const {button}=unlockClue(g,/^Longitude sector:/);
  button.handlers.click();
  const day=new Date().toISOString().slice(0,10);
  const saved=JSON.parse(storage.get("geodetective-daily-v3-"+day+"-normal"));
  assert.equal(saved.sectorMapPenalty,1000);
  assert.deepEqual(saved.sectorReveals,["longitude"]);
  const next=boot({map:true,storage});
  assert.ok(next.mapState.sources.has("case-sector-longitude"));
  assert.equal(unlockClue(next,/^Longitude sector:/).button.disabled,true);
  assert.equal(JSON.parse(storage.get("geodetective-daily-v3-"+day+"-normal")).sectorMapPenalty,1000);
  next.difficulty("hard");
  assert.ok(!clueTexts(next).some(x=>/^Longitude sector:/.test(x)));
});
test("paid hemisphere guidance draws the Equator dashed with arrows pointing to north or south",()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  for(const north of [true,false]){
    const world=boot().window;
    const index=places.findIndex((p,i)=>![7,8,10,35].includes(i)
      &&equatorRegions.has(continentForTest(i,world))
      &&hash("opening:"+p[0])%3===2&&(p[3]>=0)===north);
    assert.ok(index>=0,"Missing northern/southern hemisphere example");
    const g=boot({map:true,randomValue:(index+.25)/places.length}),$=g.get;
    $("freeBtn").handlers.click();
    assert.match(clueTexts(g)[0],/hemisphere/i);
    const button=$("clueList").children[0].children[1].children[2];
    assert.equal(button.textContent,"Map −250");
    assert.equal(button.disabled,false);
    button.handlers.click();
    const line=g.mapState.sources.get("case-hemisphere-line").data.geometry;
    assert.equal(line.type,"LineString");
    assert.equal(line.coordinates[0][1],0);
    assert.equal(line.coordinates[1][1],0);
    const layer=g.mapState.layers.get("case-hemisphere-line");
    assert.equal(layer.paint["line-color"],"#ffd449");
    assert.equal(layer.paint["line-dasharray"].join(","),"2,3");
    const arrowLayer=g.mapState.layers.get("case-hemisphere-arrows");
    assert.equal(arrowLayer.layout["text-field"],north?"↑":"↓");
    assert.equal(arrowLayer.source,"case-hemisphere-line",
      "Arrows must use the Equator line instead of fixed geographic points");
    assert.equal(arrowLayer.layout["symbol-placement"],"line");
    assert.equal(arrowLayer.layout["symbol-spacing"],88);
    assert.equal(arrowLayer.layout["text-size"],14);
    assert.equal(arrowLayer.layout["text-offset"][0],0);
    assert.equal(arrowLayer.layout["text-offset"][1],north?-0.85:0.85);
    assert.equal(arrowLayer.layout["text-rotation-alignment"],"viewport");
    assert.equal(g.mapState.sources.has("case-hemisphere-arrows"),false,
      "Fixed latitude/longitude arrows would drift away as the map zooms");
    assert.equal($("clueList").children[0].children[1].children[2].disabled,true);
    button.handlers.click(); // Clicking the original button again cannot charge twice.
    assert.equal(g.mapState.eases.at(-1).center[1],0);
    g.language("pt");
    assert.match($("clueList").children[0].children[1].children[2].textContent,/No mapa/);
    g.select(places[index][0]);$("guessBtn").handlers.click();
    assert.equal($("reportScore").textContent,"4.750 / 5,000");
    assert.equal($("reportHints").textContent,"0");
  }
});

test("hemisphere purchase survives daily reloading and map engine switching",async()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  const day=Array.from({length:120},(_,i)=>new Date(Date.UTC(2027,0,i+1)).toISOString().slice(0,10))
    .find(d=>{
      const index=normalIndexForDay(d,{GEODETECTIVE_PLACES:places,
        GeoExtendedPlaceMetadata:boot().window.GeoExtendedPlaceMetadata});
      return ![7,8,10,35].includes(index)
        &&equatorRegions.has(continentForTest(index,boot().window))
        &&hash("opening:"+places[index][0])%3===2;
    });
  assert.ok(day);
  class FakeDate extends Date{
    constructor(...args){super(...(args.length?args:[day+"T12:00:00Z"]));}
  }
  const storage=new Map(),g=boot({map:true,storage,clock:FakeDate}),$=g.get;
  assert.match(clueTexts(g)[0],/hemisphere/i);
  $("clueList").children[0].children[1].children[2].handlers.click();
  const saved=JSON.parse(storage.get("geodetective-daily-v3-"+day+"-normal"));
  assert.equal(saved.sectorMapPenalty,250);
  assert.deepEqual(saved.sectorReveals,["hemisphere"]);
  await $("mapOsmBtn").handlers.click();
  assert.ok(g.mapState.layers.has("case-hemisphere-line"));
  assert.ok(g.mapState.layers.has("case-hemisphere-arrows"));
  await $("mapVectorBtn").handlers.click();
  assert.equal(g.mapState.layers.get("case-hemisphere-arrows").type,"symbol");
  assert.equal(g.mapState.layers.get("case-hemisphere-arrows").layout["symbol-spacing"],88);
  const reopened=boot({map:true,storage,clock:FakeDate});
  assert.ok(reopened.mapState.sources.has("case-hemisphere-line"));
  assert.equal(reopened.get("clueList").children[0].children[1].children[2].disabled,true);
  assert.equal(JSON.parse(storage.get("geodetective-daily-v3-"+day+"-normal")).sectorMapPenalty,250);
});

test("hemisphere guide requires a revealed hemisphere clue and working map, including Hard",()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  const world=boot().window;
  const index=places.findIndex((p,i)=>![7,8,10,35].includes(i)
    &&equatorRegions.has(continentForTest(i,world))&&hash("opening:"+p[0])%3===2);
  assert.ok(index>=0);
  const g=boot({map:false,randomValue:(index+.25)/places.length});
  g.get("freeBtn").handlers.click();
  const button=g.get("clueList").children[0].children[1].children[2];
  assert.equal(button.disabled,true);
  assert.match(button.textContent,/250/);
  const hard=boot({map:true,randomValue:(index+.25)/places.length});
  hard.difficulty("hard");
  hard.get("freeBtn").handlers.click();
  assert.equal(hard.get("clueList").children[0].children[1].children[2].disabled,false);
  assert.equal(hard.get("clueList").children[1].children[1].children[2],undefined,
    "The continent clue remains locked after starting Hard mode");
  for(let i=2;i<6;i++)
    assert.equal(hard.get("clueList").children[i].children[1].children[2],undefined);
});

test("continent outline is a low-opacity line with NO fill, costs 500 once",()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  const cases=[["Paris","europe"],["Marrakech","africa"],["Tóquio","asia"],
    ["Sydney","oceania"],["Nova York","northAmerica"],["São Paulo","southAmerica"]];
  for(const [city,region] of cases){
    const index=places.findIndex(p=>p[0]===city);
    assert.ok(index>=0,city+" missing");
    const g=boot({map:true,randomValue:(index+.25)/places.length}),$=g.get;
    $("freeBtn").handlers.click();
    const btn=$("clueList").children[1].children[1].children[2];
    assert.ok(btn&&!btn.disabled,city);
    assert.equal(btn.textContent,"Map −500",city);
    assert.equal(g.mapState.layers.has("case-continent-outline"),false);
    btn.handlers.click();
    const shape=g.window.GeoContinentBorders[region];
    assert.ok(shape?.geometry?.coordinates?.length>0,region);
    assert.ok(shape.geometry.coordinates.flat(2).length>20,region);
    const geo=g.mapState.sources.get("case-continent-outline").data.geometry;
    assert.equal(geo.type,"MultiPolygon");
    assert.equal(geo.coordinates.length,shape.geometry.coordinates.length);
    const layer=g.mapState.layers.get("case-continent-outline");
    assert.equal(layer.type,"line");
    assert.equal(layer.paint["line-color"],"#ffd449");
    assert.equal(layer.paint["line-opacity"],0.28);
    assert.ok(!("fill-opacity" in layer.paint)&&!("fill-color" in layer.paint));
    assert.equal($("clueList").children[1].children[1].children[2].disabled,true);
    btn.handlers.click();
    g.select(city);$("guessBtn").handlers.click();
    assert.equal($("reportScore").textContent,"4,500 / 5,000");
    assert.equal($("reportHints").textContent,"0");
  }
});

test("continent shape is available only after its second clue, survives daily reload and map styles",async()=>{
  const storage=new Map(),g=boot({map:true,storage}),$=g.get;
  const btn=$("clueList").children[1].children[1].children[2];
  assert.ok(btn&&!btn.disabled);
  assert.equal(g.mapState.sources.has("case-continent-outline"),false);
  btn.handlers.click();
  const day=new Date().toISOString().slice(0,10);
  const saved=JSON.parse(storage.get("geodetective-daily-v3-"+day+"-normal"));
  assert.deepEqual(saved.sectorReveals,["continent"]);
  assert.equal(saved.sectorMapPenalty,500);
  await $("mapOsmBtn").handlers.click();
  assert.ok(g.mapState.layers.has("case-continent-outline"));
  await $("mapVectorBtn").handlers.click();
  assert.equal(g.mapState.layers.get("case-continent-outline").type,"line");
  const reopened=boot({map:true,storage});
  assert.equal(reopened.get("clueList").children[1].children[1].children[2].disabled,true);
  assert.ok(reopened.mapState.sources.has("case-continent-outline"));
  assert.equal(JSON.parse(storage.get("geodetective-daily-v3-"+day+"-normal")).sectorMapPenalty,500);
  const hard=boot({map:true});
  hard.difficulty("hard");
  assert.equal(hard.get("clueList").children[1].children[1].children[2],undefined);
  hard.get("revealBtn").handlers.click();
  const paid=hard.get("clueList").children[1].children[1].children[2];
  assert.ok(paid&&!paid.disabled);
  assert.match(paid.textContent,/750/);
});

test("Equator arrows pop in and out without fade animations",()=>{
  const g=boot({map:true}),$=g.get;
  assert.equal(g.mapState.options.fadeDuration,0);
  assert.match(files["styles.css"],/\.hemisphere-direction-arrow\{[^}]*transition:none!important/);
  assert.match(files["app.js"],/"text-opacity-transition":\{duration:0,delay:0\}/);
  assert.ok(!g.mapState.layers.has("case-continent-outline"),
    "No unpaid continent guide should appear");
  assert.ok(files["index.html"].includes('src="continent-borders.js?v=20261116-profile-diversity"'));
});

test("hemisphere evidence never follows the continent and no generic river-valley clue remains",()=>{
  const places=boot().window.GEODETECTIVE_PLACES;
  let hemisphereUsed=0;
  for(let i=0;i<places.length;i++){
    const g=boot({randomValue:i/places.length});
    g.get("freeBtn").handlers.click();
    for(let j=0;j<6;j++)g.get("revealBtn").handlers.click();
    const entries=clueTexts(g);
    const hemisphere=entries.findIndex(x=>/hemisphere/i.test(x));
    const continent=entries.findIndex(x=>/continent/i.test(x));
    assert.ok(continent!==-1,places[i][0]+" has no continent evidence");
    if(hemisphere!==-1){
      hemisphereUsed++;
      assert.ok(equatorRegions.has(continentForTest(i,g.window)),
        places[i][0]+" cannot have a hemisphere clue on a non-crossing continent");
      assert.ok(hemisphere<continent,places[i][0]+" hemisphere follows continent");
    }else{
      assert.ok(equatorRegions.has(continentForTest(i,g.window))||hemisphere===-1);
    }
    assert.doesNotMatch(entries.join(" "),/river valleys|mountain valleys/i,places[i][0]);
  }
  assert.ok(hemisphereUsed>5,"Some cases should still have hemisphere evidence before continent");
  for(const [i,river] of [[7,"Thames"],[8,"Seine"],[10,"Tiber"],[35,"Han"]]){
    const g=boot({randomValue:i/places.length});g.get("freeBtn").handlers.click();
    for(let j=0;j<6;j++)g.get("revealBtn").handlers.click();
    assert.ok(clueTexts(g).join(" ").includes(river),"Named river "+river+" missing");
  }
});
test("Normal mode renders full localized direction with pointing arrow; Hard never shows it",()=>{
  const normal=boot({randomValue:0});normal.get("freeBtn").handlers.click();
  normal.select("Oslo");normal.get("guessBtn").handlers.click();
  const english=normal.get("feedback").textContent;
  assert.match(english,/(North|South|East|West)/);
  assert.match(english,/[↑↗→↘↓↙←↖]/);
  normal.language("pt");
  const portuguese=normal.get("feedback").textContent;
  assert.match(portuguese,/(Norte|Nordeste|Leste|Sudeste|Sul|Sudoeste|Oeste|Noroeste)/);
  assert.match(portuguese,/[↑↗→↘↓↙←↖]/);
  assert.equal(normal.get("compassE").textContent,"L");
  assert.equal(normal.get("compassW").textContent,"O");
  const hard=boot({randomValue:0});hard.difficulty("hard");hard.get("freeBtn").handlers.click();
  hard.select("Oslo");hard.get("guessBtn").handlers.click();
  assert.doesNotMatch(hard.get("feedback").textContent,/[↑↗→↘↓↙←↖]/);
  assert.equal(hard.get("guessHistory").children[0].children[1].textContent.includes(" · "),false);
});
test("map buttons change engine without discarding the current investigation",async()=>{
  const g=boot({map:true}),$=g.get;
  g.get("freeBtn").handlers.click();
  g.select("Oslo");g.get("guessBtn").handlers.click();
  const originalCase=$("caseCode").textContent;
  const originalGuess=$("guessHistory").children.length;
  assert.equal($("mapVectorBtn").attributes["aria-pressed"],"true");
  await $("mapOsmBtn").handlers.click();
  assert.equal($("mapOsmBtn").attributes["aria-pressed"],"true");
  assert.equal($("mapVectorBtn").attributes["aria-pressed"],"false");
  assert.equal($("caseCode").textContent,originalCase);
  assert.equal($("guessHistory").children.length,originalGuess);
  assert.equal(JSON.parse(g.storage.get("geodetective-map-style")),"osm");
  await $("mapVectorBtn").handlers.click();
  assert.equal($("mapVectorBtn").attributes["aria-pressed"],"true");
  assert.equal($("caseCode").textContent,originalCase);
  assert.equal($("guessHistory").children.length,originalGuess);
  assert.equal(JSON.parse(g.storage.get("geodetective-map-style")),"vector");
});


test("map title bar reflects Normal and Hard difficulty",()=>{
  const g=boot(),bar=g.get("mapToolbar");
  assert.equal(bar.classList.contains("is-hard"),false);
  g.difficulty("hard");
  assert.equal(bar.classList.contains("is-hard"),true);
  g.difficulty("normal");
  assert.equal(bar.classList.contains("is-hard"),false);
  assert.match(files["index.html"],/id="mapToolbar"/);
  assert.match(files["index.html"],/aria-label="Cartigma on GitHub"/);
  assert.match(files["index.html"],/viewBox="0 0 24 24"/);
  assert.match(files["app.js"],/mapToolbar"\)\.classList\.toggle\("is-hard"/);
});


test("Cartigma map title includes localized difficulty and has a globe at its left",()=>{
  const g=boot(),bar=g.get("mapToolbar");
  assert.equal(g.get("mapTitle").textContent,"World map - Normal");
  assert.equal(bar.classList.contains("is-hard"),false);
  g.difficulty("hard");
  assert.equal(g.get("mapTitle").textContent,"World map - Hard");
  assert.equal(bar.classList.contains("is-hard"),true);
  g.language("pt");
  assert.equal(g.get("mapTitle").textContent,"Mapa mundial - Difícil");
  g.difficulty("normal");
  assert.equal(g.get("mapTitle").textContent,"Mapa mundial - Normal");
  assert.equal(bar.classList.contains("is-hard"),false);
  assert.match(files["index.html"],/class="map-title-globe"/);
  assert.match(files["index.html"],/aria-label="Cartigma home"/);
  assert.match(files["index.html"],/href="https:\/\/github\.com\/F404X\/cartigma"/);
  assert.match(files["app.js"],/const txt="Cartigma "/);
  assert.doesNotMatch(files["index.html"],/GeoDetective/i);
});

test("mobile completed-case dossier moves into lower scroller without covering map",()=>{
  const g=boot({map:true,mobile:true});
  g.get("freeBtn").handlers.click();
  g.select("Reykjavík");
  g.get("guessBtn").handlers.click();
  const report=g.get("reportDialog");
  assert.equal(report.open,true);
  assert.ok(g.mobileCase.children.includes(report));
  assert.equal(report.parentElement,g.mobileCase);
  assert.equal(report.scrolled,true,"case file should scroll into view below the map");
  report.handlers.click?.({});
  g.get("reportCloseBtn").handlers.click();
  assert.equal(report.open,false);
  g.get("reportOpenBtn").handlers.click();
  assert.equal(report.open,true);
});


test("repeatable country evidence is cached per language without distance computations",()=>{
  const g=boot(),$=g.get;
  const before=g.perf.distanceCalls;
  assert.equal(before,0,"Generating evidence no longer needs reference distances");
  $("revealBtn").handlers.click();
  assert.equal(g.perf.distanceCalls,before);
  $("dailyBtn").handlers.click();
  assert.equal(g.perf.distanceCalls,before);
  const english=revealAll(g);
  g.language("pt");
  assert.equal(g.perf.distanceCalls,before,"Translations do not need geodesic searches");
  assert.notDeepEqual(revealAll(g),english,"Clue text must react to language switches");
  g.language("en");
  assert.equal(g.perf.distanceCalls,before);
  assert.ok(files["app.js"].includes('const cacheKey=index+":"+level+":"+lang'));
  assert.ok(files["app.js"].includes('const countryPositions=[['));
  assert.ok(files["app.js"].includes('const geographic=['));
  assert.ok(files["app.js"].includes('extraCountryClues(index,level)'));
});

test("indexed city search handles accents and English aliases without changing result limits",()=>{
  const g=boot(),$=g.get,search=$("citySearch");
  function results(query){
    search.value=query;
    search.handlers.input({target:search});
    return $("suggestions").children.filter(x=>x.className==="suggestion").map(x=>x.textContent);
  }
  assert.ok(results("sao").some(name=>name.includes("São")),"Unaccented query should find cities with accents");
  assert.ok(results("tokyo").some(name=>name.includes("Tokyo")),"English city alias should be searchable");
  assert.ok(results("new york").some(name=>name.includes("New York")),"Multiword city alias should work");
  results("a");
  assert.equal($("suggestions").classList.contains("hidden"),true,"Short queries should hide suggestions without a new search");
  const many=results("bra");
  assert.ok(many.length<=5,"Keep the original five-local-result limit");
  g.language("pt");
  assert.ok(results("tokyo").some(name=>name.includes("Tóquio")),"Results must be translated at display time");
  assert.match(files["app.js"],/const LOCAL_SEARCH_INDEX = PLACES\.map/);
  assert.doesNotMatch(files["app.js"],/PLACES\.indexOf\(p\)/);
});
