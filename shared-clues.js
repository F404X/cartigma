/* Cartigma shared country evidence and price rules.
 * Loaded as a classic script by the offline game and as a side-effect import
 * by the Cloudflare Worker. No target or private state is embedded here.
 */
(()=>{
  "use strict";
  const PRICES=Object.freeze({
    hemisphere:150,continent:300,longitude:400,
    countryCurrency:250,countryLanguageFamily:250,countryFlagColor:200,
    countryPopulation:300,countryGDP:350,countryArea:300,
    countryLandlocked:200,countryBorders:300,countrySubregion:300,countryAreaBand:250
  });
  const OVERLAY_PRICES=Object.freeze({hemisphere:250,continent:500,longitude:1000});
  const MAX_CLUES=10;
  const RULES_VERSION=8;
  const DIFFICULTIES=Object.freeze({
    normal:Object.freeze({attempts:6,initial:2}),
    hard:Object.freeze({attempts:4,initial:1}),
    rush:Object.freeze({attempts:Infinity,initial:1})
  });
  const RUSH_DURATION_MS=60000, RUSH_CLUE_INTERVAL_MS=6000;
  // UN M49 geographic groupings, restricted to the game's 195 countries.
  // https://unstats.un.org/unsd/methodology/m49/overview
  const SUBREGIONS=Object.freeze(Object.fromEntries(Object.entries({
    "005":"AR BO BR CL CO EC GY PY PE SR UY VE",
    "011":"BJ BF CV CI GM GH GN GW LR ML MR NE NG SN SL TG",
    "013":"BZ CR SV GT HN MX NI PA",
    "014":"BI KM DJ ER ET KE MG MW MU MZ RW SC SO SS UG TZ ZM ZW",
    "015":"DZ EG LY MA SD TN",
    "017":"AO CM CF TD CG CD GQ GA ST",
    "018":"BW SZ LS NA ZA",
    "021":"CA US",
    "029":"AG BS BB CU DM DO GD HT JM KN LC VC TT",
    "030":"CN KP JP MN KR",
    "034":"AF BD BT IN IR MV NP PK LK",
    "035":"BN KH ID LA MY MM PH SG TH TL VN",
    "039":"AL AD BA HR GR VA IT MT ME MK PT SM RS SI ES",
    "053":"AU NZ",
    "054":"FJ PG SB VU",
    "057":"KI MH FM NR PW",
    "061":"WS TO TV",
    "143":"KZ KG TJ TM UZ",
    "145":"AM AZ BH CY GE IQ IL JO KW LB OM QA SA PS SY TR AE YE",
    "151":"BY BG CZ HU PL MD RO RU SK UA",
    "154":"DK EE FI IS IE LV LT NO SE GB",
    "155":"AT BE FR DE LI LU MC NL CH"
  }).flatMap(([group,codes])=>codes.split(" ").map(code=>[code,group]))));
  const AREA_BOUNDS=[0,100,1000,10000,100000,1000000,10000000,Infinity];
  const clueContinent=country=>country.code==="CY"?"asia":country.continent;
  const CONTINENTS=Object.freeze(["africa","asia","europe","northAmerica","oceania","southAmerica"]);
  function uniformIndex(size,nextUint32){
    const ceiling=2**32-2**32%size;
    let value;
    do{value=nextUint32();}while(value>=ceiling);
    return value%size;
  }
  function countryPicker(catalog){
    const groups=CONTINENTS.map(continent=>catalog.filter(country=>clueContinent(country)===continent));
    return draw=>{
      const group=groups[uniformIndex(groups.length,draw)];
      return group[uniformIndex(group.length,draw)];
    };
  }
  const areaBand=area=>AREA_BOUNDS.findIndex(bound=>area<bound)-1;
  // Keep legacy deck order and hint prices for sessions already in progress.
  function revealAfterMiss(revealed,difficulty,guesses,total,version){
    return Math.min(total,version===7
      ?Math.max(revealed,DIFFICULTIES[difficulty].initial+guesses)
      :revealed+1);
  }
  function guessFeedback(guess,target,difficulty){
    if(!guess||!target||guess.code===target.code||difficulty==="rush")return null;
    const radians=degrees=>degrees*Math.PI/180;
    const a=radians(guess.lat), b=radians(target.lat);
    const longitude=radians(target.lng-guess.lng);
    const haversine=Math.sin((b-a)/2)**2+Math.cos(a)*Math.cos(b)*Math.sin(longitude/2)**2;
    const distance=6371.0088*2*Math.asin(Math.min(1,Math.sqrt(haversine)));
    const bounds=[0,250,500,1000,2000,4000,8000,12000];
    const min=bounds.findLast(bound=>distance>=bound);
    const max=bounds.find(bound=>distance<bound)??null;
    if(difficulty==="hard")return {min,max};
    const y=Math.sin(longitude)*Math.cos(b);
    const x=Math.cos(a)*Math.sin(b)-Math.sin(a)*Math.cos(b)*Math.cos(longitude);
    const bearing=(Math.atan2(y,x)*180/Math.PI+360)%360;
    return {min,max,direction:Math.round(bearing/45)%8};
  }
  const EXCLUDED=Object.freeze(["zone","latitude","utmZone","utmBand",
    "latitudeBand","countryLatitudeZone"]);
  function hash(input){
    let h=2166136261;
    for(const char of input){
      h^=char.charCodeAt(0);
      h=Math.imul(h,16777619);
    }
    return h>>>0;
  }
  // Exact historic Cartigma numeric bounds; do not invent missing indicators.
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
    return {comparison,value:bound};
  }
  function clueCost(clue,difficulty){
    const base=PRICES[clue?.key]??300;
    return difficulty==="hard"?Math.ceil(base*1.5/50)*50:base;
  }
  function overlayCost(key,difficulty){
    const base=OVERLAY_PRICES[key]||0;
    return difficulty==="hard"?Math.ceil(base*1.5/50)*50:base;
  }
  function scoreFor({difficulty,guesses,penalty=0,sectorMapPenalty=0,elapsedMs=0,won}){
    if(!won)return 0;
    if(difficulty==="rush"){
      return Math.max(0,Math.round(5000*(1-Math.min(RUSH_DURATION_MS,elapsedMs)/RUSH_DURATION_MS))-
        sectorMapPenalty);
    }
    return Math.max(0,Math.max(250,Math.round(5000*Math.pow(.78,guesses-1)-
      penalty))-sectorMapPenalty);
  }
  function legacyClues(country,info,difficulty,denominations={}){
    if(!country||!country.code||!info)throw Error("Missing country metadata");
    if(!["normal","hard","rush"].includes(difficulty))
      throw Error("Unknown difficulty");
    const code=country.code,seed=code+":"+difficulty;
    // Never include continent together with north/south hemisphere.
    // Both variants are reachable but mutually exclusive.
    const location=hash(seed+":geography")%2===0
      ?{key:"continent",continents:code==="TR"?["europe","asia"]:[country.continent]}
      :{key:"hemisphere",hemisphere:country.lat>=0?"north":"south"};
    const from=Math.floor(country.lng/30)*30;
    const extras=[{key:"longitude",from,to:from+30}];
    const add=(key,fields)=>extras.push({key,...fields});
    if(info.currency){
      const family=denominations.codes?.[info.currency];
      const name=family
        ?denominations.labels?.en?.[family]||family
        :info.currencyName||info.currency;
      add("countryCurrency",{family:family||null,name});
    }
    if(info.languageFamily)add("countryLanguageFamily",{family:info.languageFamily});
    if(info.flagColor)add("countryFlagColor",{color:info.flagColor});
    if(info.population>0&&info.populationYear)
      add("countryPopulation",{
        ...numericBoundary(info.population,code+":population:"+difficulty),
        year:info.populationYear
      });
    if(info.gdpPerCapita>0&&info.gdpYear)
      add("countryGDP",{
        ...numericBoundary(info.gdpPerCapita,code+":gdp:"+difficulty),
        year:info.gdpYear
      });
    if(info.area>0)add("countryArea",{
      ...numericBoundary(info.area,code+":area:"+difficulty)
    });
    if(typeof info.landlocked==="boolean")
      add("countryLandlocked",{landlocked:info.landlocked});
    if(Number.isInteger(country.borders)&&country.borders>=0)
      add("countryBorders",{value:country.borders});
    extras.sort((a,b)=>
      hash(seed+":"+a.key)-hash(seed+":"+b.key)||
      a.key.localeCompare(b.key));
    const clues=[location,...extras].slice(0,MAX_CLUES);
    const keys=clues.map(clue=>clue.key);
    if(new Set(keys).size!==clues.length||
       keys.some(key=>EXCLUDED.includes(key))||
       keys.includes("continent")&&keys.includes("hemisphere"))
      throw Error("Invalid clue selection for "+code);
    return clues;
  }
  function buildClues(country,info,difficulty,denominations,catalog,version=RULES_VERSION){
    const legacy=legacyClues(country,info,difficulty,denominations);
    if(version===7)return legacy;
    const {code,lng,landlocked,area}=country;
    const continent=clueContinent(country);
    // Sri Lanka has no land borders. Canada borders Denmark on Hans Island.
    const landBorders=c=>({LK:0,CA:2}[c.code]??c.borders);
    const borders=landBorders(country);
    const west=Math.floor(lng/30)*30;
    const band=areaBand(area);
    const geography=[
      {clue:{key:"countrySubregion",region:SUBREGIONS[code]},
        match:c=>SUBREGIONS[c.code]===SUBREGIONS[code],use:SUBREGIONS[code]!=="005"},
      {clue:{key:"countryLandlocked",landlocked},match:c=>c.landlocked===landlocked},
      {clue:{key:"longitude",from:west,to:west+30,reference:true},match:c=>c.lng>=west&&c.lng<west+30},
      {clue:{key:"countryAreaBand",min:AREA_BOUNDS[band],max:AREA_BOUNDS[band+1]===Infinity?null:AREA_BOUNDS[band+1]},
        match:c=>areaBand(c.area)===band},
      {clue:{key:"countryBorders",value:borders},match:c=>landBorders(c)===borders}
    ].filter(option=>option.use!==false);
    // The first clue uses the catalogue's geographic grouping. Turkey's
    // transcontinental location is still shown in its completed case file.
    const clues=[{key:"continent",continents:[continent]}];
    let candidates=catalog.filter(c=>clueContinent(c)===continent);
    // Choose early clues by how many plausible answers they leave. Reserve
    // single-answer clues for later and skip facts that add no constraint
    // until the useful geographic clues have been shown.
    const goals=difficulty==="hard"?[12,7,3]:[8,4,2];
    for(const [index,goal] of goals.entries()){
      const options=geography.map(option=>({
        option,matches:candidates.filter(option.match)
      }));
      const partial=options.filter(({matches})=>matches.length>=2&&matches.length<candidates.length);
      partial.sort((a,b)=>Math.abs(a.matches.length-goal)-Math.abs(b.matches.length-goal));
      const {option,matches}=partial[0]||
        (index===goals.length-1&&options.find(({matches})=>matches.length<candidates.length))||
        options.find(({matches})=>matches.length===candidates.length)||options[0];
      geography.splice(geography.indexOf(option),1);
      clues.push(option.clue);
      candidates=matches;
    }
    clues.push(...geography.map(option=>option.clue));
    const backgroundKeys=["countryLanguageFamily","countryFlagColor","countryPopulation",
      "countryGDP","countryArea"];
    for(const key of backgroundKeys){
      if(key==="countryArea"&&clues.some(clue=>clue.key==="countryAreaBand"))continue;
      const clue=legacy.find(item=>item.key===key);
      if(clue)clues.push(clue);
    }
    // Shared currency denominations are useful. Country-named currencies
    // often spell out the answer, so leave these to the country profile.
    const currency=legacy.find(clue=>clue.key==="countryCurrency"&&clue.family);
    if(currency&&catalog.filter(c=>denominations.codes?.[c.currency]===currency.family).length>1)
      clues.push(currency);
    return clues.slice(0,MAX_CLUES);
  }
  const api=Object.freeze({buildClues,clueCost,overlayCost,scoreFor,numericBoundary,hash,
    guessFeedback,revealAfterMiss,clueContinent,countryPicker,CONTINENTS,MAX_CLUES,EXCLUDED,PRICES,OVERLAY_PRICES,
    DIFFICULTIES,RULES_VERSION,RUSH_DURATION_MS,RUSH_CLUE_INTERVAL_MS});
  if(typeof window!=="undefined")window.CartigmaClueEngine=api;
  if(typeof globalThis!=="undefined")globalThis.CartigmaClueEngine=api;
})();
