/* Cartigma — game engine · no framework, no account, no API key. */
(() => {
  "use strict";
  // One entry per country. Reference coordinates are geographic centroids,
  // never hidden city answers or additional city database records.
  const COUNTRIES=window.CartigmaCountries||[];
  const COUNTRY_REFS=COUNTRIES.map(c=>[c.name,c.name,c.continent,c.lat,c.lng]);
  const TRANSLATIONS = window.GeoI18n?.PACKS || {};
  const CLUE_I18N = window.GeoCluesI18n || {};
  const COUNTRY_INSIGHTS = window.GeoCountryInsights || {};
  const CLUE_ENGINE = window.CartigmaClueEngine;
  if(!CLUE_ENGINE)throw new Error("Shared clue engine was not loaded");
  const COUNTRY_CLUE_I18N = window.GeoCountryClueI18n || {};
  const CURRENCY_DENOMINATIONS = window.GeoCurrencyDenominations || {};
  const ATLAS_I18N = window.CartigmaAtlasI18n || {};
  const COUNTRY_FAMILIES_PT = window.GeoCountryLanguageFamiliesPT || {};
  const FILTER_TRANSLATIONS = window.GeoMapFilterLabels || {};
  const LANGS = window.GeoI18n?.langNames || {};
  const REPORT_I18N = window.GeoReportI18n || {};
  const COMPASS_I18N = window.GeoCompassI18n || {};
  const CONTINENT_BORDERS = window.GeoContinentBorders || {};
  const {DIFFICULTIES,RULES_VERSION,RUSH_DURATION_MS,RUSH_CLUE_INTERVAL_MS}=CLUE_ENGINE;
  const SERIAL_PREFIX = "geodetective-case-counter-";
  const EVIDENCE_COUNT = CLUE_ENGINE.MAX_CLUES;
  const HINT_COST = 300, DAILY_KEY = "cartigma-country-daily-v7-";
  // 300 is preserved only for loading older saved games. New charges reflect
  // information gain; the price for the NEXT clue is always shown before purchase.
  // Overlay costs differ by how tightly each display constrains the target.
  const MAP_OVERLAY_COSTS=CLUE_ENGINE.OVERLAY_PRICES;
  const overlayCost=(key)=>CLUE_ENGINE.overlayCost(key,difficulty);
  // Europe and North America are fully/almost entirely in the Northern
  // Hemisphere. The others have meaningful populations on BOTH sides of 0°.
  const COUNTRY_CODES=COUNTRIES.map(c=>c.code);
  const $ = id => document.getElementById(id);
  const hash = input => {let h=2166136261;for(const char of input){h ^=char.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0;};
  const norm = s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const DIRECTION_ARROWS=Object.freeze(["↑","↗","→","↘","↓","↙","←","↖"]);
  const direction = idx => {
    const labels=COMPASS_I18N[lang]?.names||COMPASS_I18N.en?.names||["N","NE","E","SE","S","SW","W","NW"];
    return labels[idx]+" "+DIRECTION_ARROWS[idx];
  };
  const today = () => new Date().toISOString().slice(0,10);
  const store = {
    get(k){try{return JSON.parse(localStorage.getItem(k))}catch{return null}},
    set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
  };
  const savedLang = store.get("geodetective-language");
  let lang = typeof savedLang === "string" && TRANSLATIONS[savedLang] ? savedLang : "en";
  const savedDifficulty = store.get("geodetective-difficulty");
  let difficulty = DIFFICULTIES[savedDifficulty] ? savedDifficulty : "normal";
  let game=null,selected=null,map=null,marker=null,guessMarkers=[],resultMarker=null;
  let markerCase=null,markerMap=null;
  let mapStyleReady=false, lastDragAt=0, pointerDown=null, pointerMoved=false;
  let fallbackSwitching=false, mapStyleTimeout=null, mapSwitching=false, mapPointerController=null;
  let activeMapStyle=window.maplibregl?.isFallback?"osm":"vector";
  let toastTimer = null;
  let rushCountryRequest=0, countryShapesPromise=null;
  // Mobile-only compact evidence and hypothesis windows.
  let mobilePanel="clues";
  function isMobileScreen(){
    return window.matchMedia?.(
      "(max-width: 760px), (max-height: 540px) and (pointer: coarse)"
    )?.matches===true;
  }
  function syncMobilePanels(){
    if(!game)return;
    const mobile=isMobileScreen();
    const waiting=!game.started&&!game.finished;
    // A finished case is still explorable: the map, evidence and complete
    // guess history must remain accessible after closing the final report.
    const active=mobile&&!waiting?mobilePanel:null;
    $("mobilePanelTabs").classList.toggle("finished",game.finished);
    $("mobileReportBtn").hidden=!game.finished;
    $("mobileReportBtn").disabled=!game.finished;
    $("mobileReportBtn").setAttribute("aria-label",t("openReport"));
    $("mobileGuessPanel").classList.toggle("mobile-case-finished",game.finished);
    for(const [kind,panelId,buttonId] of [
      ["clues","mobileEvidencePanel","mobileEvidenceBtn"],
      ["guess","mobileGuessPanel","mobileGuessBtn"]
    ]){
      const panel=$(panelId),button=$(buttonId),open=active===kind;
      panel.classList.toggle("mobile-open",open);
      button.classList.toggle("active",open);
      button.setAttribute("aria-expanded",String(open));
      button.disabled=waiting;
      if(mobile)panel.setAttribute("aria-hidden",String(!open));
      else panel.removeAttribute?.("aria-hidden");
    }
    $("mobileEvidencePreview").textContent=
      (waiting?0:game.revealed)+" / "+(waiting?EVIDENCE_COUNT:
        game.ranked?(game.rankedClueCount||EVIDENCE_COUNT):
          cluesFor(game.index,difficulty).length);
    $("mobileGuessPreview").textContent=
      game.guesses.length+" / "+(isRush()?"∞":maximum());
    if(active==="clues"){
      // The list is rebuilt as time-based Rush clues unlock. Follow the
      // newest unlocked evidence only within the open mobile popover;
      // never scroll the page or affect the full-size desktop dossier.
      const list=$("clueList"),currentCase=game;
      const scrollNewest=()=>{
        if(game!==currentCase||!isMobileScreen()||mobilePanel!=="clues")return;
        // Align the complete last unlocked card inside the list's own
        // scrolling viewport. Never scroll the map, page or outer popup.
        const latest=Array.from(list.children).find(row=>
          row.classList.contains("latest"));
        if(!latest)return;
        const viewport=list.getBoundingClientRect?.();
        const card=latest.getBoundingClientRect?.();
        if(viewport?.height>0&&card?.height>0){
          const bottomOverlap=card.bottom-(viewport.bottom-12);
          if(bottomOverlap>0)list.scrollTop+=bottomOverlap;
          if(card.height<=viewport.height-12&&card.top<viewport.top)
            list.scrollTop+=card.top-viewport.top;
        }else if(Number.isFinite(list.scrollHeight)){
          // Older browsers and the mock DOM use ordinary scroll metrics.
          list.scrollTop=list.scrollHeight;
        }
      };
      if(typeof requestAnimationFrame==="function")requestAnimationFrame(scrollNewest);
      else scrollNewest();
    }
  }
  function setMobilePanel(panel){
    if(!isMobileScreen()||!game)return;
    if(!game.started&&!game.finished)return;
    mobilePanel=mobilePanel===panel?null:panel;
    syncMobilePanels();
  }
  let suggestionOptions=[],activeSuggestionIndex=0;
  const regionFormatters = new Map();
  const currencyFormatters = new Map();
  const clueCache = new Map();

  function t(key, variables={}) {
    const template = REPORT_I18N[lang]?.[key] ?? TRANSLATIONS[lang]?.[key] ?? REPORT_I18N.en?.[key] ?? TRANSLATIONS.en?.[key] ?? key;
    return template.replace(/\{(\w+)\}/g,(_,name)=>String(variables[name]??""));
  }
  function tc(key,variables={}) {
    const template = CLUE_I18N[lang]?.templates?.[key] ??
      COUNTRY_CLUE_I18N[lang]?.[key] ??
      CLUE_I18N.en?.templates?.[key] ??
      COUNTRY_CLUE_I18N.en?.[key] ?? key;
    return template.replace(/\{(\w+)\}/g,(_,name)=>String(variables[name]??""));
  }
  // Region label and reference-point label for the same locales as the map.
  const GEOGRAPHY_LABELS={
    en:["Subregion","country reference point"],
    pt:["Sub-região","ponto de referência do país"],
    es:["Subregión","punto de referencia del país"],
    zh:["次区域","国家参考点"],
    ja:["小地域","国の基準点"],
    ru:["Субрегион","опорная точка страны"],
    fr:["Sous-région","point de référence du pays"],
    de:["Unterregion","Referenzpunkt des Landes"],
    it:["Sottoregione","punto di riferimento del paese"],
    nl:["Subregio","referentiepunt van het land"],
    pl:["Podregion","punkt odniesienia kraju"],
    sv:["Delregion","landets referenspunkt"],
    tr:["Alt bölge","ülkenin referans noktası"],
    ar:["المنطقة الفرعية","النقطة المرجعية للبلد"],
    he:["תת־אזור","נקודת הייחוס של המדינה"],
    ko:["하위 지역","국가 기준점"],
    th:["อนุภูมิภาค","จุดอ้างอิงของประเทศ"],
    vi:["Tiểu vùng","điểm tham chiếu của quốc gia"],
    id:["Subwilayah","titik acuan negara"]
  };
  const DEDUCTION_TEXT={
    en:{
      guessFeedback:"From your guess to the answer: {value}",
      alreadyGuessed:"You already tried this country.",
      playOffline:"Play offline",rankUnavailable:"Ranked play is unavailable. Try again or play offline.",
      rankedAttempt:"Daily and Freeplay share one ranked attempt per difficulty each UTC day.",
      practice:"Practice"
    },
    pt:{
      guessFeedback:"Do seu palpite até a resposta: {value}",
      alreadyGuessed:"Você já tentou esse país.",
      playOffline:"Jogar offline",rankUnavailable:"Ranqueada indisponível. Tente de novo ou jogue offline.",
      rankedAttempt:"O Caso do dia e o Jogo livre compartilham uma tentativa ranqueada por dificuldade a cada dia UTC.",
      practice:"Treino"
    }
  };
  function deductionText(key,variables={}){
    const template=DEDUCTION_TEXT[lang]?.[key]||DEDUCTION_TEXT.en[key];
    return template.replace(/\{(\w+)\}/g,(_,name)=>String(variables[name]??""));
  }
  function locale() {return LANGS[lang] || "en";}
  function number(value){return Math.round(value).toLocaleString(locale())}
  // Each published inequality is strictly true for the source value. The
  // threshold is deliberately rounded and 11–21% away from that value.
  function displayRegion(code){
    try{
      const language=locale();
      let formatter=regionFormatters.get(language);
      if(!formatter){
        formatter=new Intl.DisplayNames([language],{type:"region"});
        regionFormatters.set(language,formatter);
      }
      return formatter.of(code);
    }catch{return code}
  }
  // Names use CLDR in the selected language. The source dataset supplies
  // descriptive English fallbacks for browsers without currency-name support.
  function currencyName(code,fallbackName=""){
    if(!code)return "";
    try{
      const language=locale();
      let formatter=currencyFormatters.get(language);
      if(!formatter){
        formatter=new Intl.DisplayNames([language],{type:"currency",fallback:"none"});
        currencyFormatters.set(language,formatter);
      }
      const localized=formatter.of(code);
      if(typeof localized==="string"&&localized.trim()&&localized!==code)
        return localized;
    }catch(error){/* Currency display names are not supported everywhere. */}
    return fallbackName||code;
  }
  function currencyClueName(code,fallbackName=""){
    // Currency hints intentionally reveal only the monetary denomination:
    // USD/CAD/AUD -> dollar, ARS/MXN -> peso, BRL -> real, etc.
    // The country profile still uses currencyName() for precise CLDR names.
    const family=CURRENCY_DENOMINATIONS.codes?.[code];
    return (family&&(CURRENCY_DENOMINATIONS.labels?.[lang]?.[family]||
      CURRENCY_DENOMINATIONS.labels?.en?.[family]))||
      currencyName(code,fallbackName);
  }

  function countryName(index){return displayRegion(COUNTRY_CODES[index])}
  function continentKey(index){return CLUE_ENGINE.clueContinent(COUNTRIES[index])}
  function continentName(index){
    const labels=CLUE_I18N[lang]?.continents||CLUE_I18N.en?.continents||{};
    if(COUNTRY_CODES[index]==="TR")
      return [labels.europe||"Europe",labels.asia||"Asia"].join(" / ");
    const key=continentKey(index);
    return labels[key]||CLUE_I18N.en?.continents?.[key]||key;
  }
  function updateCompassRose(){
    const pack=COMPASS_I18N[lang]||COMPASS_I18N.en;
    if(!pack)return;
    for(const [i,id] of ["compassN","compassE","compassS","compassW"].entries()){
      const node=$(id);
      if(node){node.textContent=pack.rose[i];node.title=pack.names[i*2];}
    }
    const node=$("compassRose");
    if(node)node.setAttribute("aria-label",pack.names.filter((_,i)=>i%2===0).join(" · "));
    const btn=$("mapVectorBtn");
    if(btn)btn.textContent=pack.vector;
    const buttons=$("mapStylePicker");
    if(buttons)buttons.setAttribute("aria-label",pack.mapStyle);
  }
  function countryAt(index){return COUNTRY_REFS[index]}
  function cluesFor(index,level,version=game?.evidenceVersion??RULES_VERSION){
    const country=COUNTRIES[index];
    if(!country)throw Error("Unknown country "+index);
    const key=country.code+":"+level+":"+version;
    if(!clueCache.has(key)){
      clueCache.set(key,CLUE_ENGINE.buildClues(country,COUNTRY_INSIGHTS[country.code],
        level,CURRENCY_DENOMINATIONS,COUNTRIES,version));
    }
    return clueCache.get(key);
  }
  // Format canonical clue descriptors locally. Ranked API never needs to
  // reveal a target country code or choose a different translation.
  function clueText(clue){
    if(!clue)return "";
    if(clue.key==="continent"){
      const labels=CLUE_I18N[lang]?.continents||CLUE_I18N.en?.continents||{};
      const names=(clue.continents||[]).map(key=>labels[key]||
        CLUE_I18N.en?.continents?.[key]||key);
      return tc("continent",{value:names.join(" / ")});
    }
    if(clue.key==="hemisphere")
      return tc("hemisphere",{value:tc(clue.hemisphere)});
    const [subregionLabel,referenceLabel]=GEOGRAPHY_LABELS[lang]||GEOGRAPHY_LABELS.en;
    if(clue.key==="countrySubregion")return subregionLabel+": "+displayRegion(clue.region);
    if(clue.key==="longitude"&&clue.reference)return tc("longitude",clue)+" ("+referenceLabel+")";
    if(clue.key==="countryAreaBand"){
      const comparison=clue.min===0?"<":clue.max===null?"≥":"";
      const value=clue.min===0?number(clue.max):clue.max===null?number(clue.min):
        number(clue.min)+"–"+number(clue.max);
      return tc("countryArea",{comparison,value}).replace(/ {2,}/g," ");
    }
    if(clue.key==="countryLandlocked")
      return tc(clue.landlocked?"countryLandlockedYes":"countryLandlockedNo");
    const props={...clue};
    if(clue.key==="countryCurrency"&&clue.family)
      props.name=CURRENCY_DENOMINATIONS.labels?.[lang]?.[clue.family]||
        CURRENCY_DENOMINATIONS.labels?.en?.[clue.family]||clue.name;
    if(clue.key==="countryLanguageFamily")
      props.family=lang==="pt"?(COUNTRY_FAMILIES_PT[clue.family]||clue.family):
        clue.family;
    if(clue.key==="countryFlagColor")
      props.color=COUNTRY_CLUE_I18N[lang]?.colors?.[clue.color]||
        COUNTRY_CLUE_I18N.en?.colors?.[clue.color]||clue.color;
    if(["countryPopulation","countryGDP","countryArea"].includes(clue.key))
      props.value=number(clue.value);
    return tc(clue.key,props);
  }
  function maximum(){return DIFFICULTIES[difficulty].attempts}
  // Each UTC date is independently seeded: the same country may reappear
  // on subsequent dates. No elimination-style daily cycle is exposed.
  function dailyIndex(level=difficulty){
    return hash("cartigma-country-daily-v6:"+today()+":"+level)%COUNTRIES.length;
  }
  function dailyStorageKey(level=difficulty){return DAILY_KEY+today()+"-"+level}
  // Finished daily cases cannot be replayed, whether solved or closed after
  // exhausting guesses. Suggest only the alternate difficulty still playable.
  function otherDailyAvailable(level){
    const saved=store.get(dailyStorageKey(level));
    return !(saved?.mode==="daily"&&saved.date===today()&&
      saved.difficulty===level&&saved.index===dailyIndex(level)&&saved.finished===true);
  }
  function nextCaseNumber(date=today()){
    const key=SERIAL_PREFIX+date;
    const previous=Number(store.get(key))||0;
    const count=Math.max(0,previous)+1;
    store.set(key,count);
    return count;
  }
  function newGame(mode,index) {
    return {mode,index,difficulty,date:today(),serial:nextCaseNumber(),guesses:[],
      started:false,
      startedAt:null,endedAt:null,durationMs:null,
      revealed:0,penalty:0,paidHints:0,
      sectorMapPenalty:0,sectorReveals:[],evidenceVersion:RULES_VERSION,targetKind:"country",
      finished:false,won:false,score:0};
  }
  function isRush(){return difficulty==="rush"}
  function isCountryGame(){return isRush()||game?.targetKind==="country"}
  function caseCode(){
    return "#"+difficulty[0].toUpperCase()+"-"+game.date.replaceAll("-","")+"-"+String(game.serial).padStart(2,"0");
  }
  function elapsedMs(){
    if(!game)return 0;
    if(game.finished&&Number.isFinite(game.durationMs))return game.durationMs;
    if(isRush()&&!game.started)return 0;
    return Math.max(0,Date.now()-(game.clockStart??game.startedAt??Date.now()));
  }
  function formatElapsed(ms){
    const seconds=Math.floor(Math.max(0,ms)/1000);
    const minutes=Math.floor(seconds/60),hours=Math.floor(minutes/60);
    return (hours?String(hours).padStart(2,"0")+":":"")+
      String(minutes%60).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
  }
  function guessTimestamp(g){
    const stamp=Date.parse(g.at);
    const clock=Number.isFinite(stamp)?new Date(stamp).toLocaleTimeString(locale(),{
      hour:"2-digit",minute:"2-digit",second:"2-digit"}):"";
    return clock+(Number.isFinite(g.elapsedMs)?" · +"+formatElapsed(g.elapsedMs):"");
  }
  function rushRemaining(){
    return !game?.started?RUSH_DURATION_MS:Math.max(0,RUSH_DURATION_MS-elapsedMs());
  }
  // All three modes use the existing Rush map start gate. A signed-in
  // player's first attempt is automatically verified and saved by the API.
  function startCase(offline=false){
    if(!game||game.finished||game.started||game.pending)return;
    const current=game;
    const startOffline=()=>{
      current.started=true;
      current.rankError=null;
      current.practice=Boolean(window.CartigmaRanking?.mayRank?.());
      current.startedAt=Date.now();
      current.revealed=DIFFICULTIES[difficulty].initial;
      mobilePanel="clues";
      rushCountryRequest++;
      save();render();clockTick();
    };
    // Preserve instant offline play and existing Rush behavior; only a
    // remembered signed-in account needs a network round-trip.
    if(offline||!window.CartigmaRanking?.mayRank?.()){
      startOffline();
      return;
    }
    current.pending=true;
    $("rushStartBtn").disabled=true;
    $("offlineStartBtn").disabled=true;
    window.CartigmaRanking.beginRanked({mode:game.mode,difficulty}).then(ranked=>{
      if(game!==current)return;
      if(!ranked){startOffline();return;}
      current.ranked=true;
      current.mode=ranked.mode||current.mode;
      applyRankedState(ranked);
      mobilePanel="clues";
      rushCountryRequest++;
      save();render();clockTick();
    }).catch(error=>{
      if(game===current){
        toast(error.message||"Não foi possível iniciar.");
        current.rankError=error.message||deductionText("rankUnavailable");
      }
    }).finally(()=>{
      if(game===current){
        current.pending=false;
        $("rushStartBtn").disabled=false;
        render();
      }
    });
  }
  function applyRankedState(response){
    if(!game||!game.ranked)return;
    const previous=game.guesses||[];
    game.rankedClues=response.clues||[];
    game.rankedClueCount=response.clueCount||game.rankedClues.length;
    game.rankedNextHintCost=response.nextHintCost||0;
    game.sectorReveals=response.overlays||[];
    game.sectorMapPenalty=response.sectorMapPenalty||0;
    game.rankedId=response.id;
    game.started=true;
    game.startedAt=response.startedAt;
    game.evidenceVersion=response.rulesVersion??7;
    if(Number.isFinite(response.elapsedMs)){
      game.clockStart=Date.now()-response.elapsedMs;
    }
    game.revealed=response.revealed;
    game.penalty=response.penalty||0;
    game.paidHints=response.hints||0;
    game.won=Boolean(response.won);
    game.finished=Boolean(response.finished);
    game.score=response.score||0;
    game.guesses=(response.guesses||[]).map((item,i)=>{
      const code=item.code,old=previous[i];
      const coords=COUNTRIES[COUNTRY_CODES.indexOf(code)];
      const point=old?.countryCode===code?old:
        i===response.guesses.length-1&&selected?.countryCode===code?selected:null;
      return {
        lat:point?.lat??coords?.lat??0,lng:point?.lng??coords?.lng??0,
        label:point?.label||displayRegion(code),countryCode:code,
        at:new Date(response.startedAt+(item.elapsedMs||0)).toISOString(),
        elapsedMs:item.elapsedMs||0,feedback:item.feedback
      };
    });
    if(game.finished){
      const index=COUNTRY_CODES.indexOf(response.target);
      if(index<0)throw Error("Resposta inválida do servidor");
      game.index=index;
      game.endedAt=new Date().toISOString();
      game.durationMs=response.elapsedMs??elapsedMs();
      game.revealed=game.rankedClueCount;
    }else game.index=-1; // do not disclose the target through local game state
  }
  async function rankedAction(action,payload={}){
    if(!game?.ranked||game.pending||game.finished)return;
    const current=game;
    current.pending=true;
    if(action!=="state"){
      $("guessBtn").disabled=true;
      $("revealBtn").disabled=true;
    }
    try{
      const response=await window.CartigmaRanking.gameAction(action,{
        ...payload,id:current.rankedId,mode:current.mode,difficulty:current.difficulty
      });
      if(game!==current)return;
      applyRankedState(response);
      // Buying clues/overlays must preserve the current guess, like offline.
      if(action==="guess")selected=null;
      if(isMobileScreen()&&(action!=="state"||game.finished)){
        mobilePanel=game.finished?null:"clues";
      }
      if(action==="state"&&!game.finished){
        renderClues();updateClock();
      }
      if(game.finished)showReport();
    }catch(error){
      if(game===current){
        current.nextPollAt=Date.now()+(error.code==="cooldown"?error.retry*1000:5000);
        toast(error.message||deductionText("rankUnavailable"));
        if(error.code==="game_state_conflict"&&action!=="state"){
          current.pending=false;
          await rankedAction("state");
        }
      }
    }finally{
      if(game===current){
        current.pending=false;
        if(action!=="state"||game.finished)render();
      }
    }
  }
  function updateClock(){
    if(!game)return;
    const rush=isRush(),waiting=rush&&!game.started&&!game.finished;
    const remaining=rush?rushRemaining():0;
    $("timerLabel").textContent=t(waiting?"rushReady":
      rush&&!game.finished?"rushRemaining":"elapsedTime");
    $("gameTimer").textContent=formatElapsed(rush&&!game.finished?
      Math.ceil(remaining/1000)*1000:elapsedMs());
    const potential=Math.max(0,Math.round(5000*remaining/RUSH_DURATION_MS)-
      (game.sectorMapPenalty||0));
    $("timerScore").textContent=t("score")+": "+number(potential);
    $("timerScore").classList.toggle("hidden",!rush||game.finished);
    $("gameTimer").setAttribute("aria-label",$("timerLabel").textContent+" "+$("gameTimer").textContent);
    $("timerTrack").classList.toggle("hidden",!rush);
    $("timerProgress").style.setProperty("width",(rush?100*remaining/RUSH_DURATION_MS:0)+"%");
  }
  function clockTick(){
    if(!game)return;
    updateClock();
    if(!isRush()||game.finished||!game.started)return;
    if(game.ranked){
      if(game.pending||Date.now()<(game.nextPollAt??0))return;
      const available=DIFFICULTIES.rush.initial+Math.floor(elapsedMs()/RUSH_CLUE_INTERVAL_MS);
      if(rushRemaining()===0||available>game.revealed&&game.revealed<game.rankedClueCount){
        game.nextPollAt=Date.now()+1000;
        rankedAction("state");
      }
      return;
    }
    if(rushRemaining()===0){
      game.finished=true;game.won=false;game.revealed=cluesFor(game.index,difficulty).length;
      game.endedAt=new Date(game.startedAt+RUSH_DURATION_MS).toISOString();
      game.durationMs=RUSH_DURATION_MS;game.score=0;
      selected=null;save();render();showReport();return;
    }
    const count=Math.min(cluesFor(game.index,difficulty).length,DIFFICULTIES.rush.initial+
      Math.floor(elapsedMs()/RUSH_CLUE_INTERVAL_MS));
    if(count>game.revealed){game.revealed=count;save();renderClues();}
  }
  function savedDaily(){
    const saved=store.get(dailyStorageKey());
    if(!saved||saved.mode!=="daily"||saved.date!==today()||
       saved.difficulty!==difficulty||saved.index!==dailyIndex()||
       saved.targetKind!=="country"||![7,RULES_VERSION].includes(saved.evidenceVersion)||
       !Array.isArray(saved.guesses)||saved.guesses.length>maximum()||
       !Number.isFinite(saved.revealed))return null;
    if(isRush()&&!saved.started){
      saved.startedAt=null;saved.revealed=0;
    }
    return saved;
  }
  function save(){if(game?.mode==="daily"&&!game.ranked)store.set(dailyStorageKey(),game)}
  // Every Freeplay roll independently samples all 195 countries with an
  // equal chance. Never remember used countries or exclude recent answers.
  function chooseFree(){
    const entropy=typeof window.crypto?.getRandomValues==="function"
      ?window.crypto.getRandomValues(new Uint32Array(1))[0]/4294967296
      :Math.random();
    return Math.floor(entropy*COUNTRIES.length);
  }
  function startDaily(){
    mobilePanel="clues";
    rushCountryRequest++;
    const cached=savedDaily();
    game=cached||newGame("daily",dailyIndex());
    maybeRestoreRanked(game);
    if(!Number.isInteger(game.serial)||game.serial<1){
      game.serial=nextCaseNumber(game.date);
      save();
    }
    save();
    selected=null;closeReport();render();resetMapView();clockTick();
    if(isCountryGame())rushCountryFeatures().catch(()=>{});
  }
  function startFree(){
    mobilePanel="clues";
    rushCountryRequest++;game=newGame("free",chooseFree());
    maybeRestoreRanked(game);
    selected=null;closeReport();render();resetMapView();clockTick();
    if(isCountryGame())rushCountryFeatures().catch(()=>{});
  }
  function maybeRestoreRanked(snapshot){
    const api=window.CartigmaRanking;
    if(!api?.mayRank?.())return;
    const mode=snapshot.mode,level=snapshot.difficulty;
    api.resumeRanked(mode,level).then(response=>{
      // Never overwrite the selected mode with a round from another mode.
      // Completed free-play sessions are not restored for a new free case.
      if(!response||response.mode!==mode||game!==snapshot||snapshot.pending||snapshot.started||
         (mode==="free"&&response.finished))return;
      selected=null;
      snapshot.ranked=true;
      applyRankedState(response);
      render();
    }).catch(()=>{});
  }
  function setDifficulty(level){
    if(!DIFFICULTIES[level]||level===difficulty)return;
    difficulty=level;store.set("geodetective-difficulty",level);
    if(game.mode==="daily")startDaily();else startFree();
  }
  const LANGUAGE_FLAGS=Object.freeze({en:"🇺🇸",pt:"🇧🇷",es:"🇪🇸",zh:"🇨🇳",ja:"🇯🇵",ru:"🇷🇺",fr:"🇫🇷",de:"🇩🇪",it:"🇮🇹",nl:"🇳🇱",pl:"🇵🇱",sv:"🇸🇪",tr:"🇹🇷",ar:"🇸🇦",he:"🇮🇱",ko:"🇰🇷",th:"🇹🇭",vi:"🇻🇳",id:"🇮🇩"});
  function setLanguage(value){
    if(!TRANSLATIONS[value])return;
    lang=value;store.set("geodetective-language",lang);
    document.documentElement.lang=locale();
    document.documentElement.dir=["ar","he"].includes(lang)?"rtl":"ltr";
    $("langSelect").value=lang;
    window.GeoTheme?.sync();
    updateCompassRose();
    $("languageFlag").textContent=LANGUAGE_FLAGS[lang]||"🌐";
    window.GeoLanguagePicker?.sync(lang);
    updateMapLanguage();
    syncMapFiltersUI();
    document.querySelectorAll("[data-i18n]").forEach(element=>{element.textContent=t(element.dataset.i18n)});
    $("countrySearch").placeholder=t(isCountryGame()?"rushSearchPlaceholder":"searchPlaceholder");
    $("helpBtn").setAttribute("aria-label",t("help"));
    syncAtlasLanguage();
    $("resetViewBtn").title=t("reset");
    $("difficultySelect").value=difficulty;
    if(game)render();
  }
  function toast(text){
    const element=$("toast");element.textContent=text;element.classList.remove("hidden");
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>element.classList.add("hidden"),2800);
  }
  // Reuse the clue-category lookup instead of rebuilding it for every row.
  const CLUE_CATEGORY_KEYS=Object.freeze({
    continent:"clueRegion",hemisphere:"clueRegion",longitude:"clueRegion",
    countryCurrency:"clueCivic",
    countryLanguageFamily:"clueCivic",countryFlagColor:"clueCivic",
    countryPopulation:"clueCivic",countryGDP:"clueCivic",
    countryArea:"clueRegion",countryLandlocked:"clueRegion",
    countryBorders:"clueRegion",countrySubregion:"clueRegion",countryAreaBand:"clueRegion"
  });
  function revealGeographyOnMap(clue){
    if(isRush()||!game.started||game.finished||game.pending||!map||!mapStyleReady)return;
    const cost=CLUE_ENGINE.overlayCost(clue.key,difficulty);
    if(!cost||game.sectorReveals?.includes(clue.key))return;
    if(game.ranked){
      if(!game.rankedClues?.some(item=>item.key===clue.key))return;
      rankedAction("overlay",{key:clue.key});return;
    }
    const match=cluesFor(game.index,difficulty).slice(0,game.revealed)
      .find(item=>item.key===clue.key);
    if(!match||JSON.stringify(match)!==JSON.stringify(clue))return;
    if(!Array.isArray(game.sectorReveals))game.sectorReveals=[];
    game.sectorReveals.push(clue.key);
    game.sectorMapPenalty=(game.sectorMapPenalty||0)+cost;
    save();renderClues();renderMap();
    if(clue.key==="hemisphere")map.easeTo({center:[0,0],zoom:1.7,duration:450});
    else if(clue.key==="continent"){
      const bounds=(clue.continents||[])
        .map(key=>CONTINENT_BORDERS[key]?.bbox).filter(Boolean);
      if(bounds.length)map.fitBounds([
        [Math.min(...bounds.map(b=>b[0])),Math.min(...bounds.map(b=>b[1]))],
        [Math.max(...bounds.map(b=>b[2])),Math.max(...bounds.map(b=>b[3]))]
      ],{padding:20,maxZoom:4,duration:400});
    }else if(clue.key==="longitude"){
      map.fitBounds([[clue.from,-75],[clue.to,75]],{
        padding:20,maxZoom:3,duration:450});
    }
    toast(tc(clue.key==="hemisphere"?"hemisphereMapPurchased":
      clue.key==="continent"?"continentMapPurchased":"sectorMapPurchased",
      {cost:number(cost)}));
  }
  function nextHintCost(){
    if(game?.ranked)return game.rankedNextHintCost||0;
    if(!game||game.finished||isRush())return 0;
    const clue=cluesFor(game.index,difficulty)[game.revealed];
    return clue?CLUE_ENGINE.clueCost(clue,difficulty):0;
  }
  function renderClues(){
    const list=$("clueList");list.replaceChildren();
    const waiting=!game.started&&!game.finished;
    list.classList.toggle("hidden",waiting);
    if(waiting){
      $("hintCount").textContent="0 / "+EVIDENCE_COUNT;
      $("revealBtn").disabled=true;
      $("revealBtn").classList.add("hidden");
      return; // No categories, locked types or first evidence leak pre-start.
    }
    const clues=game.ranked?(game.rankedClues||[]):cluesFor(game.index,difficulty);
    const total=game.ranked?(game.rankedClueCount||clues.length):clues.length;
    const revealed=game.ranked?clues.length:game.revealed;
    $("hintCount").textContent=revealed+" / "+total;
    const lockedText=t("locked");
    for(let i=0;i<total;i++){
      const clue=clues[i];
      const row=document.createElement("li");row.className="clue"+(i>=revealed?" locked":"");
      if(i===revealed-1)row.classList.add("latest");
      const idx=document.createElement("span");idx.className="clue-index";idx.textContent=String(i+1).padStart(2,"0");
      const body=document.createElement("span");body.className="clue-body";
      const category=document.createElement("span");category.className="clue-category";
      const categoryKey=CLUE_CATEGORY_KEYS[clue?.key]||"clueRegion";
      category.textContent=(clue?.key==="countryLandlocked"
          ?(COUNTRY_CLUE_I18N[lang]?.countryLandlockedLabel||
            COUNTRY_CLUE_I18N.en?.countryLandlockedLabel||"Sea access")
          :i>=revealed?t("locked"):t(categoryKey));
      const value=document.createElement("span");value.className="clue-text";
      const clueValue=i<revealed?clueText(clue):lockedText;
      value.textContent=clueValue;
      value.title=clueValue;
      body.append(category,value);
      if(!isRush()&&i<revealed&&MAP_OVERLAY_COSTS[clue.key]){
        const purchased=Array.isArray(game.sectorReveals)&&game.sectorReveals.includes(clue.key);
        const button=document.createElement("button");
        button.type="button";
        button.className="sector-map-btn"+(purchased?" purchased":"");
        button.textContent=purchased?tc("sectorMapped"):tc("sectorMapButton",{cost:number(overlayCost(clue.key))});
        button.title=button.textContent;
        button.setAttribute("aria-label",button.textContent);
        button.disabled=game.finished||game.pending||purchased||!map||!mapStyleReady||
          (clue.key==="continent"&&
            !(clue.continents||[]).every(key=>CONTINENT_BORDERS[key]));
        button.addEventListener("click",()=>revealGeographyOnMap(clue));
        body.classList.add("with-sector-map");
        body.append(button);
      }
      row.append(idx,body);list.append(row);
    }
    $("revealBtn").disabled=game.finished||game.pending||isRush()||revealed>=total;
    $("revealCost").textContent=game.finished||revealed>=total
      ?"":"−"+number(nextHintCost());
    $("revealBtn").classList.toggle("hidden",game.finished||isRush());
    syncMobilePanels();
  }
  function distanceText(feedback){
    const {min,max}=feedback;
    return (min===0?"< "+number(max):max===null?"≥ "+number(min):number(min)+"–"+number(max))+" km";
  }
  function guessMetricText(g){
    if(g.countryCode===COUNTRY_CODES[game.index])return "✓";
    if(!g.feedback)return "×";
    const {direction:sector}=g.feedback;
    return distanceText(g.feedback)+(sector===undefined?"":" · "+direction(sector));
  }
  function renderHistory(){
    const list=$("guessHistory");list.replaceChildren();
    const count=game.guesses.length;
    $("historyCount").textContent=String(count).padStart(2,"0");
    if(!count){
      const li=document.createElement("li");li.className="empty-history";li.textContent=t("empty");list.append(li);return;
    }
    // The closest guess is underlined, including before a case finishes.
    const closest=bestGuess();
    for(let i=count-1;i>=0;i--){
      const g=game.guesses[i];
      const row=document.createElement("li");row.className="history-item";
      if(g===closest)row.classList.add("closest");
      const label=document.createElement("span");
      const idx=document.createElement("span");idx.className="history-number";idx.textContent=String(i+1).padStart(2,"0");
      label.append(idx,document.createTextNode(g.label||g.lat.toFixed(2)+"°, "+g.lng.toFixed(2)+"°"));
      const stamp=document.createElement("time");stamp.className="guess-timestamp";
      if(g.at)stamp.setAttribute("datetime",g.at);
      stamp.textContent=guessTimestamp(g);label.append(stamp);
      row.append(label);
      const metricText=guessMetricText(g);
      if(metricText){
        const distance=document.createElement("strong");
        distance.textContent=metricText;
        row.append(distance);
      }
      list.append(row);
    }
  }
  function bestGuess(){
    const correct=game.guesses.find(g=>g.countryCode===COUNTRY_CODES[game.index]);
    if(correct)return correct;
    const measured=game.guesses.filter(g=>g.feedback);
    return measured.reduce((closest,guess)=>!closest||guess.feedback.min<closest.feedback.min
      ?guess:closest,null);
  }
  function factFor(index){
    // Trivia is optional and independent of the country history.
    // Previously this returned history verbatim, duplicating the report.
    const trivia=COUNTRY_INSIGHTS[COUNTRY_CODES[index]]?.trivia;
    const text=typeof trivia==="string"?trivia:
      trivia?.[lang==="pt"?"pt":"en"]||trivia?.en||"";
    return String(text).trim();
  }
  function sameReportInformation(a,b){
    // Ignore whitespace, accents, case and punctuation when checking that
    // independently authored trivia does not repeat the history text.
    const comparable=text=>norm(text).replace(/[^\p{L}\p{N}]+/gu," ").trim();
    return comparable(a)===comparable(b);
  }

  function renderCountryProfile(info,code,place,targets={
    title:"reportCountryStatsTitle",source:"reportCountryStatsSource",
    list:"reportCountryStats"
  }){
    const locale=window.GeoCountryProfileI18n?.[lang]||
      window.GeoCountryProfileI18n?.en||{};
    $(targets.title).textContent=locale.title||"Country profile";
    $(targets.source).textContent=locale.source||
      "Country metadata and historical World Bank indicators";
    const list=$(targets.list);list.replaceChildren();
    const fmt=value=>new Intl.NumberFormat(
      TRANSLATIONS[lang]?.numberLocale||({pt:"pt-BR",en:"en-US"}[lang]||lang)
    ).format(value);
    const add=(key,value)=>{
      if(value===null||value===undefined||value==="")return;
      const cell=document.createElement("div");
      const label=document.createElement("dt");
      const content=document.createElement("dd");
      label.textContent=locale[key]||key;
      content.textContent=String(value);
      cell.append(label,content);list.append(cell);
    };
    const countryWord=value=>typeof value==="boolean"
      ?tc(value?"yes":"no"):null;
    add("iso",code);
    add("region",continentName(COUNTRY_CODES.indexOf(code)));
    add("capital",COUNTRIES[COUNTRY_CODES.indexOf(code)]?.capital||"—");
    add("currency",currencyName(info?.currency,info?.currencyName));
    if(info?.languageFamily)add("language",lang==="pt"
      ?COUNTRY_FAMILIES_PT[info.languageFamily]||info.languageFamily:info.languageFamily);
    if(info?.flagColor)add("flagColor",
      COUNTRY_CLUE_I18N[lang]?.colors?.[info.flagColor]||
      COUNTRY_CLUE_I18N.en?.colors?.[info.flagColor]||info.flagColor);
    if(info?.population)add("population",fmt(info.population)+
      (info.populationYear?" ("+info.populationYear+")":""));
    if(info?.gdpPerCapita)add("gdp","US$ "+fmt(info.gdpPerCapita)+
      (info.gdpYear?" ("+info.gdpYear+")":""));
    if(info?.area)add("area",fmt(info.area)+" km²");
    if(typeof info?.landlocked==="boolean"){
      // One natural sentence, not a confusing "landlocked: Yes/No" pair.
      const sentence=tc(info.landlocked?"countryLandlockedYes":"countryLandlockedNo");
      const cell=document.createElement("div");
      cell.className="report-country-access";
      const label=document.createElement("dt");
      label.className="visually-hidden";
      label.textContent=locale.landlocked||"Sea access";
      const value=document.createElement("dd");
      value.textContent=sentence;
      cell.append(label,value);list.append(cell);
    }
  }
  // Country dossier: the same 195-country metadata as the game.
  let atlasSelected=0,atlasButtons=[];
  const ATLAS_ROWS=COUNTRIES.map((country,index)=>({country,index}));
  function atlasText(key,vars={}){
    const template=ATLAS_I18N[lang]?.[key]||ATLAS_I18N.en?.[key]||key;
    return template.replace(/\{(\w+)\}/g,(_,name)=>String(vars[name]??""));
  }
  function atlasGeoFacts(index){
    const country=COUNTRIES[index],list=$("atlasGeoFacts");list.replaceChildren();
    function add(key,value){
      if(value===undefined||value===null||value==="")return;
      const cell=document.createElement("div"),dt=document.createElement("dt"),
        dd=document.createElement("dd");
      dt.textContent=atlasText(key);dd.textContent=String(value);
      cell.append(dt,dd);list.append(cell);
    }
    add("continent",continentName(index));
    add("nationalCapital",country.capital);
    add("landlocked",tc(country.landlocked?"countryLandlockedYes":"countryLandlockedNo"));
  }
  function atlasEvidence(index,level,target){
    const list=$(target);list.replaceChildren();
    cluesFor(index,level,RULES_VERSION).forEach((clue,i)=>{
      const row=document.createElement("li");row.className="report-evidence-row";
      const count=document.createElement("span");count.textContent=String(i+1).padStart(2,"0");
      const value=document.createElement("span");value.textContent=clueText(clue,index);
      row.append(count,value);list.append(row);
    });
  }
  function renderAtlasCountry(index){
    if(!Number.isInteger(index)||index<0||index>=COUNTRIES.length)return;
    atlasSelected=index;
    const country=COUNTRIES[index],code=country.code,
      details=COUNTRY_INSIGHTS[code]||{};
    $("atlasEntryNo").textContent=String(index+1).padStart(3,"0")+" / "+COUNTRIES.length;
    $("atlasCountryName").textContent=countryName(index);
    $("atlasCountryCode").textContent=code;
    const flag=$("atlasFlag"),fallback=$("atlasFlagFallback");
    fallback.textContent=country.flag||details.flag||"";
    fallback.classList.add("hidden");flag.classList.remove("hidden");
    flag.alt=countryName(index);
    flag.onerror=()=>{flag.classList.add("hidden");fallback.classList.remove("hidden")};
    flag.src=/^[A-Z]{2}$/.test(code)?
      "https://flagcdn.com/w160/"+code.toLowerCase()+".png":"";
    atlasGeoFacts(index);
    $("atlasHistory").textContent=details.history?.[lang==="pt"?"pt":"en"]||
      details.history?.en||atlasText("notAvailable");
    $("atlasHistorySource").textContent=COUNTRY_CLUE_I18N[lang]?.countryHistorySource||
      COUNTRY_CLUE_I18N.en?.countryHistorySource||"";
    renderCountryProfile(details,code,countryAt(index),{
      title:"atlasCountryTitle",source:"atlasCountrySource",list:"atlasCountryStats"
    });
    atlasEvidence(index,"normal","atlasNormalEvidence");
    atlasEvidence(index,"hard","atlasHardEvidence");
    for(const button of atlasButtons){
      const active=Number(button.dataset.index)===index;
      button.classList.toggle("selected",active);
      button.setAttribute("aria-selected",String(active));
    }
  }
  function renderAtlasOptions(query=""){
    const text=norm(query),tokens=text.split(/\s+/).filter(Boolean);
    const matches=ATLAS_ROWS.map(({country,index})=>({
      country,index,name:countryName(index),
      exact:text.length>0&&(norm(country.code)===text||
        norm(countryName(index))===text||norm(country.name)===text)
    })).filter(({country,name})=>{
      const searchable=norm([country.code,country.name,name].join(" "));
      return tokens.every(term=>searchable.includes(term));
    }).sort((a,b)=>Number(b.exact)-Number(a.exact)||
      a.name.localeCompare(b.name,locale())||a.index-b.index);
    $("atlasCount").textContent=atlasText("count",{count:matches.length});
    const options=$("atlasOptions");atlasButtons=[];
    if(!matches.length){
      const message=document.createElement("div");message.className="atlas-no-results";
      message.textContent=atlasText("noResults");
      options.replaceChildren(message);return;
    }
    const nodes=matches.map(item=>{
      const button=document.createElement("button");button.type="button";
      button.className="atlas-option";button.dataset.index=String(item.index);
      button.setAttribute("role","option");
      button.setAttribute("aria-selected",String(atlasSelected===item.index));
      button.setAttribute("aria-label",item.name);
      if(atlasSelected===item.index)button.classList.add("selected");
      const flag=document.createElement("span");flag.className="atlas-option-flag";
      flag.textContent=item.country.flag||"";
      flag.setAttribute("aria-hidden","true");
      const info=document.createElement("span");info.className="atlas-option-info";
      const title=document.createElement("span");title.className="atlas-option-name";
      title.textContent=item.name;
      const code=document.createElement("span");code.className="atlas-option-country";
      code.textContent=item.country.code;info.append(title,code);
      const number=document.createElement("span");number.className="atlas-option-number";
      number.textContent=String(item.index+1).padStart(3,"0");
      button.append(flag,info,number);
      button.addEventListener("click",()=>{
        renderAtlasCountry(item.index);
        if(window.matchMedia?.("(max-width: 760px)")?.matches)
          $("atlasSheet").scrollTop=0;
      });
      button.addEventListener("keydown",event=>{
        if(!["ArrowDown","ArrowUp","Home","End"].includes(event.key))return;
        event.preventDefault();
        const current=atlasButtons.indexOf(button);
        const next=event.key==="Home"?0:event.key==="End"?atlasButtons.length-1:
          (current+(event.key==="ArrowDown"?1:-1)+atlasButtons.length)%atlasButtons.length;
        atlasButtons[next]?.focus?.();
      });
      return button;
    });
    atlasButtons=nodes;options.replaceChildren(...nodes);
  }
  function syncAtlasLanguage(){
    $("atlasTitle").textContent=atlasText("title");
    $("atlasSubtitle").textContent=atlasText("subtitle");
    $("atlasSearch").placeholder=atlasText("search");
    $("atlasSearch").setAttribute("aria-label",atlasText("search"));
    $("atlasSearchLabel").textContent=atlasText("search");
    $("atlasOptions").setAttribute("aria-label",atlasText("title"));
    $("atlasBtn").setAttribute("aria-label",atlasText("title"));
    $("atlasBtn").title=atlasText("title");
    $("atlasCloseBtn").setAttribute("aria-label",atlasText("close"));
    $("atlasCloseBtn").title=atlasText("close");
    $("atlasGeoTitle").textContent=atlasText("geoDetails");
    $("atlasHistoryTitle").textContent=atlasText("history");
    $("atlasNormalLabel").textContent=atlasText("normalEvidence");
    $("atlasHardLabel").textContent=atlasText("hardEvidence");
    $("atlasDataNote").textContent=atlasText("availableNote");
    $("countryCountLabel").textContent=atlasText("countryPlural");
    if($("atlasDialog").open){
      renderAtlasOptions($("atlasSearch").value);
      renderAtlasCountry(atlasSelected);
    }
  }
  function initAtlas(){
    const dialog=$("atlasDialog"),search=$("atlasSearch");
    $("atlasBtn").addEventListener("click",()=>{
      syncAtlasLanguage();search.value="";
      renderAtlasOptions("");renderAtlasCountry(atlasSelected);
      dialog.showModal();
      if(window.matchMedia?.("(max-width: 760px)")?.matches)
        $("atlasCloseBtn").focus?.();
      else search.focus?.();
    });
    $("atlasCloseBtn").addEventListener("click",()=>dialog.close());
    dialog.addEventListener("click",event=>{
      if(event.target===dialog)dialog.close();
    });
    dialog.addEventListener("close",()=>{$("atlasBtn").focus?.()});
    search.addEventListener("input",()=>renderAtlasOptions(search.value));
    search.addEventListener("keydown",event=>{
      if(event.key!=="ArrowDown"&&event.key!=="Enter")return;
      if(atlasButtons.length){
        event.preventDefault();atlasButtons[0].focus?.();
        if(event.key==="Enter")atlasButtons[0].click?.();
      }
    });
  }

  function renderCaseNavigation(){
    const daily=game?.mode==="daily";
    const newLabel=t(daily?"newFreeCase":"newCase");
    $("newCaseBtn").textContent=newLabel;
    $("reportNextBtn").textContent=newLabel;
    const other=difficulty==="normal"?"hard":"normal";
    const showOther=daily&&Boolean(game?.finished)&&otherDailyAvailable(other);
    const switchToDaily=!daily&&Boolean(game?.finished);
    const button=$("reportAlternateBtn");
    button.classList.toggle("hidden",!(showOther||switchToDaily));
    button.disabled=!(showOther||switchToDaily);
    if(switchToDaily)button.textContent=t("daily");
    else if(showOther)button.textContent=t("otherDaily",{difficulty:t(other)});
  }
  function renderDossier(){
    if(!game.finished)return;
    const best=bestGuess();
    const place=countryAt(game.index);
    $("reportCode").textContent=caseCode();
    $("reportVerdict").textContent=t(game.won?"caseSolved":"caseClosed");
    $("reportHeading").textContent=countryName(game.index);
    $("reportCountry").textContent=countryName(game.index);
    const iso=COUNTRY_CODES[game.index],details=COUNTRY_INSIGHTS[iso];
    const flagImage=$("reportFlag"),flagFallback=$("reportFlagFallback");
    flagFallback.textContent=details?.flag||"";
    flagFallback.classList.add("hidden");
    flagImage.classList.remove("hidden");
    flagImage.alt=countryName(game.index);
    flagImage.onerror=()=>{
      flagImage.classList.add("hidden");
      flagFallback.classList.remove("hidden");
    };
    flagImage.src=/^[A-Z]{2}$/.test(iso)
      ?"https://flagcdn.com/w160/"+iso.toLowerCase()+".png":"";
    $("reportHistoryTitle").textContent=COUNTRY_CLUE_I18N[lang]?.countryHistory||
      COUNTRY_CLUE_I18N.en?.countryHistory||"Country history";
    $("reportHistory").textContent=details?.history?.[lang==="pt"?"pt":"en"]||
      details?.history?.en||"";
    $("reportHistorySource").textContent=COUNTRY_CLUE_I18N[lang]?.countryHistorySource||
      COUNTRY_CLUE_I18N.en?.countryHistorySource||"CIA World Factbook";
    $("reportStamp").textContent=t(game.won?"reportSuccess":"reportFailure");
    $("reportMode").textContent=t(game.mode==="daily"?"daily":"free");
    $("reportDifficulty").textContent=t(difficulty);
    $("reportAttempts").textContent=isRush()?String(game.guesses.length):game.guesses.length+" / "+maximum();
    $("reportBest").textContent=game.won?"✓":best?.feedback?distanceText(best.feedback):"—";
    $("reportHints").textContent=number(Number.isInteger(game.paidHints)
      ?game.paidHints:Math.round(game.penalty/HINT_COST));
    $("reportScore").textContent=number(game.score)+" / 5,000";
    $("reportCoordinates").textContent=isCountryGame()?"—":place[3].toFixed(4)+"°, "+place[4].toFixed(4)+"°";
    $("reportContinent").textContent=continentName(game.index);
    renderCountryProfile(details,iso,place);
    const trivia=factFor(game.index);
    const showTrivia=Boolean(trivia)&&
      !sameReportInformation(trivia,$("reportHistory").textContent);
    $("reportFactSection").classList.toggle("hidden",!showTrivia);
    $("reportFact").textContent=showTrivia?trivia:"";
    const log=$("reportTimeline");log.replaceChildren();
    for(const [i,g] of game.guesses.entries()){
      const row=document.createElement("li");row.className="report-log-row";
      if(g===best){row.classList.add("best");row.classList.add("closest");}
      const n=document.createElement("span");n.className="report-log-index";n.textContent=String(i+1).padStart(2,"0");
      const label=document.createElement("span");label.className="report-log-place";
      label.textContent=g.label||g.lat.toFixed(3)+"°, "+g.lng.toFixed(3)+"°";
      const stamp=document.createElement("time");stamp.className="guess-timestamp";
      if(g.at)stamp.setAttribute("datetime",g.at);
      stamp.textContent=guessTimestamp(g);label.append(stamp);
      row.append(n,label);
      const metricText=guessMetricText(g);
      if(metricText){
        const metric=document.createElement("strong");
        metric.textContent=metricText;
        row.append(metric);
      }
      log.append(row);
    }
    if(!game.guesses.length){
      const item=document.createElement("li");item.textContent=t("reportNoGuesses");log.append(item);
    }
    const evidence=$("reportEvidenceList");evidence.replaceChildren();
    (game.ranked?game.rankedClues:cluesFor(game.index,difficulty)).forEach((clue,i)=>{
      const item=document.createElement("li");item.className="report-evidence-row";
      const n=document.createElement("span");n.textContent=String(i+1).padStart(2,"0");
      const value=document.createElement("span");value.textContent=clueText(clue);
      item.append(n,value);evidence.append(item);
    });
  }
  function closeReport(){
    const dialog=$("reportDialog");
    if(dialog?.open)dialog.close();
  }
  function showReport(){
    if(!game?.finished)return;
    renderDossier();
    const dialog=$("reportDialog");
    // Phone dossier lives inside the lower investigation scroller, without
    // obscuring the square map. Desktop keeps the existing side dossier.
    const mobile=window.matchMedia?.("(max-width: 760px)")?.matches===true;
    const destination=mobile?document.querySelector(".case-card"):document.body;
    if(destination&&dialog.parentElement!==destination)destination.append(dialog);
    if(!dialog.open){
      if(mobile){
        mobilePanel=null;
        syncMobilePanels();
        dialog.showModal();
      }else dialog.show();
    }
  }
  function renderResult(){
    renderCaseNavigation();
    $("resultCard").classList.toggle("hidden",!game.finished);
    if(!game.finished)return;
    const name=countryName(game.index);
    $("resultKicker").textContent=t(game.won?"solved":"closed");
    $("resultTitle").textContent=name;
    $("resultDetail").textContent=isRush()
      ?t(game.won?"rushFound":"rushLost",{country:name,
        count:game.guesses.length,time:formatElapsed(game.durationMs??elapsedMs())})
      :t(game.won?"countryFound":"countryLost",{country:name,count:game.guesses.length});
    $("finalScore").textContent=number(game.score);
    renderDossier();
  }
  function feedback(){
    const el=$("feedback"),mobile=$("mobileGuessFeedback");
    const last=game.guesses.at(-1);
    mobile.classList.toggle("hidden",!last?.feedback||game.finished);
    mobile.textContent=last?.feedback?guessMetricText(last):"";
    if(!last||game.finished){el.classList.add("hidden");return}
    const metric=guessMetricText(last);
    el.textContent=last.feedback?(DEDUCTION_TEXT[lang]
      ?deductionText("guessFeedback",{value:metric})
      :t("rushWrong")+" "+metric):t("rushWrong");
    if(last.feedback)el.title=GEOGRAPHY_LABELS[lang]?.[1]||GEOGRAPHY_LABELS.en[1];
    el.className="feedback";
  }
  function render(){
    const daily=game.mode==="daily";
    const max=maximum(),remaining=max-game.guesses.length;
    $("dailyBtn").classList.toggle("active",daily);$("freeBtn").classList.toggle("active",!daily);
    $("dailyBtn").setAttribute("aria-pressed",String(daily));$("freeBtn").setAttribute("aria-pressed",String(!daily));
    $("difficultySelect").value=difficulty;
    $("mapToolbar").classList.toggle("is-hard",difficulty==="hard");
    $("mapToolbar").classList.toggle("is-rush",isRush());
    document.body.classList.toggle("rush-mode",isRush());
    $("mapTitle").textContent=t("map")+" - "+t(difficulty);
    const code=caseCode();
    $("caseCode").textContent=code;
    $("caseNumber").textContent=t("caseWord")+" "+code;
    const playLabel=game.ranked?" / RANKED":game.practice?" / "+deductionText("practice"):"";
    $("modeCaption").textContent=t(daily?"modeDaily":"modeFree")+playLabel;
    $("caseTitle").textContent=game.finished?countryName(game.index):t("unknown");
    $("caseStatus").textContent=t(game.finished?(game.won?"solved":"closed"):"active");
    $("caseStatus").classList.toggle("closed",game.finished);
    $("attemptCount").textContent=isRush()?t("rushUnlimited"):remaining+" / "+max;
    $("guessCounter").textContent=isRush()?String(game.guesses.length):game.guesses.length+" / "+max;
    const dots=$("attemptDots");dots.replaceChildren();
    dots.style.setProperty("--attempt-total",max);
    if(!isRush())for(let i=0;i<max;i++){const dot=document.createElement("i");dot.classList.toggle("live",i<remaining);dots.append(dot)}
    $("placeCount").textContent=String(COUNTRIES.length);
    renderClues();renderHistory();renderResult();feedback();
    $("guessBtn").disabled=game.finished||game.pending||!selected||!game.started;
    $("countrySearch").disabled=game.finished||!game.started||game.pending;
    $("countrySearch").placeholder=t(isCountryGame()?"rushSearchPlaceholder":"searchPlaceholder");
    $("searchLabel").textContent=t(isCountryGame()?"rushSearchLabel":"searchLabel");
    $("countrySearch").value="";
    hideSuggestions();
    $("selection").classList.toggle("hidden",game.finished);
    $("selectedText").textContent=selected?(selected.label||selected.lat.toFixed(3)+"°, "+selected.lng.toFixed(3)+"°"):t("noSelection");
    $("mapHint").textContent=t(game.finished?"mapRevealed":
      !game.started?"rushIntroHint":isCountryGame()?"rushMapHint":"mapHint");
    $("rushIntro").classList.toggle("hidden",game.started||game.finished);
    $("rushIntro").setAttribute("aria-hidden",String(game.started||game.finished));
    // The start gate is shared by every difficulty. Never leave the
    // original Rush heading or the "unlimited cases" free-play caption.
    $("rushIntroEyebrow").textContent="CARTIGMA / "+(
      isRush()?t("rushIntroTitle"):t(daily?"daily":"free")).toLocaleUpperCase(locale());
    $("rushIntroTitle").textContent=isRush()?t("rushIntroTitle"):t(difficulty);
    $("rushIntroText").textContent=game.rankError||(isRush()?t("rushIntroText"):
      t("remaining")+": "+maximum());
    $("rushStartBtn").textContent=t("rushStart");
    $("rushStartBtn").disabled=Boolean(game.pending&&!game.started);
    const rankNote=$("rankStartNote");
    const showRankNote=!game.started&&!game.rankError&&Boolean(window.CartigmaRanking?.mayRank?.());
    rankNote.classList.toggle("hidden",!showRankNote);
    rankNote.textContent=showRankNote?deductionText("rankedAttempt"):"";
    $("offlineStartBtn").textContent=deductionText("playOffline");
    $("offlineStartBtn").classList.toggle("hidden",!game.rankError);
    $("offlineStartBtn").disabled=Boolean(game.pending);
    updateClock();renderMap();
    syncMobilePanels();
  }
  function makeMarker(text,style){
    // The wrapper includes both the circle and the pointed tail. Its bottom edge
    // is the actual geographic coordinate used by MapLibre's bottom anchor.
    const element=document.createElement("span");
    element.className="pin "+style;
    const head=document.createElement("span");
    head.className="pin-head";
    head.textContent=String(text);
    element.append(head);
    // Never place a new guess when clicking one of the existing map markers.
    element.addEventListener("click",event=>event.stopPropagation());
    return new window.maplibregl.Marker({element,anchor:"bottom"});
  }
  function clearCasePins(){
    // Guess pins are not transient clue overlays: keep them through every
    // render and only remove them when switching cases or replacing the map.
    for(const pin of guessMarkers)pin.remove();
    guessMarkers=[];
    marker?.remove();
    marker=null;
    resultMarker?.remove();
    resultMarker=null;
    markerCase=null;
    markerMap=null;
  }
  function clearMapOverlays(){
    // Do NOT clear the guess markers when redrawing clue overlays.
    if(!map||!mapStyleReady)return;
    // The arrow layer depends on the Equator line source: remove it first.
    for(const id of ["case-sector-longitude","case-hemisphere-arrows",
      "case-hemisphere-line","case-continent-outline"]){
      if(map.getLayer(id))map.removeLayer(id);
      if(map.getSource(id))map.removeSource(id);
    }
  }
  // Full geographic strips, not a marker for the hidden city.
  function sectorRectangle(west,south,east,north){
    return [[[west,south],[east,south],[east,north],[west,north],[west,south]]];
  }
  function drawSectorOverlays(){
    if(!map||!mapStyleReady||!Array.isArray(game.sectorReveals))return;
    for(const clue of (game.ranked?game.rankedClues:cluesFor(game.index,difficulty))){
      if(!game.sectorReveals.includes(clue.key)||clue.key!=="longitude")continue;
      const geometry={type:"Polygon",coordinates:sectorRectangle(clue.from,-85,clue.to,85)};
      const id="case-sector-"+clue.key;
      map.addSource(id,{type:"geojson",data:{type:"Feature",properties:{},geometry}});
      map.addLayer({id,type:"fill",source:id,
        // Do not stroke the artificial 60° tile edges of geographic overlays.
        // Disabling fill antialiasing removes hairline seams between tiles.
        paint:{"fill-color":"#ffd449","fill-opacity":0.10,
          "fill-antialias":false}});
    }
  }
  function drawContinentOutline(){
    if(!map||!mapStyleReady||!game.sectorReveals?.includes("continent"))return;
    const clue=(game.ranked?game.rankedClues:cluesFor(game.index,difficulty))
      .find(clue=>clue.key==="continent");
    const continents=clue?.continents||[];
    const shapes=continents.map(key=>CONTINENT_BORDERS[key]).filter(Boolean);
    if(shapes.length!==continents.length||!shapes.length)return;
    const geometry=shapes.length===1?shapes[0].geometry:
      {type:"MultiPolygon",coordinates:shapes.flatMap(shape=>
        shape.geometry.type==="MultiPolygon"?shape.geometry.coordinates:
          [shape.geometry.coordinates])};
    const id="case-continent-outline";
    map.addSource(id,{type:"geojson",data:{type:"Feature",properties:{},geometry}});
    map.addLayer({id,type:"line",source:id,
      layout:{"line-cap":"round","line-join":"round"},
      paint:{"line-color":"#ffd449","line-width":1.7,"line-opacity":0.28,
        "line-opacity-transition":{duration:0,delay:0}}});
  }
  function drawHemisphereOverlay(){
    if(!map||!mapStyleReady||!game.sectorReveals?.includes("hemisphere"))return;
    const clue=(game.ranked?game.rankedClues:cluesFor(game.index,difficulty))
      .find(clue=>clue.key==="hemisphere");
    if(!clue)return;
    const north=clue.hemisphere==="north";
    const lineId="case-hemisphere-line",arrowsId="case-hemisphere-arrows";
    map.addSource(lineId,{type:"geojson",data:{type:"Feature",properties:{},
      geometry:{type:"LineString",coordinates:[[-179.9,0],[179.9,0]]}}});
    map.addLayer({id:lineId,type:"line",source:lineId,
      layout:{"line-cap":"butt","line-join":"round"},
      paint:{"line-color":"#ffd449","line-width":2,"line-opacity":0.9,"line-dasharray":[2,3]}});
    // Repeat labels at fixed SCREEN-pixel intervals along the Equator instead
    // of at fixed geographic coordinates, which drift far away when zoomed.
    const glyph=north?"↑":"↓";
    map.addLayer({id:arrowsId,type:"symbol",source:lineId,
      layout:{"symbol-placement":"line","symbol-spacing":88,
        "text-field":glyph,"text-size":14,
        "text-offset":[0,north?-0.85:0.85],
        "text-rotation-alignment":"viewport",
        "text-pitch-alignment":"viewport",
        "text-allow-overlap":true,"text-ignore-placement":true},
      paint:{"text-color":"#ffd449","text-halo-color":"#172015","text-halo-width":0.7,
        "text-opacity-transition":{duration:0,delay:0}}});
  }
  function addMarker(lat,lng,label,style,popupText=""){
    const pin=makeMarker(label,style).setLngLat([lng,lat]).addTo(map);
    if(popupText){
      const text=document.createElement("div");text.textContent=popupText;
      pin.setPopup(new window.maplibregl.Popup({offset:22}).setDOMContent(text));
    }
    return pin;
  }
  function labelMinZoom(layer){
    if(layer.type!=="symbol" || layer.layout?.["text-field"]===undefined)return null;
    const id=(layer.id+" "+(layer["source-layer"]||"")).toLowerCase();
    // Each category progressively appears as the investigator zooms in.
    // Country labels remain at world scale; street names and POIs require local zoom.
    if(/(road|street|highway|motorway|rail|transit|route|shield|housenumber|house-number)/.test(id))return 9.5;
    if(/(poi|amenity|shop|building|landmark|business|tourism|airport|station)/.test(id))return 9;
    if(/(neighbou?rhood|suburb|hamlet|village|district|quarter|locality)/.test(id))return 6.4;
    if(/(town|settlement)/.test(id))return 4.1;
    if(/(province|state|region|admin)/.test(id))return 3.15;
    if(/(country|continent)/.test(id))return 1.5;
    if(/(capital)/.test(id))return 2.3;
    if(/(city|place)/.test(id))return 2.9;
    if(/(river|lake|water|sea|ocean|mountain|hill|peak|park|island|natural)/.test(id))return 5.1;
    if(/(label|name|text)/.test(id))return 5.2;
    return 5.8;
  }
  function configureMapLabelDensity(){
    if(!map||!mapStyleReady||typeof map.setLayerZoomRange!=="function")return;
    const layers=map.getStyle()?.layers||[];
    for(const layer of layers){
      const min=labelMinZoom(layer);
      if(min===null)continue;
      const originalMin=Number.isFinite(layer.minzoom)?layer.minzoom:0;
      const originalMax=Number.isFinite(layer.maxzoom)?layer.maxzoom:24;
      // Allow major city names earlier than the original style if tile data exists.
      const targetMin=Math.max(1,Math.min(min,originalMin||min));
      if(targetMin>=originalMax)continue;
      try{map.setLayerZoomRange(layer.id,targetMin,originalMax)}
      catch(error){console.warn("Could not adjust label zoom",layer.id,error);}
    }
  }
  function updateMapLanguage(){
    if(!map||!mapStyleReady||!map.getStyle())return;
    // OpenFreeMap/OpenMapTiles contain localized place names when available.
    // Fallback to each place's native name if a requested translation is missing.
    const translations=lang==="zh"?["zh-Hans","zh"]:lang==="pt"?["pt-BR","pt"]:[lang];
    const fields=translations.flatMap(code=>[["get","name:"+code],["get","name_"+code]]);
    const expression=["coalesce",...fields,["get","name"],["get","name_en"],["get","name:en"]];
    for(const layer of map.getStyle().layers||[]){
      if(layer.type!=="symbol"||layer.layout?.["text-field"]===undefined)continue;
      if(!/(label|place|city|town|village|country|state|province|island|water|poi)/i.test(layer.id))continue;
      if(/(shield|highway|housenumber|house-number|route|ref-label)/i.test(layer.id))continue;
      try{map.setLayoutProperty(layer.id,"text-field",expression)}catch(error){
        console.warn("Could not localize map layer",layer.id,error);
      }
    }
  }
  function syncCasePins(){
    // A stable, dedicated set of guess markers survives both failed guesses
    // and map overlay redraws. Do not rebuild previous pins on every render.
    if(markerCase!==game||markerMap!==map||
       game.guesses.length<guessMarkers.length){
      clearCasePins();
      markerCase=game;
      markerMap=map;
    }
    const best=game.finished?bestGuess():null;
    for(let i=guessMarkers.length;i<game.guesses.length;i++){
      const guess=game.guesses[i];
      const pin=addMarker(guess.lat,guess.lng,i+1,
        guess===best?"best":"past",guess.label||"");
      guessMarkers.push(pin);
    }
    // Every difficulty has the same country-answer target. Reveal a distinct
    // star marker only after a case ends, whether won or lost (including Rush).
    // Keep it separate from numbered guess pins across map/style redraws.
    if(game.finished&&!resultMarker){
      const answer=COUNTRIES[game.index];
      resultMarker=addMarker(answer.lat,answer.lng,"★","target",countryName(game.index));
    }else if(!game.finished&&resultMarker){
      resultMarker.remove();
      resultMarker=null;
    }
    // The + pin is temporary. Submitted numbered pins are never removed here.
    marker?.remove();
    marker=null;
    if(!game.finished&&selected)
      marker=addMarker(selected.lat,selected.lng,"+","current",selected.label||"");
  }
  function renderMap(){
    if(!map)return;
    // Persist pins independently of overlays. Clue layers can safely be
    // reconfigured, including on style reloads and Rush clue unlocks.
    syncCasePins();
    clearMapOverlays();
    if(!isRush()){
      drawSectorOverlays();
      drawHemisphereOverlay();
      drawContinentOutline();
    }
    $("coordinates").textContent=game.finished?countryName(game.index):
      selected?selected.label||selected.lat.toFixed(3)+"°, "+selected.lng.toFixed(3)+"°":
      t("noSelection");
  }
  function resetMapView(){
    if(map&&!game.finished)map.easeTo({center:[8,15],zoom:1.7,duration:350});
  }

  // A country must be selected by its actual territory, not by the nearest
  // catalogued city (which gives wrong results along borders and in large states).
  // Natural Earth admin-0 boundaries are small enough to cache in one request.
  const RUSH_BORDERS_URLS=Object.freeze([
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson",
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
  ]);
  function rushCountryFeatures(){
    if(!countryShapesPromise){
      countryShapesPromise=(async()=>{
        let error;
        for(const url of RUSH_BORDERS_URLS){
          try{
            const response=await fetch(url,{cache:"force-cache"});
            if(!response.ok)throw Error("Could not retrieve country boundaries");
            const geojson=await response.json();
            if(!Array.isArray(geojson?.features)||geojson.features.length<100)
              throw Error("Invalid country boundary dataset");
            return geojson.features;
          }catch(failed){error=failed}
        }
        throw error||Error("Country boundary data unavailable");
      })().catch(error=>{countryShapesPromise=null;throw error});
    }
    return countryShapesPromise;
  }
  // GeoJSON uses [longitude, latitude]. Check outer rings and exclude holes.
  function pointInRing(lng,lat,ring){
    let inside=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const [x,y]=ring[i], [prevX,prevY]=ring[j];
      if((y>lat)!==(prevY>lat)&&lng<
        (prevX-x)*(lat-y)/(prevY-y)+x)inside=!inside;
    }
    return inside;
  }
  function pointInCountry(lng,lat,geometry){
    if(!geometry)return false;
    const polygons=geometry.type==="Polygon"?[geometry.coordinates]:
      geometry.type==="MultiPolygon"?geometry.coordinates:[];
    return polygons.some(rings=>
      Array.isArray(rings)&&rings.length>0&&pointInRing(lng,lat,rings[0])&&
      !rings.slice(1).some(hole=>pointInRing(lng,lat,hole)));
  }
  function codeForCountryFeature(feature){
    const info=feature?.properties||{};
    return [info.ISO_A2,info.ISO_A2_EH,info.POSTAL,info.WB_A2]
      .find(code=>typeof code==="string"&&COUNTRY_INSIGHTS[code]&&
        COUNTRY_CODES.includes(code))||null;
  }
  async function selectCountryPoint(lat,lng){
    const session=game,request=++rushCountryRequest;
    selected=null;
    $("guessBtn").disabled=true;
    $("selectedText").textContent=t("rushCheckingMap");
    try{
      const features=await rushCountryFeatures();
      if(game!==session||!isCountryGame()||game.finished||
        (isRush()&&!game.started)||
        request!==rushCountryRequest)return;
      clockTick();
      if(game.finished)return;
      const feature=features.find(item=>
        codeForCountryFeature(item)&&pointInCountry(lng,lat,item.geometry));
      const countryCode=feature&&codeForCountryFeature(feature);
      if(!countryCode||alreadyGuessed(countryCode)){
        selected=null;
        $("selectedText").textContent=t("noSelection");
        $("countrySearch").value="";
        $("guessBtn").disabled=true;
        renderMap();
        toast(countryCode?deductionText("alreadyGuessed"):t("rushNoCountry"));return;
      }
      selected={lat,lng,label:displayRegion(countryCode),countryCode};
      $("selectedText").textContent=selected.label;
      $("countrySearch").value=selected.label;
      hideSuggestions();
      $("guessBtn").disabled=false;
      if(isMobileScreen()){
        mobilePanel="guess";
        syncMobilePanels();
      }
      renderMap();
    }catch(error){
      if(game!==session||request!==rushCountryRequest)return;
      $("selectedText").textContent=t("noSelection");
      toast(t("rushMapUnavailable"));
    }
  }
  function selectPoint(lat,lng,label){
    if(game.finished||!game.started)return;
    if(isCountryGame()){
      if(!game.started)return;
      selectCountryPoint(Number(lat),Number(lng));
      return;
    }
    selected={lat:Number(lat),lng:Number(lng),label:label||""};
    // A map click only places the pin; city search may recenter without forcing zoom during a drag.
    if(map&&label)map.easeTo({center:[selected.lng,selected.lat],zoom:Math.max(map.getZoom(),4),duration:350});
    $("guessBtn").disabled=false;
    $("selectedText").textContent=selected.label||selected.lat.toFixed(3)+"°, "+selected.lng.toFixed(3)+"°";
    hideSuggestions();
    renderMap();
  }
  function reveal(){
    if(game?.ranked){rankedAction("reveal");return;}
    if(game.finished||!game.started||isRush()||game.revealed>=cluesFor(game.index,difficulty).length)return;
    const cost=nextHintCost();
    if(!cost)return;
    if(!Number.isInteger(game.paidHints))
      game.paidHints=Math.round(game.penalty/HINT_COST); // Legacy daily cases.
    game.revealed++;
    game.penalty+=cost;
    game.paidHints++;
    save();renderClues();toast(t("hintUsed",{cost:number(cost)}));
  }
  function alreadyGuessed(code){
    return game.guesses.some(guess=>guess.countryCode===code);
  }
  function guess(){
    if(!game?.started||game.finished||game.pending||!selected?.countryCode)return;
    if(alreadyGuessed(selected.countryCode)){
      toast(deductionText("alreadyGuessed"));
      return;
    }
    if(game.ranked){
      if(!selected?.countryCode)return;
      rankedAction("guess",{code:selected.countryCode});return;
    }
    clockTick();
    if(!selected||game.finished||!selected.countryCode)return;
    const now=Date.now(),elapsed=Math.max(0,now-game.startedAt);
    if(isRush()&&elapsed>=RUSH_DURATION_MS){clockTick();return}
    const feedback=game.evidenceVersion===7?null:CLUE_ENGINE.guessFeedback(
      COUNTRIES[COUNTRY_CODES.indexOf(selected.countryCode)],COUNTRIES[game.index],difficulty);
    game.guesses.push({lat:selected.lat,lng:selected.lng,label:selected.label,
      countryCode:selected.countryCode,at:new Date(now).toISOString(),elapsedMs:elapsed,feedback});
    game.won=selected.countryCode===COUNTRY_CODES[game.index];
    if(game.won||game.guesses.length>=maximum()){
      game.finished=true;game.revealed=cluesFor(game.index,difficulty).length;
      game.endedAt=new Date(now).toISOString();game.durationMs=elapsed;
      game.score=CLUE_ENGINE.scoreFor({
        difficulty,guesses:game.guesses.length,penalty:game.penalty,
        sectorMapPenalty:game.sectorMapPenalty||0,elapsedMs:elapsed,won:game.won
      });
    }else if(!isRush()){
      game.revealed=CLUE_ENGINE.revealAfterMiss(game.revealed,difficulty,game.guesses.length,
        cluesFor(game.index,difficulty).length,game.evidenceVersion);
    }
    save();selected=null;
    if(isMobileScreen()){
      $("countrySearch").blur?.(); // Dismiss mobile keyboard on confirmation.
      mobilePanel=game.finished?null:"clues";
    }
    render();
    if(game.finished)showReport();
  }
  function searchLocal(term){
    const q=norm(term),results=[];
    for(const code of COUNTRY_CODES.slice().sort((a,b)=>
      displayRegion(a).localeCompare(displayRegion(b),locale()))){
      if(alreadyGuessed(code))continue;
      const name=displayRegion(code);
      if(!norm(name).includes(q)&&!norm(code).includes(q)&&
        !norm(COUNTRIES[COUNTRY_CODES.indexOf(code)].name).includes(q))continue;
      const index=COUNTRY_CODES.indexOf(code),country=COUNTRIES[index];
      results.push({name,description:code,lat:country.lat,lon:country.lng,
        countryCode:code});
      if(results.length===7)break;
    }
    return results;
  }
  function hideSuggestions(){
    $("suggestions").classList.add("hidden");
    $("countrySearch").setAttribute("aria-expanded","false");
    $("countrySearch").setAttribute("aria-activedescendant","");
  }
  function setActiveSuggestion(index){
    if(!suggestionOptions.length)return;
    activeSuggestionIndex=(index+suggestionOptions.length)%suggestionOptions.length;
    suggestionOptions.forEach(({button},i)=>{
      const active=i===activeSuggestionIndex;
      button.classList.toggle("active",active);
      button.setAttribute("aria-selected",String(active));
    });
    const button=suggestionOptions[activeSuggestionIndex].button;
    $("countrySearch").setAttribute("aria-activedescendant",button.id);
    button.scrollIntoView?.({block:"nearest"});
  }
  function chooseSuggestion(item,confirm=false){
    if(game.finished||!game.started||game.pending||alreadyGuessed(item.countryCode))return;
    selected={lat:item.lat,lng:item.lon,label:item.name,countryCode:item.countryCode};
    $("guessBtn").disabled=false;
    $("selectedText").textContent=item.name;
    $("countrySearch").value=item.name;
    hideSuggestions();
    // Pressing Enter is the equivalent of clicking Confirm guess, while
    // clicking a suggestion only selects it and displays its + map pin.
    if(confirm)guess();
    else renderMap();
  }
  function suggestions(items){
    const list=$("suggestions");
    list.replaceChildren();
    suggestionOptions=[];
    activeSuggestionIndex=0;
    if(!items.length){
      const empty=document.createElement("div");
      empty.className="suggestion-empty";
      empty.textContent=t("noResults");
      list.append(empty);
    }
    for(let i=0;i<items.length&&i<7;i++){
      const item=items[i];
      const button=document.createElement("button");
      button.type="button";button.className="suggestion";
      button.id="country-suggestion-"+i;
      button.setAttribute("role","option");
      button.setAttribute("aria-selected","false");
      button.textContent=item.name;
      const desc=document.createElement("small");
      desc.textContent=item.description;
      button.append(desc);
      button.addEventListener("click",()=>chooseSuggestion(item));
      list.append(button);
      suggestionOptions.push({item,button});
    }
    list.classList.remove("hidden");
    $("countrySearch").setAttribute("aria-expanded","true");
    if(suggestionOptions.length)setActiveSuggestion(0);
    else $("countrySearch").setAttribute("aria-activedescendant","");
  }
  async function share(){
    const symbols=game.guesses.map(g=>g.countryCode===COUNTRY_CODES[game.index]?"✓":"×").join("");
    const attempts=isRush()?String(game.guesses.length):game.guesses.length+"/"+maximum();
    const txt="Cartigma "+caseCode()
      +"\n"+(game.won?"✓ "+attempts:"×")+" · "+number(game.score)+" pts\n"+symbols
      +"\nhttps://f404x.github.io/cartigma/";
    try{
      if(navigator.share){await navigator.share({text:txt});return}
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(txt);toast(t("copied"));return}
      const ta=document.createElement("textarea");ta.value=txt;ta.style.position="fixed";ta.style.opacity="0";document.body.append(ta);ta.select();
      const ok=document.execCommand("copy");ta.remove();if(!ok)throw Error("copy failed");toast(t("copied"));
    }catch(e){if(e.name!=="AbortError")toast(t("shareError"))}
  }

  // Basemap display settings only. Purchased case clues are NEVER filtered.
  const MAP_FILTER_INPUTS=Object.freeze({
    borders:"mapFilterBorders",regions:"mapFilterRegions",
    countryNames:"mapFilterCountryNames",cityNames:"mapFilterCityNames",
    roads:"mapFilterRoads",areas:"mapFilterAreas",water:"mapFilterWater",poi:"mapFilterPoi"
  });
  const MAP_FILTER_KEYS=Object.keys(MAP_FILTER_INPUTS);
  const MAP_FILTER_DEFAULTS=Object.freeze({
    borders:true,regions:true,countryNames:true,
    cityNames:true,roads:true,areas:true,water:true,poi:true
  });
  const MAP_FILTER_STORAGE="cartigma-map-filters-v1";
  const previousMapFilters=store.get(MAP_FILTER_STORAGE);
  let mapFilterPrefs=Object.fromEntries(MAP_FILTER_KEYS.map(key=>[
    key,typeof previousMapFilters?.[key]==="boolean"?previousMapFilters[key]:MAP_FILTER_DEFAULTS[key]
  ]));
  const originalLayerVisibility=new Map();
  let mapFiltersOpen=false;
  const filterText=key=>FILTER_TRANSLATIONS[lang]?.[key]||FILTER_TRANSLATIONS.en?.[key]||key;

  function mapFilterCategory(layer){
    if(!layer?.id||/^(case-|map-filter-)/.test(layer.id))return null;
    const id=(layer.id+" "+(layer["source-layer"]||"")).toLowerCase();
    if(layer.type==="symbol"){
      if(/(poi|amenity|shop|tourism|attraction|museum|airport|station|housenumber)/.test(id))return "poi";
      if(/(road|route|transportation|highway|motorway|rail|transit|shield)/.test(id))return "roads";
      if(/(country|continent|nation)/.test(id))return "countryNames";
      if(/(state|province|region|district|admin|suburb|neighbou?rhood)/.test(id))return "regions";
      if(/(city|town|village|settlement|place|hamlet|locality)/.test(id))return "cityNames";
      if(/(river|stream|lake|water|ocean|sea|canal)/.test(id))return "water";
      return null;
    }
    if(layer.type==="line"){
      if(/(boundary|border|admin)/.test(id))
        return /(country|national|admin[_ -]?0|level[_ -]?0|boundary_0)/.test(id)?"borders":"regions";
      if(/(road|transportation|highway|motorway|rail|route|path|track|street|bridge|tunnel)/.test(id))return "roads";
      if(/(river|stream|waterway|canal)/.test(id))return "water";
      return null;
    }
    if(layer.type==="fill"||layer.type==="fill-extrusion"){
      if(/(park|landcover|landuse|wood|forest|nature|grass|green|protected|landscape)/.test(id))return "areas";
      if(/(water|lake|reservoir|river)/.test(id))return "water";
    }
    return null;
  }

  function applyMapFilters(){
    if(!map||!mapStyleReady||activeMapStyle!=="vector"
       ||typeof map.setLayoutProperty!=="function")return;
    for(const layer of map.getStyle?.()?.layers||[]){
      const category=mapFilterCategory(layer);
      if(!category)continue;
      if(!originalLayerVisibility.has(layer.id))
        originalLayerVisibility.set(layer.id,layer.layout?.visibility||"visible");
      const visibility=mapFilterPrefs[category]?originalLayerVisibility.get(layer.id):"none";
      try{map.setLayoutProperty(layer.id,"visibility",visibility)}
      catch(error){console.warn("Could not filter map layer",layer.id,error)}
    }
  }

  function syncMapFiltersUI(){
    for(const key of MAP_FILTER_KEYS)$(MAP_FILTER_INPUTS[key]).checked=mapFilterPrefs[key];
    $("mapFiltersTitle").textContent=filterText("title");
    $("mapFiltersSubtitle").textContent=filterText("subtitle");
    $("mapFiltersGeography").textContent=filterText("geography");
    $("mapFiltersDetails").textContent=filterText("details");
    $("mapFiltersNote").textContent=filterText("note");
    $("mapFiltersReset").textContent=filterText("reset");
    $("mapFiltersClose").setAttribute("aria-label",filterText("close"));
    $("mapFiltersClose").title=filterText("close");
    const gear=$("mapFiltersButton");
    const available=activeMapStyle==="vector"&&!mapSwitching;
    gear.disabled=!available;
    gear.setAttribute("aria-label",filterText("gear"));
    gear.title=available?filterText("gear"):filterText("vectorOnly");
    for(const el of document.querySelectorAll("[data-map-filter-label]")){
      el.textContent=filterText(el.dataset.mapFilterLabel);
    }
  }

  function closeMapFilters(focus=false){
    if(!mapFiltersOpen)return;
    mapFiltersOpen=false;
    $("mapFiltersPopover").classList.add("hidden");
    $("mapFiltersButton").setAttribute("aria-expanded","false");
    if(focus)$("mapFiltersButton").focus?.();
  }
  function toggleMapFilters(){
    if(activeMapStyle!=="vector"||mapSwitching)return;
    if(mapFiltersOpen){closeMapFilters();return}
    mapFiltersOpen=true;
    $("mapFiltersPopover").classList.remove("hidden");
    $("mapFiltersButton").setAttribute("aria-expanded","true");
  }
  function updateMapFilter(key,checked){
    if(!MAP_FILTER_KEYS.includes(key)||typeof checked!=="boolean")return;
    mapFilterPrefs[key]=checked;
    store.set(MAP_FILTER_STORAGE,mapFilterPrefs);
    syncMapFiltersUI();
    applyMapFilters();
  }
  function resetMapFilters(){
    mapFilterPrefs={...MAP_FILTER_DEFAULTS};
    store.set(MAP_FILTER_STORAGE,mapFilterPrefs);
    syncMapFiltersUI();
    applyMapFilters();
  }
  function initMapFiltersUI(){
    $("mapFiltersButton").addEventListener("click",toggleMapFilters);
    $("mapFiltersClose").addEventListener("click",()=>closeMapFilters(true));
    $("mapFiltersReset").addEventListener("click",resetMapFilters);
    for(const key of MAP_FILTER_KEYS)
      $(MAP_FILTER_INPUTS[key]).addEventListener("change",event=>
        updateMapFilter(key,Boolean(event.target.checked)));
    document.addEventListener("pointerdown",event=>{
      if(mapFiltersOpen&&!$("mapStylePicker").contains(event.target))closeMapFilters();
    });
    document.addEventListener("keydown",event=>{
      if(mapFiltersOpen&&event.key==="Escape")closeMapFilters(true);
    });
    syncMapFiltersUI();
  }

  function syncMapStylePicker(){
    const buttons=[["vector","mapVectorBtn"],["osm","mapOsmBtn"]];
    for(const [style,id] of buttons){
      const button=$(id);
      if(!button)continue;
      button.classList.toggle("active",activeMapStyle===style);
      button.setAttribute("aria-pressed",String(activeMapStyle===style));
      button.disabled=mapSwitching;
    }
    if(activeMapStyle!=="vector"||mapSwitching)closeMapFilters();
    syncMapFiltersUI();
  }
  function currentMapView(){
    const center=map?.getCenter?.();
    return {
      center:center&&Number.isFinite(center.lng)&&Number.isFinite(center.lat)
        ?[center.lng,center.lat]:[8,15],
      zoom:map?.getZoom?.()||1.7
    };
  }
  async function setMapStyle(style,savePreference=true){
    if((style!=="osm"&&style!=="vector")||mapSwitching)return;
    if(style===activeMapStyle&&map)return;
    mapSwitching=true;syncMapStylePicker();
    const view=currentMapView();
    try{
      const engine=await window.GeoMapLoader.load(style);
      clearTimeout(mapStyleTimeout);
      mapPointerController?.abort();
      clearCasePins();
      if(map){try{map.remove()}catch(error){console.warn(error)}}
      $("map").replaceChildren();
      map=null;mapStyleReady=false;
      pointerDown=null;pointerMoved=false;lastDragAt=Date.now();
      window.maplibregl=engine;
      activeMapStyle=style;
      initMap(view);
      if(savePreference)store.set("geodetective-map-style",style);
    }catch(error){
      console.error("Map style unavailable:",style,error);
      toast(t("noMap"));
    }finally{
      mapSwitching=false;syncMapStylePicker();
    }
  }
  async function switchToFallback(reason){
    if(fallbackSwitching||activeMapStyle==="osm")return;
    fallbackSwitching=true;
    clearTimeout(mapStyleTimeout);
    console.warn("Switching to OpenStreetMap:",reason);
    try{
      // Do not overwrite the user's preferred style when falling back automatically.
      await setMapStyle("osm",false);
    }finally{fallbackSwitching=false}
  }
  function activeMapTheme(){
    return document.documentElement.getAttribute?.("data-theme")==="light"?"light":"dark";
  }
  function vectorMapStyle(){
    // Public OpenFreeMap styles, with no API keys or custom tile providers.
    return "https://tiles.openfreemap.org/styles/"+
      (activeMapTheme()==="light"?"positron":"dark");
  }
  function updateMapTheme(){
    if(!map||window.maplibregl?.isFallback)return; // Raster tiles follow CSS.
    if(typeof map.setStyle!=="function")return;
    mapStyleReady=false;
    originalLayerVisibility.clear();
    try{map.setStyle(vectorMapStyle())}
    catch(error){console.warn("Could not apply map theme:",error);}
  }
  function initMap(initialView={center:[8,15],zoom:1.7}){
    const libre=window.maplibregl;
    // Some supported MapLibre versions omit supported(); its absence is not a failure.
    if(!libre||typeof libre.Map!=="function"||
        (typeof libre.supported==="function"&&!libre.supported())){
      if(window.GeoMapFallback && !fallbackSwitching){
        switchToFallback("MapLibre unavailable");
      }else{
        $("map").textContent=t("noMap");
      }
      return;
    }
    originalLayerVisibility.clear();
    try {
      map=new libre.Map({
        container:"map",
        style:vectorMapStyle(),
        center:initialView.center,
        zoom:initialView.zoom,minZoom:1.2,maxZoom:16,
        attributionControl:true,
        fadeDuration:0, // Eliminate delayed fade-out of Equator arrows.
        bearing:0,pitch:0,maxPitch:0,
        dragRotate:false,touchPitch:false,pitchWithRotate:false,
        doubleClickZoom:false
      });
    }catch(error){
      console.error("Map engine could not initialize:",error);
      if(!libre.isFallback) switchToFallback(error);
      else $("map").textContent=t("noMap");
      return;
    }
    // Pin the map north-up on mouse, keyboard and multitouch controls.
    map.touchZoomRotate?.disableRotation?.();
    map.keyboard?.disableRotation?.();
    map.addControl(new libre.NavigationControl({showCompass:false}),"bottom-left");
    map.on("style.load",()=>{
      clearTimeout(mapStyleTimeout);
      mapStyleReady=true;
      configureMapLabelDensity();
      updateMapLanguage();
      applyMapFilters();
      if(game){renderMap();renderClues();}
    });
    if(!libre.isFallback){
      map.on("error",event=>{
        // Individual missing vector tiles may be transient; only fail over when
        // the style itself has not loaded.
        if(!mapStyleReady)switchToFallback(event.error?.message||"Style failed to load");
      });
      mapStyleTimeout=setTimeout(()=>{
        if(!mapStyleReady)switchToFallback("Map style timeout");
      },9000);
    }
    map.on("dragstart",()=>{pointerMoved=true;lastDragAt=Date.now()});
    map.on("dragend",()=>{pointerMoved=true;lastDragAt=Date.now()});
    mapPointerController?.abort();
    mapPointerController=new AbortController();
    const canvas=map.getCanvas();
    const pointerOptions={signal:mapPointerController.signal};
    canvas.addEventListener("pointerdown",event=>{
      if(event.button!==0&&event.pointerType==="mouse")return;
      pointerDown={x:event.clientX,y:event.clientY};
      pointerMoved=false;
    },pointerOptions);
    canvas.addEventListener("pointermove",event=>{
      if(pointerDown&&Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>8)
        pointerMoved=true;
    },pointerOptions);
    canvas.addEventListener("pointerup",event=>{
      if(pointerDown&&Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>8)
        pointerMoved=true;
      pointerDown=null;
    },pointerOptions);
    canvas.addEventListener("pointercancel",()=>{
      pointerMoved=true;pointerDown=null;lastDragAt=Date.now();
    },pointerOptions);
    map.on("click",event=>{
      // A drag release must never be interpreted as a fresh pin.
      if(game.finished||!game.started||pointerMoved||Date.now()-lastDragAt<220)return;
      selectPoint(event.lngLat.lat,event.lngLat.lng,"");
    });
  }
  function init(){
    if(COUNTRIES.length!==195||
       new Set(COUNTRY_CODES).size!==195||
       COUNTRIES.some(c=>!COUNTRY_INSIGHTS[c.code]||
         !Number.isFinite(c.lat)||!Number.isFinite(c.lng)||!c.mask))
      throw new Error("195-country catalogue is incomplete");
    document.documentElement.lang="en";
    $("difficultySelect").value=difficulty;
    $("langSelect").value=lang;
    initMap();
    // Reconcile canvas size with the phone's square map after rotation,
    // split-screen changes or mobile browser toolbar resizing.
    if(typeof ResizeObserver!=="undefined"){
      const observer=new ResizeObserver(()=>map?.resize?.());
      observer.observe($("map"));
    }
    $("dailyBtn").addEventListener("click",startDaily);
    $("freeBtn").addEventListener("click",startFree);
    $("difficultySelect").addEventListener("change",e=>setDifficulty(e.target.value));
    $("langSelect").addEventListener("change",e=>setLanguage(e.target.value));
    window.addEventListener?.("geodetective:themechange",updateMapTheme);
    $("revealBtn").addEventListener("click",reveal);
    $("guessBtn").addEventListener("click",guess);
    $("rushStartBtn").addEventListener("click",()=>startCase());
    $("offlineStartBtn").addEventListener("click",()=>startCase(true));
    $("mobileEvidenceBtn").addEventListener("click",()=>setMobilePanel("clues"));
    $("mobileGuessBtn").addEventListener("click",()=>setMobilePanel("guess"));
    $("mobileReportBtn").addEventListener("click",()=>{
      if(game?.finished)showReport();
    });
    $("resetViewBtn").addEventListener("click",resetMapView);
    $("mapVectorBtn").addEventListener("click",()=>setMapStyle("vector"));
    $("mapOsmBtn").addEventListener("click",()=>setMapStyle("osm"));
    initMapFiltersUI();
    syncMapStylePicker();
    $("reportOpenBtn").addEventListener("click",showReport);
    $("newCaseBtn").addEventListener("click",startFree);
    $("reportCloseBtn").addEventListener("click",closeReport);
    $("reportMapBtn").addEventListener("click",()=>{
      closeReport();
      if(isMobileScreen()){
        // Leave the map unobstructed, with all three bottom controls usable.
        mobilePanel=null;
        syncMobilePanels();
      }
      // Normal, Hard and Rush all reveal a country-answer marker. Make sure
      // 'View map' always takes the player to it, including tiny Lesotho.
      if(game.finished&&map){
        const answer=COUNTRIES[game.index];
        map.easeTo({center:[answer.lng,answer.lat],
          zoom:Math.max(4,Math.min(map.getZoom(),6)),duration:450});
      }
    });
    $("reportNextBtn").addEventListener("click",()=>{closeReport();startFree()});
    $("reportAlternateBtn").addEventListener("click",()=>{
      if(!game?.finished)return;
      if(game.mode==="free"){
        closeReport();
        startDaily();
        return;
      }
      const other=difficulty==="normal"?"hard":"normal";
      if(!otherDailyAvailable(other))return;
      closeReport();
      setDifficulty(other);
    });
    $("reportShareBtn").addEventListener("click",share);
    initAtlas();
    $("helpBtn").addEventListener("click",()=>$("helpDialog").showModal());
    $("closeHelpBtn").addEventListener("click",()=>$("helpDialog").close());
    $("startHelpBtn").addEventListener("click",()=>$("helpDialog").close());
    $("helpDialog").addEventListener("click",e=>{if(e.target===$("helpDialog"))$("helpDialog").close()});
    $("countrySearch").addEventListener("input",e=>{
      const term=e.target.value.trim();
      if(term.length<1){hideSuggestions();suggestionOptions=[];return}
      suggestions(searchLocal(term));
      // Local country catalogue only; no city geocoder or network search.
    });
    $("countrySearch").addEventListener("keydown",e=>{
      if(e.isComposing||e.keyCode===229||game.finished||
        !game.started)return;
      if(e.key==="Escape"){
        hideSuggestions();
        return;
      }
      if(e.key==="ArrowDown"||e.key==="ArrowUp"){
        const term=$("countrySearch").value.trim();
        if(!term)return;
        e.preventDefault();
        const wasHidden=$("suggestions").classList.contains("hidden");
        if(wasHidden)suggestions(searchLocal(term));
        if(!suggestionOptions.length)return;
        setActiveSuggestion(wasHidden?(e.key==="ArrowDown"?0:suggestionOptions.length-1):
          activeSuggestionIndex+(e.key==="ArrowDown"?1:-1));
        return;
      }
      if(e.key!=="Enter")return;
      const term=$("countrySearch").value.trim();
      if(!term)return;
      e.preventDefault();
      const closed=$("suggestions").classList.contains("hidden");
      const options=closed?searchLocal(term).map(item=>({item})):suggestionOptions;
      // Enter without arrow navigation confirms the first country.
      // After using the arrows, it confirms the highlighted country.
      const match=options[closed?0:activeSuggestionIndex];
      if(match)chooseSuggestion(match.item,true);
    });
    document.addEventListener("click",e=>{
      if(!e.target.closest(".search-wrap"))hideSuggestions();
      if(isMobileScreen()&&mobilePanel&&
        !e.target.closest(".case-card")&&!e.target.closest(".map-card")){
        mobilePanel=null;syncMobilePanels();
      }
    });
    document.addEventListener("keydown",event=>{
      if(event.key!=="Escape"||!isMobileScreen()||!mobilePanel||
        $("reportDialog").open)return;
      mobilePanel=null;syncMobilePanels();
      event.preventDefault();
    });
    startDaily();
    setLanguage(lang);
    if(typeof setInterval==="function")setInterval(clockTick,250);
    document.addEventListener("visibilitychange",()=>{
      if(!document.hidden&&game?.mode==="daily"&&game.date!==today())startDaily();
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();