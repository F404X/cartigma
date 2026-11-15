import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";

const root=new URL("../",import.meta.url);
const js=readFileSync(new URL("language-picker.js",root),"utf8");
const html=readFileSync(new URL("index.html",root),"utf8");
const css=readFileSync(new URL("styles.css",root),"utf8");
const mobileCss=readFileSync(new URL("mobile.css",root),"utf8");
const game=readFileSync(new URL("app.js",root),"utf8");
const deploy=readFileSync(new URL(".github/workflows/pages.yml",root),"utf8");

class Element {
  constructor(id=""){
    this.id=id;this.children=[];this.handlers={};this.attributes={};this.classes=new Set(["hidden"]);
    this.dataset={};this.style={};this.value="";this.textContent="";this.src="";this.focused=false;
    this.classList={
      add:k=>this.classes.add(k),
      remove:k=>this.classes.delete(k),
      contains:k=>this.classes.has(k),
      toggle:k=>this.classes.has(k)?this.classes.delete(k):this.classes.add(k)
    };
  }
  append(...items){this.children.push(...items)}
  replaceChildren(...items){this.children=items}
  addEventListener(k,fn){this.handlers[k]=fn}
  setAttribute(k,v){this.attributes[k]=v}
  focus(){this.focused=true}
  querySelector(selector){
    if(selector===".language-option")return this.children.find(item=>item.className?.startsWith("language-option"))||null;
    return null;
  }
  querySelectorAll(selector){
    if(selector===".language-option")return this.children.filter(item=>item.className?.startsWith("language-option"));
    return [];
  }
  dispatchEvent(evt){
    this.handlers[evt.type]?.(evt);
    return true;
  }
  contains(){return true}
}
function setup({mobile=false}={}){
  const ids=new Map();
  const document={
    readyState:"complete",
    documentElement:new Element("html"),
    getElementById(k){if(!ids.has(k))ids.set(k,new Element(k));return ids.get(k)},
    createElement(tag){return new Element(tag)},
    addEventListener(){}
  };
  const select=document.getElementById("langSelect");
  select.value="en";
  const window={matchMedia:()=>({matches:mobile})};
  class FakeEvent{constructor(type){this.type=type}}
  runInNewContext(js,{document,window,Event:FakeEvent,console});
  return {window,document,select,get:document.getElementById.bind(document)};
}

test("language picker has 19 selectable flag-bearing languages",()=>{
  const {window,get}=setup();
  assert.equal(window.GeoLanguagePicker.entries.length,19);
  assert.equal(get("languageOptions").children.length,19);
  for(const button of get("languageOptions").children){
    assert.equal(button.attributes.role,"option");
    const flag=button.children.find(item=>item.className==="language-option-flag");
    assert.ok(flag?.src?.startsWith("https://flagcdn.com/w40/"));
    assert.equal(flag.width,25);
    assert.equal(flag.height,18);
  }
  assert.match(html,/class="language-trigger"/);
  assert.match(html,/class="language-options"/);
  assert.match(html,/src="language-picker\.js"/);
  assert.match(deploy,/language-picker\.js/);
  assert.match(css,/\.language-option\.selected/);
  assert.match(game,/GeoLanguagePicker\?\.sync\(lang\)/);
});

test("click, search and keyboard select languages using the existing game change event",()=>{
  const {get,select}=setup();
  let changes=0;
  select.addEventListener("change",()=>{changes++});
  const trigger=get("languageTrigger"),search=get("languageSearch"),menu=get("languageMenu");
  trigger.handlers.click();
  assert.equal(menu.classList.contains("hidden"),false);
  assert.equal(trigger.attributes["aria-expanded"],"true");
  assert.equal(search.focused,true);
  search.value="Español";search.handlers.input();
  assert.equal(get("languageOptions").children.length,1);
  const choice=get("languageOptions").children[0];
  assert.equal(choice.dataset.lang,"es");
  choice.handlers.click();
  assert.equal(select.value,"es");
  assert.equal(changes,1);
  assert.equal(menu.classList.contains("hidden"),true);
  assert.equal(get("languageLabel").textContent,"Español");
  assert.ok(get("languageFlagImage").src.endsWith("/es.png"));
  trigger.handlers.click();
  search.value="japanese";search.handlers.input();
  search.handlers.keydown({key:"ArrowDown",preventDefault(){}});
  const japanese=get("languageOptions").children[0];
  assert.equal(japanese.focused,true);
  japanese.handlers.click();
  assert.equal(select.value,"ja");
  assert.equal(changes,2);
  assert.equal(get("languageLabel").textContent,"日本語");
});

