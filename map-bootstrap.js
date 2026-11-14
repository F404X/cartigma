/* Load a modern vector map; still start the game if the CDN or WebGL is unavailable. */
try {
  const maplibregl = await import("https://unpkg.com/maplibre-gl@6.18.0/dist/maplibre-gl.mjs");
  window.maplibregl = maplibregl;
} catch (error) {
  console.warn("MapLibre could not load; text search remains available.", error);
}
await import("./app.js");
