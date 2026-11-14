import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const files = Object.fromEntries(["places.js","i18n.js","clues-i18n.js","app.js","index.html","styles.css"]
  .map(p=>[p,readFileSync(new URL("../"+p,import.meta.url),"utf8")]));
class Element {
  constructor(id=""){
    this.id=id;this.className="";this.textContent="";this.innerHTML="";this.value="";
    this.children=[];this.handlers={};this.disabled=false;this.dataset={};this.placeholder="";
    this.attributes={};this.style={setProperty(){}};
    this.classes=new Set();
    this.classList={
      add:k=>this.classes.add(k),remove:k=>this.classes.delete(k),
      toggle:(k,v)=>{const on=v===undefined?!this.classes.has(k):v;if(on)this.classes.add(k);else this.classes.delete(k);return on},
      contains:k=>this.classes.has(k)
    };
  }
  addEventListener(name,fn){this.handlers[name]=fn}
  setAttribute(key,value){this.attributes[key]=value}
  replaceChildren(...nodes){this.children=nodes}
  append(...nodes){this.children.push(...nodes)}
  querySelector(selector){if(selector==="button.suggestion")return this.children.find(x=>x.className==="suggestion")||null;return null}
  scrollIntoView(){}
  showModal(){}
  close(){}
  closest(){return null}
}
function boot(persisted=new Map()){
  const nodes=new Map(),window={};
  const document={
    readyState:"complete",documentElement:{lang:"en",dir:"ltr"},hidden:false,
    getElementById(id){if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id)},
    createElement(tag){return new Element(tag)},
    createTextNode(str){const el=new Element();el.textContent=str;return el},
    querySelectorAll(){return []},addEventListener(){},querySelector(){return new Element()}
  };
  const localStorage={
    getItem:k=>persisted.get(k)||null,
    setItem:(k,value)=>persisted.set(k,value)
  };
  const context={
    window,document,localStorage,navigator:{},
    Date,Math,String,Number,JSON,Map,Set,Intl,AbortController,console,
    clearTimeout(){},setTimeout(){return 0},
    fetch:async()=>({ok:true,json:async()=>({results:[]})})
  };
  for(const name of ["places.js","i18n.js","clues-i18n.js","app.js"])
    runInNewContext(files[name],context,{filename:name});
  const get=id=>document.getElementById(id);
  function select(name){
    get("citySearch").value=name;
    get("citySearch").handlers.input({target:get("citySearch")});
    const option=get("suggestions").children.find(x=>x.className==="suggestion"&&x.textContent===name) || get("suggestions").children.find(x=>x.className==="suggestion");
    assert.ok(option,"Missing city suggestion: "+name);
    option.handlers.click();
  }
  function setDifficulty(value){get("difficultySelect").handlers.change({target:{value}})}
  function setLanguage(value){get("langSelect").handlers.change({target:{value}})}
  return {get,window,document,localStorage,persisted,select,setDifficulty,setLanguage};
}