test("picker updates selection when user preference is restored",()=>{
  const {window,get}=setup();
  window.GeoLanguagePicker.sync("pt");
  assert.equal(get("languageLabel").textContent,"Português");
  assert.ok(get("languageFlagImage").src.endsWith("/br.png"));
  assert.equal(get("languageFlag").textContent,"🇧🇷");
  const trigger=get("languageTrigger");
  trigger.handlers.click();
  const selected=get("languageOptions").children.find(x=>x.dataset.lang==="pt");
  assert.equal(selected.attributes["aria-selected"],"true");
  get("languageSearch").handlers.keydown({key:"Escape",preventDefault(){}});
  assert.equal(trigger.attributes["aria-expanded"],"false");
  assert.equal(trigger.focused,true);
});


test("phone language picker opens as a large centered dialog with scrim and close button",()=>{
  const {get,document,select}=setup({mobile:true});
  const trigger=get("languageTrigger"),menu=get("languageMenu"),
    backdrop=get("languageBackdrop"),close=get("languageCloseBtn");
  trigger.handlers.click();
  assert.equal(menu.classList.contains("hidden"),false);
  assert.equal(backdrop.classList.contains("hidden"),false);
  assert.equal(menu.attributes.role,"dialog");
  assert.equal(menu.attributes["aria-modal"],"true");
  assert.equal(menu.attributes["aria-labelledby"],"languageMenuHeading");
  assert.equal(trigger.attributes["aria-haspopup"],"dialog");
  assert.equal(document.documentElement.classList.contains("language-modal-open"),true);
  assert.equal(close.focused,true,"do not raise the software keyboard on opening");
  assert.equal(get("languageSearch").focused,false);
  assert.equal(get("languageOptions").children.length,19);
  get("languageSearch").value="portugues";
  get("languageSearch").handlers.input();
  assert.equal(get("languageOptions").children.length,1);
  assert.equal(get("languageOptions").children[0].dataset.lang,"pt");
  get("languageOptions").children[0].handlers.click();
  assert.equal(select.value,"pt");
  assert.equal(menu.classList.contains("hidden"),true);
  assert.equal(backdrop.classList.contains("hidden"),true);
  assert.equal(document.documentElement.classList.contains("language-modal-open"),false);
  assert.equal(trigger.attributes["aria-haspopup"],"listbox");
  trigger.handlers.click();
  close.handlers.click();
  assert.equal(menu.classList.contains("hidden"),true);
  trigger.handlers.click();
  backdrop.handlers.click();
  assert.equal(menu.classList.contains("hidden"),true);
  assert.equal(trigger.focused,true);
});

test("mobile language dialog is centered, uses most of screen and lists options in its own scroller",()=>{
  assert.match(html,/id="languageBackdrop"/);
  assert.match(html,/id="languageCloseBtn"/);
  assert.match(mobileCss,/\.language-picker \.language-menu:not\(\.hidden\)\{/);
  assert.match(mobileCss,/position:fixed;[\s\S]*?top:50%;[\s\S]*?left:50%;[\s\S]*?transform:translate\(-50%,-50%\)/);
  assert.match(mobileCss,/height:min\(78dvh,660px\)/);
  assert.match(mobileCss,/width:min\(92vw,450px\)/);
  assert.match(mobileCss,/\.language-picker \.language-backdrop:not\(\.hidden\)/);
  assert.match(mobileCss,/\.language-menu \.language-options\{[\s\S]*?overflow-y:auto;/);
  assert.match(mobileCss,/\.language-menu \.language-option\{[\s\S]*?min-height:52px;/);
  assert.match(mobileCss,/\.language-menu \.language-search-wrap input\{[\s\S]*?font-size:16px;/);
});
