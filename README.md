# Cartigma

A browser-based geographic detective game. Read the evidence, place pins on a world map, and identify a hidden city in a limited number of attempts.

**Play:** https://cartigma.f404x.net/

## Game rules

- **Daily case:** one shared location for each difficulty on each UTC date. The daily progress and case ID are saved locally.
- **Free play:** new random investigations without an account. Normal mode favors capitals and widely recognizable destinations through a bounded preference system; Hard mode can choose from all 500 cities.
- **Normal:** 6 guesses, 2 starting clues, distance and a **localized full cardinal direction with matching arrow** after an incorrect guess (for example, *Nordeste ↗* in Portuguese).
- **Hard:** 4 guesses, 1 starting clue, **only the distance** after an incorrect guess. Direction remains hidden even in the final case report.
- Win when a guess falls within **100 km straight-line distance** of the city's approximate coordinates.
- **Ten evidence cards:** an opening landscape/latitude-zone/hemisphere clue, the continent, five balanced geographic/civic/country clues, and three optional additional clues. The longitude sector covers 30° in Normal or becomes a UTM zone in Hard. A landmark that reveals the city's name is replaced with a 15° latitude sector; Hard instead uses UTM latitude bands. Cultural and numerical country facts are interleaved in nonadjacent positions among slots 3–7. Hemisphere clues only appear for Asia, Africa, South America, and Oceania, not Europe or North America. No distance-reference clue is shown, because the guess feedback already provides distance.
- **Vector map filters:** a gear beside **Vector** opens a compact, scrollable panel above the map selector. Toggle national borders, state/region boundaries, country/city labels, roads, natural areas, rivers/lakes, and points of interest. Preferences persist locally across basemap and theme changes. These filters only change presentation: the paid clue that identifies the target continent still costs points. OpenStreetMap raster tiles cannot hide individual map layers, so the gear is disabled in that mode.
- **Ten evidence slots**, including four or five distinct country-data facts plus geographic clues. The two original facts remain distributed among slots 3–7; the additional three clues appear in slots 8–10. Extra evidence can be purchased before any guess without consuming attempts.
- Extra hints cost **150–500 points** depending on how revealing the next clue will be; the actual cost is shown on the Reveal button and deducted only if the player chooses to reveal it. Optional map aids cost **250 points** for the Equator/hemisphere arrows, **500** for the low-opacity (28%) continent coastline outline without fill, **1,000** for a yellow (10%-opacity) 30° longitude sector, and **1,100** for a yellow 15° latitude sector. Map aids are purchased once per case and persist through style changes and daily-case reloads. The original saved deductions are preserved; paid hints are counted separately from map purchases. The score is capped at zero to avoid negative results.

### Case numbering

Case identifiers follow **`#N-YYYYMMDD-01`** or **`#H-YYYYMMDD-01`**. The first letter uses the **English** difficulty name (Normal or Hard). The date is UTC and the final segment is the ordinal number of the case **opened in that browser on that UTC date**, starting at 01. Switching difficulty and starting free-play cases count as new investigations; revisiting an existing daily case preserves its original ID. The hidden daily location, however, is the same for every player of a given difficulty.

## Completed case file

When an investigation ends, an interactive detective dossier displays a country flag, a country-specific historical milestone (for all 165 represented countries and territories), and:

- Case ID, outcome, city, country or territory, and continent.
- Approximate target coordinates, mode, difficulty, guesses used, extra hints and score.
- The **closest** attempt, all guess distances, and the final evidence list.
- The original 74 cities retain curated English/Portuguese trivia. The 426 supplemental cities have factual, source-derived bilingual location notes (administrative region and approximate latitude), rather than invented landmarks; other languages use localized fallback information.
- The result card offers **New case** and **View case file**. The dossier retains separate **Share** and **New case** controls.

