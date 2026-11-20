/* Persisted application appearance, independent of language and map provider. */
(() => {
  "use strict";
  const KEY="geodetective-theme";
  const THEMES={
    midnight:{mode:"dark",en:"Midnight",pt:"Meia-noite"},
    graphite:{mode:"dark",en:"Graphite",pt:"Grafite"},
    orbit:{mode:"dark",en:"Orbit",pt:"Órbita"},
    forest:{mode:"dark",en:"Forest",pt:"Floresta"},
    abyss:{mode:"dark",en:"Abyss",pt:"Abismo"},
    ember:{mode:"dark",en:"Ember",pt:"Brasa"},
    porcelain:{mode:"light",en:"Porcelain",pt:"Porcelana"},
    linen:{mode:"light",en:"Linen",pt:"Linho"},
    garden:{mode:"light",en:"Garden",pt:"Jardim"},
    petal:{mode:"light",en:"Petal",pt:"Pétala"}
  };
  const TEXT={
    en:["Themes","Dark themes","Light themes","Close"],
    pt:["Temas","Temas escuros","Temas claros","Fechar"],
    es:["Temas","Temas oscuros","Temas claros","Cerrar"],
    zh:["主题","深色主题","浅色主题","关闭"],
    ja:["テーマ","ダークテーマ","ライトテーマ","閉じる"],
    ru:["Темы","Тёмные темы","Светлые темы","Закрыть"],
    fr:["Thèmes","Thèmes sombres","Thèmes clairs","Fermer"],
    de:["Designs","Dunkle Designs","Helle Designs","Schließen"],
    it:["Temi","Temi scuri","Temi chiari","Chiudi"],
    nl:["Thema’s","Donkere thema’s","Lichte thema’s","Sluiten"],
    pl:["Motywy","Ciemne motywy","Jasne motywy","Zamknij"],
    sv:["Teman","Mörka teman","Ljusa teman","Stäng"],
    tr:["Temalar","Koyu temalar","Açık temalar","Kapat"],
    ar:["السمات","السمات الداكنة","السمات الفاتحة","إغلاق"],
    he:["ערכות נושא","ערכות כהות","ערכות בהירות","סגירה"],
    ko:["테마","어두운 테마","밝은 테마","닫기"],
    th:["ธีม","ธีมสีเข้ม","ธีมสีอ่อน","ปิด"],
    vi:["Giao diện","Giao diện tối","Giao diện sáng","Đóng"],
    id:["Tema","Tema gelap","Tema terang","Tutup"]
  };
  const root=document.documentElement;
  const $=id=>document.getElementById(id);
  const dialog=$("themeCatalog");
  const trigger=$("themeToggle");
  const cards=new Map();
  const normalize=id=>id==="light"?"porcelain":id==="dark"?"midnight":id;
  let theme="midnight";
  try{
    const saved=normalize(localStorage.getItem(KEY));
    if(Object.hasOwn(THEMES,saved))theme=saved;
  }catch{}

  function sync(){
    const {mode}=THEMES[theme];
    root.setAttribute("data-palette",theme);
    root.setAttribute("data-color-mode",mode);
    const language=(root.lang||"en").split("-")[0].toLowerCase();
    const [title,dark,light,close]=TEXT[language]||TEXT.en;
    const themeName=item=>item[language]||item.en;
    $("themeLabel").textContent=title;
    $("themeCatalogTitle").textContent=title;
    $("darkThemesTitle").textContent=dark;
    $("lightThemesTitle").textContent=light;
    $("themeClose").setAttribute("aria-label",close);
    trigger.setAttribute("aria-label",title+" — "+themeName(THEMES[theme]));
    trigger.title=themeName(THEMES[theme]);
    for(const [id,{button,name}] of cards){
      button.setAttribute("aria-pressed",String(id===theme));
      name.textContent=themeName(THEMES[id]);
    }
    const background=window.getComputedStyle(root).getPropertyValue("--bg").trim();
    if(background)document.querySelector('meta[name="theme-color"]')?.setAttribute("content",background);
  }

  function set(id){
    const next=normalize(id);
    if(!Object.hasOwn(THEMES,next)||next===theme)return;
    const previousColorMode=THEMES[theme].mode;
    theme=next;
    try{localStorage.setItem(KEY,theme);}catch{}
    sync();
    window.dispatchEvent(new CustomEvent("geodetective:themechange",{
      detail:{theme,colorMode:THEMES[theme].mode,previousColorMode}
    }));
  }

  function makeThemeCard(id,mode){
    const button=document.createElement("button");
    button.type="button";
    button.className="theme-card";
    const preview=document.createElement("span");
    preview.className="theme-preview";
    preview.setAttribute("data-palette",id);
    preview.setAttribute("aria-hidden","true");
    const map=document.createElement("span");
    map.className="theme-preview-map";
    const panel=document.createElement("span");
    panel.className="theme-preview-panel";
    preview.append(map,panel);
    const name=document.createElement("span");
    name.className="theme-card-name";
    button.append(preview,name);
    button.addEventListener("click",()=>set(id));
    $(mode+"ThemeOptions").append(button);
    cards.set(id,{button,name});
  }

  for(const [id,{mode}] of Object.entries(THEMES))makeThemeCard(id,mode);
  trigger.addEventListener("click",()=>{
    if(dialog.open)return;
    dialog.showModal();
    cards.get(theme).button.focus();
  });
  $("themeClose").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",event=>{
    if(event.target!==dialog)return;
    const bounds=dialog.getBoundingClientRect();
    if(event.clientX<bounds.left||event.clientX>bounds.right||
       event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();
  });
  dialog.addEventListener("close",()=>trigger.focus());
  window.GeoTheme={current:()=>theme,set,sync};
  sync();
})();
