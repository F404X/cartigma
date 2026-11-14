import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const placesSource = readFileSync(new URL("../places.js", import.meta.url), "utf8");
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");

class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.className = "";
    this.children = [];
    this.handlers = {};
    this.value = "";
    this.textContent = "";
    this.innerHTML = "";
    this.disabled = false;
    this.style = {};
    this._classes = new Set();
    this.classList = {
      add: (name) => this._classes.add(name),
      remove: (name) => this._classes.delete(name),
      contains: (name) => this._classes.has(name),
      toggle: (name, force) => {
        const enabled = force === undefined ? !this._classes.has(name) : force;
        if (enabled) this._classes.add(name);
        else this._classes.delete(name);
        return enabled;
      }
    };
  }
  replaceChildren(...children) { this.children = children; }
  append(...children) { this.children.push(...children); }
  addEventListener(name, handler) { this.handlers[name] = handler; }
  setAttribute() {}
  querySelector(selector) {
    if (selector === "button.suggestion") {
      return this.children.find((child) => child.className === "suggestion") || null;
    }
    return null;
  }
  scrollIntoView() {}
  showModal() {}
  close() {}
  closest() { return null; }
}

function createGame() {
  const elements = new Map(), state = new Map(), window = {};
  const document = {
    readyState: "complete",
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement(id));
      return elements.get(id);
    },
    createElement: () => new FakeElement(),
    createTextNode(text) {
      const element = new FakeElement();
      element.textContent = text;
      return element;
    },
    addEventListener() {},
    querySelector: () => new FakeElement()
  };
  const localStorage = {
    getItem: (key) => state.get(key) || null,
    setItem: (key, value) => state.set(key, value)
  };
  const context = {
    window, document, localStorage, navigator: {},
    setTimeout: () => 0, clearTimeout: () => {},
    fetch: async () => ({ ok: true, json: async () => ({ elevation: [600] }) }),
    console, Math, Date, String, Number, JSON, Map, Set, Array
  };
  runInNewContext(placesSource, context, { filename: "places.js" });
  runInNewContext(appSource, context, { filename: "app.js" });
  const get = document.getElementById.bind(document);
  function select(name) {
    get("citySearch").value = name;
    get("citySearch").handlers.input({ target: get("citySearch") });
    const suggestion = get("suggestions").children.find((el) => el.className === "suggestion" && el.textContent === name);
    assert.ok(suggestion, "Deve encontrar sugestão para " + name);
    suggestion.handlers.click();
  }
  return { places: window.GEODETECTIVE_PLACES, get, select, state };
}

function hash(value) {
  let h = 2166136261;
  for (const char of value) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

test("catálogo tem localidades válidas e distintas", () => {
  const { places } = createGame();
  assert.ok(places.length >= 70);
  const seen = new Set();
  for (const place of places) {
    assert.equal(place.length, 7);
    assert.ok(place[3] >= -90 && place[3] <= 90);
    assert.ok(place[4] >= -180 && place[4] <= 180);
    assert.ok(place[5].length > 12 && place[6].length > 12);
    const key = place[0] + "|" + place[1];
    assert.ok(!seen.has(key), "Localidade duplicada: " + key);
    seen.add(key);
  }
});

test("desafio diário libera pistas e persiste após seis palpites", () => {
  const { places, get, select, state } = createGame();
  assert.equal(get("clueList").children.length, 6);
  assert.equal(get("clueList").children.filter((x) => !x.className.includes("locked")).length, 2);
  const day = new Date().toISOString().slice(0, 10);
  const idx = hash("GEODETECTIVE|" + day) % places.length;
  const far = places.find((p) => Math.abs(p[3] - places[idx][3]) > 50);
  assert.ok(far);
  for (let i = 0; i < 6; i++) {
    select(far[0]);
    get("guessBtn").handlers.click();
  }
  assert.equal(get("guessHistory").children.length, 6);
  assert.equal(get("resultCard").classList.contains("hidden"), false);
  assert.equal(get("finalScore").textContent, "0");
  assert.equal(state.size, 1);
  get("dailyBtn").handlers.click();
  assert.equal(get("guessHistory").children.length, 6, "Progresso deve continuar após retornar ao desafio diário");
});

test("modo livre aceita acerto exato e calcula 5.000 pontos", () => {
  const { places, get, select } = createGame();
  get("freeBtn").handlers.click();
  const match = get("caseCode").textContent.match(/#F-(\d+)/);
  assert.ok(match);
  const target = places[Number(match[1]) - 1];
  select(target[0]);
  get("guessBtn").handlers.click();
  assert.equal(get("resultKicker").textContent, "✓ CASO RESOLVIDO");
  assert.equal(get("finalScore").textContent, "5.000");
  assert.equal(get("guessHistory").children.length, 1);
  get("nextBtn").handlers.click();
  assert.equal(get("guessHistory").children.length, 0);
});

test("pista extra cobra penalidade e desbloqueia mais uma evidência", () => {
  const { get } = createGame();
  get("revealBtn").handlers.click();
  assert.equal(get("clueList").children.filter((x) => !x.className.includes("locked")).length, 3);
  assert.equal(get("hintCount").textContent, "3 DE 6");
});