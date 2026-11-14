# GeoDetective

A browser-based geographic detective game. Read the evidence, place pins on a world map, and identify a hidden city in a limited number of attempts.

**Play:** https://f404x.github.io/geodetective/

## Game rules

- **Daily case:** one shared location for each difficulty on each UTC date. The daily progress and case ID are saved locally.
- **Free play:** new random investigations without an account.
- **Normal:** 6 guesses, 2 starting clues, distance **and cardinal direction** after an incorrect guess.
- **Hard:** 4 guesses, 1 starting clue, **only the distance** after an incorrect guess. Direction remains hidden even in the final case report.
- Win when a guess falls within **100 km straight-line distance** of the city's approximate coordinates.
- Six evidence cards: physical landscape or latitude zone, continent, regional profile, distance from a nearby reference city, geographic proximity comparison, and a distinctive local landmark. Distance references are always **at most 1,000 km** from the target; isolated locations have additional curated neighbors. References include country or territory names in the selected language.
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

The game uses a flat, yellow-and-charcoal detective interface. Evidence cards have larger typography, ruled separators, numbered sections and evidence classifications. The whole application fits in the viewport without a browser-page scrollbar; longer clue, log and report sections can scroll **internally** when needed, particularly on small screens.

The UI supports **19 languages**: English (default), Portuguese, Spanish, Simplified Chinese, Japanese, Russian, French, German, Italian, Dutch, Polish, Swedish, Turkish, Arabic, Hebrew, Korean, Thai, Vietnamese and Indonesian. Arabic and Hebrew use RTL layout. The language selector includes a persistent globe icon and representative national flag. Preferences are stored locally. The map uses MapLibre vector labels that follow the selected language when translated name fields exist, falling back to the local name otherwise. Interface strings, clue templates, geographic terminology, and report controls are also translated.

## Technology

- Plain HTML, CSS, JavaScript, no build step or account.
- **MapLibre GL JS 6.18.0** with [OpenFreeMap](https://openfreemap.org/) dark vector tiles, no API key. Map labels update via localized OpenMapTiles `name:*` fields. Viewport gestures are distinguished from deliberate clicks (8 px pointer threshold plus drag suppression).
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
| `map-bootstrap.js` | Loads the MapLibre mapping engine from CDN |
| `facts.js` | 74 English and Portuguese location facts |
| `i18n.js` | Main user interface translations |
| `clues-i18n.js` | Geographic clue vocabulary and continent translations |
| `report-i18n.js` | Case report and updated game-rule translations |
| `app.js` | State, date-specific case IDs, clues, map, gameplay, reports |
| `tests/smoke.test.mjs` | Automated gameplay and data integrity checks |

The [GitHub Pages deployment workflow](.github/workflows/pages.yml) publishes the files to `https://f404x.github.io/geodetective/` after passing the automated tests.

## Data accuracy

The city center coordinates are approximate. Distances use the haversine formula, which describes straight-line distance on a sphere, **not** road distance. Physical landscape labels are simplified. Geographic comparison references draw from both the city catalogue and a separately validated local reference dataset. Location facts are educational descriptions, not live measurements. Maps require WebGL and internet access; not every map feature has names translated into all 19 languages.
