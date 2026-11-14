# GeoDetective

A daily geography deduction game. Find a hidden city using geographic clues, a world map and distance feedback.

**Play:** https://f404x.github.io/geodetective/

## Gameplay

- **Daily case:** one shared location per date (UTC) and difficulty. Progress is stored in the browser independently for each difficulty.
- **Free play:** unlimited random cases.
- **Easy:** 8 guesses, 3 clues at the start, country/territory as the fifth clue.
- **Normal:** 6 guesses, 2 clues at the start, no country reveal.
- **Hard:** 4 guesses, 1 clue at the start, no country reveal.
- **Win condition:** guess within 100 km (great-circle distance) of the target city center.
- **Scoring:** up to 5,000 points, adjusted for guesses and accuracy. You can reveal hints early for a 300-point penalty each.

Evidence is assembled for each city from a variety of geographical facts: landscape, continent, latitude belt, national-capital status, hemisphere, distance to reference cities, comparative proximity and nearest other city in the catalogue. Evidence order varies by location. The old broad longitude/daylight clue is removed, and the country clue is restricted to Easy.

The catalogue contains 74 cities with approximate coordinates. Geographic and country names are localized when available using browser internationalization features.

## Interface

The responsive game fills the available viewport with no page scrollbar: map on the left and evidence/guess columns alongside each other on desktop. On narrower screens the map moves above the two columns; the guess history can scroll internally when necessary. Yellow is the primary accent; borders are squared and background glows and the introductory landing section have been removed.

**Languages:** English (default), Portuguese, Spanish, Simplified Chinese, Japanese, Russian, French, German, Italian, Dutch, Polish, Swedish, Turkish, Arabic, Hebrew, Korean, Thai, Vietnamese and Indonesian. Arabic and Hebrew use right-to-left text direction. Language and difficulty preferences are saved locally. Geographic clue templates and terrain categories are translated; proper city names use a readable localized or international form.

## Technology

No build tools, account or API keys are required:

- HTML, CSS, and JavaScript
- Leaflet with OpenStreetMap tiles (keyless, [public tile usage policy](https://operations.osmfoundation.org/policies/tiles/))
- Open-Meteo Geocoding API for optional city search
- Browser `Intl.DisplayNames` for localized countries/continents
- `localStorage` for daily game progress and preferences

Because this is a static site, the hidden city and game data are present in the browser; the game is intended as a casual knowledge challenge, not a tamper-proof competition.

## Running locally

Serve the repository root over HTTP, for example:

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Tests

```bash
node --test tests/*.test.mjs
```

GitHub Actions runs the tests on every push and pull request. The [Pages deployment workflow](.github/workflows/pages.yml) also executes the tests and publishes the static files on every commit to `main`.

## Source layout

| File | Purpose |
| --- | --- |
| `index.html` | Compact interface and accessible controls |
| `styles.css` | Yellow/dark theme and responsive viewport layout |
| `places.js` | Coordinates and original city catalogue |
| `i18n.js` | 19-language UI messages |
| `clues-i18n.js` | 19-language clue text and geography vocabulary |
| `app.js` | Game engine, map, difficulty rules, persistence and geocoding |
| `tests/smoke.test.mjs` | Automated gameplay and translation checks |

## Accuracy notes

Distances use the haversine formula; the 100 km win radius is not a driving distance. Landscape categories are simplified and are not a replacement for a detailed physical geography source. The extra comparisons are computed from catalogue coordinates, not live GPS data. External map tiles and geocoding require internet and are governed by their providers' usage policies.
