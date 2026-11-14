/* GeoDetective — jogo geográfico em JavaScript puro. */
(() => {
  "use strict";

  const PLACES = window.GEODETECTIVE_PLACES || [];
  const MAX_GUESSES = 6;
  const WIN_RADIUS_KM = 100;
  const DAILY_PREFIX = "geodetective-daily-v1-";
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, "0");
  const number = (n) => Math.round(n).toLocaleString("pt-BR");
  const today = () => new Date().toISOString().slice(0, 10);
  const rad = (deg) => deg * Math.PI / 180;
  const deg = (radians) => radians * 180 / Math.PI;
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const normalize = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const storage = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const kmDistance = (a, b) => {
    const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
    return 6371.0088 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
  };
  function bearing(a, b) {
    const x = Math.sin(rad(b[1] - a[1])) * Math.cos(rad(b[0]));
    const y = Math.cos(rad(a[0])) * Math.sin(rad(b[0])) - Math.sin(rad(a[0])) * Math.cos(rad(b[0])) * Math.cos(rad(b[1] - a[1]));
    return (deg(Math.atan2(x, y)) + 360) % 360;
  }
  const compass = (heading) => ["N", "NE", "L", "SE", "S", "SO", "O", "NO"][Math.round(heading / 45) % 8];
  function sunlight(latitude) {
    // Duração astronômica teórica no solstício de junho; ignora refração e horizonte.
    const cosine = -Math.tan(rad(latitude)) * Math.tan(rad(23.44));
    return cosine <= -1 ? 24 : cosine >= 1 ? 0 : 24 / Math.PI * Math.acos(cosine);
  }
  function cluesFor(p) {
    const lat = p[3], lon = p[4], lowLat = Math.floor(Math.abs(lat) / 10) * 10, lowLon = Math.floor(Math.abs(lon) / 20) * 20;
    const altitude = elevationCache.get(p[0]);
    const altitudeHint = Number.isFinite(altitude) ? "Altitude estimada do terreno: cerca de " + Math.round(altitude / 10) * 10 + " m. " : "";
    return [
      "A paisagem ao redor inclui " + p[5] + ".",
      "O alvo está no hemisfério " + (lat >= 0 ? "norte" : "sul") + ", entre " + lowLat + "° e " + (lowLat + 10) + "° de latitude.",
      "Procure na região: " + p[2] + ".",
      altitudeHint + "Longitude entre " + lowLon + "° e " + (lowLon + 20) + "° " + (lon >= 0 ? "leste" : "oeste") + ". No solstício de junho, o dia dura cerca de " + sunlight(lat).toFixed(1).replace(".", ",") + " horas.",
      "País ou território: " + p[1] + ".",
      "Referência decisiva: " + p[6] + "."
    ];
  }
  const dailyIndex = () => hash("GEODETECTIVE|" + today()) % PLACES.length;
  const newState = (mode, index) => ({
    mode, index, date: mode === "daily" ? today() : null,
    guesses: [], revealed: 2, penalty: 0, finished: false, won: false, score: 0
  });
  const savedDaily = () => {
    const saved = storage.get(DAILY_PREFIX + today());
    return saved && saved.mode === "daily" && saved.date === today() && saved.index === dailyIndex() &&
      Array.isArray(saved.guesses) && saved.guesses.length <= MAX_GUESSES &&
      saved.guesses.every((g) => Number.isFinite(g.lat) && Number.isFinite(g.lng) && Number.isFinite(g.distance))
      ? saved : null;
  };

  let game, selected = null, map = null, selectedMarker = null, overlay = null, freeIndex = -1;
  let fetchAbort = null, searchTimer = null, toastTimer = null;
  const elevationCache = new Map(), loadingElevation = new Set();
  function activePlace() { return PLACES[game.index]; }
  function save() { if (game.mode === "daily") storage.set(DAILY_PREFIX + today(), game); }
  function randomIndex() {
    const all = PLACES.map((_, i) => i).filter((i) => i !== freeIndex);
    const index = all[Math.floor(Math.random() * all.length)];
    freeIndex = index;
    return index;
  }
  function startDaily() {
    game = savedDaily() || newState("daily", dailyIndex());
    selected = null;
    render();
    resetMapView();
    loadElevation();
  }
  function startFree() {
    game = newState("free", randomIndex());
    selected = null;
    render();
    resetMapView();
    loadElevation();
  }
  async function loadElevation() {
    const place = activePlace(), key = place[0];
    if (elevationCache.has(key) || loadingElevation.has(key)) return;
    loadingElevation.add(key);
    try {
      const url = "https://api.open-meteo.com/v1/elevation?latitude=" + encodeURIComponent(place[3]) + "&longitude=" + encodeURIComponent(place[4]);
      const response = await fetch(url);
      if (!response.ok) return;
      const data = await response.json();
      const altitude = Array.isArray(data.elevation) ? data.elevation[0] : null;
      if (typeof altitude === "number" && Number.isFinite(altitude)) {
        elevationCache.set(key, altitude);
        if (activePlace()[0] === key) renderClues();
      }
    } catch { /* A pista funciona mesmo sem a API. */ }
    finally { loadingElevation.delete(key); }
  }
  function showToast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add("hidden"), 3200);
  }
  function renderClues() {
    const clues = cluesFor(activePlace());
    $("hintCount").textContent = game.revealed + " DE " + clues.length;
    $("clueList").replaceChildren();
    clues.forEach((content, i) => {
      const li = document.createElement("li");
      li.className = "clue" + (i >= game.revealed ? " locked" : "");
      const index = document.createElement("span");
      index.className = "clue-index";
      index.textContent = pad(i + 1);
      const body = document.createElement("span");
      body.className = "clue-text";
      body.textContent = i < game.revealed ? content : "EVIDÊNCIA BLOQUEADA";
      li.append(index, body);
      $("clueList").append(li);
    });
    $("revealBtn").disabled = game.finished || game.revealed >= clues.length;
    $("revealBtn").classList.toggle("hidden", game.finished);
  }
  function renderHistory() {
    const list = $("guessHistory");
    list.replaceChildren();
    $("historyCount").textContent = pad(game.guesses.length);
    if (!game.guesses.length) {
      const li = document.createElement("li");
      li.className = "empty-history";
      li.textContent = "Seus palpites aparecerão aqui.";
      list.append(li);
      return;
    }
    for (const [i, g] of game.guesses.entries()) {
      const li = document.createElement("li");
      li.className = "history-item";
      const left = document.createElement("span");
      const idx = document.createElement("span");
      idx.className = "history-number";
      idx.textContent = pad(i + 1);
      const label = document.createTextNode(g.label || g.lat.toFixed(2) + "°, " + g.lng.toFixed(2) + "°");
      const small = document.createElement("small");
      small.textContent = g.lat.toFixed(2) + "°, " + g.lng.toFixed(2) + "°";
      left.append(idx, label, small);
      const right = document.createElement("strong");
      right.textContent = g.distance <= WIN_RADIUS_KM ? "ACERTO" : number(g.distance) + " km · " + compass(g.bearing);
      li.append(left, right);
      list.append(li);
    }
  }
  function renderResult() {
    $("resultCard").classList.toggle("hidden", !game.finished);
    if (!game.finished) return;
    const p = activePlace();
    $("resultKicker").textContent = game.won ? "✓ CASO RESOLVIDO" : "◉ CASO ENCERRADO";
    $("resultTitle").textContent = p[0] + ", " + p[1];
    $("resultDetail").textContent = game.won
      ? "Excelente investigação! Você encontrou a cidade a " + number(game.guesses.at(-1).distance) + " km do ponto-alvo."
      : "As seis tentativas acabaram. A cidade secreta era " + p[0] + ", " + p[1] + ". Analise as pistas e tente novamente.";
    $("finalScore").textContent = number(game.score);
    $("nextBtn").textContent = game.mode === "daily" ? "JOGAR MODO LIVRE →" : "NOVO CASO →";
  }
  function render() {
    const daily = game.mode === "daily", remaining = MAX_GUESSES - game.guesses.length;
    $("year").textContent = String(new Date().getFullYear());
    $("placeCount").textContent = String(PLACES.length);
    $("dailyBtn").classList.toggle("active", daily);
    $("freeBtn").classList.toggle("active", !daily);
    $("dailyBtn").setAttribute("aria-pressed", String(daily));
    $("freeBtn").setAttribute("aria-pressed", String(!daily));
    const caseNumber = daily ? "#" + today().replaceAll("-", "").slice(2) : "#F-" + String(game.index + 1).padStart(3, "0");
    $("caseCode").textContent = "CASO " + caseNumber;
    $("caseNumber").textContent = "CASO " + caseNumber;
    $("modeCaption").textContent = daily ? "DESAFIO GLOBAL · DATA UTC" : "CASOS ILIMITADOS";
    $("caseStatus").textContent = game.finished ? (game.won ? "RESOLVIDO" : "ENCERRADO") : "EM ABERTO";
    $("caseStatus").classList.toggle("closed", game.finished);
    $("caseTitle").textContent = game.finished ? activePlace()[0] : "Localização desconhecida";
    $("attemptCount").textContent = remaining + " / " + MAX_GUESSES;
    $("guessCounter").textContent = game.guesses.length + " DE " + MAX_GUESSES;
    $("attemptDots").replaceChildren();
    for (let i = 0; i < MAX_GUESSES; i++) {
      const dot = document.createElement("i");
      dot.classList.toggle("live", i < remaining);
      $("attemptDots").append(dot);
    }
    renderClues();
    renderHistory();
    renderResult();
    $("guessBtn").disabled = game.finished || !selected;
    $("citySearch").disabled = game.finished;
    $("citySearch").value = "";
    $("selection").classList.toggle("hidden", game.finished);
    $("selectedText").textContent = selected ? (selected.label || selected.lat.toFixed(3) + "°, " + selected.lng.toFixed(3) + "°") : "Nenhum ponto selecionado";
    $("mapHint").textContent = game.finished ? "LOCALIZAÇÃO REVELADA" : "CLIQUE PARA MARCAR SUA HIPÓTESE";
    $("feedback").classList.add("hidden");
    $("suggestions").classList.add("hidden");
    renderMap();
  }
  function createIcon(content, style) {
    const html = '<span class="pin ' + style + '">' + String(content) + '</span>';
    return L.divIcon({ className: "guess-marker", html, iconSize: [28, 28], iconAnchor: [14, 14] });
  }
  function renderMap() {
    if (!map) return;
    overlay.clearLayers();
    if (selectedMarker) {
      map.removeLayer(selectedMarker);
      selectedMarker = null;
    }
    const p = activePlace(), target = [p[3], p[4]];
    for (const [i, g] of game.guesses.entries()) {
      L.marker([g.lat, g.lng], { icon: createIcon(i + 1, "past") }).addTo(overlay);
    }
    if (game.finished) {
      L.marker(target, { icon: createIcon("★", "target") }).addTo(overlay).bindPopup(p[0] + " · " + p[1]);
      if (game.guesses.length) {
        const g = game.guesses.at(-1);
        L.polyline([[g.lat, g.lng], target], { color: "#d5f77a", weight: 2, opacity: .75, dashArray: "6 8" }).addTo(overlay);
        map.fitBounds(L.latLngBounds([[g.lat, g.lng], target]).pad(.35), { maxZoom: 8, animate: true, padding: [30, 30] });
      } else map.setView(target, 5);
    } else if (selected) {
      selectedMarker = L.marker([selected.lat, selected.lng], { icon: createIcon("+", "") }).addTo(map);
    }
    $("coordinates").textContent = selected && !game.finished
      ? Math.abs(selected.lat).toFixed(3) + "° " + (selected.lat >= 0 ? "N" : "S") + " · " + Math.abs(selected.lng).toFixed(3) + "° " + (selected.lng >= 0 ? "L" : "O")
      : game.finished ? "ALVO " + target[0].toFixed(3) + "°, " + target[1].toFixed(3) + "°" : "AGUARDANDO COORDENADAS";
  }
  function resetMapView() { if (map && !game.finished) map.setView([12, 8], 2, { animate: false }); }
  function selectPoint(lat, lng, label) {
    if (game.finished) return;
    selected = { lat: Number(lat), lng: Number(lng), label: label || "" };
    if (map) map.setView([selected.lat, selected.lng], Math.max(map.getZoom(), 4), { animate: true });
    $("guessBtn").disabled = false;
    $("selectedText").textContent = label || selected.lat.toFixed(3) + "°, " + selected.lng.toFixed(3) + "°";
    $("feedback").classList.add("hidden");
    $("suggestions").classList.add("hidden");
    renderMap();
  }
  function reveal() {
    if (game.finished || game.revealed >= 6) return;
    game.revealed++;
    game.penalty += 300;
    save();
    renderClues();
    showToast("Nova evidência revelada. Penalidade: 300 pontos.");
  }
  function guess() {
    if (!selected || game.finished) return;
    const target = [activePlace()[3], activePlace()[4]], pos = [selected.lat, selected.lng];
    const distance = kmDistance(pos, target), direction = bearing(pos, target);
    game.guesses.push({
      lat: selected.lat, lng: selected.lng, label: selected.label,
      distance: Math.round(distance), bearing: Math.round(direction)
    });
    game.won = distance <= WIN_RADIUS_KM;
    if (game.won || game.guesses.length >= MAX_GUESSES) {
      game.finished = true;
      game.revealed = 6;
      game.score = game.won ? Math.max(250, Math.round(
        5000 * Math.pow(.77, game.guesses.length - 1) * Math.max(.76, 1 - distance / 425) - game.penalty
      )) : 0;
    } else {
      game.revealed = Math.min(6, Math.max(game.revealed, game.guesses.length + 2));
    }
    save();
    selected = null;
    render();
    const feedback = $("feedback");
    if (!game.finished) {
      feedback.textContent = "Distância: " + number(distance) + " km · Direção do alvo: " + compass(direction) + ". Nova pista desbloqueada.";
      feedback.className = "feedback";
      if (map) {
        const g = game.guesses.at(-1);
        map.setView([g.lat, g.lng], Math.max(map.getZoom(), 3));
      }
    } else if (game.won) showToast("Caso resolvido. Excelente trabalho!");
    else showToast("Caso encerrado. O alvo foi revelado no mapa.");
  }
  function resultsFor(term) {
    const q = normalize(term);
    return PLACES.filter((p) => normalize(p[0] + " " + p[1] + " " + p[2]).includes(q))
      .slice(0, 5).map((p) => ({ name: p[0], sub: p[1], latitude: p[3], longitude: p[4] }));
  }
  function listSuggestions(items) {
    const list = $("suggestions");
    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "suggestion-empty";
      empty.textContent = "Nenhum lugar encontrado. Você também pode clicar no mapa.";
      list.append(empty);
    }
    for (const item of items.slice(0, 7)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "suggestion";
      button.setAttribute("role", "option");
      button.textContent = item.name;
      const small = document.createElement("small");
      small.textContent = item.sub;
      button.append(small);
      button.addEventListener("click", () => {
        selectPoint(item.latitude, item.longitude, item.name);
        $("citySearch").value = item.name;
      });
      list.append(button);
    }
    list.classList.remove("hidden");
  }
  async function performSearch(term) {
    if (term.length < 3 || game.finished) return;
    const local = resultsFor(term);
    listSuggestions(local);
    if (fetchAbort) fetchAbort.abort();
    const controller = new AbortController();
    fetchAbort = controller;
    try {
      const url = "https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(term) + "&count=8&language=pt&format=json";
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error("API indisponível");
      const data = await response.json();
      if (controller !== fetchAbort || game.finished || $("citySearch").value.trim() !== term) return;
      const remote = (data.results || []).map((p) => ({
        name: p.name, sub: [p.admin1, p.country].filter(Boolean).join(", "),
        latitude: p.latitude, longitude: p.longitude
      }));
      const all = [...local];
      for (const p of remote) {
        if (!all.some((existing) => kmDistance([existing.latitude, existing.longitude], [p.latitude, p.longitude]) < 10)) all.push(p);
      }
      listSuggestions(all);
    } catch (error) {
      if (error.name !== "AbortError" && !local.length) listSuggestions([]);
    }
  }
  function shareText() {
    const symbols = game.guesses.map((g) => g.distance <= WIN_RADIUS_KM ? "🟩" : g.distance < 500 ? "🟨" : "⬛").join("");
    return "GeoDetective " + (game.mode === "daily" ? today() : "Modo Livre") + "\n"
      + (game.won ? "Resolvido em " + game.guesses.length + "/" + MAX_GUESSES + " tentativas" : "Caso não resolvido")
      + " · " + number(game.score) + " pts\n" + symbols
      + "\nhttps://github.com/F404X/geodetective";
  }
  async function share() {
    const content = shareText();
    try {
      if (navigator.share) { await navigator.share({ text: content }); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
        showToast("Resultado copiado para compartilhar.");
        return;
      }
      const field = document.createElement("textarea");
      field.value = content;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      const success = document.execCommand("copy");
      field.remove();
      if (!success) throw new Error("Falha ao copiar");
      showToast("Resultado copiado.");
    } catch (error) {
      if (error.name !== "AbortError") showToast("Não foi possível compartilhar automaticamente.");
    }
  }
  function initMap() {
    if (!window.L) {
      $("map").innerHTML = '<div style="padding:30px;color:#a9c1af">Não foi possível carregar o mapa. Verifique a conexão. A busca de lugares ainda pode ser utilizada.</div>';
      return;
    }
    map = L.map("map", { center: [12, 8], zoom: 2, minZoom: 2, maxZoom: 16, worldCopyJump: true, zoomControl: false });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
      subdomains: "abcd", maxZoom: 19
    }).addTo(map);
    L.control.zoom({ position: "bottomleft" }).addTo(map);
    overlay = L.layerGroup().addTo(map);
    map.on("click", (e) => selectPoint(e.latlng.lat, e.latlng.lng, ""));
    setTimeout(() => map.invalidateSize(), 100);
  }
  function init() {
    if (!PLACES.length) {
      $("map").textContent = "Não foi possível carregar as localidades. Atualize a página.";
      return;
    }
    initMap();
    $("dailyBtn").addEventListener("click", startDaily);
    $("freeBtn").addEventListener("click", startFree);
    $("revealBtn").addEventListener("click", reveal);
    $("guessBtn").addEventListener("click", guess);
    $("resetViewBtn").addEventListener("click", () => { if (map) map.setView([12, 8], 2); });
    $("nextBtn").addEventListener("click", () => {
      startFree();
      document.querySelector("#jogar").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("shareBtn").addEventListener("click", share);
    $("helpBtn").addEventListener("click", () => $("helpDialog").showModal());
    $("closeHelpBtn").addEventListener("click", () => $("helpDialog").close());
    $("startHelpBtn").addEventListener("click", () => $("helpDialog").close());
    $("helpDialog").addEventListener("click", (e) => { if (e.target === $("helpDialog")) $("helpDialog").close(); });
    $("citySearch").addEventListener("input", (e) => {
      const term = e.target.value.trim();
      if (fetchAbort) fetchAbort.abort();
      clearTimeout(searchTimer);
      if (term.length < 3) { $("suggestions").classList.add("hidden"); return; }
      listSuggestions(resultsFor(term));
      searchTimer = setTimeout(() => performSearch(term), 420);
    });
    $("citySearch").addEventListener("keydown", (e) => {
      if (e.key === "Escape") $("suggestions").classList.add("hidden");
      if (e.key === "Enter") {
        const option = $("suggestions").querySelector("button.suggestion");
        if (option && !$("suggestions").classList.contains("hidden")) { e.preventDefault(); option.click(); }
      }
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-wrap")) $("suggestions").classList.add("hidden");
    });
    startDaily();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();