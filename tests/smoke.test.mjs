import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const names=["places.js","references.js","i18n.js","clues-i18n.js","report-i18n.js","facts.js","compass-i18n.js","app.js","index.html","styles.css","map-bootstrap.js"];
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
function boot({storage=new Map(),map=false,randomValue=0,mobile=false}={}){
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
    getCanvas(){return mapState.canvas},
    addControl(){return this},
    getStyle(){return {layers:[
      {id:"label_country_1",type:"symbol",layout:{"text-field":["get","name"]}},
      {id:"label_city",type:"symbol",layout:{"text-field":["get","name"]}},
      {id:"road_shield",type:"symbol",layout:{"text-field":["get","ref"]}}
    ]}},
    setLayoutProperty(id,key,expr){mapState.styles.push({id,key,expr})},
    setLayerZoomRange(id,min,max){mapState.zoomRanges.push({id,min,max})},
    easeTo(options){mapState.eases.push(options);return this},
    fitBounds(bounds,options){mapState.fits.push({bounds,options});return this},
    getZoom(){return 3},
    getCenter(){return {lng:8,lat:15}},
    remove(){mapState.removed=(mapState.removed||0)+1},
    getLayer(id){return mapState.layers.get(id)||null},
    removeLayer(id){mapState.layers.delete(id)},
    addLayer(layer){mapState.layers.set(layer.id,layer)},
    getSource(id){return mapState.sources.get(id)||null},
    removeSource(id){mapState.sources.delete(id)},
    addSource(id,source){mapState.sources.set(id,source)}
  };
  const libre={
    supported(){return true},
    Map:class{constructor(){return mapInstance}},
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
    window,document,localStorage,navigator:{},Math:math,Number,String,Array,Set,Map,JSON,Date,Intl,
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
function clueTexts(g){
  return g.get("clueList").children.map(row=>row.children[1].children[1].textContent);
}
function makeWrong(g,tries,name){
  for(let i=0;i<tries;i++){g.select(name);g.get("guessBtn").handlers.click()}
}

test("city catalogue, trivia and report translations remain aligned",()=>{
  const g=boot();
  assert.equal(g.window.GEODETECTIVE_PLACES.length,74);
  assert.equal(g.window.GEODETECTIVE_FACTS.length,74);
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

test("national-capital evidence marks Taipei correctly and keeps non-capitals distinct",()=>{
  const all=boot().window.GEODETECTIVE_PLACES;
  for(const [name,isCapital] of [["Taipé",true],["Brasília",true],["Goiânia",false]]){
    const index=all.findIndex(p=>p[0]===name);
    assert.ok(index>=0,"Missing city "+name);
    const g=boot({randomValue:(index+0.25)/all.length});
    g.get("freeBtn").handlers.click();
    g.language("pt");
    g.get("revealBtn").handlers.click();
    assert.equal(clueTexts(g)[2],"Capital nacional: "+(isCapital?"Sim":"Não"),name);
  }
  const capitalNames=files["app.js"].match(/const CAPITALS = new Set\\("([^"]+)"\\.split\\("\\|"\\)\\)/)?.[1]?.split("|");
  assert.ok(capitalNames?.includes("Taipé"));
  assert.ok(capitalNames?.includes("Cidade do Cabo"),"Cape Town is South Africa's legislative capital");
});

test("Normal and Hard are the only modes and both have six translated clues",()=>{
  const g=boot(),$=g.get;
  assert.doesNotMatch(files["index.html"],/value="easy"/);
  assert.equal($("attemptCount").textContent,"6 / 6");
  assert.equal($("hintCount").textContent,"2 / 6");
  assert.equal(clueTexts(g).length,6);
  assert.equal(g.document.documentElement.lang,"en");
  g.difficulty("hard");
  assert.equal($("attemptCount").textContent,"4 / 4");
  assert.equal($("hintCount").textContent,"1 / 6");
  for(let i=0;i<5;i++)$("revealBtn").handlers.click();
  assert.equal($("hintCount").textContent,"6 / 6");
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
  const index=hash("GEODETECTIVE-v3|"+day+"|normal")%g.window.GEODETECTIVE_PLACES.length;
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
  assert.equal($("reportEvidenceList").children.length,6);
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
  assert.equal(p.length,74);
  for(let i=0;i<p.length;i++){
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
  assert.ok(g.mapState.styles.every(x=>x.id!=="road_shield"));
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


test("distance clues adapt to geography; never use a fixed 1,000 km limit",()=>{
  const samples=[
    [8,"Paris","europe"],[13,"Marrakech","africa"],
    [33,"Tóquio","asia"],[49,"Papeete","oceania"],
    [51,"Nova York","northAmerica"],[65,"Goiânia","southAmerica"]
  ];
  const radiusBase={europe:2000,africa:2600,asia:2700,
    oceania:2500,northAmerica:2500,southAmerica:2300};
  const places=boot().window.GEODETECTIVE_PLACES;
  const regionFor=i=>i<=12?"europe":i<=20?"africa":i<=41?"asia"
    :i<=49?"oceania":i<=58?"northAmerica":"southAmerica";
  const radius=(i,level)=>{
    const base=radiusBase[regionFor(i)],origin=[places[i][3],places[i][4]];
    const others=places.map((p,j)=>({j,km:distanceKm(origin,[p[3],p[4]])}))
      .filter(x=>x.j!==i&&regionFor(x.j)===regionFor(i))
      .sort((a,b)=>a.km-b.km);
    const local=others[Math.min(2,others.length-1)].km;
    return Math.round(Math.min(6000,Math.min(5200,Math.max(base,.55*base+.65*local))
      *(level==="hard"?1.2:1))/100)*100;
  };
  const observed=[];
  for(const [i,name,region] of samples){
    const g=boot({randomValue:i/places.length});
    g.get("freeBtn").handlers.click();
    // Two initial clues, two additional reveals; distance is clue four.
    g.get("revealBtn").handlers.click();
    g.get("revealBtn").handlers.click();
    const text=g.get("clueList").children[3].children[1].children[1].textContent;
    const m=text.match(/Around ([\d,]+) km from (.+)/);
    assert.ok(m,name+" should have a translated numeric distance clue: "+text);
    const km=Number(m[1].replaceAll(",",""));
    assert.ok(km>0&&km<=radius(i,"normal"),name+" has distance outside regional cap");
    assert.ok(km%100===0,name+" should use rounded distances");
    observed.push({name,region,km,cap:radius(i,"normal"),reference:m[2]});
  }
  assert.ok(new Set(observed.map(x=>x.cap)).size>=4,"Several regions must have different radii");
  assert.ok(observed.find(x=>x.name==="Marrakech").cap>observed.find(x=>x.name==="Paris").cap);
  assert.ok(observed.find(x=>x.name==="Papeete").cap>observed.find(x=>x.name==="Paris").cap);
  assert.ok(observed.some(x=>x.km>1000),"At least one clue must reach beyond the former fixed cap");
  assert.doesNotMatch(observed.find(x=>x.name==="Marrakech").reference,/New York/i);
});

test("Hard mode uses a wider local radius and coarser distance approximation",()=>{
  const i=13,places=boot().window.GEODETECTIVE_PLACES;
  const normal=boot({randomValue:i/places.length});
  normal.get("freeBtn").handlers.click();
  for(let j=0;j<2;j++)normal.get("revealBtn").handlers.click();
  const hard=boot({randomValue:i/places.length});
  hard.difficulty("hard");
  hard.get("freeBtn").handlers.click();
  for(let j=0;j<3;j++)hard.get("revealBtn").handlers.click();
  const hardText=hard.get("clueList").children[3].children[1].children[1].textContent;
  const hardDistance=Number(hardText.match(/Around ([\d,]+) km from /)?.[1].replaceAll(",",""));
  assert.ok(Number.isFinite(hardDistance));
  assert.equal(hardDistance%500,0,"Hard distance in a large region must be rounded to 500 km");
  assert.match(files["app.js"],/level==="hard"\?1\.2:1/);
  assert.doesNotMatch(
    hard.get("clueList").children[4].children[1].children[1].textContent,
    /Nearest catalog city:/,
    "Fifth clue should no longer reveal the nearest catalog city"
  );
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
    if(hemisphere!==-1){hemisphereUsed++;assert.ok(hemisphere<continent,places[i][0]+" hemisphere follows continent");}
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


test("repeated clue renders reuse geographic calculations and switch cache by language",()=>{
  const g=boot(),$=g.get;
  const before=g.perf.distanceCalls;
  assert.ok(before>20,"Initial investigation needs geographic distances");
  $("revealBtn").handlers.click();
  assert.equal(g.perf.distanceCalls,before,"Revealing a clue should not recalculate all regional distances");
  $("dailyBtn").handlers.click();
  assert.equal(g.perf.distanceCalls,before,"Reopening the same case should reuse immutable clues");
  const english=clueTexts(g);
  g.language("pt");
  const translated=g.perf.distanceCalls;
  assert.ok(translated>before,"A different language needs its own translated clue cache");
  assert.notDeepEqual(clueTexts(g),english,"Localized text must still update");
  g.language("en");
  assert.equal(g.perf.distanceCalls,translated,"Returning to a cached language should not repeat calculations");
  assert.match(files["app.js"],/const cacheKey=index\+":"\+level\+":"\+lang/);
  assert.match(files["app.js"],/anchorDistances\(index,level,radius\)/);
  assert.match(files["app.js"],/regionFormatters\.get\(language\)/);
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