The map automatically frames the **closest guess and the actual city**, with zoom caps adjusted to their separation, viewport padding and a line connecting both. The map also handles points that straddle the international date line. The case file opens as a **non-modal side panel on the right**, keeping the map visible (on phones it becomes a bottom panel).

## Design and languages

The game uses a restrained detective interface with **dark and light appearance modes**. Dark uses near-black and desaturated navy surfaces; light uses white and cool-gray surfaces. **Yellow is reserved for accents** such as interactive selections, map pins, clue markers and buttons, not large panel backgrounds. A header toggle switches modes and saves the preference in local storage. Evidence cards have larger typography, ruled separators, numbered sections and evidence classifications. **Evidence is stacked above the guess panel** on all screen sizes, with internal scrolling where necessary. On desktop, the game fits within the viewport, with internal scrolling where needed. **On smartphones (up to 760 px wide), the map is exactly square (1:1)** and the evidence, city search, guesses and results are arranged vertically below it in one scrollable investigation panel. When the available screen height is too short for a square map and a useful lower panel, the full page scrolls instead, so nothing is clipped. Touch controls are sized for fingers; the case report is shown inside the lower scroller rather than covering the map.

The theme button follows the currently selected UI language. On the vector map, the dark appearance uses OpenFreeMap **Dark** and the light appearance uses OpenFreeMap **Positron**, both keyless; the original OpenStreetMap tiles remain available, with their dark CSS filter disabled in light mode.

The UI supports **19 languages**: English (default), Portuguese, Spanish, Simplified Chinese, Japanese, Russian, French, German, Italian, Dutch, Polish, Swedish, Turkish, Arabic, Hebrew, Korean, Thai, Vietnamese and Indonesian. Arabic and Hebrew use RTL layout. The language selector is a searchable custom menu with a persistent globe icon, a representative flag image in **every option**, full native-language names, keyboard navigation and a visible selected state (with emoji fallback when a flag image cannot load). On smartphones, it opens as a **large centered dialog** (roughly 78% of the viewport height) with a dimmed backdrop, explicit close button, and scrollable language list; the desktop dropdown is unchanged. Preferences are stored locally. The primary map uses MapLibre vector labels that follow the selected language when translated name fields exist, falling back to the local name otherwise. **Label density is zoom-dependent:** countries appear at world scale, major cities at moderate zoom, and neighborhoods, local streets and points of interest at progressively higher zoom. This is applied directly to vector style layers; raster fallback tiles have fixed labels. A **map-style selector below the map** lets players switch between the vector map (localized names where available) and the classic OpenStreetMap raster map (fixed labels). The choice persists in local storage and retains the current case and map viewport. A **compass rose at the bottom-right of the map** adapts its cardinal lettering to the selected language. If WebGL, a CDN or the vector style fails, the Leaflet/OpenStreetMap raster map also loads automatically. Interface strings, clue templates, geographic terminology, and report controls are also translated.

## Technology

