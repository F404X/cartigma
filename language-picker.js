/* Accessible, keyboard-navigable language picker.
   Uses a flag in every option, not the OS-native select UI.
   The hidden #langSelect is retained as a compatibility bridge to the game. */
(() => {
  "use strict";
  const DATA = [
    ["en","English","us","🇺🇸","inglês english"],
    ["pt","Português","br","🇧🇷","portuguese portugués português"],
    ["es","Español","es","🇪🇸","spanish espanhol español"],
    ["zh","中文","cn","🇨🇳","chinese mandarim 中文 普通话"],
    ["ja","日本語","jp","🇯🇵","japanese japonês 日本語"],
    ["ru","Русский","ru","🇷🇺","russian russo русский"],
    ["fr","Français","fr","🇫🇷","french francês français"],
    ["de","Deutsch","de","🇩🇪","german alemão deutsch"],
    ["it","Italiano","it","🇮🇹","italian italiano"],
    ["nl","Nederlands","nl","🇳🇱","dutch holandês nederlands"],
    ["pl","Polski","pl","🇵🇱","polish polonês polski"],
    ["sv","Svenska","se","🇸🇪","swedish sueco svenska"],
    ["tr","Türkçe","tr","🇹🇷","turkish turco türkçe"],
    ["ar","العربية","sa","🇸🇦","arabic árabe العربية"],
    ["he","עברית","il","🇮🇱","hebrew hebraico עברית"],
    ["ko","한국어","kr","🇰🇷","korean coreano 한국어"],
    ["th","ไทย","th","🇹🇭","thai tailandês ไทย"],
    ["vi","Tiếng Việt","vn","🇻🇳","vietnamese vietnamita tiếng việt"],
    ["id","Bahasa Indonesia","id","🇮🇩","indonesian indonésio bahasa"]
  ];
  const $ = id => document.getElementById(id);
  let active="en";
  let ready=false;
  const strip=str=>str.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const SEARCH_INDEX=DATA.map(row=>({row,terms:strip(row.join(" "))}));
  function flagUrl(region){return "https://flagcdn.com/w40/"+region+".png";}
  const isMobile=()=>window.matchMedia?.("(max-width: 760px), (max-height: 540px) and (pointer: coarse)")?.matches===true;
  function isOpen(){return !$("languageMenu").classList.contains("hidden");}
  function open(){
    const mobile=isMobile();
    const menu=$("languageMenu"),trigger=$("languageTrigger");
    menu.classList.remove("hidden");
    trigger.setAttribute("aria-expanded","true");
    trigger.setAttribute("aria-haspopup",mobile?"dialog":"listbox");
    if(mobile){
      menu.setAttribute("role","dialog");
      menu.setAttribute("aria-modal","true");
      menu.setAttribute("aria-labelledby","languageMenuHeading");
      $("languageBackdrop").classList.remove("hidden");
      document.documentElement?.classList?.add("language-modal-open");
    }else{
      menu.removeAttribute?.("role");
      menu.removeAttribute?.("aria-modal");
      menu.removeAttribute?.("aria-labelledby");
    }
    $("languageSearch").value="";
    render("");
    // Avoid opening the mobile keyboard over the centered picker automatically.
    if(mobile)$("languageCloseBtn").focus();
    else $("languageSearch").focus();
  }
  function close(restoreFocus=false){
    $("languageMenu").classList.add("hidden");
    $("languageBackdrop").classList.add("hidden");
    document.documentElement?.classList?.remove("language-modal-open");
    $("languageTrigger").setAttribute("aria-expanded","false");
    $("languageTrigger").setAttribute("aria-haspopup","listbox");
    if(restoreFocus)$("languageTrigger").focus();
  }
  function sync(code){
    const entry=DATA.find(row=>row[0]===code)||DATA[0];
    active=entry[0];
    const label=$("languageLabel"),image=$("languageFlagImage"),emoji=$("languageFlag");
    if(label)label.textContent=entry[1];
    if(emoji)emoji.textContent=entry[3];
    if(image){
      image.style.display="";
      if(emoji)emoji.style.display="";
      image.src=flagUrl(entry[2]);
    }
    if(ready&&isOpen())render($("languageSearch").value);
  }
  function choose(code){
    if(!DATA.some(row=>row[0]===code))return;
    // Use the same change path that the app uses for persistence/map localization.
    const select=$("langSelect");
    select.value=code;
    select.dispatchEvent(new Event("change",{bubbles:true}));
    sync(code);
    close(true);
  }
  function moveOption(current,delta){
    const options=[...$("languageOptions").querySelectorAll(".language-option")];
    if(!options.length)return;
    const i=options.indexOf(current);
    options[(i+delta+options.length)%options.length].focus();
  }
  function buildOption(entry){
    const [code,name,region,flag]=entry;
    const button=document.createElement("button");
    button.type="button";
    button.className="language-option"+(code===active?" selected":"");
    button.dataset.lang=code;
    button.setAttribute("role","option");
    button.setAttribute("aria-selected",String(code===active));
    const image=document.createElement("img");
    image.src=flagUrl(region);image.alt="";image.loading="lazy";
    image.width=25;image.height=18;image.className="language-option-flag";
    const fallback=document.createElement("span");
    fallback.className="language-option-emoji";fallback.textContent=flag;
    image.addEventListener("error",()=>{image.style.display="none";fallback.style.display="inline-flex";});
    const text=document.createElement("span");
    text.className="language-option-name";text.textContent=name;
    const short=document.createElement("span");
    short.className="language-option-code";short.textContent=code.toUpperCase();
    button.append(image,fallback,text,short);
    button.addEventListener("click",()=>choose(code));
    button.addEventListener("keydown",event=>{
      if(event.key==="ArrowDown"||event.key==="ArrowUp"){
        event.preventDefault();moveOption(button,event.key==="ArrowDown"?1:-1);
      }else if(event.key==="Home"||event.key==="End"){
        event.preventDefault();
        const opts=$("languageOptions").querySelectorAll(".language-option");
        const target=event.key==="Home"?opts[0]:opts[opts.length-1];
        if(target)target.focus();
      }else if(event.key==="Escape"){event.preventDefault();close(true);}
    });
    return button;
  }
  function render(query){
    const q=strip(query);
    const found=SEARCH_INDEX.filter(({terms})=>terms.includes(q)).map(({row})=>row);
    const box=$("languageOptions");
    box.replaceChildren(...found.map(buildOption));
    if(!found.length){
      const empty=document.createElement("div");
      empty.className="language-empty";empty.textContent="No results / Nenhum resultado";
      box.append(empty);
    }
  }
  function init(){
    if(ready)return;
    ready=true;
    const trigger=$("languageTrigger"),search=$("languageSearch"),picker=$("languagePicker");
    if(!trigger||!search||!picker)return;
    $("languageFlagImage").addEventListener("error",()=>{
      $("languageFlagImage").style.display="none";
      $("languageFlag").style.display="inline-flex";
    });
    trigger.addEventListener("click",()=>isOpen()?close():open());
    $("languageCloseBtn").addEventListener("click",()=>close(true));
    $("languageBackdrop").addEventListener("click",()=>close(true));
    trigger.addEventListener("keydown",event=>{
      if(event.key==="ArrowDown"||event.key==="Enter"||event.key===" "){
        event.preventDefault();if(!isOpen())open();
      }else if(event.key==="Escape"){close();}
    });
    search.addEventListener("input",()=>render(search.value));
    search.addEventListener("keydown",event=>{
      if(event.key==="Escape"){event.preventDefault();close(true);}
      if(event.key==="ArrowDown"||event.key==="Enter"){
        const first=$("languageOptions").querySelector(".language-option");
        if(first){event.preventDefault();first.focus();}
      }
    });
    document.addEventListener("pointerdown",event=>{
      if(isOpen()&&!picker.contains(event.target))close();
    });
    document.addEventListener("keydown",event=>{
      if(!isOpen())return;
      if(event.key==="Escape"){event.preventDefault?.();close(true);return;}
      if(event.key!=="Tab"||!isMobile())return;
      const options=[...$("languageOptions").querySelectorAll(".language-option")];
      const focusable=[$("languageCloseBtn"),$("languageSearch"),...options];
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&document.activeElement===first){
        event.preventDefault();last.focus();
      }else if(!event.shiftKey&&document.activeElement===last){
        event.preventDefault();first.focus();
      }
    });
    sync($("langSelect").value||"en");
    render("");
  }
  window.GeoLanguagePicker={init,sync,entries:DATA.map(row=>row.slice(0,4))};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();