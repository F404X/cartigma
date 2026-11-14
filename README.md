# GeoDetective

A browser-based geographic detective game. Read the evidence, place pins on a world map, and identify a hidden city in a limited number of attempts.

**Play:** https://f404x.github.io/geodetective/

## Game rules

- **Daily case:** one shared location for each difficulty on each UTC date. The daily progress and case ID are saved locally.
- **Free play:** new random investigations without an account.
- **Normal:** 6 guesses, 2 starting clues, distance **and cardinal direction** after an incorrect guess.
- **Hard:** 4 guesses, 1 starting clue, **only the distance** after an incorrect guess. Direction remains hidden even in the final case report.
- Win when a guess falls within **100 km straight-line distance** of the city's approximate coordinates.
- Six evidence cards: physical landscape or latitude zone, continent, regional profile, distance from a nearby reference city, geographic proximity comparison, and a distinctive local landmark. The distance reference radius is **adaptive to the region and difficulty**, based on the geographic spread of the catalog's nearby cities. It is approximately 2,000–5,200 km on Normal and can reach up to 6,000 km on Hard. References within the same geographical region are preferred, and distances are rounded to avoid pinpoint-accurate clues. The fifth clue compares proximity to two different regional reference locations rather than revealing the closest city. References include country or territory names in the selected language.
- Extra hints cost **300 points** each. A successful investigation earns up to **5,000 points**, depending on guess count, accuracy and penalties.

### Case numbering

Case identifiers follow **`#N-YYYYMMDD-01`** or **`#H-YYYYMMDD-01`**. The first letter uses the **English** difficulty name (Normal or Hard). The date is UTC and the final segment is the ordinal number of the case **opened in that browser on that UTC date**, starting at 01. Switching difficulty and starting free-play cases count as new investigations; revisiting an existing daily case preserves its original ID. The hidden daily location, however, is the same for every player of a given difficulty.

## Completed case file

When an investigation ends, an interactive detective dossier is displayed with:

- Case ID, outcome, city, country or territory, and continent.
- Approximate target coordinates, mode, difficulty, guesses used, extra hints and score.
- The **closest** attempt, all guess distances, and the final evidence list.
- A location-specific **did-you-know** fact for every city, curated in English and Portuguese; in other languages, a localized note identifying an important landmark is used.
- Buttons to share the result, examine the final map and begin a new case.

The map automatically frames the **closest guess and the actual city**, with zoom caps adjusted to their separation, viewport padding and a line connecting both. The map also handles points that straddle the international date line. The case file opens as a **non-modal side panel on the right**, keeping the map visible (on phones it becomes a bottom panel).

## Design and languages

The game uses a flat, yellow-and-charcoal detective interface. Evidence cards have larger typography, ruled separators, numbered sections and evidence classifications. **Evidence is stacked above the guess panel** on all screen sizes, with internal scrolling where necessary. The whole application fits in the viewport without a browser-page scrollbar; longer clue, log and report sections can scroll **internally** when needed, particularly on small screens.

The UI supports **19 languages**: English (default), Portuguese, Spanish, Simplified Chinese, Japanese, Russian, French, German, Italian, Dutch, Polish, Swedish, Turkish, Arabic, Hebrew, Korean, Thai, Vietnamese and Indonesian. Arabic and Hebrew use RTL layout. The language selector is a searchable custom menu with a persistent globe icon, a representative flag image in **every option**, full native-language names, keyboard navigation and a visible selected state (with emoji fallback when a flag image cannot load). Preferences are stored locally. The primary map uses MapLibre vector labels that follow the selected language when translated name fields exist, falling back to the local name otherwise. **Label density is zoom-dependent:** countries appear at world scale, major cities after zooming in, and local streets/points of interest at much closer zoom. This is applied directly to vector style layers; raster fallback tiles have fixed labels. If WebGL, a CDN or the vector style fails, a keyless Leaflet/OpenStreetMap raster map is loaded automatically (its baked-in map labels are not translated). Interface strings, clue templates, geographic terminology, and report controls are also translated.

## Technology

- Plain HTML, CSS, JavaScript, no build step or account.
- **MapLibre GL JS 6.18.0** with [OpenFreeMap](https://openfreemap.org/) dark vector tiles, no API key, plus **Leaflet 1.9.4** as an automatic fallback when WebGL or the vector style is unavailable. Viewport gestures are distinguished from deliberate clicks (8 px pointer threshold plus drag suppression).
- Open-Meteo Geocoding API for optional search suggestions.
- Browser `Intl.DisplayNames` for country names; six continents have explicit localized names.
- `localStorage` for daily results, sequence numbers and preferences.

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
| `styles.css` | Flat dark/yellow layout, lined evidence, map pins and report |
| `places.js` | 74 cities with approximate locations |
| `references.js` | Local named reference coordinates within a 1,000 km radius |
| `map-bootstrap.js` | Loads the vector engine from redundant CDNs and selects fallback when needed |
| `map-fallback.js` | Loads Leaflet and adapts the game map interactions without WebGL |
| `language-picker.js` | Searchable native-language list with national flags and keyboard support |
| `facts.js` | 74 English and Portuguese location facts |
| `i18n.js` | Main user interface translations |
| `clues-i18n.js` | Geographic clue vocabulary and continent translations |
| `report-i18n.js` | Case report and updated game-rule translations |
| `app.js` | State, date-specific case IDs, clues, map, gameplay, reports |
| `tests/smoke.test.mjs` | Automated gameplay and data integrity checks |

The [GitHub Pages deployment workflow](.github/workflows/pages.yml) publishes the files to `https://f404x.github.io/geodetective/` after passing the automated tests.

## Data accuracy

The city center coordinates are approximate. Distances use the haversine formula, which describes straight-line distance on a sphere, **not** road distance. Physical landscape labels are simplified. Geographic comparison references draw from the city catalogue and a separately validated local reference dataset. The region-specific clue radius depends on the available locations in the catalog; this is a game-design heuristic, not an official geographic boundary. Location facts are educational descriptions, not live measurements. The vector map uses WebGL, while the fallback can work without it; both require internet access to download tiles. Not every map feature has names translated into all 19 languages.
