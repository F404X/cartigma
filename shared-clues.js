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
    countryLandlocked:200,countryBorders:300
  });
  const MAX_CLUES=10;
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
  function buildClues(country,info,difficulty,denominations={}){
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
  const api=Object.freeze({buildClues,clueCost,numericBoundary,hash,
    MAX_CLUES,EXCLUDED,PRICES});
  if(typeof window!=="undefined")window.CartigmaClueEngine=api;
  if(typeof globalThis!=="undefined")globalThis.CartigmaClueEngine=api;
})();
