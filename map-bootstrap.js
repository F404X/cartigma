/* GeoDetective map bootstrap: load the selected engine, preserve an explicit fallback. */
let vectorPromise = null;
async function loadVector() {
  if (!vectorPromise) vectorPromise = (async () => {
    let lastError = null;
    for (const url of [
      "https://cdn.jsdelivr.net/npm/maplibre-gl@6.18.0/dist/maplibre-gl.mjs",
      "https://unpkg.com/maplibre-gl@6.18.0/dist/maplibre-gl.mjs"
    ]) {
      try {
        const candidate = await import(url);
        if (typeof candidate.Map === "function" &&
            (typeof candidate.supported !== "function" || candidate.supported()))
          return candidate;
      } catch (error) {
        lastError = error;
        console.warn("Vector map provider unavailable:", error);
      }
    }
    throw lastError || new Error("Vector map not supported in this browser");
  })().catch(error => {
    vectorPromise = null; // Retry on the next explicit user switch.
    throw error;
  });
  return vectorPromise;
}
window.GeoMapLoader = {
  loadVector,
  async load(style) {
    return style === "osm" ? window.GeoMapFallback.ensure() : loadVector();
  }
};
let preferred = "vector";
try {
  const saved = JSON.parse(localStorage.getItem("geodetective-map-style"));
  if (saved === "osm") preferred = "osm";
} catch {}
try {
  window.maplibregl = await window.GeoMapLoader.load(preferred);
} catch (error) {
  console.warn("Preferred map unavailable, trying OpenStreetMap:", error);
  try {
    window.maplibregl = await window.GeoMapLoader.load("osm");
  } catch (fallbackError) {
    console.error("No map engine could load:", fallbackError);
    window.maplibregl = null;
  }
}
await import("./app.js");
