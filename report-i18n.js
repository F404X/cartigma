/* Additional case-file translations and rule updates for the two difficulty modes. */
(() => {
  const KEYS = "reportArchive|openReport|investigationRecord|reportMode|reportAttempts|reportBest|reportHints|reportCoordinates|reportContinent|reportTrivia|reportTimeline|reportEvidence|showMap|clueTerrain|clueRegion|clueClimate|clueCivic|clueDistance|clueLandmark|hardDistance|caseClosed|caseSolved|reportNoGuesses|reportFactFallback|reportDate|reportFailure|reportSuccess".split("|");
  const DATA = {
    en:"CARTIGMA / CASE FILE|View case file|Investigation record|Mode|Guesses|Closest guess|Extra clues|Coordinates|Continent|Did you know?|Guess log|Evidence collected|Back to map|TERRAIN|REGION|CLIMATE|PROFILE|DISTANCE|LANDMARK|{km} km away. New clue unlocked.|CASE CLOSED|CASE SOLVED|No guesses recorded|A notable landmark here is {landmark}.|Opened|Unsolved|Solved",
    pt:"CARTIGMA / DOSSIÊ|Ver ficha do caso|Registro da investigação|Modo|Palpites|Melhor palpite|Pistas extras|Coordenadas|Continente|Você sabia?|Histórico de palpites|Evidências coletadas|Voltar ao mapa|RELEVO|REGIÃO|CLIMA|PERFIL|DISTÂNCIA|MARCO|Distância: {km} km. Nova pista liberada.|CASO ENCERRADO|CASO RESOLVIDO|Nenhum palpite registrado|Um ponto conhecido desta cidade é {landmark}.|Aberto em|Não resolvido|Resolvido",
    es:"CARTIGMA / EXPEDIENTE|Ver expediente|Registro de investigación|Modo|Intentos|Mejor intento|Pistas extra|Coordenadas|Continente|¿Sabías que...?|Historial de intentos|Pruebas reunidas|Volver al mapa|RELIEVE|REGIÓN|CLIMA|PERFIL|DISTANCIA|LUGAR CLAVE|A {km} km. Nueva pista desbloqueada.|CASO CERRADO|CASO RESUELTO|Sin intentos registrados|Un lugar conocido aquí es {landmark}.|Iniciado|Sin resolver|Resuelto",
    zh:"CARTIGMA / 档案|查看案件档案|调查记录|模式|猜测次数|最近的一次|额外线索|坐标|大洲|你知道吗？|猜测记录|已收集证据|返回地图|地形|地区|气候|特征|距离|地标|距离 {km} 公里。新线索已解锁。|案件结束|案件解决|没有猜测记录|这里的著名地标是 {landmark}。|开始时间|未解决|已解决",
    ja:"CARTIGMA / 調査ファイル|調査ファイルを見る|調査記録|モード|予想回数|最も近い予想|追加ヒント|座標|大陸|豆知識|予想履歴|収集した証拠|地図に戻る|地形|地域|気候|特徴|距離|名所|距離 {km} km。新しいヒントが開放。|調査終了|調査成功|予想記録なし|この場所の有名な名所は {landmark} です。|開始|未解決|解決",
    ru:"CARTIGMA / ДОСЬЕ|Открыть дело|Отчёт об исследовании|Режим|Попытки|Лучший результат|Доп. подсказки|Координаты|Континент|Знаете ли вы?|Журнал попыток|Собранные улики|Назад к карте|РЕЛЬЕФ|РЕГИОН|КЛИМАТ|ПРОФИЛЬ|РАССТОЯНИЕ|ОБЪЕКТ|Расстояние: {km} км. Новая улика открыта.|ДЕЛО ЗАКРЫТО|ДЕЛО РАСКРЫТО|Попыток не было|Известная достопримечательность здесь — {landmark}.|Открыто|Не разгадано|Разгадано",
    fr:"CARTIGMA / DOSSIER|Voir le dossier|Rapport d'enquête|Mode|Essais|Meilleur essai|Indices supplémentaires|Coordonnées|Continent|Le saviez-vous ?|Journal des essais|Indices recueillis|Retour à la carte|RELIEF|RÉGION|CLIMAT|PROFIL|DISTANCE|SITE|À {km} km. Nouvel indice débloqué.|AFFAIRE CLOSE|AFFAIRE RÉSOLUE|Aucun essai enregistré|Un lieu emblématique est {landmark}.|Ouvert le|Non résolu|Résolu",
    de:"CARTIGMA / AKTE|Fallakte anzeigen|Ermittlungsbericht|Modus|Versuche|Bester Tipp|Extra-Hinweise|Koordinaten|Kontinent|Wusstest du schon?|Tippverlauf|Gesammelte Hinweise|Zurück zur Karte|GELÄNDE|REGION|KLIMA|PROFIL|ENTFERNUNG|WAHRZEICHEN|{km} km entfernt. Neuer Hinweis verfügbar.|FALL GESCHLOSSEN|FALL GELÖST|Keine Versuche|Ein bekanntes Wahrzeichen ist {landmark}.|Geöffnet|Nicht gelöst|Gelöst",
    it:"CARTIGMA / FASCICOLO|Apri fascicolo|Registro delle indagini|Modalità|Tentativi|Tentativo migliore|Indizi extra|Coordinate|Continente|Lo sapevi?|Cronologia tentativi|Prove raccolte|Torna alla mappa|TERRENO|REGIONE|CLIMA|PROFILO|DISTANZA|LUOGO|A {km} km. Nuovo indizio sbloccato.|CASO CHIUSO|CASO RISOLTO|Nessun tentativo|Un luogo famoso qui è {landmark}.|Aperto il|Non risolto|Risolto",
    nl:"CARTIGMA / DOSSIER|Bekijk dossier|Onderzoeksverslag|Modus|Pogingen|Beste gok|Extra hints|Coördinaten|Continent|Wist je dat?|Gokgeschiedenis|Verzamelde aanwijzingen|Terug naar kaart|TERREIN|REGIO|KLIMAAT|PROFIEL|AFSTAND|BEZIENSWAARDIGHEID|{km} km afstand. Nieuwe aanwijzing vrij.|ZAAK GESLOTEN|ZAAK OPGELOST|Geen gokken geregistreerd|Een bekende bezienswaardigheid is {landmark}.|Geopend|Niet opgelost|Opgelost",
    pl:"CARTIGMA / AKTA|Pokaż akta|Raport śledztwa|Tryb|Próby|Najlepsza próba|Dodatkowe wskazówki|Współrzędne|Kontynent|Czy wiesz, że...?|Historia prób|Zebrane dowody|Powrót do mapy|TEREN|REGION|KLIMAT|PROFIL|ODLEGŁOŚĆ|OBIEKT|Odległość: {km} km. Nowa wskazówka.|SPRAWA ZAMKNIĘTA|SPRAWA ROZWIĄZANA|Brak prób|Znany punkt tego miejsca to {landmark}.|Otwarto|Nierozwiązana|Rozwiązana",
    sv:"CARTIGMA / AKT|Visa fallakt|Utredningsrapport|Läge|Gissningar|Bästa gissningen|Extra ledtrådar|Koordinater|Kontinent|Visste du?|Gissningshistorik|Insamlade bevis|Tillbaka till kartan|TERRÄNG|REGION|KLIMAT|PROFIL|AVSTÅND|LANDMÄRKE|{km} km bort. Ny ledtråd öppnad.|FALL AVSLUTAT|FALL LÖST|Inga gissningar|Ett välkänt landmärke är {landmark}.|Öppnat|Olöst|Löst",
    tr:"CARTIGMA / DOSYA|Dosyayı görüntüle|Soruşturma kaydı|Mod|Tahminler|En yakın tahmin|Ek ipuçları|Koordinatlar|Kıta|Biliyor muydunuz?|Tahmin günlüğü|Toplanan kanıtlar|Haritaya dön|ARAZİ|BÖLGE|İKLİM|PROFİL|MESAFE|SİMGE|{km} km uzaklıkta. Yeni ipucu açıldı.|DOSYA KAPANDI|DOSYA ÇÖZÜLDÜ|Tahmin yok|Buradaki ünlü bir simge {landmark}.|Açılış|Çözülmedi|Çözüldü",
    ar:"CARTIGMA / ملف القضية|عرض ملف القضية|سجل التحقيق|الوضع|التخمينات|أقرب تخمين|أدلة إضافية|الإحداثيات|القارة|هل تعلم؟|سجل التخمينات|الأدلة المجمعة|العودة للخريطة|التضاريس|المنطقة|المناخ|الملف|المسافة|معلم|على بعد {km} كم. تم فتح دليل جديد.|أُغلقت القضية|حُلّت القضية|لا تخمينات|من أشهر المعالم هنا {landmark}.|فُتحت|لم تُحل|حُلّت",
    he:"CARTIGMA / תיק חקירה|הצג תיק חקירה|דוח חקירה|מצב|ניחושים|הניחוש הקרוב ביותר|רמזים נוספים|קואורדינטות|יבשת|הידעת?|יומן ניחושים|ראיות שנאספו|חזרה למפה|שטח|אזור|אקלים|פרופיל|מרחק|אתר|מרחק {km} ק״מ. נפתח רמז חדש.|התיק נסגר|התיק נפתר|אין ניחושים|אתר מוכר כאן הוא {landmark}.|נפתח|לא נפתר|נפתר",
    ko:"CARTIGMA / 사건 파일|사건 파일 보기|수사 기록|모드|추측 횟수|가장 가까운 추측|추가 힌트|좌표|대륙|알고 계셨나요?|추측 기록|수집한 단서|지도로 돌아가기|지형|지역|기후|특징|거리|명소|{km}km 떨어짐. 새 단서가 열렸습니다.|사건 종료|사건 해결|추측 기록 없음|이곳의 유명한 명소는 {landmark}입니다.|시작|미해결|해결",
    th:"CARTIGMA / แฟ้มคดี|ดูแฟ้มคดี|บันทึกการสืบสวน|โหมด|จำนวนครั้ง|ครั้งที่ใกล้ที่สุด|คำใบ้เพิ่มเติม|พิกัด|ทวีป|รู้หรือไม่?|ประวัติการทาย|หลักฐานที่รวบรวม|กลับไปแผนที่|ภูมิประเทศ|ภูมิภาค|ภูมิอากาศ|ข้อมูล|ระยะทาง|สถานที่สำคัญ|ห่าง {km} กม. ปลดล็อกเบาะแสใหม่|ปิดคดีแล้ว|ไขคดีแล้ว|ยังไม่มีการทาย|สถานที่สำคัญที่มีชื่อเสียงคือ {landmark}|เริ่มเมื่อ|ยังไม่สำเร็จ|สำเร็จ",
    vi:"CARTIGMA / HỒ SƠ|Xem hồ sơ|Báo cáo điều tra|Chế độ|Lượt đoán|Lần gần nhất|Gợi ý thêm|Tọa độ|Châu lục|Bạn có biết?|Nhật ký dự đoán|Manh mối thu thập|Trở lại bản đồ|ĐỊA HÌNH|KHU VỰC|KHÍ HẬU|HỒ SƠ|KHOẢNG CÁCH|ĐỊA DANH|Cách {km} km. Đã mở manh mối mới.|HỒ SƠ ĐÃ ĐÓNG|ĐÃ GIẢI QUYẾT|Không có dự đoán|Một địa danh nổi tiếng ở đây là {landmark}.|Mở ngày|Chưa giải|Đã giải",
    id:"CARTIGMA / BERKAS KASUS|Lihat berkas|Catatan investigasi|Mode|Tebakan|Tebakan terdekat|Petunjuk tambahan|Koordinat|Benua|Tahukah Anda?|Riwayat tebakan|Bukti terkumpul|Kembali ke peta|MEDAN|WILAYAH|IKLIM|PROFIL|JARAK|LANDMARK|Jarak {km} km. Petunjuk baru terbuka.|KASUS DITUTUP|KASUS TERPECAHKAN|Belum ada tebakan|Landmark terkenal di sini adalah {landmark}.|Dibuka|Belum terpecahkan|Terpecahkan"
  };
  const rules = {
    en:["Wrong guesses reveal distance and another clue. Hard hides direction.","Normal: 6 guesses with direction. Hard: 4 guesses without it."],
    pt:["Após errar, veja a distância e desbloqueie outra pista. No Difícil, a direção fica oculta.","Normal: 6 tentativas com direção. Difícil: 4 sem direção."],
    es:["Cada error revela distancia y otra pista. Difícil oculta la dirección.","Normal: 6 intentos con dirección. Difícil: 4 sin dirección."],
    zh:["猜错后会显示距离和新线索。困难模式不显示方向。","普通：6 次猜测并显示方向。困难：4 次且无方向。"],
    ja:["不正解だと距離と新しいヒントが表示されます。難しいモードでは方角を非表示。","ふつう：方向ありで 6 回。むずかしい：方向なしで 4 回。"],
    ru:["После ошибки открывается расстояние и новая улика. На сложном уровне направление скрыто.","Средний: 6 попыток с направлением. Сложный: 4 без направления."],
    fr:["Après une erreur, obtenez la distance et un indice. En difficile, la direction est masquée.","Normal : 6 essais avec direction. Difficile : 4 sans direction."],
    de:["Nach einem Fehler erhältst du Entfernung und einen Hinweis. Auf Schwer bleibt die Richtung verborgen.","Normal: 6 Versuche mit Richtung. Schwer: 4 ohne Richtung."],
    it:["Dopo un errore ricevi distanza e un indizio. La direzione è nascosta in Difficile.","Normale: 6 tentativi con direzione. Difficile: 4 senza direzione."],
    nl:["Na een fout zie je afstand en een hint. Moeilijk verbergt de richting.","Normaal: 6 gokken met richting. Moeilijk: 4 zonder richting."],
    pl:["Po błędzie zobaczysz dystans i wskazówkę. W trybie trudnym kierunek jest ukryty.","Normalny: 6 prób z kierunkiem. Trudny: 4 bez kierunku."],
    sv:["Efter ett fel får du avstånd och en ledtråd. Svår visar inte riktning.","Normal: 6 gissningar med riktning. Svår: 4 utan riktning."],
    tr:["Yanlış tahmin mesafeyi ve yeni ipucunu gösterir. Zor modda yön gizlidir.","Normal: yön gösterilen 6 tahmin. Zor: yönsüz 4 tahmin."],
    ar:["بعد كل خطأ تظهر المسافة ودليل جديد. الاتجاه مخفي في المستوى الصعب.","عادي: 6 محاولات مع الاتجاه. صعب: 4 محاولات دون اتجاه."],
    he:["לאחר טעות תראה מרחק ורמז חדש. ברמה קשה הכיוון מוסתר.","רגיל: 6 ניחושים עם כיוון. קשה: 4 בלי כיוון."],
    ko:["오답 후 거리와 새 단서가 표시됩니다. 어려움 모드에서는 방향이 숨겨집니다.","보통: 방향 표시, 6회. 어려움: 방향 없음, 4회."],
    th:["ทายผิดจะแสดงระยะทางและเบาะแสใหม่ โหมดยากไม่แสดงทิศทาง","ปกติ: 6 ครั้งพร้อมทิศทาง ยาก: 4 ครั้งโดยไม่มีทิศทาง"],
    vi:["Khi đoán sai, bạn nhận khoảng cách và manh mối. Chế độ Khó ẩn hướng.","Thường: 6 lượt có chỉ hướng. Khó: 4 lượt không có hướng."],
    id:["Tebakan salah menampilkan jarak dan petunjuk baru. Mode Sulit menyembunyikan arah.","Normal: 6 tebakan dengan arah. Sulit: 4 tebakan tanpa arah."]
  };
  const PACKS = {};
  for(const [language,raw] of Object.entries(DATA)){
    const parts=raw.split("|");
    if(parts.length!==KEYS.length)throw Error("Incomplete case-file translation for "+language+": "+parts.length);
    PACKS[language]=Object.fromEntries(KEYS.map((key,i)=>[key,parts[i]]));
    PACKS[language].rule2=rules[language][0];
    PACKS[language].rule4=rules[language][1];
  }
  window.GeoReportI18n=PACKS;
})();