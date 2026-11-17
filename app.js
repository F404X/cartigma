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
  const CURRENCY_DENOMINATIONS = window.GeoCurrencyDenominations || {};
  const CITY_INDICATORS = window.CartigmaCityIndicators || [];
  const CITY_URBAN_2025 = window.CartigmaUrban2025 || {};
  const CITY_CLUES_I18N = window.CartigmaCityClueI18n || {};
  const ATLAS_I18N = window.CartigmaAtlasI18n || {};
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
  const DIFFICULTIES = {normal:{attempts:6,initial:2},hard:{attempts:4,initial:1},rush:{attempts:Infinity,initial:1}};
  const SERIAL_PREFIX = "geodetective-case-counter-";
  const EVIDENCE_COUNT = 10;
  const WIN_RADIUS = 100, HINT_COST = 300, DAILY_KEY = "geodetective-daily-v3-";
  // 300 is preserved only for loading older saved games. New charges reflect
  // information gain; the price for the NEXT clue is always shown before purchase.
  const HINT_PRICES=Object.freeze({
    hemisphere:150,terrain:200,zone:200,continent:300,capital:250,
    adminRegion:350,landmark:500,
    longitude:400,latitude:450,utmZone:450,utmBand:450,
    countryCurrency:250,countryLanguageFamily:250,countryFlagColor:200,
    countryPopulation:300,countryGDP:350,countryArea:300,countryLandlocked:200,
    cityCapitalDistance:500,cityCoastDistance:350,cityPopulation:300,
    cityDensity:400,cityTimezone:200
  });
  // Overlay costs differ by how tightly each display constrains the target.
  const MAP_OVERLAY_COSTS=Object.freeze({hemisphere:250,continent:500,zone:600,
    longitude:1000,latitude:1100,utmZone:1200,utmBand:1300});
  // Hard charges 50% more for clues AND every map aid, rounding to 50 points.
  // Stored purchases retain their original cost when a daily case is reopened.
  const HARD_COST_FACTOR=1.5;
  const pricedCost=(base)=>difficulty==="hard"
    ?Math.ceil(base*HARD_COST_FACTOR/50)*50:base;
  const overlayCost=(key)=>pricedCost(MAP_OVERLAY_COSTS[key]||0);
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
  let rushCountryRequest=0, countryShapesPromise=null;
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
      CITY_CLUES_I18N[lang]?.templates?.[key] ??
      CLUE_I18N.en?.templates?.[key] ??
      CITY_CLUES_I18N.en?.templates?.[key] ??
      COUNTRY_CLUE_I18N.en?.[key] ?? key;
    return template.replace(/\{(\w+)\}/g,(_,name)=>String(variables[name]??""));
  }
  function locale() {return LANGS[lang] || "en";}
  function number(value){return Math.round(value).toLocaleString(locale())}
  // Each published inequality is strictly true for the source value. The
  // threshold is deliberately rounded and 11–21% away from that value.
  function numericBoundary(actual,seed){
    if(!Number.isFinite(actual)||actual<=0)throw Error("Invalid numeric evidence");
    const comparison=actual<=1||hash(seed)%2?"<":">";
    const fraction=.11+(hash(seed+":spread")%11)/100;
    const step=Math.max(1,10**(Math.floor(Math.log10(actual))-1));
    const reference=actual*(comparison===">"?1-fraction:1+fraction);
    let bound=Math.round(reference/step)*step;
    if(comparison===">"&&bound>=actual)bound=Math.floor((actual-1)/step)*step;
    if(comparison==="<"&&bound<=actual)bound=Math.ceil((actual+1)/step)*step;
    bound=Math.max(1,Math.round(bound));
    if(!(comparison===">"?actual>bound:actual<bound))
      throw Error("Invalid numeric inequality");
    return {comparison,value:number(bound)};
  }
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
  function latitudeZoneKey(latitude){
    const a=Math.abs(latitude);
    return a<10?"equatorial":a<23.5?"tropical":a<35?"subtropical":
      a<55?"temperate":a<66.5?"subpolar":"polar";
  }
  function latitudeZone(latitude) {
    const key=latitudeZoneKey(latitude);
    return CLUE_I18N[lang]?.zones?.[key] || CLUE_I18N.en?.zones?.[key] || key;
  }
  // Verified latitude-band intersections by country/territory. Generated from
  // Natural Earth low-resolution sovereign geometries; PF and SG are supplied
  // from their island extents. Each entry is primary-band index:6-bit mask.
  const COUNTRY_BELT_NAMES=Object.freeze(
    ["equatorial","tropical","subtropical","temperate","subpolar","polar"]);
  const COUNTRY_BELT_DATA=Object.freeze(Object.fromEntries(
    "AE=2:6 AF=2:12 AL=3:8 AM=3:8 AO=1:3 AR=3:30 AT=3:8 AU=2:14 AZ=3:8 BA=3:8 BD=2:6 BE=3:8 BF=1:3 BG=3:8 BI=0:1 BJ=0:3 BN=0:1 BO=1:3 BR=1:7 BT=2:4 BW=1:6 BY=3:24 BZ=1:2 CA=4:56 CD=0:3 CF=0:3 CG=0:1 CH=3:8 CI=0:3 CL=3:30 CM=0:3 CN=3:14 CO=0:3 CR=0:3 CU=1:2 CZ=3:8 DE=3:8 DJ=1:2 DK=4:24 DO=1:2 DZ=2:14 EC=0:1 EE=4:16 EG=2:6 ER=1:2 ES=3:8 ET=0:3 FI=4:48 FJ=1:2 FR=3:9 GA=0:1 GB=3:24 GE=3:8 GH=0:3 GM=1:2 GN=1:3 GQ=0:1 GR=3:12 GT=1:2 GW=1:2 GY=0:1 HN=1:2 HR=3:8 HT=1:2 HU=3:8 ID=0:3 IE=3:24 IL=2:4 IN=1:15 IQ=2:12 IR=2:12 IS=4:48 IT=3:8 JM=1:2 JO=2:4 JP=3:12 KE=0:1 KG=3:8 KH=1:2 KP=3:8 KR=3:12 KW=2:4 KZ=3:24 LA=1:2 LB=2:4 LK=0:1 LR=0:1 LS=2:4 LT=4:24 LU=3:8 LV=4:16 LY=2:6 MA=2:14 MD=3:8 ME=3:8 MG=1:6 MK=3:8 ML=1:6 MM=1:6 MN=3:8 MR=1:6 MW=1:3 MX=2:6 MY=0:1 MZ=1:6 NA=1:6 NE=1:2 NG=0:3 NI=1:2 NL=3:8 NO=5:48 NP=2:4 NZ=3:12 OM=1:6 PA=0:1 PE=0:3 PF=1:7 PG=0:3 PH=1:3 PK=2:12 PL=3:8 PT=3:8 PY=1:6 QA=2:4 RO=3:8 RS=3:8 RU=4:56 RW=0:1 SA=2:6 SB=0:3 SD=1:3 SE=4:48 SG=0:1 SI=3:8 SK=3:8 SL=0:3 SN=1:2 SO=0:3 SR=0:1 SV=1:2 SY=3:12 SZ=2:4 TD=1:3 TG=0:3 TH=1:3 TJ=3:8 TL=0:1 TM=3:8 TN=2:12 TR=3:8 TT=1:2 TW=2:6 TZ=0:3 UA=3:8 UG=0:1 US=3:62 UY=2:4 UZ=3:8 VE=0:3 VN=1:3 VU=1:2 YE=1:2 ZA=2:6 ZM=1:3 ZW=1:2".split(" ").map(item=>{
      const [code,record]=item.split("="),[primary,mask]=record.split(":").map(Number);
      return [code,Object.freeze({primary,mask})];
    })));
  function countryBelts(index){
    const code=COUNTRY_CODES[index],record=COUNTRY_BELT_DATA[code];
    if(!record)throw Error("Missing country latitude coverage: "+code);
    return {code,primary:COUNTRY_BELT_NAMES[record.primary],
      zones:COUNTRY_BELT_NAMES.filter((_,n)=>record.mask&(1<<n))};
  }
  function countryLatitudeZone(index){
    const {primary,zones}=countryBelts(index);
    const name=CLUE_I18N[lang]?.zones?.[primary]||
      CLUE_I18N.en?.zones?.[primary]||primary;
    return name+(zones.length>1?" (+"+(zones.length-1)+")":"");
  }
  // Latitude belts describe angular position, not meteorological climate.
  // All non-equatorial belts occur in both hemispheres. Keep both visible,
  // since a latitude clue alone must not disclose the target's hemisphere.
  const LATITUDE_BELT_LIMITS=Object.freeze({
    equatorial:[[-10,10]],
    tropical:[[-23.5,-10],[10,23.5]],
    subtropical:[[-35,-23.5],[23.5,35]],
    temperate:[[-55,-35],[35,55]],
    subpolar:[[-66.5,-55],[55,66.5]],
    polar:[[-85.05,-66.5],[66.5,85.05]]
  });
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
  function latitudeGridClue(index,level){
    const latitude=cityAt(index)[3];
    if(level==="hard")return {key:"utmBand",band:utmLatitudeBand(latitude)};
    const from=Math.floor(latitude/15)*15;
    return {key:"latitude",from,to:from+15};
  }
  // For already-started saved investigations only. New cases never offer
  // an associated landmark as evidence; the city archive still lists it.
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
    if(data.currency)add("countryCurrency",{
      name:currencyClueName(data.currency,data.currencyName)
    });
    if(data.languageFamily){
      const family=lang==="pt"?(COUNTRY_FAMILIES_PT[data.languageFamily]||data.languageFamily):data.languageFamily;
      add("countryLanguageFamily",{family});
    }
    if(data.flagColor){
      const color=COUNTRY_CLUE_I18N[lang]?.colors?.[data.flagColor]||
        COUNTRY_CLUE_I18N.en?.colors?.[data.flagColor]||data.flagColor;
      add("countryFlagColor",{color});
    }
    if(data.population&&data.populationYear)
      add("countryPopulation",{...numericBoundary(data.population,
        code+":countryPopulation:"+level),year:data.populationYear});
    if(data.gdpPerCapita&&data.gdpYear)
      add("countryGDP",{...numericBoundary(data.gdpPerCapita,
        code+":countryGDP:"+level),year:data.gdpYear});
    if(data.area)
      add("countryArea",{...numericBoundary(data.area,
        code+":countryArea:"+level)});
    if(typeof data.landlocked==="boolean")
      // Keep the source boolean, not a translated yes/no string.
      add("countryLandlocked",{landlocked:data.landlocked});
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
    // Keep the two previously selected facts in their original order so
    // in-progress daily cases retain all the hints they already purchased.
    const chosen=hash(id+":order")%2?[second,first]:[first,second];
    const remaining=candidates.filter(item=>!chosen.some(pick=>pick.key===item.key))
      .sort((a,b)=>hash(id+":more:"+a.key)-hash(id+":more:"+b.key));
    if(remaining.length<3)throw Error("Not enough additional verified evidence for "+code);
    return [...chosen,...remaining.slice(0,3)];
  }
  // City measurements are optional, never inferred from countrywide figures.
  function extraCityClues(index){
    const data=CITY_INDICATORS[index]||{},urban=CITY_URBAN_2025[index]||{};
    const clues=[],add=(key,props)=>clues.push({key,...props});
    const city=cityAt(index);
    if(data.cap&&Number.isFinite(data.cap[0])&&data.cap[0]>0)
      add("cityCapitalDistance",{value:number(data.cap[0]),capital:data.cap[1],year:2026});
    // Natural Earth includes the Caspian Sea among its coastlines even
    // though it is a lake: omit uncertain Caspian-basin coastal distances.
    const nearCaspian=city[3]>=32&&city[3]<=50&&city[4]>=40&&city[4]<=61;
    if(data.coast&&!nearCaspian)
      add("cityCoastDistance",{value:number(data.coast),year:2026});
    if(urban.population>0&&urban.year===2025)
      add("cityPopulation",{...numericBoundary(urban.population,index+":cityPopulation"),year:2025});
    if(urban.density>0&&urban.year===2025)
      add("cityDensity",{...numericBoundary(urban.density,index+":cityDensity"),year:2025});
    if(data.tz){
      try{
        const stamp=new Date();
        const offset=new Intl.DateTimeFormat("en-US",{timeZone:data.tz,
          timeZoneName:"shortOffset"}).formatToParts(stamp)
          .find(part=>part.type==="timeZoneName")?.value;
        if(offset&&/^GMT(?:[+-][0-9]{1,2}(?::[0-9]{2})?)?$/.test(offset))
          add("cityTimezone",{offset:offset.replace("GMT","UTC"),
            year:stamp.getUTCFullYear()});
      }catch(error){/* Unknown local zone: skip, never guess an offset. */}
    }
    return clues;
  }
  function cluesFor(index,level,revision=null){
    // Version 3 retires landmark and administrative-region evidence.
    // Preserve purchased hints in version 1/2 daily saves. The public city
    // archive always requests version 3, regardless of the active save.
    const evidenceVersion=revision??(game?.index===index
      ?(game.evidenceVersion??2):3);
    const legacy=evidenceVersion===1;
    const archived=evidenceVersion<3;
    const cacheKey=index+":"+level+":"+lang+":"+evidenceVersion;
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
      ?(archived&&safeRegion&&!extra.capital
        ?{key:"adminRegion",value:p[2]}:capital)
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
    const geographic=[third,coordinateClue(index,level),
      archived?landmarkClue(index,level):latitudeGridClue(index,level)];
    for(let i=geographic.length-1;i>0;i--){
      const j=hash("geographic-order:"+index+":"+level+":"+i)%(i+1);
      [geographic[i],geographic[j]]=[geographic[j],geographic[i]];
    }
    let next=0;
    for(let i=0;i<mixed.length;i++)if(!mixed[i])mixed[i]=geographic[next++];
    // Versioned layouts preserve the first seven clues only for saved cases
    // that already earned or purchased evidence. New games have no landmark
    // or administrative-region clue, without altering their guess limits.
    const clues=[opening,{key:"continent",value:continentName(index)},...mixed];
    const usedKeys=new Set(clues.map(clue=>clue.key));
    const extraGeographic=[
      zone,terrain,
      ...(reliableCapital||index>=BASE_CITIES?[capital]:[]),
      ...(archived&&safeRegion?[{key:"adminRegion",value:p[2]}]:[])
    ].find(clue=>!usedKeys.has(clue.key));
    let additional;
    if(legacy){
      // Keep all three purchased late clues in pre-update daily cases.
      additional=extraGeographic
        ?[countryFacts[2],extraGeographic,countryFacts[3]]
        :[countryFacts[2],countryFacts[3],countryFacts[4]];
      if(extraGeographic&&mixed[4]?.key.startsWith("country"))
        [additional[0],additional[1]]=[additional[1],additional[0]];
    }else{
      additional=[];
      const fallbacks=[...(extraGeographic?[extraGeographic]:[]),
        ...countryFacts.slice(2)];
      for(const item of [...extraCityClues(index),...fallbacks]){
        if(usedKeys.has(item.key)||additional.some(x=>x.key===item.key))continue;
        additional.push(item);
        if(additional.length===3)break;
      }
    }
    if(additional.length!==3||additional.some(clue=>usedKeys.has(clue.key))||
      new Set(additional.map(clue=>clue.key)).size!==3)
      throw Error("Repeated or missing evidence in case "+index);
    clues.push(...additional);
    if(!archived&&clues.some(clue=>["landmark","adminRegion"].includes(clue.key)))
      throw Error("Retired evidence in a new case "+index);
    if(clues.length!==EVIDENCE_COUNT)throw Error("Incomplete evidence set for "+index);
    clueCache.set(cacheKey,clues);
    return clues;
  }
  function clueText(clue,referenceIndex=game.index){
    if(clue.key==="countryLandlocked"){
      // Resolve this clue from source geography, not a possibly stale cached value.
      const authoritative=COUNTRY_INSIGHTS[COUNTRY_CODES[referenceIndex]]?.landlocked;
      const value=typeof authoritative==="boolean"?authoritative:clue.landlocked;
      if(typeof value==="boolean")
        return tc(value?"countryLandlockedYes":"countryLandlockedNo");
    }
    return tc(clue.key,clue);
  }
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
      started:difficulty!=="rush",
      startedAt:difficulty==="rush"?null:Date.now(),endedAt:null,durationMs:null,
      revealed:DIFFICULTIES[difficulty].initial,penalty:0,paidHints:0,
      sectorMapPenalty:0,sectorReveals:[],evidenceVersion:3,
      finished:false,won:false,score:0};
  }
  function isRush(){return difficulty==="rush"}
  function caseCode(){
    return "#"+difficulty[0].toUpperCase()+"-"+game.date.replaceAll("-","")+"-"+String(game.serial).padStart(2,"0");
  }
  const RUSH_DURATION_MS=60000, RUSH_CLUE_INTERVAL_MS=6000;
  function elapsedMs(){
    if(!game)return 0;
    if(game.finished&&Number.isFinite(game.durationMs))return game.durationMs;
    if(isRush()&&!game.started)return 0;
    return Math.max(0,Date.now()-(Number.isFinite(game.startedAt)?game.startedAt:Date.now()));
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
  function startRush(){
    if(!game||!isRush()||game.finished||game.started)return;
    game.started=true;
    game.startedAt=Date.now();
    rushCountryRequest++;
    save();render();clockTick();
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
    if(rushRemaining()===0){
      game.finished=true;game.won=false;game.revealed=EVIDENCE_COUNT;
      game.endedAt=new Date(game.startedAt+RUSH_DURATION_MS).toISOString();
      game.durationMs=RUSH_DURATION_MS;game.score=0;
      selected=null;save();render();showReport();return;
    }
    const count=Math.min(EVIDENCE_COUNT,DIFFICULTIES.rush.initial+
      Math.floor(elapsedMs()/RUSH_CLUE_INTERVAL_MS));
    if(count>game.revealed){game.revealed=count;save();renderClues();}
  }
  function savedDaily(){
    const s=store.get(dailyStorageKey());
    const valid=s&&s.mode==="daily"&&s.date===today()&&s.difficulty===difficulty
      &&s.index===dailyIndex()&&Array.isArray(s.guesses)&&s.guesses.length<=maximum()
      &&Number.isFinite(s.revealed)
      &&s.guesses.every(g=>Number.isFinite(g.lat)&&Number.isFinite(g.lng)&&Number.isFinite(g.distance));
    if(!valid)return null;
    if(!Number.isInteger(s.evidenceVersion)){
      // Older saved cases with slots 8–10 already revealed retain the
      // original evidence, protecting points already spent.
      s.evidenceVersion=s.revealed>7?1:2;
      store.set(dailyStorageKey(),s);
    }
    if(s.difficulty==="rush"&&typeof s.started!=="boolean"){
      // Previously opening a Rush daily started the timer without consent.
      // Allow unopened, unguessed legacy cases to use the new Start gate.
      if(!s.guesses.length){
        s.started=false;s.startedAt=null;s.endedAt=null;s.durationMs=null;
        s.finished=false;s.won=false;s.score=0;s.revealed=DIFFICULTIES.rush.initial;
      }else s.started=Number.isFinite(s.startedAt);
      store.set(dailyStorageKey(),s);
    }
    if(!Number.isFinite(s.startedAt)&&s.difficulty!=="rush"){
      s.startedAt=s.finished?(Date.parse(s.guesses[0]?.at)||Date.now()):Date.now();
      store.set(dailyStorageKey(),s);
    }
    // A never-played saved daily case can safely receive the new clue set.
    // Cases with previous attempts or paid evidence retain their prior clues.
    if(s.evidenceVersion<3&&!s.finished&&s.guesses.length===0&&
      s.revealed===DIFFICULTIES[difficulty].initial&&!s.paidHints){
      s.evidenceVersion=3;
      store.set(dailyStorageKey(),s);
    }
    // Before this release, northern-only regions could receive a hemisphere
    // map purchase. Refund its previous 600-point cost on open cases now that
    // the evidence no longer appears in those continents.
    if(!s.finished&&Array.isArray(s.sectorReveals)
      &&s.sectorReveals.includes("hemisphere")
      &&!EQUATOR_CROSSING_CONTINENTS.has(continentKey(s.index))){
      s.sectorReveals=s.sectorReveals.filter(key=>key!=="hemisphere");
      s.sectorMapPenalty=Math.max(0,(s.sectorMapPenalty||0)-600);
      store.set(dailyStorageKey(),s);
    }
    return s;
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
    rushCountryRequest++;
    game=savedDaily()||newGame("daily",dailyIndex());
    if(!Number.isInteger(game.serial)||game.serial<1){
      game.serial=nextCaseNumber(game.date);
      save();
    }
    save();
    selected=null;closeReport();render();resetMapView();clockTick();
    if(isRush())rushCountryFeatures().catch(()=>{});
  }
  function startFree(){
    rushCountryRequest++;game=newGame("free",chooseFree());
    selected=null;closeReport();render();resetMapView();clockTick();
    if(isRush())rushCountryFeatures().catch(()=>{});
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
    $("citySearch").placeholder=t(isRush()?"rushSearchPlaceholder":"searchPlaceholder");
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
    terrain:"clueTerrain",continent:"clueRegion",zone:"clueClimate",adminRegion:"clueRegion",
    countryCurrency:"clueCivic",countryLanguageFamily:"clueCivic",
    countryFlagColor:"clueCivic",countryPopulation:"clueCivic",
    countryGDP:"clueCivic",countryArea:"clueRegion",
    countryLandlocked:"clueRegion",
    hemisphere:"clueRegion",capital:"clueCivic",longitude:"clueRegion",
    latitude:"clueRegion",utmZone:"clueRegion",utmBand:"clueRegion",
    landmark:"clueLandmark",
    cityCapitalDistance:"clueRegion",cityCoastDistance:"clueRegion",
    cityPopulation:"clueCivic",cityDensity:"clueCivic",cityTimezone:"clueRegion"
  });
  function revealGeographyOnMap(clue){
    const cost=overlayCost(clue.key);
    if(game.finished||!map||!mapStyleReady||!cost)return;
    if(clue.key==="continent"&&!CONTINENT_BORDERS[continentKey(game.index)])return;
    if(!cluesFor(game.index,difficulty).slice(0,game.revealed).some(item=>
      item.key===clue.key&&(
        item.key==="utmZone"?item.zone===clue.zone:
        item.key==="utmBand"?item.band===clue.band:
        ["hemisphere","continent","zone"].includes(clue.key)
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
    }else if(clue.key==="zone"){
      // Show both hemispheres without centering on the hidden city's latitude.
      map.easeTo({center:[0,0],zoom:1.55,duration:450});
    }else{
      let bounds;
      if(clue.key==="utmZone"){
        const polygons=utmZonePolygons(clue.zone);
        const coords=polygons.flatMap(poly=>poly[0]);
        bounds=[[Math.min(...coords.map(p=>p[0])),Math.min(...coords.map(p=>p[1]))],
          [Math.max(...coords.map(p=>p[0])),Math.max(...coords.map(p=>p[1]))]];
      }else if(clue.key==="utmBand"){
        const [south,north]=utmBandBounds(clue.band);
        bounds=[[-179.5,south],[179.5,north]];
      }else bounds=clue.key==="longitude"?
        [[clue.from,-75],[clue.to,75]]:[[-179.5,clue.from],[179.5,clue.to]];
      map.fitBounds(bounds,{padding:{top:20,bottom:20,left:20,right:20},maxZoom:3,duration:450});
    }
    const message=clue.key==="hemisphere"?"hemisphereMapPurchased":
      clue.key==="continent"?"continentMapPurchased":"sectorMapPurchased";
    toast(tc(message,{cost:number(cost)}));
  }
  function nextHintCost(){
    if(!game||game.finished||isRush()||game.revealed>=EVIDENCE_COUNT)return 0;
    const clue=cluesFor(game.index,difficulty)[game.revealed];
    return pricedCost(HINT_PRICES[clue?.key]??HINT_COST);
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
      category.textContent=CITY_CLUES_I18N[lang]?.categories?.[clue.key]||
        CITY_CLUES_I18N.en?.categories?.[clue.key]||
        (clue.key==="countryLandlocked"
          ?(COUNTRY_CLUE_I18N[lang]?.countryLandlockedLabel||
            COUNTRY_CLUE_I18N.en?.countryLandlockedLabel||"Sea access")
          :t(categoryKey));
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
        button.textContent=purchased?tc("sectorMapped"):tc("sectorMapButton",{cost:number(overlayCost(clue.key))});
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
    $("revealBtn").disabled=game.finished||isRush()||revealed>=EVIDENCE_COUNT;
    $("revealCost").textContent=game.finished||revealed>=EVIDENCE_COUNT
      ?"":"−"+number(nextHintCost());
    $("revealBtn").classList.toggle("hidden",game.finished||isRush());
  }
  function guessMetricText(g){
    if(isRush())return g.countryCode===COUNTRY_CODES[game.index]?"✓":"×";
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
    if(isRush())return game.guesses.find(g=>g.countryCode===COUNTRY_CODES[game.index])||null;
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
    add("region",place[2]);
    add("capital",countryWord(CAPITALS.has(place[0])));
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
  // Public 500-city archive: it only reads the same static catalogue and
  // translated clue sources as the game. Neither selection nor opening it
  // changes the active investigation, location marker, score, or saved state.
  let atlasSelected=0;
  let atlasButtons=[];
  const ATLAS_ROWS=PLACES.map((place,index)=>({place,index}));
  function atlasText(key,vars={}){
    const template=ATLAS_I18N[lang]?.[key]||ATLAS_I18N.en?.[key]||key;
    return template.replace(/\{(\w+)\}/g,(_,name)=>String(vars[name]??""));
  }
  function atlasFacts(index){
    const place=cityAt(index),code=COUNTRY_CODES[index],details=COUNTRY_INSIGHTS[code]||{};
    const list=$("atlasCityFacts");list.replaceChildren();
    const add=(key,value)=>{
      if(value===undefined||value===null||value==="")return;
      const cell=document.createElement("div");
      const dt=document.createElement("dt"),dd=document.createElement("dd");
      dt.textContent=atlasText(key);dd.textContent=String(value);
      cell.append(dt,dd);list.append(cell);
    };
    add("region",place[2]);
    // Keep both descriptive fields recorded with every source city. They are
    // Portuguese source text even when another interface language is active.
    if(place[5])add("geoNote",place[5]);
    if(place[6])add("catalogNote",place[6]);
    add("coordinates",place[3].toFixed(4)+"°, "+place[4].toFixed(4)+"°");
    add("continent",continentName(index));
    // A missing or disputed capital definition should not become a false fact.
    if(!["Jerusalém","La Paz","Jacarta"].includes(place[0]))
      add("nationalCapital",tc(CAPITALS.has(place[0])?"yes":"no"));
    if(index<BASE_CITIES&&FEATURES[index]!=="urban")
      add("landscape",locationFeature(index));
    add("climateZone",latitudeZone(place[3]));
    add("hemisphere",tc(place[3]>=0?"north":"south"));
    const longitudeStart=Math.floor(place[4]/30)*30;
    const latitudeStart=Math.floor(place[3]/15)*15;
    add("longitudeSector",tc("longitude",{from:longitudeStart,to:longitudeStart+30}));
    add("latitudeSector",tc("latitude",{from:latitudeStart,to:latitudeStart+15}));
    if(place[3]>=-80&&place[3]<84){
      add("utmZone",String(utmZone(place[3],place[4])));
      add("utmBand",utmLatitudeBand(place[3]));
    }
    if(index<BASE_CITIES&&LANDMARKS[index])
      add("landmark",LANDMARKS[index]);
    for(const clue of extraCityClues(index)){
      const key={
        cityCapitalDistance:"capitalDistance",cityCoastDistance:"coastDistance",
        cityPopulation:"cityPopulation",cityDensity:"cityDensity",cityTimezone:"timezone"
      }[clue.key];
      if(key){
        // The archive keeps exact sourced statistics; only game evidence is bounded.
        const source=CITY_URBAN_2025[index]||{};
        const exact=clue.key==="cityPopulation"?source.population:
          clue.key==="cityDensity"?source.density:null;
        add(key,exact?tc(clue.key,{...clue,comparison:"≈",value:number(exact)}):
          clueText(clue,index));
      }
    }
    if(!list.children.length){
      const p=document.createElement("p");p.textContent=atlasText("notAvailable");list.append(p);
    }
  }
  function atlasEvidence(index,level,target){
    const list=$(target);list.replaceChildren();
    cluesFor(index,level,3).forEach((clue,i)=>{
      const row=document.createElement("li");row.className="report-evidence-row";
      const count=document.createElement("span");count.textContent=String(i+1).padStart(2,"0");
      const value=document.createElement("span");value.textContent=clueText(clue,index);
      row.append(count,value);list.append(row);
    });
  }
  function renderAtlasCity(index){
    if(!Number.isInteger(index)||index<0||index>=PLACES.length)return;
    atlasSelected=index;
    const place=cityAt(index),code=COUNTRY_CODES[index],details=COUNTRY_INSIGHTS[code]||{};
    $("atlasEntryNo").textContent=String(index+1).padStart(3,"0")+" / 500";
    $("atlasCityName").textContent=cityName(place);
    $("atlasCityCountry").textContent=countryName(index);
    const flag=$("atlasFlag"),fallback=$("atlasFlagFallback");
    fallback.textContent=details.flag||"";
    fallback.classList.add("hidden");flag.classList.remove("hidden");
    flag.alt=countryName(index);
    flag.onerror=()=>{flag.classList.add("hidden");fallback.classList.remove("hidden")};
    flag.src=/^[A-Z]{2}$/.test(code)?"https://flagcdn.com/w160/"+code.toLowerCase()+".png":"";
    atlasFacts(index);
    $("atlasFact").textContent=factFor(index);
    $("atlasHistory").textContent=details.history?.[lang==="pt"?"pt":"en"]||
      details.history?.en||atlasText("notAvailable");
    $("atlasHistorySource").textContent=COUNTRY_CLUE_I18N[lang]?.countryHistorySource||
      COUNTRY_CLUE_I18N.en?.countryHistorySource||"";
    renderCountryProfile(details,code,place,{
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
    const matches=ATLAS_ROWS.map(({place,index})=>({
      place,index,name:cityName(place),country:countryName(index),
      exact:text.length>0&&(norm(place[0])===text||norm(cityName(place))===text||
        norm(EN_CITY[place[0]]||"")===text)
    })).filter(({place,index,name,country})=>{
      const searchable=norm([place[0],EN_CITY[place[0]]||"",
        PT_EXTRA_NAMES[place[0]]||"",place[1],place[2],
        COUNTRY_CODES[index],name,country].join(" "));
      return tokens.every(term=>searchable.includes(term));
    }).sort((a,b)=>Number(b.exact)-Number(a.exact)||
      a.name.localeCompare(b.name,locale())||a.index-b.index);
    $("atlasCount").textContent=atlasText("count",{count:matches.length});
    const options=$("atlasOptions");
    atlasButtons=[];
    if(!matches.length){
      const message=document.createElement("div");message.className="atlas-no-results";
      message.textContent=atlasText("noResults");options.replaceChildren(message);
      return;
    }
    const nodes=matches.map(item=>{
      const button=document.createElement("button");
      button.type="button";button.className="atlas-option";
      button.dataset.index=String(item.index);
      button.setAttribute("role","option");
      button.setAttribute("aria-selected",String(atlasSelected===item.index));
      button.setAttribute("aria-label",item.name+", "+item.country);
      if(atlasSelected===item.index)button.classList.add("selected");
      const flag=document.createElement("span");flag.className="atlas-option-flag";
      flag.textContent=COUNTRY_INSIGHTS[COUNTRY_CODES[item.index]]?.flag||"";
      flag.setAttribute("aria-hidden","true");
      const info=document.createElement("span");info.className="atlas-option-info";
      const title=document.createElement("span");title.className="atlas-option-name";
      title.textContent=item.name;
      const country=document.createElement("span");country.className="atlas-option-country";
      country.textContent=item.country;
      info.append(title,country);
      const ordinal=document.createElement("span");ordinal.className="atlas-option-number";
      ordinal.textContent=String(item.index+1).padStart(3,"0");
      button.append(flag,info,ordinal);
      button.addEventListener("click",()=>{
        renderAtlasCity(item.index);
        // On phones the dossier scrolls below the compact city picker.
        if(window.matchMedia?.("(max-width: 760px)")?.matches)
          $("atlasSheet").scrollTop=0;
      });
      button.addEventListener("keydown",event=>{
        if(["ArrowDown","ArrowUp","Home","End"].includes(event.key)){
          event.preventDefault();
          const current=atlasButtons.indexOf(button);
          const next=event.key==="Home"?0:event.key==="End"?atlasButtons.length-1:
            (current+(event.key==="ArrowDown"?1:-1)+atlasButtons.length)%atlasButtons.length;
          atlasButtons[next]?.focus?.();
        }
      });
      return button;
    });
    atlasButtons=nodes;
    options.replaceChildren(...nodes);
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
    $("atlasCitySectionTitle").textContent=atlasText("cityDetails");
    $("atlasFactTitle").textContent=atlasText("story");
    $("atlasHistoryTitle").textContent=atlasText("history");
    $("atlasNormalLabel").textContent=atlasText("normalEvidence");
    $("atlasHardLabel").textContent=atlasText("hardEvidence");
    $("atlasDataNote").textContent=atlasText("availableNote");
    if($("atlasDialog").open){
      renderAtlasOptions($("atlasSearch").value);
      renderAtlasCity(atlasSelected);
    }
  }
  function initAtlas(){
    const dialog=$("atlasDialog"),search=$("atlasSearch");
    $("atlasBtn").addEventListener("click",()=>{
      syncAtlasLanguage();
      search.value="";
      renderAtlasOptions("");
      renderAtlasCity(atlasSelected);
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
        event.preventDefault();
        atlasButtons[0].focus?.();
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
    $("reportHeading").textContent=isRush()?countryName(game.index):cityName(place);
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
    $("reportBest").textContent=isRush()?"—":best?number(best.distance)+" km":"—";
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
    const name=isRush()?countryName(game.index):cityName(cityAt(game.index))+", "+countryName(game.index);
    $("resultKicker").textContent=t(game.won?"solved":"closed");
    $("resultTitle").textContent=name;
    $("resultDetail").textContent=isRush()
      ?t(game.won?"rushFound":"rushLost",{country:name,count:game.guesses.length,
        time:formatElapsed(game.durationMs??elapsedMs())})
      :game.won?t("foundText",{city:name,count:game.guesses.length,
        km:number(bestGuess().distance)}):t("lostText",{city:name});
    $("finalScore").textContent=number(game.score);
    renderDossier();
  }
  function feedback(){
    const el=$("feedback");
    if(!game.guesses.length||game.finished){el.classList.add("hidden");return}
    const last=game.guesses.at(-1);
    el.textContent=isRush()?t("rushWrong"):
      difficulty==="hard"?t("hardDistance",{km:number(last.distance)}) :
      t("feedback",{km:number(last.distance),dir:direction(last.bearing)});
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
    $("modeCaption").textContent=t(daily?"modeDaily":"modeFree");
    $("caseTitle").textContent=game.finished?(isRush()?countryName(game.index):cityName(cityAt(game.index))):t("unknown");
    $("caseStatus").textContent=t(game.finished?(game.won?"solved":"closed"):"active");
    $("caseStatus").classList.toggle("closed",game.finished);
    $("attemptCount").textContent=isRush()?t("rushUnlimited"):remaining+" / "+max;
    $("guessCounter").textContent=isRush()?String(game.guesses.length):game.guesses.length+" / "+max;
    const dots=$("attemptDots");dots.replaceChildren();
    dots.style.setProperty("--attempt-total",max);
    if(!isRush())for(let i=0;i<max;i++){const dot=document.createElement("i");dot.classList.toggle("live",i<remaining);dots.append(dot)}
    $("placeCount").textContent=String(PLACES.length);
    renderClues();renderHistory();renderResult();feedback();
    $("guessBtn").disabled=game.finished||!selected||(isRush()&&!game.started);
    $("citySearch").disabled=game.finished||(isRush()&&!game.started);
    $("citySearch").placeholder=t(isRush()?"rushSearchPlaceholder":"searchPlaceholder");
    $("searchLabel").textContent=t(isRush()?"rushSearchLabel":"searchLabel");
    $("citySearch").value="";
    $("suggestions").classList.add("hidden");
    $("selection").classList.toggle("hidden",game.finished);
    $("selectedText").textContent=selected?(selected.label||selected.lat.toFixed(3)+"°, "+selected.lng.toFixed(3)+"°"):t("noSelection");
    $("mapHint").textContent=t(game.finished?"mapRevealed":
      isRush()&&!game.started?"rushIntroHint":isRush()?"rushMapHint":"mapHint");
    $("rushIntro").classList.toggle("hidden",!isRush()||game.started||game.finished);
    $("rushIntro").setAttribute("aria-hidden",String(!isRush()||game.started||game.finished));
    $("rushIntroTitle").textContent=t("rushIntroTitle");
    $("rushIntroText").textContent=t("rushIntroText");
    $("rushStartBtn").textContent=t("rushStart");
    updateClock();renderMap();
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
      "case-latitude-belt","case-utm-annotations","case-utm-grid","case-utm-zone","case-utm-band",
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
        // Do not stroke the artificial 60° tile edges of geographic overlays.
        // Disabling fill antialiasing removes hairline seams between tiles.
        paint:{"fill-color":"#ffd449","fill-opacity":0.10,
          "fill-antialias":false}});
    }
  }
  function drawLatitudeBeltOverlay(){
    if(!map||!mapStyleReady||!game?.sectorReveals?.includes("zone")||
      !cluesFor(game.index,difficulty).some(clue=>clue.key==="zone"))return;
    const belt=latitudeZoneKey(cityAt(game.index)[3]);
    // Web Mercator cannot display exact poles: clip polar rectangles to
    // 85.05 degrees. Split at 60-degree longitude intervals to avoid wraps.
    const coordinates=LATITUDE_BELT_LIMITS[belt].flatMap(([south,north])=>
      Array.from({length:6},(_,i)=>
        sectorRectangle(-180+i*60,south,-120+i*60,north)));
    const id="case-latitude-belt";
    map.addSource(id,{type:"geojson",data:{type:"Feature",properties:{belt},
      geometry:{type:"MultiPolygon",coordinates}}});
    map.addLayer({id,type:"fill",source:id,
      paint:{"fill-color":"#ffd449","fill-opacity":0.10,
        "fill-antialias":false}});
  }
  // UTM grid spans 80°S–84°N. Bands C–W are 8° high; X is 12°.
  // Norway's 32V and Svalbard's 31X/33X/35X/37X boundaries are irregular.
  const UTM_BANDS="CDEFGHJKLMNPQRSTUVWX";
  const UTM_LONGITUDE_CUTS=Object.freeze(
    [...new Set([...Array.from({length:61},(_,i)=>-180+i*6),
      3,9,12,21,33,42])].sort((a,b)=>a-b));
  function utmBandBounds(letter){
    const index=UTM_BANDS.indexOf(letter);
    if(index<0)throw Error("Unknown UTM latitude band "+letter);
    const south=-80+index*8;
    return [south,index===UTM_BANDS.length-1?84:south+8];
  }
  function utmBandRows(){
    return [...UTM_BANDS].map(band=>{
      const [south,north]=utmBandBounds(band);
      return {band,south,north,latitude:(south+north)/2};
    });
  }
  function utmIntervals(zone,latitude){
    const ranges=[];
    for(let i=0;i<UTM_LONGITUDE_CUTS.length-1;i++){
      const left=UTM_LONGITUDE_CUTS[i],right=UTM_LONGITUDE_CUTS[i+1];
      if(utmZone(latitude,(left+right)/2)!==zone)continue;
      if(ranges.length&&ranges.at(-1)[1]===left)ranges.at(-1)[1]=right;
      else ranges.push([left,right]);
    }
    return ranges;
  }
  function utmZonePolygons(zone){
    return utmBandRows().flatMap(row=>utmIntervals(zone,row.latitude)
      .map(([west,east])=>sectorRectangle(west,row.south,east,row.north)));
  }
  function drawUtmOverlays(){
    const purchased=game?.sectorReveals||[];
    if(!map||!mapStyleReady||
      !["utmZone","utmBand"].some(key=>purchased.includes(key)))return;
    const clues=cluesFor(game.index,difficulty);
    const zoneClue=clues.find(clue=>clue.key==="utmZone");
    const bandClue=clues.find(clue=>clue.key==="utmBand");
    const addShape=(id,geometry,opacity)=>{
      map.addSource(id,{type:"geojson",data:{type:"Feature",properties:{},geometry}});
      map.addLayer({id,type:"fill",source:id,
        paint:{"fill-color":"#ffd449","fill-opacity":opacity,
          "fill-antialias":false}});
    };
    if(purchased.includes("utmZone")&&zoneClue)
      addShape("case-utm-zone",{type:"MultiPolygon",coordinates:
        utmZonePolygons(zoneClue.zone)},.10);
    if(purchased.includes("utmBand")&&bandClue){
      const [south,north]=utmBandBounds(bandClue.band);
      addShape("case-utm-band",{type:"MultiPolygon",coordinates:
        Array.from({length:6},(_,i)=>
          sectorRectangle(-180+i*60,south,-120+i*60,north))},.085);
    }
    // Draw only actual UTM boundaries, including the Norway and Svalbard
    // exceptions. Splitting the vertical lines by band avoids false 6° zones.
    const lines=[];
    for(const row of utmBandRows()){
      for(const lon of UTM_LONGITUDE_CUTS.slice(1,-1)){
        if(utmZone(row.latitude,lon-0.001)===utmZone(row.latitude,lon+0.001))
          continue;
        lines.push([[lon,row.south],[lon,row.north]]);
      }
      lines.push([[-179.8,row.south],[179.8,row.south]]);
    }
    lines.push([[-179.8,84],[179.8,84]]);
    map.addSource("case-utm-grid",{type:"geojson",data:{type:"Feature",
      properties:{},geometry:{type:"MultiLineString",coordinates:lines}}});
    map.addLayer({id:"case-utm-grid",type:"line",source:"case-utm-grid",
      paint:{"line-color":"#ffd449","line-width":0.65,
        "line-opacity":0.18,"line-dasharray":[2,3]}});
    // Numbered zones and lettered latitude bands make the overlay a readable
    // geographic ruler, rather than an unlabeled highlighted rectangle.
    const annotations=[];
    if(purchased.includes("utmZone")){
      for(let zone=1;zone<=60;zone++){
        const longitude=-180+(zone-.5)*6;
        annotations.push({type:"Feature",properties:{label:String(zone)},
          geometry:{type:"Point",coordinates:[longitude,-4]}});
      }
    }
    if(purchased.includes("utmBand")){
      for(const row of utmBandRows())
        for(const longitude of [-150,-90,-30,30,90,150])
          annotations.push({type:"Feature",properties:{label:row.band},
            geometry:{type:"Point",coordinates:[longitude,row.latitude]}});
    }
    map.addSource("case-utm-annotations",{type:"geojson",
      data:{type:"FeatureCollection",features:annotations}});
    map.addLayer({id:"case-utm-annotations",source:"case-utm-annotations",
      type:"symbol",minzoom:2.5,
      layout:{"text-field":["get","label"],"text-size":10,
        "text-font":["Open Sans Regular","Arial Unicode MS Regular"],
        "text-allow-overlap":false,"text-optional":true},
      paint:{"text-color":"#ffe28a","text-halo-color":"#122017",
        "text-halo-width":1.3}});
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
    drawLatitudeBeltOverlay();
    drawUtmOverlays();
    drawHemisphereOverlay();
    drawContinentOutline();
    const target=cityCoords(game.index);
    const best=game.finished?bestGuess():null;
    if(!isRush())game.guesses.forEach((g,i)=>addMarker(g.lat,g.lng,i+1,g===best?"best":"past"));
    if(game.finished){
      const adjustedLng=best?target[1]+360*Math.round((best.lng-target[1])/360):target[1];
      addMarker(target[0],adjustedLng,"★","target",cityName(cityAt(game.index))+" · "+countryName(game.index));
      if(best&&!isRush())addResultLine([best.lng,best.lat],[adjustedLng,target[0]]);
      frameResult(isRush()?null:best,target);
    }else if(selected){
      marker=addMarker(selected.lat,selected.lng,isRush()?"✓":"+","current");
    }
    $("coordinates").textContent=game.finished
      ?target[0].toFixed(3)+"°, "+target[1].toFixed(3)+"°"
      :selected?selected.lat.toFixed(3)+"°, "+selected.lng.toFixed(3)+"°":t("noSelection");
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
  async function selectRushPoint(lat,lng){
    const session=game,request=++rushCountryRequest;
    selected=null;
    $("guessBtn").disabled=true;
    $("selectedText").textContent=t("rushCheckingMap");
    try{
      const features=await rushCountryFeatures();
      if(game!==session||!isRush()||game.finished||!game.started||
        request!==rushCountryRequest)return;
      clockTick();
      if(game.finished)return;
      const feature=features.find(item=>
        codeForCountryFeature(item)&&pointInCountry(lng,lat,item.geometry));
      const countryCode=feature&&codeForCountryFeature(feature);
      if(!countryCode){
        $("selectedText").textContent=t("noSelection");
        toast(t("rushNoCountry"));return;
      }
      selected={lat,lng,label:displayRegion(countryCode),countryCode};
      $("selectedText").textContent=selected.label;
      $("citySearch").value=selected.label;
      $("suggestions").classList.add("hidden");
      $("guessBtn").disabled=false;
      renderMap();
    }catch(error){
      if(game!==session||request!==rushCountryRequest)return;
      $("selectedText").textContent=t("noSelection");
      toast(t("rushMapUnavailable"));
    }
  }
  function selectPoint(lat,lng,label){
    if(game.finished)return;
    if(isRush()){
      if(!game.started)return;
      selectRushPoint(Number(lat),Number(lng));
      return;
    }
    selected={lat:Number(lat),lng:Number(lng),label:label||""};
    // A map click only places the pin; city search may recenter without forcing zoom during a drag.
    if(map&&label)map.easeTo({center:[selected.lng,selected.lat],zoom:Math.max(map.getZoom(),4),duration:350});
    $("guessBtn").disabled=false;
    $("selectedText").textContent=selected.label||selected.lat.toFixed(3)+"°, "+selected.lng.toFixed(3)+"°";
    $("suggestions").classList.add("hidden");
    renderMap();
  }
  function reveal(){
    if(game.finished||isRush()||game.revealed>=EVIDENCE_COUNT)return;
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
    if(isRush()&&!game?.started)return;
    clockTick();
    if(!selected||game.finished)return;
    const pos=[selected.lat,selected.lng],to=cityCoords(game.index),distance=dist(pos,to);
    const now=Date.now(),elapsed=Math.max(0,now-game.startedAt);
    if(isRush()&&elapsed>=RUSH_DURATION_MS){clockTick();return}
    game.guesses.push({lat:selected.lat,lng:selected.lng,label:selected.label,
      countryCode:selected.countryCode||null,at:new Date(now).toISOString(),
      elapsedMs:elapsed,distance:Math.round(distance),bearing:Math.round(heading(pos,to))});
    game.won=isRush()?selected.countryCode===COUNTRY_CODES[game.index]:distance<=WIN_RADIUS;
    if(game.won||game.guesses.length>=maximum()){
      game.finished=true;game.revealed=EVIDENCE_COUNT;
      game.endedAt=new Date(now).toISOString();
      game.durationMs=elapsed;
      game.score=game.won
        ?isRush()
          ?Math.max(0,Math.round(5000*(1-Math.min(RUSH_DURATION_MS,elapsed)/RUSH_DURATION_MS))-(game.sectorMapPenalty||0))
          :Math.max(0,Math.max(250,Math.round(5000*Math.pow(.78,game.guesses.length-1)*Math.max(.76,1-distance/425)-game.penalty))-(game.sectorMapPenalty||0))
        :0;
    }else if(!isRush())game.revealed=Math.min(EVIDENCE_COUNT,
      Math.max(game.revealed,DIFFICULTIES[difficulty].initial+game.guesses.length));
    save();selected=null;render();
    if(game.finished){showReport();}
    // Keep the investigator’s chosen zoom after a wrong guess.
  }
  function searchLocal(term){
    const q=norm(term),results=[];
    if(isRush()){
      for(const code of [...new Set(COUNTRY_CODES)].sort((a,b)=>
        displayRegion(a).localeCompare(displayRegion(b),locale()))){
        const name=displayRegion(code);
        if(!norm(name).includes(q)&&!norm(code).includes(q))continue;
        const index=COUNTRY_CODES.indexOf(code),place=cityAt(index);
        results.push({name,description:code,lat:place[3],lon:place[4],
          countryCode:code});
        if(results.length===7)break;
      }
      return results;
    }
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
      button.addEventListener("click",()=>{
        if(item.countryCode){
          selected={lat:item.lat,lng:item.lon,label:item.name,countryCode:item.countryCode};
          $("guessBtn").disabled=false;$("selectedText").textContent=item.name;
          $("suggestions").classList.add("hidden");
          renderMap();
        }else selectPoint(item.lat,item.lon,item.name);
        $("citySearch").value=item.name;
      });
      list.append(button);
    }
    list.classList.remove("hidden");
  }
  async function searchRemote(term){
    if(term.length<3||game.finished||isRush())return;
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
    const symbols=game.guesses.map(g=>isRush()?(g.countryCode===COUNTRY_CODES[game.index]?"✓":"×"):g.distance<=WIN_RADIUS?"🟨":g.distance<500?"🟧":"⬛").join("");
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
    $("rushStartBtn").addEventListener("click",startRush);
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
    initAtlas();
    $("helpBtn").addEventListener("click",()=>$("helpDialog").showModal());
    $("closeHelpBtn").addEventListener("click",()=>$("helpDialog").close());
    $("startHelpBtn").addEventListener("click",()=>$("helpDialog").close());
    $("helpDialog").addEventListener("click",e=>{if(e.target===$("helpDialog"))$("helpDialog").close()});
    $("citySearch").addEventListener("input",e=>{
      const term=e.target.value.trim();
      if(controller)controller.abort();
      clearTimeout(debounce);
      if(term.length<(isRush()?1:3)){$("suggestions").classList.add("hidden");return}
      suggestions(searchLocal(term));
      if(!isRush())debounce=setTimeout(()=>searchRemote(term),450);
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
    if(typeof setInterval==="function")setInterval(clockTick,250);
    document.addEventListener("visibilitychange",()=>{
      if(!document.hidden&&game?.mode==="daily"&&game.date!==today())startDaily();
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
})();