test("all location metadata matches 74 cities and every language has full translations",()=>{
  const g=boot();
  const places=g.window.GEODETECTIVE_PLACES;
  assert.equal(places.length,74);
  const langs=["en","pt","es","zh","ja","ru","fr","de","it","nl","pl","sv","tr","ar","he","ko","th","vi","id"];
  assert.deepEqual(Object.keys(g.window.GeoI18n.PACKS).sort(),langs.sort());
  for(const lang of langs){
    assert.equal(Object.keys(g.window.GeoI18n.PACKS[lang]).length,53);
    assert.equal(Object.keys(g.window.GeoCluesI18n[lang].features).length,18);
    assert.equal(Object.keys(g.window.GeoCluesI18n[lang].zones).length,6);
  }
});
test("starts in English with six attempts and visible side-by-side clues",()=>{
  const g=boot(),$=g.get;
  assert.equal(g.document.documentElement.lang,"en");
  assert.equal($("attemptCount").textContent,"6 / 6");
  assert.equal($("hintCount").textContent,"2 / 6");
  assert.equal($("clueList").children.length,6);
  assert.match($("caseTitle").textContent,/Unknown location/);
  assert.match(files["styles.css"],/grid-template-columns:minmax\(0,50%\) minmax\(0,50%\)/);
  assert.match(files["styles.css"],/height:100dvh/);
  assert.match(files["styles.css"],/overflow:hidden/);
  assert.doesNotMatch(files["index.html"],/como-jogar|EXPLORE\. DEDUCE\. DISCOVER\./);
});
test("three difficulties have 8, 6, and 4 guesses; country hint only on Easy",()=>{
  const g=boot(),$=g.get;
  g.setDifficulty("easy");
  assert.equal($("attemptCount").textContent,"8 / 8");
  assert.equal($("hintCount").textContent,"3 / 6");
  $("revealBtn").handlers.click();
  $("revealBtn").handlers.click();
  const easy=$("clueList").children.map(li=>li.children?.[1]?.textContent||"").join(" ");
  assert.match(easy,/Country \/ territory:/);
  g.setDifficulty("normal");
  assert.equal($("attemptCount").textContent,"6 / 6");
  for(let i=0;i<4;i++)$("revealBtn").handlers.click();
  const normal=$("clueList").children.map(li=>li.children?.[1]?.textContent||"").join(" ");
  assert.doesNotMatch(normal,/Country \/ territory:/);
  g.setDifficulty("hard");
  assert.equal($("attemptCount").textContent,"4 / 4");
  assert.equal($("hintCount").textContent,"1 / 6");
  for(let i=0;i<5;i++)$("revealBtn").handlers.click();
  const hard=$("clueList").children.map(li=>li.children?.[1]?.textContent||"").join(" ");
  assert.doesNotMatch(hard,/Country \/ territory:/);
});
test("switches among all 19 languages including RTL and localized clues",()=>{
  const g=boot(),$=g.get;
  for(const lang of Object.keys(g.window.GeoI18n.PACKS)){
    g.setLanguage(lang);
    assert.equal(g.document.documentElement.lang,g.window.GeoI18n.langNames[lang]);
    assert.equal(g.document.documentElement.dir,["ar","he"].includes(lang)?"rtl":"ltr");
    assert.equal($("citySearch").placeholder,g.window.GeoI18n.PACKS[lang].searchPlaceholder);
    assert.ok($("clueList").children[0].children[1].textContent.length>0);
  }
  g.setLanguage("en");
  assert.match($("caseTitle").textContent,/Unknown location/);
});
test("daily game persists independently for each difficulty",()=>{
  const g=boot(),$=g.get;
  g.select("London");
  $("guessBtn").handlers.click();
  assert.equal($("guessHistory").children.length,1);
  g.setDifficulty("hard");
  assert.equal($("guessHistory").children[0].textContent,"No guesses yet");
  g.setDifficulty("normal");
  assert.equal($("guessHistory").children.length,1);
  assert.ok(g.persisted.size>=2);
});
test("free play exact solution returns 5,000 points",()=>{
  const g=boot(),$=g.get;
  $("freeBtn").handlers.click();
  const match=$("caseCode").textContent.match(/#F-(\d+)/);
  assert.ok(match);
  const index=Number(match[1])-1;
  const place=g.window.GEODETECTIVE_PLACES[index];
  const display=place[0]==="Londres"?"London":place[0]==="Estocolmo"?"Stockholm":place[0];
  g.select(display);
  $("guessBtn").handlers.click();
  assert.equal($("resultCard").classList.contains("hidden"),false);
  assert.equal($("resultKicker").textContent,"Solved");
  assert.equal($("finalScore").textContent,"5,000");
  $("nextBtn").handlers.click();
  assert.equal($("guessHistory").children[0].textContent,"No guesses yet");
});
test("extra hints cost points and never exceed six clues",()=>{
  const g=boot(),$=g.get;
  for(let i=0;i<10;i++)$("revealBtn").handlers.click();
  assert.equal($("hintCount").textContent,"6 / 6");
  assert.equal($("revealBtn").disabled,true);
});
test("map uses keyless OpenStreetMap raster tiles",()=>{
  assert.match(files["app.js"],/tile\.openstreetmap\.org/);
  assert.doesNotMatch(files["app.js"],/basemaps\.cartocdn\.com/);
});
