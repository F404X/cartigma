/* GeoDetective — game engine · no framework, no account, no API key. */
(() => {
  "use strict";
  const PLACES = window.GEODETECTIVE_PLACES || [];
  const TRANSLATIONS = window.GeoI18n?.PACKS || {};
  const CLUE_I18N = window.GeoCluesI18n || {};
  const LANGS = window.GeoI18n?.langNames || {};
  const REPORT_I18N = window.GeoReportI18n || {};
  const FACTS = window.GEODETECTIVE_FACTS || [];
  const COMPASS_I18N = window.GeoCompassI18n || {};
  const NEARBY_REFERENCES = window.GEODETECTIVE_NEARBY_REFERENCES || {};
  const DIFFICULTIES = {normal:{attempts:6,initial:2},hard:{attempts:4,initial:1}};
  const SERIAL_PREFIX = "geodetective-case-counter-";
  const WIN_RADIUS = 100, HINT_COST = 300, DAILY_KEY = "geodetective-daily-v3-";
  const COUNTRY_CODES = "IS NO NO NO FI SE DK GB FR PT IT GR TR MA EG SN NG KE ET ZA MG AE JO IL IN IN IN NP BD TH SG ID ID JP JP KR CN CN CN TW MN KZ AU AU AU AU NZ NZ FJ PF CA US US US US MX MX CU GT CO EC PE PE BO BR BR BR BR BR BR AR CL AR CL".split(" ");
  const FEATURES = "volcanic fjord polar fjord coast islands coast river river estuary river mountains strait desert desert peninsula delta plateau plateau peninsula plateau desert plateau mountains coast plain delta mountains delta delta islands delta islands coast mountains river plain delta bay mountains plateau mountains harbor coast coast islands volcanic harbor islands volcanic coast estuary bay mountains islands plateau plateau coast volcanic plateau mountains desert mountains plateau plateau plateau forest bay plateau bay estuary mountains islands strait".split(" ");
  const LANDMARKS = [
    "Hallgrímskirkja","Arctic Cathedral","Svalbard Global Seed Vault","Vigeland Sculpture Park","Suomenlinna","Gamla Stan","Nyhavn","Tower Bridge",
    "Eiffel Tower","Belém Tower","Colosseum","Acropolis","Hagia Sophia","Jemaa el-Fnaa","Pyramids of Giza","Gorée Island",
    "Lekki Conservation Centre","Nairobi National Park","African Union headquarters","Table Mountain","Rova of Antananarivo",
    "Burj Khalifa","Amman Citadel","Old City of Jerusalem","Gateway of India","India Gate","Victoria Memorial","Swayambhunath",
    "Lalbagh Fort","Grand Palace","Marina Bay Sands","Monas National Monument","Bajra Sandhi Monument","Tokyo Skytree",
    "Fushimi Inari Shrine","Gyeongbokgung Palace","Forbidden City","The Bund","Victoria Harbour","Taipei 101",
    "Sükhbaatar Square","Medeu","Sydney Opera House","Federation Square","Kings Park","kunanyi / Mount Wellington",
    "Sky Tower","The Beehive","Fiji Museum","Papeete Market","Stanley Park","Statue of Liberty","Golden Gate Bridge",
    "Flattop Mountain","Waikiki Beach","Palacio de Bellas Artes","Teatro Degollado","Malecón","National Palace of Culture",
    "Monserrate","Mitad del Mundo","Plaza Mayor","Sacsayhuamán","Mi Teleférico","National Congress","Art Deco architecture",
    "Meeting of the Waters","Sugarloaf Mountain","Paulista Avenue","Pelourinho","Casa Rosada","Cerro San Cristóbal",
    "Beagle Channel","Strait of Magellan"
  ];
  const CAPITALS = new Set("Reykjavík|Oslo|Helsinque|Estocolmo|Copenhague|Londres|Paris|Lisboa|Roma|Atenas|Cairo|Dacar|Nairóbi|Adis Abeba|Antananarivo|Amã|Nova Délhi|Catmandu|Daca|Bangcoc|Singapura|Tóquio|Seul|Pequim|Ulan Bator|Wellington|Suva|Cidade do México|Havana|Cidade da Guatemala|Bogotá|Quito|Lima|Brasília|Buenos Aires|Santiago".split("|"));
  const EN_CITY = {
    "Estocolmo":"Stockholm","Copenhague":"Copenhagen","Londres":"London","Lisboa":"Lisbon",
    "Roma":"Rome","Atenas":"Athens","Istambul":"Istanbul","Cidade do Cabo":"Cape Town",
    "Nairóbi":"Nairobi","Adis Abeba":"Addis Ababa","Amã":"Amman",
    "Nova Délhi":"New Delhi","Calcutá":"Kolkata","Catmandu":"Kathmandu","Daca":"Dhaka",
    "Bangcoc":"Bangkok","Singapura":"Singapore","Jacarta":"Jakarta","Tóquio":"Tokyo",
    "Quioto":"Kyoto","Seul":"Seoul","Pequim":"Beijing","Xangai":"Shanghai",
    "Taipé":"Taipei","Ulan Bator":"Ulaanbaatar","Nova York":"New York",
    "São Francisco":"San Francisco","Cidade do México":"Mexico City",
    "Cidade da Guatemala":"Guatemala City"
  };
  const $ = id => document.getElementById(id);
  const hash = input => {let h=2166136261;for(const char of input){h ^=char.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0;};
  const norm = s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
  const rad = n => n*Math.PI/180;
  const dist = (a,b) => {
    const la=rad(b[0]-a[0]),lo=rad(b[1]-a[1]);
    const h=Math.sin(la/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(lo/2)**2;
    return 6371.0088*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
  };
  const heading = (a,b) => {
    const y=Math.sin(rad(b[1]-a[1]))*Math.cos(rad(b[0]));
    const x=Math.cos(rad(a[0]))*Math.sin(rad(b[0]))-Math.sin(rad(a[0]))*Math.cos(rad(b[0]))*Math.cos(rad(b[1]-a[1]));
    return (Math.atan2(y,x)*180/Math.PI+360)%360;
  };
  const direction = bearing => {
    const idx=Math.round(bearing/45)%8;
    const labels=COMPASS_I18N[lang]?.names||COMPASS_I18N.en?.names||["N","NE","E","SE","S","SW","W","NW"];
    const arrows=["↑","↗","→","↘","↓","↙","←","↖"];
    return labels[idx]+" "+arrows[idx];
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
  let game = null, selected = null, map = null, marker = null, overlayMarkers = [], freeIndex = -1;
  let activeLine=false, mapStyleReady=false, lastDragAt=0, pointerDown=null, pointerMoved=false;
  let fallbackSwitching=false, mapStyleTimeout=null;
  let controller = null, debounce = null, toastTimer = null;

  function t(key, variables={}) {
    const template = REPORT_I18N[lang]?.[key] ?? TRANSLATIONS[lang]?.[key] ?? REPORT_I18N.en?.[key] ?? TRANSLATIONS.en?.[key] ?? key;
    return template.replace(/\{(\w+)\}/g,(_,name)=>String(variables[name]??""));
  }
  function tc(key,variables={}) {
    const template = CLUE_I18N[lang]?.templates?.[key] ?? CLUE_I18N.en?.templates?.[key] ?? key;
    return template.replace(/\{(\w+)\}/g,(_,name)=>String(variables[name]??""));
  }
  function locale() {return LANGS[lang] || "en";}
  function number(value){return Math.round(value).toLocaleString(locale())}
  function displayRegion(code){
    try{return new Intl.DisplayNames([locale()],{type:"region"}).of(code)}catch{return code}
  }
  function cityName(p) {return lang==="pt"?p[0]:(EN_CITY[p[0]]||p[0]);}
  function countryName(index){return displayRegion(COUNTRY_CODES[index])}
  function continentKey(index){
    if(index<=12)return "europe";
    if(index<=20)return "africa";
    if(index<=41)return "asia";
    if(index<=49)return "oceania";
    if(index<=58)return "northAmerica";
    return "southAmerica";
  }
  function continentName(index){
    const key=continentKey(index);
    return CLUE_I18N[lang]?.continents?.[key] || CLUE_I18N.en?.continents?.[key] || key;
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
  function locationFeature(index) {
    // Naming the river is more useful than the generic clue "river valleys".
    const rivers={7:"Thames",8:"Seine",10:"Tiber",35:"Han"};
    if(rivers[index]){
      const template=COMPASS_I18N[lang]?.river||COMPASS_I18N.en?.river||"Along the {name} River";
      return template.replace("{name}",rivers[index]);
    }
    const key = FEATURES[index] || "plain";
    return CLUE_I18N[lang]?.features?.[key] || CLUE_I18N.en?.features?.[key] || key;
  }
  function latitudeZone(latitude) {
    const a=Math.abs(latitude);
    const key=a<10?"equatorial":a<23.5?"tropical":a<35?"subtropical":a<55?"temperate":a<66.5?"subpolar":"polar";
    return CLUE_I18N[lang]?.zones?.[key] || CLUE_I18N.en?.zones?.[key] || key;
  }
  function cityAt(index){return PLACES[index]}
  function cityCoords(index){return [PLACES[index][3],PLACES[index][4]]}
  function nearestOther(index) {
    let best=-1,minimum=Infinity;
    for(let i=0;i<PLACES.length;i++){
      if(i===index)continue;
      const d=dist(cityCoords(index),cityCoords(i));
      if(d<minimum){best=i;minimum=d}
    }
    return {index:best,km:minimum};
  }
  function regionalHintRadius(index, level){
    // Use the geographic spread of the target's region, not a universal 1,000 km cap.
    // Sparse/large regions need longer references; dense regions get a smaller radius.
    const base={europe:2000,africa:2600,asia:2700,oceania:2500,
      northAmerica:2500,southAmerica:2300};
    const region=continentKey(index);
    const center=cityCoords(index);
    const neighbors=PLACES.map((_,i)=>({
      i,km:dist(center,cityCoords(i))
    })).filter(item=>item.i!==index&&continentKey(item.i)===region)
      .sort((a,b)=>a.km-b.km);
    const localScale=neighbors[Math.min(2,neighbors.length-1)]?.km||base[region];
    const normalRadius=Math.max(base[region],base[region]*0.55+localScale*0.65);
    const modifier=level==="hard"?1.2:1;
    return Math.round(Math.min(6000,Math.min(5200,normalRadius)*modifier)/100)*100;
  }
  function anchorDistances(index,level) {
    const radius=regionalHintRadius(index,level);
    const origin=cityCoords(index),region=continentKey(index);
    const items=[];
    for(let i=0;i<PLACES.length;i++){
      if(i===index)continue;
      const km=dist(origin,cityCoords(i));
      if(km<=radius&&km>=10)
        items.push({name:cityName(cityAt(i)),country:COUNTRY_CODES[i],
          km,regional:continentKey(i)===region});
    }
    for(const [name,country,lat,lng] of NEARBY_REFERENCES[index]||[]){
      const km=dist(origin,[lat,lng]);
      if(km<=radius&&km>=10)
        items.push({name,country,km,regional:true});
    }
    const unique=new Map();
    for(const item of items) {
      const key=norm(item.name);
      if(!unique.has(key)||unique.get(key).km>item.km)unique.set(key,item);
    }
    return [...unique.values()].sort((a,b)=>a.km-b.km);
  }
  function roundedHintDistance(km,level,radius){
    const step=level==="hard"?(radius>=3200?500:250):(radius>=3000?200:100);
    return Math.min(radius,Math.max(step,Math.round(km/step)*step));
  }
  function referenceName(item){
    return item.name+", "+displayRegion(item.country);
  }
  function cluesFor(index,level){
    const p=cityAt(index);
    const radius=regionalHintRadius(index,level);
    const anchors=anchorDistances(index,level);
    if(anchors.length<2)throw Error("Not enough regional references for "+p[0]);
    // Avoid a near-neighbor that instantly reveals the destination.
    // Prefer places in the same geographical region, about 65% of the local radius away.
    const regionAnchors=anchors.filter(a=>a.regional&&a.km>=radius*.30);
    const distantAnchors=anchors.filter(a=>a.km>=radius*.30);
    const options=regionAnchors.length?regionAnchors:(distantAnchors.length?distantAnchors:anchors);
    const desired=radius*.65;
    const chosen=options.reduce((best,item)=>{
      return Math.abs(item.km-desired)<Math.abs(best.km-desired)?item:best;
    },options[0]);
    const regionalComparison=anchors.filter(a=>a.regional&&a.km>=radius*.25);
    const comparison=regionalComparison.length>=2?regionalComparison:anchors;
    const nearIndex=Math.floor((comparison.length-1)*.22);
    const farIndex=Math.max(nearIndex+1,Math.ceil((comparison.length-1)*.83));
    const nearReference=comparison[nearIndex];
    const farReference=comparison[farIndex];
    const terrain={key:"terrain",value:locationFeature(index)};
    const zone={key:"zone",value:latitudeZone(p[3])};
    const capital={key:"capital",value:tc(CAPITALS.has(p[0])?"yes":"no")};
    const hemisphere={key:"hemisphere",value:tc(p[3]>=0?"north":"south")};
    const reliableCapital=!["Jerusalém","La Paz","Jacarta"].includes(p[0]);
    // Hemisphere, when used at all, comes BEFORE the continent clue.
    // It must never appear in a later evidence slot after the continent.
    const choice=hash("opening:"+p[0])%3;
    const opening=choice===2?hemisphere:(choice===0?terrain:zone);
    const third=reliableCapital&&hash("profile:"+p[0])%3===0?capital:
      (opening===terrain?zone:terrain);
    // Comparison replaces the precise "nearest city" clue, which was too revealing.
    const relationship={
      key:"closer",a:referenceName(nearReference),b:referenceName(farReference)
    };
    return [
      opening,
      {key:"continent",value:continentName(index)},
      third,
      {key:"distance",km:number(roundedHintDistance(chosen.km,level,radius)),city:referenceName(chosen)},
      relationship,
      {key:"landmark",name:LANDMARKS[index]}
    ];
  }
  function clueText(clue){return tc(clue.key,clue)}
  function maximum(){return DIFFICULTIES[difficulty].attempts}
  function dailyIndex(){
    return hash("GEODETECTIVE-v3|"+today()+"|"+difficulty)%PLACES.length;
  }
  function dailyStorageKey(){return DAILY_KEY+today()+"-"+difficulty}
  function nextCaseNumber(date=today()){
    const key=SERIAL_PREFIX+date;
    const previous=Number(store.get(key))||0;
    const count=Math.max(0,previous)+1;
    store.set(key,count);
    return count;
  }
  function newGame(mode,index) {
    return {mode,index,difficulty,date:today(),serial:nextCaseNumber(),guesses:[],
      revealed:DIFFICULTIES[difficulty].initial,penalty:0,finished:false,won:false,score:0};
  }
  function caseCode(){
    return "#"+difficulty[0].toUpperCase()+"-"+game.date.replaceAll("-","")+"-"+String(game.serial).padStart(2,"0");
  }
  function savedDaily(){
    const s=store.get(dailyStorageKey());
    return s&&s.mode==="daily"&&s.date===today()&&s.difficulty===difficulty&&s.index===dailyIndex()
      &&Array.isArray(s.guesses)&&s.guesses.length<=maximum()&&Number.isFinite(s.revealed)
      &&s.guesses.every(g=>Number.isFinite(g.lat)&&Number.isFinite(g.lng)&&Number.isFinite(g.distance))
      ?s:null;
  }
  function save(){if(game?.mode==="daily")store.set(dailyStorageKey(),game)}
  function chooseFree(){
    const options=PLACES.map((_,i)=>i).filter(i=>i!==freeIndex);
    freeIndex=options[Math.floor(Math.random()*options.length)];
    return freeIndex;
  }
  function startDaily(){
    game=savedDaily()||newGame("daily",dailyIndex());
    if(!Number.isInteger(game.serial)||game.serial<1){
      game.serial=nextCaseNumber(game.date);
      save();
    }
    save();
    selected=null;closeReport();render();resetMapView();
  }
  function startFree(){game=newGame("free",chooseFree());selected=null;closeReport();render();resetMapView()}
  function setDifficulty(level){
    if(!DIFFICULTIES[level]||level===difficulty)return;
    difficulty=level;store.set("geodetective-difficulty",level);
    if(game.mode==="daily")startDaily();else startFree();
  }
  function setLanguage(value){
    if(!TRANSLATIONS[value])return;
    lang=value;store.set("geodetective-language",lang);
    document.documentElement.lang=locale();
    document.documentElement.dir=["ar","he"].includes(lang)?"rtl":"ltr";
    $("langSelect").value=lang;
    updateCompassRose();
    const FLAGS={en:"🇺🇸",pt:"🇧🇷",es:"🇪🇸",zh:"🇨🇳",ja:"🇯🇵",ru:"🇷🇺",fr:"🇫🇷",de:"🇩🇪",it:"🇮🇹",nl:"🇳🇱",pl:"🇵🇱",sv:"🇸🇪",tr:"🇹🇷",ar:"🇸🇦",he:"🇮🇱",ko:"🇰🇷",th:"🇹🇭",vi:"🇻🇳",id:"🇮🇩"};
    $("languageFlag").textContent=FLAGS[lang]||"🌐";
    window.GeoLanguagePicker?.sync(lang);
    updateMapLanguage();
    document.querySelectorAll("[data-i18n]").forEach(element=>{element.textContent=t(element.dataset.i18n)});
    $("citySearch").placeholder=t("searchPlaceholder");
    $("helpBtn").setAttribute("aria-label",t("help"));
    $("resetViewBtn").title=t("reset");
    $("difficultySelect").value=difficulty;
    if(game)render();
  }
  function toast(text){
    const element=$("toast");element.textContent=text;element.classList.remove("hidden");
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>element.classList.add("hidden"),2800);
  }
  function renderClues(){
    const clues=cluesFor(game.index,difficulty);
    $("hintCount").textContent=game.revealed+" / "+clues.length;
    const list=$("clueList");list.replaceChildren();
    clues.forEach((clue,i)=>{
      const row=document.createElement("li");row.className="clue"+(i>=game.revealed?" locked":"");
      const idx=document.createElement("span");idx.className="clue-index";idx.textContent=String(i+1).padStart(2,"0");
      const body=document.createElement("span");body.className="clue-body";
      const category=document.createElement("span");category.className="clue-category";
      const categoryKey={
        terrain:"clueTerrain",continent:"clueRegion",zone:"clueClimate",
        hemisphere:"clueRegion",capital:"clueCivic",distance:"clueDistance",
        closer:"clueDistance",nearest:"clueDistance",landmark:"clueLandmark"
      }[clue.key]||"clueRegion";
      category.textContent=t(categoryKey);
      const value=document.createElement("span");value.className="clue-text";
      value.textContent=i<game.revealed?clueText(clue):t("locked");
      value.title=i<game.revealed?clueText(clue):t("locked");
      body.append(category,value);row.append(idx,body);list.append(row);
    });
    $("revealBtn").disabled=game.finished||game.revealed>=6;
    $("revealBtn").classList.toggle("hidden",game.finished);
  }
  function renderHistory(){
    const list=$("guessHistory");list.replaceChildren();
    $("historyCount").textContent=String(game.guesses.length).padStart(2,"0");
    if(!game.guesses.length){
      const li=document.createElement("li");li.className="empty-history";li.textContent=t("empty");list.append(li);return;
    }
    [...game.guesses].reverse().forEach((g,reversed)=>{
      const row=document.createElement("li");row.className="history-item";
      const label=document.createElement("span");
      const idx=document.createElement("span");idx.className="history-number";idx.textContent=String(game.guesses.length-reversed).padStart(2,"0");
      label.append(idx,document.createTextNode(g.label||g.lat.toFixed(2)+"°, "+g.lng.toFixed(2)+"°"));
      const distance=document.createElement("strong");distance.textContent=number(g.distance)+" km"+(difficulty==="hard"?"":" · "+direction(g.bearing));
      row.append(label,distance);list.append(row);
    });
  }
  function bestGuess(){
    if(!game.guesses.length)return null;
    return game.guesses.reduce((best,g)=>g.distance<best.distance?g:best,game.guesses[0]);
  }
  function factFor(index){
    const fact=FACTS[index];
    if(fact&&lang==="pt")return fact[1];
    if(fact&&lang==="en")return fact[0];
    return t("reportFactFallback",{landmark:LANDMARKS[index]});
  }
  function renderDossier(){
    if(!game.finished)return;
    const best=bestGuess();
    const place=cityAt(game.index);
    $("reportCode").textContent=caseCode();
    $("reportVerdict").textContent=t(game.won?"caseSolved":"caseClosed");
    $("reportHeading").textContent=cityName(place);
    $("reportCountry").textContent=countryName(game.index);
    $("reportStamp").textContent=t(game.won?"reportSuccess":"reportFailure");
    $("reportMode").textContent=t(game.mode==="daily"?"daily":"free");
    $("reportDifficulty").textContent=t(difficulty);
    $("reportAttempts").textContent=game.guesses.length+" / "+maximum();
    $("reportBest").textContent=best?number(best.distance)+" km":"—";
    $("reportHints").textContent=number(Math.round(game.penalty/HINT_COST));
    $("reportScore").textContent=number(game.score)+" / 5,000";
    $("reportCoordinates").textContent=place[3].toFixed(4)+"°, "+place[4].toFixed(4)+"°";
    $("reportContinent").textContent=continentName(game.index);
    $("reportFact").textContent=factFor(game.index);
    const log=$("reportTimeline");log.replaceChildren();
    for(const [i,g] of game.guesses.entries()){
      const row=document.createElement("li");row.className="report-log-row";
      if(g===best)row.classList.add("best");
      const n=document.createElement("span");n.className="report-log-index";n.textContent=String(i+1).padStart(2,"0");
      const label=document.createElement("span");label.className="report-log-place";
      label.textContent=g.label||g.lat.toFixed(3)+"°, "+g.lng.toFixed(3)+"°";
      const metric=document.createElement("strong");metric.textContent=number(g.distance)+" km"
        +(difficulty==="hard"?"":" · "+direction(g.bearing));
      row.append(n,label,metric);log.append(row);
    }
    if(!game.guesses.length){
      const item=document.createElement("li");item.textContent=t("reportNoGuesses");log.append(item);
    }
    const evidence=$("reportEvidenceList");evidence.replaceChildren();
    cluesFor(game.index,difficulty).forEach((clue,i)=>{
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
    if(!dialog.open)dialog.show(); // Non-modal right-side dossier: the map stays visible.
  }
  function renderResult(){
    $("resultCard").classList.toggle("hidden",!game.finished);
    if(!game.finished)return;
    const name=cityName(cityAt(game.index))+", "+countryName(game.index);
    $("resultKicker").textContent=t(game.won?"solved":"closed");
    $("resultTitle").textContent=name;
    $("resultDetail").textContent=game.won
      ?t("foundText",{city:name,count:game.guesses.length,km:number(bestGuess().distance)})
      :t("lostText",{city:name});
    $("finalScore").textContent=number(game.score);
    renderDossier();
  }
  function feedback(){
    const el=$("feedback");
    if(!game.guesses.length||game.finished){el.classList.add("hidden");return}
    const last=game.guesses.at(-1);
    el.textContent=difficulty==="hard" ?t("hardDistance",{km:number(last.distance)}) :t("feedback",{km:number(last.distance),dir:direction(last.bearing)});
    el.className="feedback";
  }
  function render(){
    const daily=game.mode==="daily";
    const max=maximum(),remaining=max-game.guesses.length;
    $("dailyBtn").classList.toggle("active",daily);$("freeBtn").classList.toggle("active",!daily);
    $("dailyBtn").setAttribute("aria-pressed",String(daily));$("freeBtn").setAttribute("aria-pressed",String(!daily));
    $("difficultySelect").value=difficulty;
    const code=caseCode();
    $("caseCode").textContent=code;
    $("caseNumber").textContent=t("caseWord")+" "+code;
    $("modeCaption").textContent=t(daily?"modeDaily":"modeFree");
    $("caseTitle").textContent=game.finished?cityName(cityAt(game.index)):t("unknown");
    $("caseStatus").textContent=t(game.finished?(game.won?"solved":"closed"):"active");
    $("caseStatus").classList.toggle("closed",game.finished);
    $("attemptCount").textContent=remaining+" / "+max;
    $("guessCounter").textContent=game.guesses.length+" / "+max;
    const dots=$("attemptDots");dots.replaceChildren();
    dots.style.setProperty("--attempt-total",max);
    for(let i=0;i<max;i++){const dot=document.createElement("i");dot.classList.toggle("live",i<remaining);dots.append(dot)}
    $("placeCount").textContent=String(PLACES.length);
    renderClues();renderHistory();renderResult();feedback();
    $("guessBtn").disabled=game.finished||!selected;
    $("citySearch").disabled=game.finished;
    $("citySearch").value="";
    $("suggestions").classList.add("hidden");
    $("selection").classList.toggle("hidden",game.finished);
    $("selectedText").textContent=selected?(selected.label||selected.lat.toFixed(3)+"°, "+selected.lng.toFixed(3)+"°"):t("noSelection");
    $("mapHint").textContent=t(game.finished?"mapRevealed":"mapHint");
    renderMap();
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
  function clearMapOverlays(){
    overlayMarkers.forEach(pin=>pin.remove());
    overlayMarkers=[];
    if(!map||!mapStyleReady)return;
    if(map.getLayer("case-distance-line"))map.removeLayer("case-distance-line");
    if(map.getSource("case-distance-line"))map.removeSource("case-distance-line");
    activeLine=false;
  }
  function addMarker(lat,lng,label,style,popupText=""){
    const pin=makeMarker(label,style).setLngLat([lng,lat]).addTo(map);
    if(popupText){
      const text=document.createElement("div");text.textContent=popupText;
      pin.setPopup(new window.maplibregl.Popup({offset:22}).setDOMContent(text));
    }
    overlayMarkers.push(pin);
    return pin;
  }
  function addResultLine(from,to){
    if(!mapStyleReady)return;
    map.addSource("case-distance-line",{type:"geojson",data:{
      type:"Feature",properties:{},geometry:{type:"LineString",coordinates:[from,to]}
    }});
    map.addLayer({id:"case-distance-line",type:"line",source:"case-distance-line",layout:{"line-join":"round","line-cap":"round"},
      paint:{"line-color":"#ffd449","line-width":2,"line-opacity":0.85,"line-dasharray":[2,3]}});
    activeLine=true;
  }
  function frameResult(best,target){
    if(!map)return;
    const targetLng=best
      ?target[1]+360*Math.round((best.lng-target[1])/360)
      :target[1];
    if(!best){
      map.easeTo({center:[targetLng,target[0]],zoom:4,duration:450});
      return [targetLng,target[0]];
    }
    const gap=dist([best.lat,best.lng],target);
    const maxZoom=gap<50?6.2:gap<200?5.5:gap<750?4.8:gap<2000?4.1:gap<5000?3.2:2.6;
    const bounds=[
      [Math.min(best.lng,targetLng),Math.min(best.lat,target[0])],
      [Math.max(best.lng,targetLng),Math.max(best.lat,target[0])]
    ];
    const root=$("map");
    const xPadding=Math.max(24,Math.min(90,Math.round((root.clientWidth||700)*0.11)));
    const yPadding=Math.max(26,Math.min(90,Math.round((root.clientHeight||500)*0.14)));
    // fitBounds centres the camera between the closest attempt and the target,
    // while dynamic caps and viewport padding prevent extreme zoom jumps.
    map.fitBounds(bounds,{padding:{top:yPadding,bottom:yPadding,left:xPadding,right:xPadding},
      maxZoom,duration:450,bearing:0,pitch:0});
    return [targetLng,target[0]];
  }
  function labelMinZoom(layer){
    if(layer.type!=="symbol" || layer.layout?.["text-field"]===undefined)return null;
    const id=(layer.id+" "+(layer["source-layer"]||"")).toLowerCase();
    // Each category progressively appears as the investigator zooms in.
    // Country labels remain at world scale; street names and POIs require local zoom.
    if(/(road|street|highway|motorway|rail|transit|route|shield|housenumber|house-number)/.test(id))return 12;
    if(/(poi|amenity|shop|building|landmark|business|tourism|airport|station)/.test(id))return 11;
    if(/(neighbou?rhood|suburb|hamlet|village|district|quarter|locality)/.test(id))return 8.2;
    if(/(town|settlement)/.test(id))return 7;
    if(/(province|state|region|admin)/.test(id))return 5;
    if(/(city|capital|place)/.test(id))return 4.6;
    if(/(river|lake|water|sea|ocean|mountain|hill|peak|park|island|natural)/.test(id))return 6.6;
    if(/(country|continent)/.test(id))return 1.5;
    if(/(label|name|text)/.test(id))return 7.2;
    return 8;
  }
  function configureMapLabelDensity(){
    if(!map||!mapStyleReady||typeof map.setLayerZoomRange!=="function")return;
    const layers=map.getStyle()?.layers||[];
    for(const layer of layers){
      const min=labelMinZoom(layer);
      if(min===null)continue;
      const originalMin=Number.isFinite(layer.minzoom)?layer.minzoom:0;
      const originalMax=Number.isFinite(layer.maxzoom)?layer.maxzoom:24;
      const targetMin=Math.max(originalMin,min);
      // Never invert an existing zoom range from the source style.
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
  function renderMap(){
    if(!map)return;
    clearMapOverlays();
    const target=cityCoords(game.index);
    const best=game.finished?bestGuess():null;
    game.guesses.forEach((g,i)=>addMarker(g.lat,g.lng,i+1,g===best?"best":"past"));
    if(game.finished){
      const adjustedLng=best?target[1]+360*Math.round((best.lng-target[1])/360):target[1];
      addMarker(target[0],adjustedLng,"★","target",cityName(cityAt(game.index))+" · "+countryName(game.index));
      if(best){
        addResultLine([best.lng,best.lat],[adjustedLng,target[0]]);
      }
      frameResult(best,target);
    }else if(selected){
      marker=addMarker(selected.lat,selected.lng,"+","current");
    }
    $("coordinates").textContent=game.finished
      ?target[0].toFixed(3)+"°, "+target[1].toFixed(3)+"°"
      :selected?selected.lat.toFixed(3)+"°, "+selected.lng.toFixed(3)+"°":t("noSelection");
  }
  function resetMapView(){
    if(map&&!game.finished)map.easeTo({center:[8,15],zoom:1.7,duration:350});
  }
  function selectPoint(lat,lng,label){
    if(game.finished)return;
    selected={lat:Number(lat),lng:Number(lng),label:label||""};
    // A map click only places the pin; city search may recenter without forcing zoom during a drag.
    if(map&&label)map.easeTo({center:[selected.lng,selected.lat],zoom:Math.max(map.getZoom(),4),duration:350});
    $("guessBtn").disabled=false;
    $("selectedText").textContent=selected.label||selected.lat.toFixed(3)+"°, "+selected.lng.toFixed(3)+"°";
    $("suggestions").classList.add("hidden");
    renderMap();
  }
  function reveal(){
    if(game.finished||game.revealed>=6)return;
    game.revealed++;game.penalty+=HINT_COST;save();renderClues();toast(t("hintUsed"));
  }
  function guess(){
    if(!selected||game.finished)return;
    const pos=[selected.lat,selected.lng],to=cityCoords(game.index),distance=dist(pos,to);
    game.guesses.push({lat:selected.lat,lng:selected.lng,label:selected.label,
      at:new Date().toISOString(),distance:Math.round(distance),bearing:Math.round(heading(pos,to))});
    game.won=distance<=WIN_RADIUS;
    if(game.won||game.guesses.length>=maximum()){
      game.finished=true;game.revealed=6;
      game.score=game.won
        ?Math.max(250,Math.round(5000*Math.pow(.78,game.guesses.length-1)*Math.max(.76,1-distance/425)-game.penalty))
        :0;
    }else game.revealed=Math.min(6,Math.max(game.revealed,DIFFICULTIES[difficulty].initial+game.guesses.length));
    save();selected=null;render();
    if(game.finished){showReport();}
    // Keep the investigator’s chosen zoom after a wrong guess.
  }
  function searchLocal(term){
    const q=norm(term);
    return PLACES.filter(p=>norm(p[0]+" "+(EN_CITY[p[0]]||"")+" "+p[1]).includes(q)).slice(0,5)
      .map((p)=>({name:cityName(p),description:countryName(PLACES.indexOf(p)),lat:p[3],lon:p[4]}));
  }
  function suggestions(items){
    const list=$("suggestions");list.replaceChildren();
    if(!items.length){
      const empty=document.createElement("div");empty.className="suggestion-empty";empty.textContent=t("noResults");list.append(empty);
    }
    for(const item of items.slice(0,7)){
      const button=document.createElement("button");button.type="button";button.className="suggestion";button.setAttribute("role","option");
      button.textContent=item.name;
      const desc=document.createElement("small");desc.textContent=item.description;button.append(desc);
      button.addEventListener("click",()=>{selectPoint(item.lat,item.lon,item.name);$("citySearch").value=item.name});
      list.append(button);
    }
    list.classList.remove("hidden");
  }
  async function searchRemote(term){
    if(term.length<3||game.finished)return;
    const local=searchLocal(term);suggestions(local);
    if(controller)controller.abort();
    const signaler=new AbortController();controller=signaler;
    try{
      const supported=["en","pt","es","fr","de","it","ru","zh","ja","nl","pl","tr"].includes(lang)?lang:"en";
      const url="https://geocoding-api.open-meteo.com/v1/search?name="+encodeURIComponent(term)+"&count=8&language="+supported+"&format=json";
      const response=await fetch(url,{signal:signaler.signal});
      if(!response.ok)throw Error("search failed");
      const data=await response.json();
      if(signaler!==controller||game.finished||$("citySearch").value.trim()!==term)return;
      const all=[...local];
      for(const p of data.results||[]){
        if(!all.some(item=>dist([item.lat,item.lon],[p.latitude,p.longitude])<10))
          all.push({name:p.name,description:[p.admin1,p.country].filter(Boolean).join(", "),lat:p.latitude,lon:p.longitude});
      }
      suggestions(all);
    }catch(e){if(e.name!=="AbortError"&&!local.length)suggestions([])}
  }
  async function share(){
    const symbols=game.guesses.map(g=>g.distance<=WIN_RADIUS?"🟨":g.distance<500?"🟧":"⬛").join("");
    const txt="GeoDetective "+caseCode()
      +"\n"+(game.won?"✓ "+game.guesses.length+"/"+maximum():"×")+" · "+number(game.score)+" pts\n"+symbols
      +"\nhttps://f404x.github.io/geodetective/";
    try{
      if(navigator.share){await navigator.share({text:txt});return}
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(txt);toast(t("copied"));return}
      const ta=document.createElement("textarea");ta.value=txt;ta.style.position="fixed";ta.style.opacity="0";document.body.append(ta);ta.select();
      const ok=document.execCommand("copy");ta.remove();if(!ok)throw Error("copy failed");toast(t("copied"));
    }catch(e){if(e.name!=="AbortError")toast(t("shareError"))}
  }
  async function switchToFallback(reason){
    if(fallbackSwitching || window.maplibregl?.isFallback)return;
    fallbackSwitching=true;
    clearTimeout(mapStyleTimeout);
    console.warn("Switching to Leaflet basemap:",reason);
    try{
      const leaf=await window.GeoMapFallback.ensure();
      if(map){
        try{map.remove();}catch(error){console.warn(error);}
      }
      $("map").replaceChildren();
      map=null;mapStyleReady=false;overlayMarkers=[];marker=null;activeLine=false;
      window.maplibregl=leaf;
      initMap();
    }catch(error){
      console.error("Leaflet fallback could not initialize:",error);
      $("map").textContent=t("noMap");
    }finally{
      fallbackSwitching=false;
    }
  }
  function initMap(){
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
    try {
      map=new libre.Map({
        container:"map",
        style:"https://tiles.openfreemap.org/styles/dark",
        center:[8,15],
        zoom:1.7,minZoom:1.2,maxZoom:16,
        attributionControl:true,
        dragRotate:false,touchPitch:false,pitchWithRotate:false,
        doubleClickZoom:false
      });
    }catch(error){
      console.error("Map engine could not initialize:",error);
      if(!libre.isFallback) switchToFallback(error);
      else $("map").textContent=t("noMap");
      return;
    }
    map.addControl(new libre.NavigationControl({showCompass:false}),"bottom-left");
    map.on("style.load",()=>{
      clearTimeout(mapStyleTimeout);
      mapStyleReady=true;
      configureMapLabelDensity();
      updateMapLanguage();
      if(game)renderMap();
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
    const canvas=map.getCanvas();
    canvas.addEventListener("pointerdown",event=>{
      if(event.button!==0&&event.pointerType==="mouse")return;
      pointerDown={x:event.clientX,y:event.clientY};
      pointerMoved=false;
    });
    canvas.addEventListener("pointermove",event=>{
      if(pointerDown&&Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>8)
        pointerMoved=true;
    });
    canvas.addEventListener("pointerup",event=>{
      if(pointerDown&&Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>8)
        pointerMoved=true;
      pointerDown=null;
    });
    canvas.addEventListener("pointercancel",()=>{
      pointerMoved=true;pointerDown=null;lastDragAt=Date.now();
    });
    map.on("click",event=>{
      // A drag release must never be interpreted as a fresh pin.
      if(game.finished||pointerMoved||Date.now()-lastDragAt<220)return;
      selectPoint(event.lngLat.lat,event.lngLat.lng,"");
    });
  }
  function init(){
    if(!PLACES.length||PLACES.length!==FEATURES.length||PLACES.length!==COUNTRY_CODES.length||PLACES.length!==LANDMARKS.length||PLACES.length!==FACTS.length||Object.keys(NEARBY_REFERENCES).length<45)
      throw new Error("Location catalogue and metadata are out of sync");
    document.documentElement.lang="en";
    $("difficultySelect").value=difficulty;
    $("langSelect").value=lang;
    initMap();
    $("dailyBtn").addEventListener("click",startDaily);
    $("freeBtn").addEventListener("click",startFree);
    $("difficultySelect").addEventListener("change",e=>setDifficulty(e.target.value));
    $("langSelect").addEventListener("change",e=>setLanguage(e.target.value));
    $("revealBtn").addEventListener("click",reveal);
    $("guessBtn").addEventListener("click",guess);
    $("resetViewBtn").addEventListener("click",resetMapView);
    $("reportOpenBtn").addEventListener("click",showReport);
    $("shareBtn").addEventListener("click",share);
    $("reportCloseBtn").addEventListener("click",closeReport);
    $("reportMapBtn").addEventListener("click",closeReport);
    $("reportNextBtn").addEventListener("click",()=>{closeReport();startFree()});
    $("reportShareBtn").addEventListener("click",share);
    $("helpBtn").addEventListener("click",()=>$("helpDialog").showModal());
    $("closeHelpBtn").addEventListener("click",()=>$("helpDialog").close());
    $("startHelpBtn").addEventListener("click",()=>$("helpDialog").close());
    $("helpDialog").addEventListener("click",e=>{if(e.target===$("helpDialog"))$("helpDialog").close()});
    $("citySearch").addEventListener("input",e=>{
      const term=e.target.value.trim();
      if(controller)controller.abort();
      clearTimeout(debounce);
      if(term.length<3){$("suggestions").classList.add("hidden");return}
      suggestions(searchLocal(term));
      debounce=setTimeout(()=>searchRemote(term),450);
    });
    $("citySearch").addEventListener("keydown",e=>{
      if(e.key==="Escape")$("suggestions").classList.add("hidden");
      if(e.key==="Enter"){
        const option=$("suggestions").querySelector("button.suggestion");
        if(option&&!$("suggestions").classList.contains("hidden")){e.preventDefault();option.click()}
      }
    });
    document.addEventListener("click",e=>{if(!e.target.closest(".search-wrap"))$("suggestions").classList.add("hidden")});
    startDaily();
    setLanguage(lang);
    document.addEventListener("visibilitychange",()=>{
      if(!document.hidden&&game?.mode==="daily"&&game.date!==today())startDaily();
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();