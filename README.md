# Cartigma

A country-deduction game for the browser. Investigate geographic and historical clues, click a country on the map or search by name, and identify the hidden country.

**Play:** https://cartigma.f404x.net/

## Countries, not cities

Cartigma contains **195 playable countries**: the 193 UN member states and the two UN non-member observer states (the Holy See and the State of Palestine). The game and the searchable **Country Archive** use the same list. A country appears **once**, whether it has one large city or hundreds.

There is **no city/urban-place database**. The former 500-city catalogue, urban statistics, city references and city-specific facts have been deleted. Geographic reference coordinates are taken from country metadata and used only for map-sector calculations; they are not separate city answers. The searchable country dossier includes a flag, ISO code, geographic/latitude information, currency, country area, historical summary and any available dated population and GDP data. Absent source values are omitted instead of being invented.

Country selection by map uses Natural Earth admin-0 polygons (50m with a 110m fallback). Tiny islands and micronations may be difficult to click on a world-scale map; selecting their name in search works regardless of geometry. Geographic boundaries are approximate and may follow Natural Earth's default de facto representation.

## Game modes

| Difficulty | Guess limit | Starting clues | Special rules |
| --- | ---: | ---: | --- |
| Normal | 6 | 2 | Country name or map click; optional paid hints |
| Hard | 4 | 1 | Country name or map click; clues and map aids cost more |
| Rush | Unlimited | **0 before Start**, 1 after | Explicit Start; identify the country within **60 seconds**. Another clue unlocks every **6 seconds** after the first. Score decreases over time |

All modes target **the country**, not a city or its coordinates. Wrong guesses reveal further evidence in Normal and Hard. Rush never shows a clue (including its category) before **Start** is pressed. The 60-second countdown begins at Start and is based on the wall clock; hiding the tab does not pause it.

Every guess is timestamped and its elapsed time is displayed in the guess history and report. Results show the correct country, flag, history, guesses and score, but never disclose a nonexistent city target.

### Randomness and repetition

- **Daily:** a fixed, seeded shuffle of all 195 countries per difficulty. Every country appears exactly once within **any consecutive 195-day window**, including cycle boundaries; the same randomized order repeats only after 195 days. The day's case is identical worldwide for the same UTC date and difficulty.
- **Freeplay:** an independent, shuffled **bag of all 195 countries**, shared between difficulties and persisted in `localStorage`. A country cannot reappear until the bag is exhausted. The next shuffled bag avoids repeating the immediately previous country across the cycle boundary.
- The country-only catalogue uses new saved-game keys so old city-based daily records cannot be confused with the new investigations.

### Evidence

Each investigation has **10 clues**, drawn from the available country-level facts and geographical references. Possible topics include continent, latitude belt, longitude/latitude sectors, UTM zone/band, hemisphere of the geographic reference, country currency denomination, language family, flag color where verified, country population, GDP per capita, territorial area and access to the sea.

**Landscape (“Paisagem”) is not an evidence type.** National-capital status, distance to a capital and distance to a coast are also excluded from gameplay, as are city population and density. These old city-only facts do not appear in the country archive either.

Numerical evidence uses a strictly valid rounded bound, such as `> 100,000,000` or `< 2,000,000 km²`. Source values and years remain available in the country dossier where verified. Missing economic data is never substituted with invented values.

Countries that intersect multiple latitude bands display a representative band and the number of additional bands: **Mexico: Subtropical (+1)** and **Brazil: Tropical (+2)**. Purchasing the corresponding overlay highlights all represented latitude bands.

### Optional map aids

The game has an interactive MapLibre vector map with an OpenStreetMap/Leaflet fallback. Where supported, paid overlays can show a latitude/longitude sector, equator/hemisphere, continent outline or UTM grid. Normal and Hard retain their existing hint price and score systems; Hard's assisted information is more expensive. Rush automatically unlocks hints over time, with no manual Reveal button.

The map has layer filters for country/city *basemap labels*, state boundaries, roads and physical features. These are map labels, **not a city database** and cannot be selected as game answers. The map theme supports dark and light appearances and localized country names.

## Country archive

Use the list button in the header to browse **all 195 country dossiers** and their available facts. The archive includes localized country names, flags, histories, a country profile and the ten Normal/Hard evidence examples for each country. Browsing never changes the active case or score.

The UI supports **19 languages**: English, Brazilian Portuguese, Spanish, Simplified Chinese, Japanese, Russian, French, German, Italian, Dutch, Polish, Swedish, Turkish, Arabic, Hebrew, Korean, Thai, Vietnamese and Indonesian. Arabic and Hebrew use RTL layout. On phones the map is square and the investigation content scrolls underneath.

## Data provenance and limits

- Country names, basic country/territory metadata, representative coordinates, administrative information, flag emojis, currencies and areas: [mledoze/countries](https://github.com/mledoze/countries).
- The 193 UN membership list and two observer states: [United Nations membership](https://research.un.org/en/unmembers/currentmembers) and [UN observer states](https://research.un.org/en/unmembers/observers).
- Latitude-band intersections and map hit testing: [Natural Earth admin-0 borders](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/), with latitude-reference fallbacks for states omitted from its low-resolution maps.
- Existing country-level population and GDP snapshots use year-marked historical [World Bank indicators](https://data.worldbank.org/). A newly added country with no verified value does not receive that kind of clue.
- Historic country summaries retain the previously curated references to [CIA World Factbook](https://github.com/factbook/factbook.json); newly added entries note major independence and UN milestones.
- Flag-color evidence is shown only where previously vetted source data exists; no color is inferred merely from a flag emoji.

A country may span multiple geographical zones, and its area/currency/history may be recorded in different years. Cartigma presents static educational data, not a live authoritative geopolitical or economic registry. Source classification may differ for contested boundaries. The full correct answer necessarily exists in the browser's static code: this is an educational game, not an anti-cheat competition.

## Technical details

The site uses plain HTML, CSS and JavaScript without an account, a server-side API or a build step.

| File | Purpose |
| --- | --- |
| `country-catalog.js` | The **195 unique countries**, geography, ISO codes and latitude bands |
| `country-insights.js` | Country facts, ISO flags, source years and historical summaries |
| `app.js` | Case state, country clues, country search, Rush, shuffle bag, map overlays and dossiers |
| `atlas-i18n.js` | Translated country-archive labels in 19 languages |
| `clues-i18n.js` / `country-clues-i18n.js` | Geographical and country-data clue translations |
| `index.html`, `styles.css`, `mobile.css`, `themes.css` | Accessible responsive UI |
| `map-bootstrap.js`, `map-fallback.js` | MapLibre/OpenStreetMap maps |
| `tests/*.test.mjs` | Automated gameplay and compatibility checks |

Run locally:

```bash
python -m http.server 8000
node --test tests/*.test.mjs
```

The GitHub Actions workflow tests and publishes the site to GitHub Pages, used by the custom domain [cartigma.f404x.net](https://cartigma.f404x.net/).
