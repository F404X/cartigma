# GeoDetective

A browser-based geographic detective game. Read the evidence, place pins on a world map, and identify a hidden city in a limited number of attempts.

**Play:** https://f404x.github.io/geodetective/

## Game rules

- **Daily case:** one shared location for each difficulty on each UTC date. The daily progress and case ID are saved locally.
- **Free play:** new random investigations without an account.
- **Normal:** 6 guesses, 2 starting clues, distance **and cardinal direction** after an incorrect guess.
- **Hard:** 4 guesses, 1 starting clue, **only the distance** after an incorrect guess. Direction remains hidden even in the final case report.
- Win when a guess falls within **100 km straight-line distance** of the city's approximate coordinates.
- Six evidence cards: physical landscape or latitude zone, continent, regional profile, distance from a known reference city, geographic proximity comparison, and a distinctive local landmark. The initial and comparative facts vary per city; the country name is not a clue.
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

The map automatically frames the **closest guess and the actual city**, with restrained zoom and a line connecting both. Click markers are small pointed pins anchored at the exact selected coordinate. The map also handles points that straddle the international date line.

## Design and languages

The game uses a flat, yellow-and-charcoal detective interface. Evidence cards have larger typography, ruled separators, numbered sections and evidence classifications. The whole application fits in the viewport without a browser-page scrollbar; longer clue, log and report sections can scroll **internally** when needed, particularly on small screens.

The UI supports **19 languages**: English (default), Portuguese, Spanish, Simplified Chinese, Japanese, Russian, French, German, Italian, Dutch, Polish, Swedish, Turkish, Arabic, Hebrew, Korean, Thai, Vietnamese and Indonesian. Arabic and Hebrew use RTL layout. Preferences are stored locally. Interface strings, clue templates, geographic terminology, and report controls are translated; geographical proper names may use internationally recognized spellings.

## Technology

- Plain HTML, CSS, JavaScript, no build step or account.
- Leaflet + OpenStreetMap public tiles (keyless; comply with the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/)).
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
| `facts.js` | 74 English and Portuguese location facts |
| `i18n.js` | Main user interface translations |
| `clues-i18n.js` | Geographic clue vocabulary and continent translations |
| `report-i18n.js` | Case report and updated game-rule translations |
| `app.js` | State, date-specific case IDs, clues, map, gameplay, reports |
| `tests/smoke.test.mjs` | Automated gameplay and data integrity checks |

The [GitHub Pages deployment workflow](.github/workflows/pages.yml) publishes the files to `https://f404x.github.io/geodetective/` after passing the automated tests.

## Data accuracy

The city center coordinates are approximate. Distances use the haversine formula, which describes straight-line distance on a sphere, **not** road distance. Physical landscape labels are simplified. Reference-city and nearest-city comparisons use the project's own catalogue. Location facts are educational descriptions, not live measurements.
