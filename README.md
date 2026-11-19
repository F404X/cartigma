# Cartigma

A country-deduction game for the browser. Investigate geographic and historical clues, click a country on the map or search by name, and identify the hidden country.

**Play:** https://cartigma.f404x.net/

## Countries, not cities

Cartigma contains **195 playable countries**: the 193 UN member states and the two UN non-member observer states (the Holy See and the State of Palestine). The game and the searchable **Country Archive** use the same list. A country appears **once**, whether it has one large city or hundreds.

There is **no city/urban-place database**. The former 500-city catalogue, urban statistics, city references and city-specific facts have been deleted. Geographic reference coordinates are taken from country metadata and used only for map-sector calculations; they are not separate city answers. The searchable country dossier includes a flag, ISO code, geographic/latitude information, currency, country area, historical summary and any available dated population and GDP data. Absent source values are omitted instead of being invented.

Country selection uses the 195 Natural Earth admin-0 country polygons bundled in `country-boundaries.geojson`. The source is the [1:10m Natural Earth dataset](https://github.com/nvkelso/natural-earth-vector/blob/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_10m_admin_0_countries.geojson), filtered to the country catalogue and simplified with Mapshaper (`-simplify 10% keep-shapes`, five decimal places). Zoom in or search by name for small islands and micronations. Boundaries follow Natural Earth's approximate de facto representation.

When the ranking API is unavailable at the start of a match, Cartigma starts a local round. If the API goes down during ranked play, Cartigma opens a separate local round because the ranked answer is stored on the server. Local results are scored in the game.

## Game modes

| Difficulty | Guess limit | Starting clues | Special rules |
| --- | ---: | ---: | --- |
| Normal | 6 | 2 | Country name or map click; optional paid hints |
| Hard | 4 | 1 | Country name or map click; clues and map aids cost more |
| Rush | Unlimited | **0 before Start**, 1 after | Explicit Start; identify the country within **60 seconds**. Another clue unlocks every **6 seconds** after the first. Score decreases over time |

All modes target **the country**, not a city or its coordinates. Wrong guesses reveal one additional available clue in Normal and Hard, including after a clue purchase. The game reports a distance range between country reference points and gives a compass direction in Normal. Each country can be guessed once per case. Rush never shows a clue (including its category) before **Start** is pressed. The 60-second countdown begins at Start and is based on the wall clock; hiding the tab does not pause it.

Every guess is timestamped and its elapsed time is displayed in the guess history and report. Results show the correct country, flag, history, guesses and score, but never disclose a nonexistent city target. **Rush shows an immediate selection pin after a map click or country-name suggestion, and numbered pins remain for every confirmed guess**, even after a wrong answer.

### Randomness and repetition

- **Daily:** each UTC date and difficulty determine a shared target. The draw selects one of the six continents with equal probability, then one country from that continent.
- **Freeplay:** every new round uses the same two-stage draw. All 195 countries can appear, and countries can repeat.
- The country-only catalogue uses new saved-game keys so old city-based daily records cannot be confused with the new investigations.

### Evidence

Each new investigation has **6–10 clues**. It starts with a continent or a named geographic region, followed by map-readable facts such as subregion, longitude of the country's reference point, sea access, land borders and area ranges. **Caribbean countries start with the dedicated "Region: Caribbean" clue (13 countries); Canada, the United States, Mexico, and the seven Central American countries start with "Region: North/Central America" (10 countries). The Caribbean is never called a continent.** The draw still samples the same six continental pools fairly, and existing ranked cases keep their original clue decks. Early clues are ordered by how much they narrow the set of possible countries. Hard narrows that set more gradually, and Rush reveals its clues on the clock.

Flag color, language family, population, GDP per capita and shared currency denominations add context later when the catalogue has those facts. Population and GDP clues display the source year. Previous cases retain their original evidence order and prices. The same engine drives the browser game and the ranking Worker, with parity tested for the full catalogue.

### Optional map aids

The game has an interactive MapLibre vector map with an OpenStreetMap/Leaflet fallback. Paid overlays can show a longitude sector or a continent outline. Earlier cases can still have an equator/hemisphere overlay. Both the browser and the ranked server validate the same available overlays and prices. Normal and Hard retain their existing hint price and score systems; Hard's assisted information is more expensive. Rush automatically unlocks hints over time, with no manual Reveal button.

**Rush** disables all purchased evidence overlays and hides their buttons. Its clues unlock automatically, and map pins for guesses and results remain usable.

**Mobile layout:** the map, case summary, and two tappable bottom cards fit within one viewport. **Evidence** and **Your guess** open independent, compact popovers with their own bounded scrolling; only one is open at a time. The cards show clue/guess counts, hide locked clue rows, support keyboard and touch search, and preserve map interaction. On short landscape phones, the same controls occupy a small side dock rather than covering the map. The finished-case dossier opens as a scrollable mobile dialog. Desktop retains its full two-column investigation layout.

The map has layer filters for country/city *basemap labels*, state boundaries, roads and physical features. These are map labels, **not a city database** and cannot be selected as game answers. The theme catalog offers six dark and four light palettes, remembers your choice on this device, and keeps the map in the selected light or dark mode. The map also uses localized country names.

## Country archive

Use the list button in the header to browse **all 195 country dossiers** and their available facts. The archive includes localized country names, flags, histories, a country profile and the available Normal/Hard evidence examples for each country. Browsing never changes the active case or score.

The UI supports **19 languages**: English, Brazilian Portuguese, Spanish, Simplified Chinese, Japanese, Russian, French, German, Italian, Dutch, Polish, Swedish, Turkish, Arabic, Hebrew, Korean, Thai, Vietnamese and Indonesian. Arabic and Hebrew use RTL layout. On phones, the responsive map and compact popovers share the available screen height without forcing the page to scroll.

## Data provenance and limits

- Subregions: [UN Statistics Division M49](https://unstats.un.org/unsd/methodology/m49/overview).
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
| `country-catalog.js` | The **195 unique countries**, geography and ISO codes |
| `country-insights.js` | Country facts, ISO flags, source years and historical summaries |
| `app.js` | Case state, country clues, country search, Rush, map overlays and dossiers |
| `shared-clues.js` | Shared source of truth for offline and ranked evidence selection, hint costs, overlays and scores |
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
