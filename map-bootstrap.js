/* Load vector maps from either CDN; fall back to Leaflet when unavailable. */
let lib = null;
for (const url of [
  "https://cdn.jsdelivr.net/npm/maplibre-gl@6.18.0/dist/maplibre-gl.mjs",
  "https://unpkg.com/maplibre-gl@6.18.0/dist/maplibre-gl.mjs"
]) {
  try {
    const candidate = await import(url);
    if (typeof candidate.Map === "function" &&
        (typeof candidate.supported !== "function" || candidate.supported())) {
      lib = candidate;
      break;
    }
  } catch (error) {
    console.warn("MapLibre CDN unavailable:", error);
  }
}
if (!lib) {
  try {
    lib = await window.GeoMapFallback.ensure();
  } catch (error) {
    console.error("Both map providers unavailable:", error);
  }
}
window.maplibregl = lib;
await import("./app.js");
