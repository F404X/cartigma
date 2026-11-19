/* Cartigma version history. All data is bundled locally for offline access. */
(() => {
  "use strict";
  const archive=window.CartigmaChangelog;
  if(!archive?.entries?.length)return;
  const $=id=>document.getElementById(id);
  const L={
    en:["Version history","Complete history, including features that have since been replaced. Original commit descriptions are in English.","All changes","Updates","Bug fixes","Technical","Update","Fix","Technical","Show more","entries","Purely technical changes do not increase the version."],
    pt:["Histórico de versões","Histórico completo, inclusive funcionalidades substituídas. As descrições originais dos commits estão em inglês.","Tudo","Atualizações","Correções","Técnico","Atualização","Correção","Técnico","Ver mais","registros","Alterações exclusivamente técnicas não aumentam a versão."],
    es:["Historial de versiones","Historial completo; las descripciones originales están en inglés.","Todos","Actualizaciones","Correcciones","Técnico","Actualización","Corrección","Técnico","Ver más","registros","Los cambios técnicos no aumentan la versión."],
    zh:["版本历史","完整历史，原始提交说明保留英语。","全部","更新","修复","技术","更新","修复","技术","更多","条记录","纯技术变更不会增加版本号。"],
    ja:["更新履歴","全履歴。コミットの説明は英語のままです。","すべて","更新","修正","技術","更新","修正","技術","さらに表示","件","技術的変更はバージョンを増やしません。"],
    ru:["История версий","Полная история; описания коммитов сохранены на английском.","Все","Обновления","Исправления","Технические","Обновление","Исправление","Техническая запись","Показать ещё","записей","Технические изменения не увеличивают версию."],
    fr:["Historique des versions","Historique complet; messages des commits en anglais.","Tout","Mises à jour","Correctifs","Technique","Mise à jour","Correctif","Technique","Voir plus","entrées","Les changements techniques n'incrémentent pas la version."],
    de:["Versionsverlauf","Vollständiger Verlauf; Commit-Beschreibungen bleiben Englisch.","Alle","Updates","Fehlerbehebungen","Technik","Update","Fehlerbehebung","Technik","Mehr anzeigen","Einträge","Technische Änderungen erhöhen die Version nicht."],
    it:["Cronologia versioni","Cronologia completa; descrizioni dei commit in inglese.","Tutti","Aggiornamenti","Correzioni","Tecnici","Aggiornamento","Correzione","Tecnico","Mostra altro","voci","Le modifiche tecniche non aumentano la versione."],
    nl:["Versiegeschiedenis","Volledige geschiedenis; committeksten blijven Engels.","Alles","Updates","Bugfixes","Technisch","Update","Bugfix","Technisch","Meer tonen","items","Technische wijzigingen verhogen de versie niet."],
    pl:["Historia wersji","Pełna historia; opisy commitów są po angielsku.","Wszystkie","Aktualizacje","Poprawki","Techniczne","Aktualizacja","Poprawka","Techniczne","Pokaż więcej","wpisów","Zmiany techniczne nie zwiększają wersji."],
    sv:["Versionshistorik","Fullständig historik; commitbeskrivningar är på engelska.","Alla","Uppdateringar","Rättningar","Tekniskt","Uppdatering","Rättning","Tekniskt","Visa fler","poster","Tekniska ändringar höjer inte versionen."],
    tr:["Sürüm geçmişi","Tüm geçmiş; commit açıklamaları İngilizce tutulur.","Tümü","Güncellemeler","Düzeltmeler","Teknik","Güncelleme","Düzeltme","Teknik","Daha fazla","kayıt","Teknik değişiklikler sürümü artırmaz."],
    ar:["سجل الإصدارات","السجل الكامل؛ وصف الالتزامات بالإنجليزية.","الكل","التحديثات","الإصلاحات","تقني","تحديث","إصلاح","تقني","المزيد","سجل","التغييرات التقنية لا تزيد الإصدار."],
    he:["היסטוריית גרסאות","היסטוריה מלאה; תיאורי הקומיטים באנגלית.","הכול","עדכונים","תיקונים","טכני","עדכון","תיקון","טכני","עוד","רשומות","שינויים טכניים אינם מעלים גרסה."],
    ko:["버전 기록","전체 기록. 원본 커밋 설명은 영어입니다.","전체","업데이트","수정","기술","업데이트","수정","기술","더 보기","개","기술 변경은 버전을 올리지 않습니다."],
    th:["ประวัติเวอร์ชัน","ประวัติทั้งหมด โดยข้อความคอมมิตคงเป็นภาษาอังกฤษ","ทั้งหมด","อัปเดต","แก้บั๊ก","เทคนิค","อัปเดต","แก้ไข","เทคนิค","ดูเพิ่ม","รายการ","การเปลี่ยนแปลงทางเทคนิคไม่เพิ่มเวอร์ชัน"],
    vi:["Lịch sử phiên bản","Toàn bộ lịch sử; mô tả commit bằng tiếng Anh.","Tất cả","Cập nhật","Sửa lỗi","Kỹ thuật","Cập nhật","Sửa lỗi","Kỹ thuật","Xem thêm","mục","Thay đổi kỹ thuật không tăng phiên bản."],
    id:["Riwayat versi","Riwayat lengkap; deskripsi commit tetap berbahasa Inggris.","Semua","Pembaruan","Perbaikan","Teknis","Pembaruan","Perbaikan","Teknis","Lihat lagi","entri","Perubahan teknis tidak menaikkan versi."]
  };
  const locale=()=>$("langSelect")?.value||"en";
  const words=()=>L[locale()]||L.en;
  let visible=0,filtered=[];
  function item(entry){
    const li=document.createElement("li");li.className="changelog-item";
    const row=document.createElement("div");row.className="changelog-item-meta";
    const version=document.createElement("strong");version.textContent=entry.version;
    const kind=document.createElement("span");
    kind.className="changelog-kind changelog-"+entry.kind;
    kind.textContent=words()[entry.kind==="general"?6:entry.kind==="fix"?7:8];
    const date=document.createElement("time");
    date.dateTime=entry.date.slice(0,10);date.textContent=entry.date.slice(0,10);
    row.append(version,kind,date);
    const title=document.createElement("p");title.textContent=entry.title;
    li.append(row,title);
    if(entry.commits.length){
      const commits=document.createElement("div");commits.className="changelog-commits";
      for(const sha of entry.commits){
        const link=document.createElement("a");
        link.href="https://github.com/F404X/cartigma/commit/"+sha;
        link.textContent=sha.slice(0,8);link.title="Commit "+sha;
        link.target="_blank";link.rel="noopener noreferrer";
        commits.append(link);
      }
      li.append(commits);
    }
    return li;
  }
  function more(){
    const fragment=document.createDocumentFragment();
    const target=Math.min(visible+25,filtered.length);
    for(let i=visible;i<target;i++)fragment.append(item(filtered[i]));
    $("changelogList").append(fragment);visible=target;
    $("changelogMore").hidden=visible>=filtered.length;
  }
  function reset(){
    const kind=$("changelogFilter").value;
    filtered=archive.entries.filter(e=>kind==="all"||kind===e.kind);
    visible=0;$("changelogList").replaceChildren();
    more();
    $("changelogCount").textContent=filtered.length+" "+words()[10];
  }
  function translate(){
    const w=words();
    $("changelogHeading").textContent=w[0];
    $("changelogIntro").textContent=w[1];
    $("changelogNote").textContent=w[11];
    $("changelogMore").textContent=w[9];
    for(const [index,opt] of Array.from($("changelogFilter").options).entries())opt.textContent=w[index+2];
    $("changelogCount").textContent=filtered.length+" "+w[10];
    $("changelogSummary").textContent=archive.general+" "+w[3].toLowerCase()+" · "+archive.fixes+" "+w[4].toLowerCase();
    if(visible){
      const count=visible;
      visible=0;$("changelogList").replaceChildren();
      while(visible<count)more();
    }
  }
  function setup(){
    if(!$("changelogTab")||!$("changelogList"))return;
    $("cartigmaVersion").textContent=archive.current;
    $("changelogVersion").textContent=archive.current;
    $("changelogTab").addEventListener("click",()=>{translate();if(!visible)reset()});
    $("changelogTab").addEventListener("focus",()=>{translate();if(!visible)reset()});
    $("changelogMore").addEventListener("click",more);
    $("changelogFilter").addEventListener("change",reset);
    $("langSelect")?.addEventListener("change",translate);
    translate();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup);
  else setup();
})();
