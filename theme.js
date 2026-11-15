/* Persisted application appearance, independent of the game's language and map style. */
(() => {
  "use strict";
  const KEY = "geodetective-theme";
  const TEXT = {
    en:["Light mode","Dark mode","Switch to light mode","Switch to dark mode"],
    pt:["Modo claro","Modo escuro","Mudar para modo claro","Mudar para modo escuro"],
    es:["Modo claro","Modo oscuro","Cambiar a modo claro","Cambiar a modo oscuro"],
    zh:["浅色模式","深色模式","切换到浅色模式","切换到深色模式"],
    ja:["ライトモード","ダークモード","ライトモードに切り替え","ダークモードに切り替え"],
    ru:["Светлая тема","Тёмная тема","Включить светлую тему","Включить тёмную тему"],
    fr:["Mode clair","Mode sombre","Passer en mode clair","Passer en mode sombre"],
    de:["Heller Modus","Dunkler Modus","Zum hellen Modus wechseln","Zum dunklen Modus wechseln"],
    it:["Tema chiaro","Tema scuro","Passa al tema chiaro","Passa al tema scuro"],
    nl:["Lichte modus","Donkere modus","Overschakelen naar licht","Overschakelen naar donker"],
    pl:["Tryb jasny","Tryb ciemny","Włącz tryb jasny","Włącz tryb ciemny"],
    sv:["Ljust läge","Mörkt läge","Byt till ljust läge","Byt till mörkt läge"],
    tr:["Açık tema","Koyu tema","Açık temaya geç","Koyu temaya geç"],
    ar:["الوضع الفاتح","الوضع الداكن","التبديل إلى الوضع الفاتح","التبديل إلى الوضع الداكن"],
    he:["מצב בהיר","מצב כהה","מעבר למצב בהיר","מעבר למצב כהה"],
    ko:["라이트 모드","다크 모드","라이트 모드로 전환","다크 모드로 전환"],
    th:["โหมดสว่าง","โหมดมืด","เปลี่ยนเป็นโหมดสว่าง","เปลี่ยนเป็นโหมดมืด"],
    vi:["Chế độ sáng","Chế độ tối","Chuyển sang chế độ sáng","Chuyển sang chế độ tối"],
    id:["Mode terang","Mode gelap","Beralih ke mode terang","Beralih ke mode gelap"]
  };
  let theme = "dark";
  try { if (localStorage.getItem(KEY) === "light") theme = "light"; } catch {}
  function language() {
    return (document.documentElement.lang || "en").split("-")[0].toLowerCase();
  }
  function sync() {
    document.documentElement.setAttribute("data-theme",theme);
    const next = theme === "dark" ? 0 : 1;
    const i18n = TEXT[language()] || TEXT.en;
    const button = document.getElementById("themeToggle");
    const label = document.getElementById("themeLabel");
    if(label)label.textContent=i18n[next];
    if(button) {
      button.setAttribute("aria-pressed",String(theme === "light"));
      button.setAttribute("aria-label",i18n[next+2]);
      button.title=i18n[next+2];
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute("content",theme === "light" ? "#f3f6fb" : "#0b1018");
  }
  function set(value) {
    if(value !== "dark" && value !== "light")return;
    const changed = value !== theme;
    theme = value;
    try { localStorage.setItem(KEY,theme); } catch {}
    sync();
    if(changed)window.dispatchEvent(new CustomEvent("geodetective:themechange",{detail:{theme}}));
  }
  window.GeoTheme = {current:()=>theme,set,sync};
  sync();
  const button = document.getElementById("themeToggle");
  if(button)button.addEventListener("click",()=>set(theme === "dark" ? "light" : "dark"));
})();