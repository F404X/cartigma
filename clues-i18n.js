/* Translated short geographic clue templates and landscape categories. */
(() => {
  const TEMPLATE_KEYS = ["terrain","continent","zone","capital","closer","distance","nearest","country","hemisphere","yes","no","north","south"];
  const FEATURE_KEYS = ["volcanic","fjord","polar","coast","islands","river","estuary","strait","desert","peninsula","delta","plateau","mountains","plain","valley","bay","forest","harbor"];
  const ZONE_KEYS = ["equatorial","tropical","subtropical","temperate","subpolar","polar"];
  const T = {
    en:"Landscape: {value}|Continent: {value}|Latitude belt: {value}|National capital: {value}|Closer to {a} than {b}|Around {km} km from {city}|Nearest catalog city: {city} ({km} km)|Country / territory: {value}|{value} hemisphere|Yes|No|Northern|Southern",
    pt:"Paisagem: {value}|Continente: {value}|Faixa de latitude: {value}|Capital nacional: {value}|Mais perto de {a} que de {b}|Cerca de {km} km de {city}|Cidade mais próxima do catálogo: {city} ({km} km)|País / território: {value}|Hemisfério {value}|Sim|Não|Norte|Sul",
    es:"Paisaje: {value}|Continente: {value}|Franja de latitud: {value}|Capital nacional: {value}|Más cerca de {a} que de {b}|A unos {km} km de {city}|Ciudad más cercana del catálogo: {city} ({km} km)|País / territorio: {value}|Hemisferio {value}|Sí|No|Norte|Sur",
    zh:"地形特点：{value}|大洲：{value}|纬度带：{value}|国家首都：{value}|离 {a} 比 {b} 更近|距离 {city} 约 {km} 公里|数据库中最近的城市：{city}（{km} 公里）|国家或地区：{value}|{value}半球|是|否|北|南",
    ja:"地形：{value}|大陸：{value}|緯度帯：{value}|首都：{value}|{b} より {a} に近い|{city} から約 {km} km|登録された最寄り都市：{city}（{km} km）|国・地域：{value}|{value}半球|はい|いいえ|北|南",
    ru:"Ландшафт: {value}|Континент: {value}|Широтная зона: {value}|Столица: {value}|Ближе к {a}, чем к {b}|Около {km} км от {city}|Ближайший город в базе: {city} ({km} км)|Страна / территория: {value}|{value} полушарие|Да|Нет|Северное|Южное",
    fr:"Paysage : {value}|Continent : {value}|Zone de latitude : {value}|Capitale nationale : {value}|Plus près de {a} que de {b}|À environ {km} km de {city}|Ville du catalogue la plus proche : {city} ({km} km)|Pays / territoire : {value}|Hémisphère {value}|Oui|Non|Nord|Sud",
    de:"Landschaft: {value}|Kontinent: {value}|Breitenzone: {value}|Hauptstadt: {value}|Näher an {a} als an {b}|Etwa {km} km von {city} entfernt|Nächste Stadt im Katalog: {city} ({km} km)|Land / Gebiet: {value}|{value} Hemisphäre|Ja|Nein|Nördliche|Südliche",
    it:"Paesaggio: {value}|Continente: {value}|Fascia di latitudine: {value}|Capitale nazionale: {value}|Più vicino a {a} che a {b}|A circa {km} km da {city}|Città più vicina nel catalogo: {city} ({km} km)|Paese / territorio: {value}|Emisfero {value}|Sì|No|Nord|Sud",
    nl:"Landschap: {value}|Continent: {value}|Breedtezone: {value}|Hoofdstad: {value}|Dichter bij {a} dan bij {b}|Ongeveer {km} km van {city}|Dichtstbijzijnde catalogusstad: {city} ({km} km)|Land / gebied: {value}|{value} halfrond|Ja|Nee|Noordelijk|Zuidelijk",
    pl:"Krajobraz: {value}|Kontynent: {value}|Strefa szerokości: {value}|Stolica: {value}|Bliżej {a} niż {b}|Około {km} km od {city}|Najbliższe miasto w bazie: {city} ({km} km)|Kraj / terytorium: {value}|Półkula {value}|Tak|Nie|Północna|Południowa",
    sv:"Landskap: {value}|Kontinent: {value}|Breddgradszon: {value}|Huvudstad: {value}|Närmare {a} än {b}|Cirka {km} km från {city}|Närmaste katalogstad: {city} ({km} km)|Land / territorium: {value}|{value} halvklotet|Ja|Nej|Norra|Södra",
    tr:"Arazi: {value}|Kıta: {value}|Enlem kuşağı: {value}|Başkent: {value}|{b} yerine {a} noktasına daha yakın|{city} noktasından yaklaşık {km} km|Katalogdaki en yakın şehir: {city} ({km} km)|Ülke / bölge: {value}|{value} yarımküre|Evet|Hayır|Kuzey|Güney",
    ar:"التضاريس: {value}|القارة: {value}|نطاق دوائر العرض: {value}|عاصمة وطنية: {value}|أقرب إلى {a} من {b}|على بعد نحو {km} كم من {city}|أقرب مدينة في القائمة: {city} ({km} كم)|البلد / الإقليم: {value}|نصف الكرة {value}|نعم|لا|الشمالي|الجنوبي",
    he:"נוף: {value}|יבשת: {value}|אזור רוחב: {value}|עיר בירה: {value}|קרוב יותר אל {a} מאשר אל {b}|כ־{km} ק״מ מ־{city}|העיר הקרובה ברשימה: {city} ({km} ק״מ)|מדינה / טריטוריה: {value}|חצי הכדור {value}|כן|לא|הצפוני|הדרומי",
    ko:"지형: {value}|대륙: {value}|위도대: {value}|수도: {value}|{b}보다 {a}에 더 가까움|{city}에서 약 {km}km|목록에서 가장 가까운 도시: {city} ({km}km)|국가 / 지역: {value}|{value}반구|예|아니요|북|남",
    th:"ภูมิประเทศ: {value}|ทวีป: {value}|เขตละติจูด: {value}|เมืองหลวง: {value}|ใกล้ {a} มากกว่า {b}|ห่างจาก {city} ประมาณ {km} กม.|เมืองในฐานข้อมูลที่ใกล้ที่สุด: {city} ({km} กม.)|ประเทศ / ดินแดน: {value}|ซีกโลก{value}|ใช่|ไม่ใช่|เหนือ|ใต้",
    vi:"Địa hình: {value}|Châu lục: {value}|Vùng vĩ độ: {value}|Thủ đô quốc gia: {value}|Gần {a} hơn {b}|Cách {city} khoảng {km} km|Thành phố gần nhất trong danh sách: {city} ({km} km)|Quốc gia / lãnh thổ: {value}|Bán cầu {value}|Có|Không|Bắc|Nam",
    id:"Bentang alam: {value}|Benua: {value}|Zona lintang: {value}|Ibu kota negara: {value}|Lebih dekat ke {a} daripada {b}|Sekitar {km} km dari {city}|Kota terdekat dalam katalog: {city} ({km} km)|Negara / wilayah: {value}|Belahan bumi {value}|Ya|Tidak|Utara|Selatan"
  };
  const F = {
    en:"Volcanic terrain|Fjords|Polar tundra|Coastal plains|Islands|River valleys|River estuaries|Straits|Dry deserts|Peninsulas|River deltas|High plateaus|Mountain ranges|Wide plains|Mountain valleys|Bays|Tropical forests|Natural harbors",
    pt:"Terreno vulcânico|Fiordes|Tundra polar|Planícies costeiras|Ilhas|Vales fluviais|Estuários|Estreitos|Desertos secos|Penínsulas|Deltas fluviais|Planaltos elevados|Cordilheiras|Planícies amplas|Vales montanhosos|Baías|Florestas tropicais|Portos naturais",
    es:"Terreno volcánico|Fiordos|Tundra polar|Llanuras costeras|Islas|Valles fluviales|Estuarios|Estrechos|Desiertos secos|Penínsulas|Deltas fluviales|Altiplanos|Cordilleras|Grandes llanuras|Valles montañosos|Bahías|Bosques tropicales|Puertos naturales",
    zh:"火山地貌|峡湾|极地苔原|沿海平原|岛屿|河谷|河口湾|海峡|干旱沙漠|半岛|三角洲|高原|山脉|广阔平原|山谷|海湾|热带森林|天然良港",
    ja:"火山地形|フィヨルド|極地ツンドラ|沿岸平野|島々|河谷|河口|海峡|乾燥した砂漠|半島|三角州|高原|山脈|広い平野|山間の谷|湾|熱帯林|天然港",
    ru:"Вулканические земли|Фьорды|Полярная тундра|Прибрежные равнины|Острова|Речные долины|Эстуарии|Проливы|Пустыни|Полуострова|Дельты рек|Высокие плато|Горные хребты|Равнины|Горные долины|Заливы|Тропические леса|Естественные гавани",
    fr:"Relief volcanique|Fjords|Toundra polaire|Plaines côtières|Îles|Vallées fluviales|Estuaires|Détroits|Déserts arides|Péninsules|Deltas|Hauts plateaux|Chaînes de montagnes|Grandes plaines|Vallées montagneuses|Baies|Forêts tropicales|Ports naturels",
    de:"Vulkanlandschaften|Fjorde|Polare Tundra|Küstenebenen|Inseln|Flusstäler|Flussmündungen|Meerengen|Trockene Wüsten|Halbinseln|Flussdeltas|Hochplateaus|Gebirge|Weite Ebenen|Gebirgstäler|Buchten|Tropenwälder|Naturhäfen",
    it:"Terreno vulcanico|Fiordi|Tundra polare|Pianure costiere|Isole|Valli fluviali|Estuari|Stretti|Deserti aridi|Penisole|Delta fluviali|Altopiani|Catene montuose|Grandi pianure|Valli montane|Baie|Foreste tropicali|Porti naturali",
    nl:"Vulkanisch terrein|Fjorden|Pooltoendra|Kustvlakten|Eilanden|Riviervalleien|Estuaria|Zeestraten|Droge woestijnen|Schiereilanden|Rivierdelta's|Hoogvlakten|Bergketens|Vlakten|Bergdalen|Baaien|Tropische bossen|Natuurlijke havens",
    pl:"Teren wulkaniczny|Fiordy|Tundra polarna|Równiny nadmorskie|Wyspy|Doliny rzeczne|Estuaria|Cieśniny|Suche pustynie|Półwyspy|Delty rzek|Wyżyny|Pasma górskie|Równiny|Doliny górskie|Zatoki|Lasy tropikalne|Naturalne porty",
    sv:"Vulkanisk terräng|Fjordar|Polartundra|Kustslätter|Öar|Floddalar|Flodmynningar|Sund|Torra öknar|Halvöar|Floddeltan|Högplatåer|Bergskedjor|Vida slätter|Bergsdalar|Vikar|Tropiska skogar|Naturhamnar",
    tr:"Volkanik arazi|Fiyortlar|Kutup tundrası|Kıyı ovaları|Adalar|Nehir vadileri|Haliçler|Boğazlar|Kurak çöller|Yarımadalar|Nehir deltaları|Yüksek platolar|Dağ sıraları|Geniş ovalar|Dağ vadileri|Koylar|Tropikal ormanlar|Doğal limanlar",
    ar:"تضاريس بركانية|مضائق بحرية عميقة|تندرا قطبية|سهول ساحلية|جزر|أودية أنهار|مصبات أنهار|مضائق|صحارى جافة|أشباه جزر|دلتا أنهار|هضاب مرتفعة|سلاسل جبلية|سهول واسعة|أودية جبلية|خلجان|غابات استوائية|موانئ طبيعية",
    he:"שטח געשי|פיורדים|טונדרה קוטבית|מישורי חוף|איים|עמקי נהרות|שפכי נהרות|מצרים|מדבריות צחיחים|חצאי איים|דלתות נהר|רמות גבוהות|רכסי הרים|מישורים רחבים|עמקי הרים|מפרצים|יערות טרופיים|נמלים טבעיים",
    ko:"화산 지형|피오르|극지 툰드라|해안 평야|섬|하천 계곡|강 하구|해협|건조한 사막|반도|삼각주|고원|산맥|넓은 평야|산골짜기|만|열대우림|천연 항구",
    th:"ภูมิประเทศภูเขาไฟ|ฟยอร์ด|ทุนดราเขตขั้วโลก|ที่ราบชายฝั่ง|หมู่เกาะ|หุบเขาแม่น้ำ|ปากแม่น้ำ|ช่องแคบ|ทะเลทรายแห้งแล้ง|คาบสมุทร|ดินดอนสามเหลี่ยม|ที่ราบสูง|เทือกเขา|ที่ราบกว้าง|หุบเขาภูเขา|อ่าว|ป่าเขตร้อน|ท่าเรือธรรมชาติ",
    vi:"Địa hình núi lửa|Vịnh hẹp|Lãnh nguyên vùng cực|Đồng bằng ven biển|Các đảo|Thung lũng sông|Cửa sông|Eo biển|Sa mạc khô|Bán đảo|Châu thổ|Cao nguyên|Dãy núi|Đồng bằng rộng|Thung lũng núi|Vịnh|Rừng nhiệt đới|Cảng tự nhiên",
    id:"Medan vulkanik|Fyord|Tundra kutub|Dataran pesisir|Kepulauan|Lembah sungai|Muara sungai|Selat|Gurun kering|Semenanjung|Delta sungai|Dataran tinggi|Pegunungan|Dataran luas|Lembah pegunungan|Teluk|Hutan tropis|Pelabuhan alami"
  };
  const Z = {
    en:"Equatorial|Tropical|Subtropical|Temperate|Subpolar|Polar",
    pt:"Equatorial|Tropical|Subtropical|Temperada|Subpolar|Polar",
    es:"Ecuatorial|Tropical|Subtropical|Templada|Subpolar|Polar",
    zh:"赤道|热带|亚热带|温带|亚极地|极地",
    ja:"赤道|熱帯|亜熱帯|温帯|亜寒帯|極地",
    ru:"Экваториальная|Тропическая|Субтропическая|Умеренная|Субполярная|Полярная",
    fr:"Équatoriale|Tropicale|Subtropicale|Tempérée|Subpolaire|Polaire",
    de:"Äquatorial|Tropisch|Subtropisch|Gemäßigt|Subpolar|Polar",
    it:"Equatoriale|Tropicale|Subtropicale|Temperata|Subpolare|Polare",
    nl:"Equatoriaal|Tropisch|Subtropisch|Gematigd|Subpolair|Polair",
    pl:"Równikowa|Tropikalna|Subtropikalna|Umiarkowana|Subpolarna|Polarna",
    sv:"Ekvatoriell|Tropisk|Subtropisk|Tempererad|Subpolär|Polär",
    tr:"Ekvatoral|Tropikal|Subtropikal|Ilıman|Kutup altı|Kutup",
    ar:"استوائي|مداري|شبه مداري|معتدل|شبه قطبي|قطبي",
    he:"משווני|טרופי|סובטרופי|ממוזג|תת־קוטבי|קוטבי",
    ko:"적도|열대|아열대|온대|아극지|극지",
    th:"เส้นศูนย์สูตร|เขตร้อน|กึ่งเขตร้อน|เขตอบอุ่น|กึ่งขั้วโลก|ขั้วโลก",
    vi:"Xích đạo|Nhiệt đới|Cận nhiệt đới|Ôn đới|Cận cực|Cực",
    id:"Khatulistiwa|Tropis|Subtropis|Sedang|Subkutub|Kutub"
  };
  const localeData = {};
  for (const l of Object.keys(T)) {
    const templates = T[l].split("|"), features = F[l].split("|"), zones = Z[l].split("|");
    if (templates.length!==TEMPLATE_KEYS.length || features.length!==FEATURE_KEYS.length || zones.length!==ZONE_KEYS.length)
      throw new Error("Incomplete clue translation: " + l + ": " + [templates.length,features.length,zones.length].join("/"));
    localeData[l] = {
      templates: Object.fromEntries(TEMPLATE_KEYS.map((key,i)=>[key,templates[i]])),
      features: Object.fromEntries(FEATURE_KEYS.map((key,i)=>[key,features[i]])),
      zones: Object.fromEntries(ZONE_KEYS.map((key,i)=>[key,zones[i]]))
    };
  }
  // Place names remain proper nouns; the explanatory clue is translated.
  const landmark = {
    en:"Associated landmark: {name}",
    pt:"Referência conhecida: {name}",
    es:"Lugar emblemático: {name}",
    zh:"当地著名地标：{name}",
    ja:"有名な名所：{name}",
    ru:"Известная достопримечательность: {name}",
    fr:"Lieu emblématique : {name}",
    de:"Bekanntes Wahrzeichen: {name}",
    it:"Luogo simbolo: {name}",
    nl:"Bekend herkenningspunt: {name}",
    pl:"Znany punkt orientacyjny: {name}",
    sv:"Känt landmärke: {name}",
    tr:"Bilinen simge yapı: {name}",
    ar:"معلم شهير: {name}",
    he:"אתר מפורסם: {name}",
    ko:"잘 알려진 명소: {name}",
    th:"สถานที่สำคัญ: {name}",
    vi:"Địa danh nổi tiếng: {name}",
    id:"Landmark terkenal: {name}"
  };
  for(const language of Object.keys(localeData)) {
    if(!landmark[language]) throw Error("Missing landmark translation for "+language);
    localeData[language].templates.landmark=landmark[language];
  }
  // Explicit continent labels: Intl.DisplayNames may return raw UN M49 numbers
  // (e.g. 009) rather than names on some browsers.
  const continentKeys = ["europe","africa","asia","oceania","northAmerica","southAmerica"];
  const continentNames = {
    en:"Europe|Africa|Asia|Oceania|North America|South America",
    pt:"Europa|África|Ásia|Oceania|América do Norte|América do Sul",
    es:"Europa|África|Asia|Oceanía|América del Norte|América del Sur",
    zh:"欧洲|非洲|亚洲|大洋洲|北美洲|南美洲",
    ja:"ヨーロッパ|アフリカ|アジア|オセアニア|北アメリカ|南アメリカ",
    ru:"Европа|Африка|Азия|Океания|Северная Америка|Южная Америка",
    fr:"Europe|Afrique|Asie|Océanie|Amérique du Nord|Amérique du Sud",
    de:"Europa|Afrika|Asien|Ozeanien|Nordamerika|Südamerika",
    it:"Europa|Africa|Asia|Oceania|America settentrionale|America meridionale",
    nl:"Europa|Afrika|Azië|Oceanië|Noord-Amerika|Zuid-Amerika",
    pl:"Europa|Afryka|Azja|Oceania|Ameryka Północna|Ameryka Południowa",
    sv:"Europa|Afrika|Asien|Oceanien|Nordamerika|Sydamerika",
    tr:"Avrupa|Afrika|Asya|Okyanusya|Kuzey Amerika|Güney Amerika",
    ar:"أوروبا|إفريقيا|آسيا|أوقيانوسيا|أمريكا الشمالية|أمريكا الجنوبية",
    he:"אירופה|אפריקה|אסיה|אוקיאניה|צפון אמריקה|דרום אמריקה",
    ko:"유럽|아프리카|아시아|오세아니아|북아메리카|남아메리카",
    th:"ยุโรป|แอฟริกา|เอเชีย|โอเชียเนีย|อเมริกาเหนือ|อเมริกาใต้",
    vi:"Châu Âu|Châu Phi|Châu Á|Châu Đại Dương|Bắc Mỹ|Nam Mỹ",
    id:"Eropa|Afrika|Asia|Oseania|Amerika Utara|Amerika Selatan"
  };
  for (const language of Object.keys(localeData)) {
    const labels = continentNames[language]?.split("|");
    if (!labels || labels.length !== continentKeys.length)
      throw new Error("Incomplete continent translation for " + language);
    localeData[language].continents = Object.fromEntries(continentKeys.map((key,i) => [key,labels[i]]));
  }
  window.GeoCluesI18n = localeData;
})();