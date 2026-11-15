/* Compass labels for all 19 supported interface languages.
   Bearings are clockwise from north. */
(() => {
  const names={
    en:"North|Northeast|East|Southeast|South|Southwest|West|Northwest",
    pt:"Norte|Nordeste|Leste|Sudeste|Sul|Sudoeste|Oeste|Noroeste",
    es:"Norte|Noreste|Este|Sureste|Sur|Suroeste|Oeste|Noroeste",
    zh:"北|东北|东|东南|南|西南|西|西北",
    ja:"北|北東|東|南東|南|南西|西|北西",
    ru:"Север|Северо-восток|Восток|Юго-восток|Юг|Юго-запад|Запад|Северо-запад",
    fr:"Nord|Nord-est|Est|Sud-est|Sud|Sud-ouest|Ouest|Nord-ouest",
    de:"Norden|Nordosten|Osten|Südosten|Süden|Südwesten|Westen|Nordwesten",
    it:"Nord|Nord-est|Est|Sud-est|Sud|Sud-ovest|Ovest|Nord-ovest",
    nl:"Noord|Noordoost|Oost|Zuidoost|Zuid|Zuidwest|West|Noordwest",
    pl:"Północ|Północny wschód|Wschód|Południowy wschód|Południe|Południowy zachód|Zachód|Północny zachód",
    sv:"Norr|Nordost|Öster|Sydost|Söder|Sydväst|Väster|Nordväst",
    tr:"Kuzey|Kuzeydoğu|Doğu|Güneydoğu|Güney|Güneybatı|Batı|Kuzeybatı",
    ar:"شمال|شمال شرق|شرق|جنوب شرق|جنوب|جنوب غرب|غرب|شمال غرب",
    he:"צפון|צפון־מזרח|מזרח|דרום־מזרח|דרום|דרום־מערב|מערב|צפון־מערב",
    ko:"북쪽|북동쪽|동쪽|남동쪽|남쪽|남서쪽|서쪽|북서쪽",
    th:"เหนือ|ตะวันออกเฉียงเหนือ|ตะวันออก|ตะวันออกเฉียงใต้|ใต้|ตะวันตกเฉียงใต้|ตะวันตก|ตะวันตกเฉียงเหนือ",
    vi:"Bắc|Đông Bắc|Đông|Đông Nam|Nam|Tây Nam|Tây|Tây Bắc",
    id:"Utara|Timur Laut|Timur|Tenggara|Selatan|Barat Daya|Barat|Barat Laut"
  };
  // Compass rose order: north, east, south, west.
  const initials={
    en:"N|E|S|W",pt:"N|L|S|O",es:"N|E|S|O",zh:"北|东|南|西",
    ja:"北|東|南|西",ru:"С|В|Ю|З",fr:"N|E|S|O",de:"N|O|S|W",
    it:"N|E|S|O",nl:"N|O|Z|W",pl:"N|W|S|Z",sv:"N|Ö|S|V",
    tr:"K|D|G|B",ar:"ش|ق|ج|غ",he:"צ|מ|ד|ע",ko:"북|동|남|서",
    th:"น|ตอ|ใ|ตต",vi:"B|Đ|N|T",id:"U|T|S|B"
  };
  const rivers={
    en:"Along the {name} River",pt:"Às margens do rio {name}",
    es:"A orillas del río {name}",zh:"位于{name}河畔",ja:"{name}川のほとり",
    ru:"На реке {name}",fr:"Au bord du fleuve {name}",de:"Am Fluss {name}",
    it:"Sulle rive del fiume {name}",nl:"Aan de rivier de {name}",
    pl:"Nad rzeką {name}",sv:"Vid floden {name}",tr:"{name} Nehri kıyısında",
    ar:"على ضفاف نهر {name}",he:"על גדות נהר {name}",ko:"{name} 강변",
    th:"ริมแม่น้ำ {name}",vi:"Bên sông {name}",id:"Di tepi Sungai {name}"
  };
  const vectorLabels={
    en:"Vector",pt:"Vetorial",es:"Vectorial",zh:"矢量",ja:"ベクター",ru:"Векторная",
    fr:"Vectorielle",de:"Vektor",it:"Vettoriale",nl:"Vector",pl:"Wektorowa",
    sv:"Vektor",tr:"Vektör",ar:"متجهة",he:"וקטור",ko:"벡터",th:"เวกเตอร์",
    vi:"Vector",id:"Vektor"
  };
  const mapStyleDescriptions={
    en:"Choose map style",pt:"Escolher mapa",es:"Elegir mapa",zh:"选择地图",
    ja:"地図を選択",ru:"Выбрать карту",fr:"Choisir la carte",de:"Karte auswählen",
    it:"Scegli mappa",nl:"Kies kaart",pl:"Wybierz mapę",sv:"Välj karta",
    tr:"Harita seç",ar:"اختر الخريطة",he:"בחירת מפה",ko:"지도 선택",
    th:"เลือกแผนที่",vi:"Chọn bản đồ",id:"Pilih peta"
  };
  const data={};
  for(const [language,raw] of Object.entries(names)){
    const words=raw.split("|"),rose=initials[language]?.split("|");
    if(words.length!==8||rose?.length!==4)throw Error("Invalid compass translation: "+language);
    data[language]={names:words,rose,river:rivers[language],vector:vectorLabels[language],mapStyle:mapStyleDescriptions[language]};
  }
  window.GeoCompassI18n=data;
})();