- Plain HTML, CSS, JavaScript, no build step or account.
- **MapLibre GL JS 6.18.0** with [OpenFreeMap](https://openfreemap.org/) dark vector tiles, no API key, plus **Leaflet 1.9.4** as an automatic fallback when WebGL or the vector style is unavailable. Viewport gestures are distinguished from deliberate clicks (8 px pointer threshold plus drag suppression).
- Open-Meteo Geocoding API for optional search suggestions.
- Browser `Intl.DisplayNames` for country names; six continents have explicit localized names.
- `localStorage` for daily results, sequence numbers, preferred language, preferred basemap and appearance theme.

Because this is entirely static, the answers and clues exist on the client; it is a casual game rather than a secure competition. No proprietary API secrets are required.

## Run and test

```bash
python -m http.server 8000
# In another terminal:
node --test tests/*.test.mjs
```

Open http://localhost:8000. The tests also run automatically on pushes and pull requests via GitHub Actions.

## Files

| File | Content |
| --- | --- |
| `index.html` | Single-screen UI and case report |
| `styles.css` | Responsive investigation layout, lined evidence, map pins and report |
| `mobile.css` | Square map and readable scrolling investigation panel for smartphones |
| `themes.css` | Semantic dark/white palettes and contrast-safe appearance overrides |
| `theme.js` | Localized appearance toggle, persistence, and map theme notification |
| `places.js` | 500 cities with approximate locations |
| `references.js` | Curated named regional reference coordinates used for distance clues |
| `map-bootstrap.js` | Loads the vector engine from redundant CDNs and selects fallback when needed |
| `map-fallback.js` | Loads Leaflet and adapts OpenStreetMap map interactions without WebGL |
| `compass-i18n.js` | Cardinal directions, arrow labels, rose abbreviations and map selector labels in 19 languages |
| `language-picker.js` | Searchable native-language list with national flags and keyboard support |
| `facts.js` | 500 English and Portuguese location notes |
| `i18n.js` | Main user interface translations |
| `clues-i18n.js` | Geographic clue vocabulary and continent translations |
| `report-i18n.js` | Case report and updated game-rule translations |
| `app.js` | State, date-specific case IDs, clues, map, gameplay, reports |
| `tests/smoke.test.mjs` | Automated gameplay and data integrity checks |

The [GitHub Pages deployment workflow](.github/workflows/pages.yml) publishes the files to `https://f404x.github.io/cartigma/` after passing the automated tests.

## Data accuracy

The first 74 manually curated localities remain in their original order. A separate, static 426-city supplement was selected from the public-domain [Natural Earth 1:50m populated places](https://www.naturalearthdata.com/) dataset with additional Turkish destinations. The two European and Asian parts of Türkiye are separated by the Bosporus, Sea of Marmara and Dardanelles; Natural Earth's East Thrace polygon is assigned to Europe. Istanbul, on both sides of the straits, has a transcontinental clue. The Normal case selection heavily favors national capitals and major world cities; Hard can use the full catalogue. The additional notes describe geography rather than bespoke historical trivia.
 
The city center coordinates are approximate. Distances use the haversine formula, which describes straight-line distance on a sphere, **not** road distance. Physical landscape labels are simplified. Geographic comparison references draw from the city catalogue and a separately validated local reference dataset. The region-specific clue radius depends on the available locations in the catalog; this is a game-design heuristic, not an official geographic boundary. Location facts are educational descriptions, not live measurements. The vector map uses WebGL, while the fallback can work without it; both require internet access to download tiles. Not every map feature has names translated into all 19 languages.

### Map outline data

Continent borders are based on [Natural Earth](https://www.naturalearthdata.com/) geographic outlines via the MIT-licensed [power-bi-shape-maps world-continents topology](https://github.com/giobuzala/power-bi-shape-maps/blob/master/world-continents.json), simplified and converted to standalone GeoJSON for offline use. These are approximate geographic contours, not political border determinations.

### Data provenance (country evidence and history)

The optional country-data clues and the country section of the final case file are generated from a **static 165-country snapshot** (no runtime API key):

- ISO flags, currencies, area, access to sea and official languages: [mledoze/countries](https://github.com/mledoze/countries).
- GDP per capita: calculated from matched-year current-US-dollar GDP and population in [World Bank WDI GDP](https://github.com/datasets/gdp) and [WDI population](https://github.com/datasets/population). Mostly 2023, with older observations labeled by year. Population estimates also carry a year, usually 2025. These are **approximate** country-level clues, not city statistics.
- Language family: classification of an identified official language; countries may have multiple languages/families.
- Flag-color clue: one color attested in the historic [UCI Flags dataset](https://archive.ics.uci.edu/dataset/40/flags) and retained only where the flag record was suitable. A missing or uncertain color is never used.
- Brief country-specific political history: milestones from the public-domain [CIA World Factbook almanac](https://github.com/factbook/factbook.json), with authored contextual notes for selected countries and special cases such as Taiwan and French Polynesia. Dates describe historical events, not current government status. Short Portuguese and English notes are available for all 165 entries.

The country flag in the case file loads by ISO alpha-2 code from flagcdn.com, with an emoji fallback. Other report languages use English history text when a dedicated translation is unavailable.

The dossier displays all available country data (GDP per capita and population with reference years, area, ISO code, administrative region, currency, language family, a flag color and landlocked status). Its flag is larger and frameless. Map rotation is disabled on both touch and mouse input.

- **Area-scope clarity:** every `km²` country-area clue and dossier statistic explicitly says it represents the whole **country or territory**, not the city, municipality, state or province. The source dataset does not provide subnational/city area values; all 19 supported languages use scoped labels.
- **Case-file daily navigation:** once a daily case finishes, the dossier offers the other daily difficulty only if its same-day case has not already finished (win or loss). This respects both levels' separate saved state and immediately switches to the still-playable daily challenge. The main action in a daily result or dossier explicitly starts a new **Free Play** case; ordinary Free Play continues to use “New case.” All 19 locales are translated.

### Balanced evidence and assistance prices

Ten evidence slots retain the original first seven clues in their established order, separating the original two country facts (one cultural/civic, one numerical) in positions 3–7. The new 8th–10th clues add two different country facts and one unused geographic clue wherever available, without repeated clue types. The hemisphere clue appears only for Asia, Africa, South America and Oceania (continents with territory on both sides of the Equator), never for Europe or North America. Hints cost **150–500 points each** depending on precision; the price is shown on the button before purchasing. Country/terrain/flag clues are cheaper than detailed coordinate and landmark clues. Optional map overlays now cost **250 points** for the Equator hemisphere divider, **500** for a continent outline, **1,000** for the longitude sector, or **1,100** for the latitude sector. Old saved hint purchases retain their original penalty and remain counted correctly. The landlocked clue and the final case file use natural sentences instead of yes/no labels.

- **Sea-access clue repair:** it has its own localized label ("Acesso ao mar"), rather than the generic "Região". The visible text comes directly from the country's landlocked boolean: "Sem acesso ao mar." or "Tem acesso ao mar." It never displays only "Sim" or "Não"; source assets are freshly fingerprinted on deployment.

- **Currency names:** clues and the completed case dossier now display the full, localized currency name (e.g. Brazilian real / real brasileiro, Japanese yen / iene japonês) instead of the three-letter ISO code. CLDR currency names are displayed in all 19 supported languages through `Intl.DisplayNames`, with descriptive English names sourced from mledoze/countries as a browser compatibility fallback. Internal ISO currency identifiers are preserved for correctness.

### Ten clues, independent guesses

Normal mode retains **6 guesses**, while Hard retains its original **4**; neither is increased by buying clues. The initial evidence remains 2 in Normal and 1 in Hard, with all remaining clues available for optional point purchases from the start. Incorrect guesses still reveal evidence at the existing pace. The first seven positions remain unchanged so that ongoing saved daily cases do not lose access to previously revealed clue and map-overlay purchases. The final report now lists all ten clues.

### UTM map ruler and Hard-mode pricing

Both UTM zone and UTM latitude-band evidence now offer a one-time paid **Map**
button on Hard. Buying either displays a low-opacity geographic highlight of
the respective UTM region and a UTM grid: real 6° zone boundaries, horizontal
latitude-band boundaries C–X (including the 12° X band), numeric zone labels
and band letters. The zone geometry includes the exceptions in western Norway
and Svalbard. Purchases are stored separately, survive map-style changes and
daily-case reloads, and do not use guesses.

Hard charges **50% more** than Normal for every paid clue and existing overlay,
with costs rounded up to the nearest 50 points. UTM zone and UTM latitude-band
overlays have base costs 1,200/1,300 and therefore cost **1,800/1,950 points**
on Hard. Normal-mode pricing remains unchanged. Existing charges from saved
cases are not recalculated.
