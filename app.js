/* Cartigma — game engine · no framework, no account, no API key. */
(() => {
  "use strict";
  const PLACES = window.GEODETECTIVE_PLACES || [];
  // Indices 0–73 retain their curated coordinates, facts and saved-case identity.
  const BASE_CITIES=74, EXTENDED=window.GeoExtendedPlaceMetadata || [];
  const PT_EXTRA_NAMES=window.GeoExtendedCityPortugueseNames || {};
  const TRANSLATIONS = window.GeoI18n?.PACKS || {};
  const CLUE_I18N = window.GeoCluesI18n || {};
  const COUNTRY_INSIGHTS = window.GeoCountryInsights || {};
  const COUNTRY_CLUE_I18N = window.GeoCountryClueI18n || {};
  const COUNTRY_FAMILIES_PT = window.GeoCountryLanguageFamiliesPT || {};
  const EXTRA_CLUE_KEYS = new Set(["countryCurrency","countryLanguageFamily","countryFlagColor",
    "countryPopulation","countryGDP","countryArea","countryLandlocked"]);
  const FILTER_TRANSLATIONS = window.GeoMapFilterLabels || {};
  const LANGS = window.GeoI18n?.langNames || {};
  const REPORT_I18N = window.GeoReportI18n || {};
  const FACTS = window.GEODETECTIVE_FACTS || [];
  const COMPASS_I18N = window.GeoCompassI18n || {};
  const NEARBY_REFERENCES = window.GEODETECTIVE_NEARBY_REFERENCES || {};
  const CONTINENT_BORDERS = window.GeoContinentBorders || {};
  const DIFFICULTIES = {normal:{attempts:6,initial:2},hard:{attempts:4,initial:1}};
  const SERIAL_PREFIX = "geodetective-case-counter-";
  const EVIDENCE_COUNT = 7;
  const WIN_RADIUS = 100, HINT_COST = 300, DAILY_KEY = "geodetective-daily-v3-";
  // 300 is preserved only for loading older saved games. New charges reflect
  // information gain; the price for the NEXT clue is always shown before purchase.
  const HINT_PRICES=Object.freeze({
    hemisphere:150,terrain:200,zone:200,continent:300,capital:250,
    adminRegion:350,landmark:500,
    longitude:400,latitude:450,utmZone:450,utmBand:450,
    countryCurrency:250,countryLanguageFamily:250,countryFlagColor:200,
    countryPopulation:300,countryGDP:350,countryArea:300,countryLandlocked:200
  });
  // Overlay costs differ by how tightly each display constrains the target.
  const MAP_OVERLAY_COSTS=Object.freeze({hemisphere:250,continent:500,
    longitude:1000,latitude:1100});
  // Europe and North America are fully/almost entirely in the Northern
  // Hemisphere. The others have meaningful populations on BOTH sides of 0°.
  const EQUATOR_CROSSING_CONTINENTS=new Set(["asia","africa","southAmerica","oceania"]);
  const COUNTRY_CODES = "IS NO NO NO FI SE DK GB FR PT IT GR TR MA EG SN NG KE ET ZA MG AE JO IL IN IN IN NP BD TH SG ID ID JP JP KR CN CN CN TW MN KZ AU AU AU AU NZ NZ FJ PF CA US US US US MX MX CU GT CO EC PE PE BO BR BR BR BR BR BR AR CL AR CL".split(" ").concat(EXTENDED.map(item=>item.countryCode));
  const FEATURES = "volcanic fjord polar fjord coast islands coast river river estuary river mountains strait desert desert peninsula delta plateau plateau peninsula plateau desert plateau mountains coast plain delta mountains delta delta islands delta islands coast mountains river plain delta bay mountains plateau mountains harbor coast coast islands volcanic harbor islands volcanic coast estuary bay mountains islands plateau plateau coast volcanic plateau mountains desert mountains plateau plateau plateau forest bay plateau bay estuary mountains islands strait".split(" ").concat(EXTENDED.map(()=>"urban"));
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
  ].concat(EXTENDED.map(item=>item.landmark));
  const CAPITALS = new Set("Reykjavík|Oslo|Helsinque|Estocolmo|Copenhague|Londres|Paris|Lisboa|Roma|Atenas|Cairo|Dacar|Nairóbi|Adis Abeba|Cidade do Cabo|Antananarivo|Amã|Nova Délhi|Catmandu|Daca|Bangcoc|Singapura|Tóquio|Seul|Pequim|Taipé|Ulan Bator|Wellington|Suva|Cidade do México|Havana|Cidade da Guatemala|Bogotá|Quito|Lima|Brasília|Buenos Aires|Santiago".split("|"));
  for(let i=0;i<EXTENDED.length;i++)
    if(EXTENDED[i].capital)CAPITALS.add(PLACES[BASE_CITIES+i][0]);
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
  // Index immutable search terms once instead of normalizing 74 cities per keystroke.
  const LOCAL_SEARCH_INDEX = PLACES.map((place,index)=>({
    place,index,terms:norm(place[0]+" "+(EN_CITY[place[0]]||"")+" "+
      (PT_EXTRA_NAMES[place[0]]||"")+" "+place[1])
  }));
  const GEOCODER_LANGUAGES=new Set(["en","pt","es","fr","de","it","ru","zh","ja","nl","pl","tr"]);
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
  const DIRECTION_ARROWS=Object.freeze(["↑","↗","→","↘","↓","↙","←","↖"]);
  const direction = bearing => {
    const idx=Math.round(bearing/45)%8;
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
  let game = null, selected = null, map = null, marker = null, overlayMarkers = [], freeIndex = -1;
  let activeLine=false, mapStyleReady=false, lastDragAt=0, pointerDown=null, pointerMoved=false;
  let fallbackSwitching=false, mapStyleTimeout=null, mapSwitching=false, mapPointerController=null;
  let activeMapStyle=window.maplibregl?.isFallback?"osm":"vector";
  let controller = null, debounce = null, toastTimer = null;
  const regionFormatters = new Map();
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
  function locale() {return LANGS[lang] || "en";}
  function number(value){return Math.round(value).toLocaleString(locale())}
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
  function cityName(p) {
    return lang==="pt"?(PT_EXTRA_NAMES[p[0]]||p[0]):(EN_CITY[p[0]]||p[0]);
  }
  function countryName(index){return displayRegion(COUNTRY_CODES[index])}
  function continentKey(index){
    if(index>=BASE_CITIES)return EXTENDED[index-BASE_CITIES]?.continent||"asia";
    if(index<=12)return "europe";
    if(index<=20)return "africa";
    if(index<=41)return "asia";
    if(index<=49)return "oceania";
    if(index<=58)return "northAmerica";
    return "southAmerica";
  }
  function continentName(index){
    const names=CLUE_I18N[lang]?.continents||CLUE_I18N.en?.continents||{};
    if(index===12)return [names.europe||"Europe",names.asia||"Asia"].join(" / ");
    const key=continentKey(index);
    return names[key]||CLUE_I18N.en?.continents?.[key]||key;
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
  const RIVER_NAMES=Object.freeze({7:"Thames",8:"Seine",10:"Tiber",35:"Han"});
  function locationFeature(index) {
    // Naming the river is more useful than the generic clue "river valleys".
    if(RIVER_NAMES[index]){
      const template=COMPASS_I18N[lang]?.river||COMPASS_I18N.en?.river||"Along the {name} River";
      return template.replace("{name}",RIVER_NAMES[index]);
    }
    const key = FEATURES[index] || "urban";
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
  const REGIONAL_BASE_RADIUS=Object.freeze({europe:2000,africa:2600,asia:2700,oceania:2500,northAmerica:2500,southAmerica:2300});
  function regionalHintRadius(index, level){
    // Use the geographic spread of the target's region, not a universal 1,000 km cap.
    // Sparse/large regions need longer references; dense regions get a smaller radius.
    const base=REGIONAL_BASE_RADIUS;
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
  function anchorDistances(index,level,radius=regionalHintRadius(index,level)) {
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
    // Very isolated additions may have no second catalog city nearby.
    // Expand only in that case: the comparison stays geographically true.
    if(unique.size<2){
      const extra=PLACES.map((place,i)=>({
        name:cityName(place),country:COUNTRY_CODES[i],
        km:i===index?0:dist(origin,[place[3],place[4]]),
        regional:continentKey(i)===region
      })).filter(item=>item.km>=10).sort((a,b)=>a.km-b.km);
      for(const candidate of extra){
        if(unique.size>=2)break;
        if(!unique.has(norm(candidate.name)))unique.set(norm(candidate.name),candidate);
      }
    }
    return [...unique.values()].sort((a,b)=>a.km-b.km);
  }
  // Normal mode gives a broad geographic sector; Hard mode uses surveyor-style UTM notation.
  function utmZone(latitude,longitude){
    if(latitude>=56&&latitude<64&&longitude>=3&&longitude<12)return 32;
    if(latitude>=72&&latitude<84&&longitude>=0&&longitude<42){
      return longitude<9?31:longitude<21?33:longitude<33?35:37;
    }
    return Math.max(1,Math.min(60,Math.floor((longitude+180)/6)+1));
  }
  function utmLatitudeBand(latitude){
    return "CDEFGHJKLMNPQRSTUVWX"[Math.min(19,Math.max(0,Math.floor((latitude+80)/8)))];
  }
  function coordinateClue(index,level){
    const p=cityAt(index);
    if(level==="hard")return {key:"utmZone",zone:utmZone(p[3],p[4])};
    const from=Math.floor(p[4]/30)*30;
    return {key:"longitude",from,to:from+30};
  }
  function landmarkClue(index,level){
    const place=cityAt(index),name=LANDMARKS[index];
    // Supplemental cities have reliable coordinates but no curated landmark:
    // offer a reproducible latitude sector, never an invented attraction.
    if(index>=BASE_CITIES){
      if(level==="hard")return {key:"utmBand",band:utmLatitudeBand(place[3])};
      const from=Math.floor(place[3]/15)*15;
      return {key:"latitude",from,to:from+15};
    }
    // Check the catalog name AND its English alias (e.g. Tóquio/Tokyo and Taipé/Taipei).
    const revealsCity=[place[0],EN_CITY[place[0]]]
      .filter(Boolean).some(candidate=>norm(name).includes(norm(candidate)));
    if(level==="hard")return {key:"utmBand",band:utmLatitudeBand(place[3])};
    if(revealsCity){
      const from=Math.floor(place[3]/15)*15;
      return {key:"latitude",from,to:from+15};
    }
    return {key:"landmark",name};
  }
  function referenceName(item){
    return item.name+", "+displayRegion(item.country);
  }
  function extraCountryClues(index,level){
    const code=COUNTRY_CODES[index],data=COUNTRY_INSIGHTS[code];
    if(!data)throw Error("Missing country insights for "+code);
    const candidates=[];
    const add=(key,props)=>candidates.push({key,...props});
    if(data.currency)add("countryCurrency",{code:data.currency});
    if(data.languageFamily){
      const family=lang==="pt"?(COUNTRY_FAMILIES_PT[data.languageFamily]||data.languageFamily):data.languageFamily;
      add("countryLanguageFamily",{family});
    }
    if(data.flagColor){
      const color=COUNTRY_CLUE_I18N[lang]?.colors?.[data.flagColor]||
        COUNTRY_CLUE_I18N.en?.colors?.[data.flagColor]||data.flagColor;
      add("countryFlagColor",{color});
    }
    const roundingStep=(amount,level)=>{
      if(amount>=1e9)return level==="hard"?250e6:100e6;
      if(amount>=100e6)return level==="hard"?50e6:20e6;
      if(amount>=10e6)return level==="hard"?10e6:5e6;
      if(amount>=1e6)return level==="hard"?2e6:500e3;
      return level==="hard"?200e3:50e3;
    };
    if(data.population&&data.populationYear){
      const step=roundingStep(data.population,level);
      add("countryPopulation",{value:number(Math.max(step,Math.round(data.population/step)*step)),
        year:data.populationYear});
    }
    if(data.gdpPerCapita&&data.gdpYear){
      // Preserve meaningful scale for low-income economies; avoid a 10,000
      // USD rounding step when GDP/capita is only a few hundred dollars.
      const value=data.gdpPerCapita;
      const step=value>=50000?5000:value>=10000?1000:
        value>=1000?100:10;
      const roundedStep=step*(level==="hard"?2:1);
      add("countryGDP",{value:number(Math.max(roundedStep,
        Math.round(value/roundedStep)*roundedStep)),year:data.gdpYear});
    }
    if(data.area){
      // Singapore and island territories are not remotely 10,000 km².
      const area=data.area;
      const step=area>=1000000?100000:area>=100000?10000:
        area>=10000?1000:area>=1000?100:area>=100?10:1;
      const roundedStep=step*(level==="hard"?2:1);
      add("countryArea",{value:number(Math.max(roundedStep,
        Math.round(area/roundedStep)*roundedStep))});
    }
    if(typeof data.landlocked==="boolean")
      add("countryLandlocked",{value:tc(data.landlocked?"countryLandlockedYes":"countryLandlockedNo")});
    // Pair one cultural/civic fact with one numeric fact. This prevents two
    // nearly identical population/GDP/area clues in a single investigation.
    // Both buckets are available for every country in the current catalogue.
    const cultural=candidates.filter(item=>["countryCurrency","countryLanguageFamily",
      "countryFlagColor","countryLandlocked"].includes(item.key));
    const numeric=candidates.filter(item=>["countryPopulation","countryGDP","countryArea"].includes(item.key));
    if(!cultural.length||!numeric.length)throw Error("Insufficient distinct country evidence for "+code);
    const id="country-evidence:"+code+":"+index+":"+level;
    const first=cultural[hash(id+":cultural")%cultural.length];
    const second=numeric[hash(id+":numeric")%numeric.length];
    return hash(id+":order")%2?[second,first]:[first,second];
  }
  function cluesFor(index,level){
    const cacheKey=index+":"+level+":"+lang;
    if(clueCache.has(cacheKey))return clueCache.get(cacheKey);
    const p=cityAt(index);
     const terrain={key:"terrain",value:locationFeature(index)};
    const zone={key:"zone",value:latitudeZone(p[3])};
    const capital={key:"capital",value:tc(CAPITALS.has(p[0])?"yes":"no")};
    const hemisphere={key:"hemisphere",value:tc(p[3]>=0?"north":"south")};
    const hemisphereUseful=EQUATOR_CROSSING_CONTINENTS.has(continentKey(index));
    const reliableCapital=!["Jerusalém","La Paz","Jacarta"].includes(p[0]);
    // Hemisphere, when used at all, comes BEFORE the continent clue.
    // It must never appear in a later evidence slot after the continent.
    const choice=hash("opening:"+p[0])%3;
    const opening=[7,8,10,35].includes(index)?terrain:
      (choice===2&&hemisphereUseful?hemisphere:(choice===0?terrain:zone));
    const extra=index>=BASE_CITIES?EXTENDED[index-BASE_CITIES]:null;
    const safeRegion=extra&&p[2]&&!norm(p[2]).includes(norm(p[0]));
    const third=extra
      ?(extra.capital?capital:(safeRegion?{key:"adminRegion",value:p[2]}:capital))
      :(reliableCapital&&hash("profile:"+p[0])%3===0?capital:
        (opening===terrain?zone:terrain));
    // Spread cultural, numeric and geographic clues across positions 3–7.
    // Country fact cards never sit next to each other. The six stable layouts
    // balance which positions carry the most useful evidence.
    const countryFacts=extraCountryClues(index,level);
    const countryPositions=[[0,2],[0,3],[0,4],[1,3],[1,4],[2,4]];
    const positions=countryPositions[hash("fact-positions:"+index+":"+level)%countryPositions.length];
    const mixed=Array(5);
    mixed[positions[0]]=countryFacts[0];
    mixed[positions[1]]=countryFacts[1];
    const geographic=[third,coordinateClue(index,level),landmarkClue(index,level)];
    for(let i=geographic.length-1;i>0;i--){
      const j=hash("geographic-order:"+index+":"+level+":"+i)%(i+1);
      [geographic[i],geographic[j]]=[geographic[j],geographic[i]];
    }
    let next=0;
    for(let i=0;i<mixed.length;i++)if(!mixed[i])mixed[i]=geographic[next++];
    const clues=[opening,{key:"continent",value:continentName(index)},...mixed];
    clueCache.set(cacheKey,clues);
    return clues;
  }
  function clueText(clue){return tc(clue.key,clue)}
  function maximum(){return DIFFICULTIES[difficulty].attempts}
  // Most Normal cases deliberately feature capitals or recognizable cities;
  // Hard still draws from the complete 500-location catalogue.
  const NORMAL_FOCUS=PLACES.map((_,index)=>index).filter(index=>
    index<BASE_CITIES||Boolean(EXTENDED[index-BASE_CITIES]?.capital)||
    Number(EXTENDED[index-BASE_CITIES]?.populationRank)<=2);
  function dailyIndex(level=difficulty){
    const seed=hash("GEODETECTIVE-v3|"+today()+"|"+level);
    if(level==="normal"&&seed%10!==0&&NORMAL_FOCUS.length)
      return NORMAL_FOCUS[seed%NORMAL_FOCUS.length];
    return seed%PLACES.length;
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
      revealed:DIFFICULTIES[difficulty].initial,penalty:0,paidHints:0,
      sectorMapPenalty:0,sectorReveals:[],finished:false,won:false,score:0};
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
    // Bounded rerolls: Normal strongly favors capitals/famous cities,
    // without banning lesser-known places or biasing the Hard catalogue.
    for(let attempt=0;attempt<(difficulty==="normal"?4:1);attempt++){
      const pick=options[Math.floor(Math.random()*options.length)];
      freeIndex=pick;
      if(difficulty!=="normal"||NORMAL_FOCUS.includes(pick))break;
    }
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
  // Reuse the clue-category lookup instead of rebuilding it for every row.
  const CLUE_CATEGORY_KEYS=Object.freeze({
    terrain:"clueTerrain",continent:"clueRegion",zone:"clueClimate",adminRegion:"clueRegion",
    countryCurrency:"clueCivic",countryLanguageFamily:"clueCivic",
    countryFlagColor:"clueCivic",countryPopulation:"clueCivic",
    countryGDP:"clueCivic",countryArea:"clueRegion",
    countryLandlocked:"clueRegion",
    hemisphere:"clueRegion",capital:"clueCivic",longitude:"clueRegion",
    latitude:"clueRegion",utmZone:"clueRegion",utmBand:"clueRegion",
    landmark:"clueLandmark"
  });
  function revealGeographyOnMap(clue){
    const cost=MAP_OVERLAY_COSTS[clue.key];
    if(game.finished||!map||!mapStyleReady||!cost)return;
    if(clue.key==="continent"&&!CONTINENT_BORDERS[continentKey(game.index)])return;
    if(!cluesFor(game.index,difficulty).slice(0,game.revealed).some(item=>
      item.key===clue.key&&(["hemisphere","continent"].includes(clue.key)
        ?item.value===clue.value:item.from===clue.from&&item.to===clue.to)))return;
    if(!Array.isArray(game.sectorReveals))game.sectorReveals=[];
    if(game.sectorReveals.includes(clue.key))return;
    game.sectorReveals.push(clue.key);
    game.sectorMapPenalty=(game.sectorMapPenalty||0)+cost;
    save();renderClues();renderMap();
    if(clue.key==="hemisphere"){
      map.easeTo({center:[0,0],zoom:1.7,duration:450});
    }else if(clue.key==="continent"){
      const bounds=CONTINENT_BORDERS[continentKey(game.index)].bbox;
      map.fitBounds([[bounds[0],bounds[1]],[bounds[2],bounds[3]]],{
        padding:{top:20,bottom:20,left:20,right:20},maxZoom:4,duration:400
      });
    }else{
      const bounds=clue.key==="longitude"?
        [[clue.from,-75],[clue.to,75]]:[[-179.5,clue.from],[179.5,clue.to]];
      map.fitBounds(bounds,{padding:{top:20,bottom:20,left:20,right:20},maxZoom:3,duration:450});
    }
    const message=clue.key==="hemisphere"?"hemisphereMapPurchased":
      clue.key==="continent"?"continentMapPurchased":"sectorMapPurchased";
    toast(tc(message,{cost:number(cost)}));
  }
  function nextHintCost(){
    if(!game||game.finished||game.revealed>=EVIDENCE_COUNT)return 0;
    const clue=cluesFor(game.index,difficulty)[game.revealed];
    return HINT_PRICES[clue?.key]??HINT_COST;
  }
  function renderClues(){
    const clues=cluesFor(game.index,difficulty);
    const revealed=game.revealed;
    $("hintCount").textContent=revealed+" / "+clues.length;
    const list=$("clueList");list.replaceChildren();
    const lockedText=t("locked");
    clues.forEach((clue,i)=>{
      const row=document.createElement("li");row.className="clue"+(i>=revealed?" locked":"");
      const idx=document.createElement("span");idx.className="clue-index";idx.textContent=String(i+1).padStart(2,"0");
      const body=document.createElement("span");body.className="clue-body";
      const category=document.createElement("span");category.className="clue-category";
      const categoryKey=CLUE_CATEGORY_KEYS[clue.key]||"clueRegion";
      category.textContent=t(categoryKey);
      const value=document.createElement("span");value.className="clue-text";
      const clueValue=i<revealed?clueText(clue):lockedText;
      value.textContent=clueValue;
      value.title=clueValue;
      body.append(category,value);
      if(i<revealed&&MAP_OVERLAY_COSTS[clue.key]){
        const purchased=Array.isArray(game.sectorReveals)&&game.sectorReveals.includes(clue.key);
        const button=document.createElement("button");
        button.type="button";
        button.className="sector-map-btn"+(purchased?" purchased":"");
        button.textContent=purchased?tc("sectorMapped"):tc("sectorMapButton",{cost:number(MAP_OVERLAY_COSTS[clue.key])});
        button.title=button.textContent;
        button.setAttribute("aria-label",button.textContent);
        button.disabled=game.finished||purchased||!map||!mapStyleReady||
          (clue.key==="continent"&&!CONTINENT_BORDERS[continentKey(game.index)]);
        button.addEventListener("click",()=>revealGeographyOnMap(clue));
        body.classList.add("with-sector-map");
        body.append(button);
      }
      row.append(idx,body);list.append(row);
    });
    $("revealBtn").disabled=game.finished||revealed>=EVIDENCE_COUNT;
    $("revealCost").textContent=game.finished||revealed>=EVIDENCE_COUNT
      ?"":"−"+number(nextHintCost());
    $("revealBtn").classList.toggle("hidden",game.finished);
  }
  function guessMetricText(g){
    // Hide both distance and bearing if the displayed result rounds to 0 km.
    if(Math.round(g.distance)===0)return "";
    return number(g.distance)+" km"+(difficulty==="hard"?"":" · "+direction(g.bearing));
  }
  function renderHistory(){
    const list=$("guessHistory");list.replaceChildren();
    const count=game.guesses.length;
    $("historyCount").textContent=String(count).padStart(2,"0");
    if(!count){
      const li=document.createElement("li");li.className="empty-history";li.textContent=t("empty");list.append(li);return;
    }
    // Render newest first without copying and reversing the guesses array.
    for(let i=count-1;i>=0;i--){
      const g=game.guesses[i];
      const row=document.createElement("li");row.className="history-item";
      const label=document.createElement("span");
      const idx=document.createElement("span");idx.className="history-number";idx.textContent=String(i+1).padStart(2,"0");
      label.append(idx,document.createTextNode(g.label||g.lat.toFixed(2)+"°, "+g.lng.toFixed(2)+"°"));
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
    if(!game.guesses.length)return null;
    let best=game.guesses[0];
    for(let i=1;i<game.guesses.length;i++){
      const candidate=game.guesses[i];
      if(candidate.distance<best.distance)best=candidate;
    }
    return best;
  }
  function factFor(index){
    const fact=FACTS[index];
    if(fact&&lang==="pt")return fact[1];
    if(fact&&lang==="en")return fact[0];
    return t("reportFactFallback",{landmark:LANDMARKS[index]});
  }

  function renderCountryProfile(info,code,place){
    const locale=window.GeoCountryProfileI18n?.[lang]||
      window.GeoCountryProfileI18n?.en||{};
    $("reportCountryStatsTitle").textContent=locale.title||"Country profile";
    $("reportCountryStatsSource").textContent=locale.source||
      "Country metadata and historical World Bank indicators";
    const list=$("reportCountryStats");list.replaceChildren();
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
    add("region",place[2]);
    add("capital",countryWord(CAPITALS.has(place[0])));
    add("currency",info?.currency);
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
  function renderCaseNavigation(){
    const daily=game?.mode==="daily";
    const newLabel=t(daily?"newFreeCase":"newCase");
    $("newCaseBtn").textContent=newLabel;
    $("reportNextBtn").textContent=newLabel;
    const other=difficulty==="normal"?"hard":"normal";
    const showOther=daily&&Boolean(game?.finished)&&otherDailyAvailable(other);
    const button=$("reportAlternateBtn");
    button.classList.toggle("hidden",!showOther);
    button.disabled=!showOther;
    if(showOther)button.textContent=t("otherDaily",{difficulty:t(other)});
  }
  function renderDossier(){
    if(!game.finished)return;
    const best=bestGuess();
    const place=cityAt(game.index);
    $("reportCode").textContent=caseCode();
    $("reportVerdict").textContent=t(game.won?"caseSolved":"caseClosed");
    $("reportHeading").textContent=cityName(place);
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
    $("reportAttempts").textContent=game.guesses.length+" / "+maximum();
    $("reportBest").textContent=best?number(best.distance)+" km":"—";
    $("reportHints").textContent=number(Number.isInteger(game.paidHints)
      ?game.paidHints:Math.round(game.penalty/HINT_COST));
    $("reportScore").textContent=number(game.score)+" / 5,000";
    $("reportCoordinates").textContent=place[3].toFixed(4)+"°, "+place[4].toFixed(4)+"°";
    $("reportContinent").textContent=continentName(game.index);
    renderCountryProfile(details,iso,place);
    $("reportFact").textContent=factFor(game.index);
    const log=$("reportTimeline");log.replaceChildren();
    for(const [i,g] of game.guesses.entries()){
      const row=document.createElement("li");row.className="report-log-row";
      if(g===best)row.classList.add("best");
      const n=document.createElement("span");n.className="report-log-index";n.textContent=String(i+1).padStart(2,"0");
      const label=document.createElement("span");label.className="report-log-place";
      label.textContent=g.label||g.lat.toFixed(3)+"°, "+g.lng.toFixed(3)+"°";
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
    // Phone dossier lives inside the lower investigation scroller, without
    // obscuring the square map. Desktop keeps the existing side dossier.
    const mobile=window.matchMedia?.("(max-width: 760px)")?.matches===true;
    const destination=mobile?document.querySelector(".case-card"):document.body;
    if(destination&&dialog.parentElement!==destination)destination.append(dialog);
    if(!dialog.open)dialog.show();
    if(mobile){
      const move=()=>dialog.scrollIntoView?.({behavior:"smooth",block:"start"});
      if(typeof requestAnimationFrame==="function")requestAnimationFrame(move);
      else move();
    }
  }
  function renderResult(){
    renderCaseNavigation();
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
    $("mapToolbar").classList.toggle("is-hard",difficulty==="hard");
    $("mapTitle").textContent=t("map")+" - "+t(difficulty);
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
    // The symbol layer depends on the Equator line source: remove it first.
    for(const id of ["case-sector-longitude","case-sector-latitude",
      "case-hemisphere-arrows","case-hemisphere-line","case-continent-outline"]){
      if(map.getLayer(id))map.removeLayer(id);
      if(map.getSource(id))map.removeSource(id);
    }
    activeLine=false;
  }
  // Full geographic strips, not a marker for the hidden city.
  function sectorRectangle(west,south,east,north){
    return [[[west,south],[east,south],[east,north],[west,north],[west,south]]];
  }
  function drawSectorOverlays(){
    if(!map||!mapStyleReady||!Array.isArray(game.sectorReveals))return;
    for(const clue of cluesFor(game.index,difficulty)){
      if(!game.sectorReveals.includes(clue.key)||!["longitude","latitude"].includes(clue.key))continue;
      const geometry=clue.key==="longitude"
        ?{type:"Polygon",coordinates:sectorRectangle(clue.from,-85,clue.to,85)}
        :{type:"MultiPolygon",coordinates:Array.from({length:6},(_,i)=>
          sectorRectangle(-180+i*60,clue.from,-120+i*60,clue.to))};
      const id="case-sector-"+clue.key;
      map.addSource(id,{type:"geojson",data:{type:"Feature",properties:{},geometry}});
      map.addLayer({id,type:"fill",source:id,
        paint:{"fill-color":"#ffd449","fill-opacity":0.10,"fill-outline-color":"#ffd449"}});
    }
  }
  function drawContinentOutline(){
    if(!map||!mapStyleReady||!Array.isArray(game.sectorReveals)
      ||!game.sectorReveals.includes("continent"))return;
    const shape=CONTINENT_BORDERS[continentKey(game.index)];
    if(!shape)return;
    const id="case-continent-outline";
    // Istanbul spans the Bosporus, so both continental sides are relevant.
    const geometry=game.index===12
      ?{type:"MultiPolygon",coordinates:[
        ...CONTINENT_BORDERS.europe.geometry.coordinates,
        ...CONTINENT_BORDERS.asia.geometry.coordinates
      ]}
      :shape.geometry;
    map.addSource(id,{type:"geojson",data:{
      type:"Feature",properties:{},geometry
    }});
    // Only outline: no fill layer. Remains subtle against geographic labels.
    map.addLayer({id,type:"line",source:id,
      layout:{"line-cap":"round","line-join":"round"},
      paint:{"line-color":"#ffd449","line-width":1.7,"line-opacity":0.28,
        "line-opacity-transition":{duration:0,delay:0}}});
  }
  function drawHemisphereOverlay(){
    if(!map||!mapStyleReady||!Array.isArray(game.sectorReveals)
      ||!game.sectorReveals.includes("hemisphere")
      ||!cluesFor(game.index,difficulty).some(clue=>clue.key==="hemisphere"))return;
    const north=cityAt(game.index)[3]>=0;
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
  function renderMap(){
    if(!map)return;
    clearMapOverlays();
    drawSectorOverlays();
    drawHemisphereOverlay();
    drawContinentOutline();
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
    if(game.finished||game.revealed>=EVIDENCE_COUNT)return;
    const cost=nextHintCost();
    if(!cost)return;
    if(!Number.isInteger(game.paidHints))
      game.paidHints=Math.round(game.penalty/HINT_COST); // Legacy daily cases.
    game.revealed++;
    game.penalty+=cost;
    game.paidHints++;
    save();renderClues();toast(t("hintUsed",{cost:number(cost)}));
  }
  function guess(){
    if(!selected||game.finished)return;
    const pos=[selected.lat,selected.lng],to=cityCoords(game.index),distance=dist(pos,to);
    game.guesses.push({lat:selected.lat,lng:selected.lng,label:selected.label,
      at:new Date().toISOString(),distance:Math.round(distance),bearing:Math.round(heading(pos,to))});
    game.won=distance<=WIN_RADIUS;
    if(game.won||game.guesses.length>=maximum()){
      game.finished=true;game.revealed=EVIDENCE_COUNT;
      game.score=game.won
        ?Math.max(0,Math.max(250,Math.round(5000*Math.pow(.78,game.guesses.length-1)*Math.max(.76,1-distance/425)-game.penalty))-(game.sectorMapPenalty||0))
        :0;
    }else game.revealed=Math.min(EVIDENCE_COUNT,
      Math.max(game.revealed,DIFFICULTIES[difficulty].initial+game.guesses.length));
    save();selected=null;render();
    if(game.finished){showReport();}
    // Keep the investigator’s chosen zoom after a wrong guess.
  }
  function searchLocal(term){
    const q=norm(term),results=[];
    for(const {place,index,terms} of LOCAL_SEARCH_INDEX){
      if(!terms.includes(q))continue;
      results.push({name:cityName(place),description:countryName(index),lat:place[3],lon:place[4]});
      if(results.length===5)break;
    }
    return results;
  }
  function suggestions(items){
    const list=$("suggestions");list.replaceChildren();
    if(!items.length){
      const empty=document.createElement("div");empty.className="suggestion-empty";empty.textContent=t("noResults");list.append(empty);
    }
    for(let i=0;i<items.length&&i<7;i++){
      const item=items[i];
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
    // Local matches were already rendered by the input handler.
    const local=searchLocal(term);
    if(controller)controller.abort();
    const signaler=new AbortController();controller=signaler;
    try{
      const supported=GEOCODER_LANGUAGES.has(lang)?lang:"en";
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
    const txt="Cartigma "+caseCode()
      +"\n"+(game.won?"✓ "+game.guesses.length+"/"+maximum():"×")+" · "+number(game.score)+" pts\n"+symbols
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
      if(map){try{map.remove()}catch(error){console.warn(error)}}
      $("map").replaceChildren();
      map=null;mapStyleReady=false;overlayMarkers=[];marker=null;activeLine=false;
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
      if(game.finished||pointerMoved||Date.now()-lastDragAt<220)return;
      selectPoint(event.lngLat.lat,event.lngLat.lng,"");
    });
  }
  function init(){
    if(PLACES.length!==500||EXTENDED.length!==426||
       new Set(COUNTRY_CODES).size!==Object.keys(COUNTRY_INSIGHTS).length||
       PLACES.length!==FEATURES.length||
       PLACES.length!==COUNTRY_CODES.length||PLACES.length!==LANDMARKS.length||
       PLACES.length!==FACTS.length||Object.keys(NEARBY_REFERENCES).length<45)
      throw new Error("Location catalogue and metadata are out of sync");
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
    $("resetViewBtn").addEventListener("click",resetMapView);
    $("mapVectorBtn").addEventListener("click",()=>setMapStyle("vector"));
    $("mapOsmBtn").addEventListener("click",()=>setMapStyle("osm"));
    initMapFiltersUI();
    syncMapStylePicker();
    $("reportOpenBtn").addEventListener("click",showReport);
    $("newCaseBtn").addEventListener("click",startFree);
    $("reportCloseBtn").addEventListener("click",closeReport);
    $("reportMapBtn").addEventListener("click",closeReport);
    $("reportNextBtn").addEventListener("click",()=>{closeReport();startFree()});
    $("reportAlternateBtn").addEventListener("click",()=>{
      if(game?.mode!=="daily"||!game.finished)return;
      const other=difficulty==="normal"?"hard":"normal";
      if(!otherDailyAvailable(other))return;
      closeReport();
      setDifficulty(other);
    });
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