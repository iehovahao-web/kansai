(() => {
  'use strict';

  const root = document.getElementById('seasonal-guides');
  const select = document.getElementById('language-select');
  if (!root || !select) return;

  const FIREWORKS_URL = 'https://hanabi.walkerplus.com/list/ar0700/';
  const JNTO_LOCALES = Object.freeze({ zh: 'tw', en: 'en', ko: 'ko', es: 'es', de: 'de', fr: 'fr', it: 'it', ar: 'ar', th: 'th' });
  const localeTags = Object.freeze({ zh: 'zh-Hant', zhHans: 'zh-Hans', en: 'en', ja: 'ja', ko: 'ko', es: 'es', de: 'de', fr: 'fr', it: 'it', ar: 'ar', th: 'th' });

  const copy = Object.freeze({
    zh: {
      kicker: '關西四季導覽', title: '關西旬時手帖', intro: '跟著花期、葉色與夜空安排旅程', nav: '關西季節資訊',
      sakura: ['櫻花前線 · 春季', '關西櫻花前線', '查看開花預報'],
      autumn: ['紅葉前線 · 秋季', '關西紅葉前線', '查看最佳觀賞期'],
      fireworks: ['花火日曆 · 夜空', '關西大型花火大會', '查看日文花火資訊']
    },
    zhHans: {
      kicker: '关西四季导览', title: '关西时令手帖', intro: '跟随花期、叶色与夜空安排旅程', nav: '关西季节信息',
      sakura: ['樱花前线 · 春季', '关西樱花前线', '查看赏樱信息'],
      autumn: ['红叶前线 · 秋季', '关西红叶前线', '查看最佳观赏期'],
      fireworks: ['花火日历 · 夜空', '关西大型花火大会', '查看日文花火信息']
    },
    en: {
      kicker: 'KANSAI SEASONAL GUIDE', title: 'Kansai by Season', intro: 'Plan around blossoms, autumn color and the night sky', nav: 'Kansai seasonal information',
      sakura: ['SAKURA FORECAST · SPRING', 'Kansai Cherry Blossoms', 'View the bloom forecast'],
      autumn: ['FOLIAGE FORECAST · AUTUMN', 'Kansai Autumn Colors', 'View the color forecast'],
      fireworks: ['FIREWORKS CALENDAR · NIGHT', 'Kansai Fireworks Festivals', 'View the Japanese calendar']
    },
    ja: {
      kicker: '関西 季節の案内', title: '関西・旬の手帖', intro: '花の便り、紅葉、夜空に合わせて旅を計画', nav: '関西の季節情報',
      sakura: ['桜前線 · 春', '関西の桜前線', '開花予想を見る'],
      autumn: ['紅葉前線 · 秋', '関西の紅葉前線', '見頃予想を見る'],
      fireworks: ['花火暦 · 夜空', '関西の花火大会', '開催情報を見る']
    },
    ko: {
      kicker: '간사이 계절 가이드', title: '간사이 제철 여행 수첩', intro: '벚꽃, 단풍, 밤하늘에 맞춰 여행을 계획하세요', nav: '간사이 계절 정보',
      sakura: ['벚꽃 예보 · 봄', '간사이 벚꽃 예보', '개화 예보 보기'],
      autumn: ['단풍 예보 · 가을', '간사이 단풍 예보', '절정 시기 보기'],
      fireworks: ['불꽃놀이 일정 · 밤하늘', '간사이 대형 불꽃축제', '일본어 일정 보기']
    },
    es: {
      kicker: 'GUÍA ESTACIONAL DE KANSAI', title: 'Kansai en cada estación', intro: 'Organiza el viaje según los cerezos, el follaje y el cielo nocturno', nav: 'Información estacional de Kansai',
      sakura: ['PRONÓSTICO SAKURA · PRIMAVERA', 'Cerezos de Kansai', 'Ver el pronóstico de floración'],
      autumn: ['HOJAS DE OTOÑO · OTOÑO', 'Colores de otoño en Kansai', 'Ver el pronóstico del color'],
      fireworks: ['CALENDARIO DE FUEGOS · NOCHE', 'Grandes fuegos de Kansai', 'Ver el calendario en japonés']
    },
    de: {
      kicker: 'SAISONFÜHRER KANSAI', title: 'Kansai im Jahreslauf', intro: 'Reisen nach Kirschblüte, Herbstlaub und Nachthimmel planen', nav: 'Saisoninformationen für Kansai',
      sakura: ['KIRSCHBLÜTE · FRÜHLING', 'Kirschblüte in Kansai', 'Blütenprognose ansehen'],
      autumn: ['HERBSTLAUB · HERBST', 'Herbstfarben in Kansai', 'Laubprognose ansehen'],
      fireworks: ['FEUERWERKSKALENDER · NACHT', 'Feuerwerke in Kansai', 'Japanischen Kalender öffnen']
    },
    fr: {
      kicker: 'GUIDE SAISONNIER DU KANSAI', title: 'Le Kansai au fil des saisons', intro: 'Planifiez votre voyage selon les fleurs, les feuillages et le ciel nocturne', nav: 'Informations saisonnières du Kansai',
      sakura: ['PRÉVISION DES SAKURA · PRINTEMPS', 'Cerisiers du Kansai', 'Voir les prévisions de floraison'],
      autumn: ['FEUILLAGES · AUTOMNE', 'Couleurs d’automne du Kansai', 'Voir les prévisions'],
      fireworks: ['CALENDRIER DES FEUX · NUIT', 'Grands feux d’artifice du Kansai', 'Voir le calendrier en japonais']
    },
    it: {
      kicker: 'GUIDA STAGIONALE DEL KANSAI', title: 'Kansai, stagione per stagione', intro: 'Pianifica il viaggio tra fioriture, foliage e cieli notturni', nav: 'Informazioni stagionali sul Kansai',
      sakura: ['PREVISIONE SAKURA · PRIMAVERA', 'Ciliegi nel Kansai', 'Vedi la previsione della fioritura'],
      autumn: ['FOGLIE D’AUTUNNO · AUTUNNO', 'Colori d’autunno nel Kansai', 'Vedi la previsione'],
      fireworks: ['CALENDARIO FUOCHI · NOTTE', 'Grandi fuochi del Kansai', 'Vedi il calendario in giapponese']
    },
    ar: {
      kicker: 'دليل كانساي الموسمي', title: 'كانساي عبر الفصول', intro: 'خطط لرحلتك وفق تفتح الأزهار وألوان الخريف وسماء الليل', nav: 'معلومات كانساي الموسمية',
      sakura: ['توقعات الساكورا · الربيع', 'ساكورا كانساي', 'عرض توقعات التفتح'],
      autumn: ['توقعات أوراق الخريف · الخريف', 'ألوان الخريف في كانساي', 'عرض توقعات الألوان'],
      fireworks: ['تقويم الألعاب النارية · الليل', 'مهرجانات الألعاب النارية في كانساي', 'عرض التقويم باللغة اليابانية']
    },
    th: {
      kicker: 'คู่มือฤดูกาลคันไซ', title: 'คันไซตามฤดูกาล', intro: 'วางแผนการเดินทางตามช่วงซากุระ ใบไม้เปลี่ยนสี และท้องฟ้ายามค่ำคืน', nav: 'ข้อมูลฤดูกาลของคันไซ',
      sakura: ['พยากรณ์ซากุระ · ฤดูใบไม้ผลิ', 'ซากุระในคันไซ', 'ดูพยากรณ์วันบาน'],
      autumn: ['พยากรณ์ใบไม้เปลี่ยนสี · ฤดูใบไม้ร่วง', 'ใบไม้เปลี่ยนสีในคันไซ', 'ดูพยากรณ์ช่วงสวยที่สุด'],
      fireworks: ['ปฏิทินดอกไม้ไฟ · กลางคืน', 'เทศกาลดอกไม้ไฟใหญ่ในคันไซ', 'ดูปฏิทินภาษาญี่ปุ่น']
    }
  });

  const links = Object.freeze({
    ja: Object.freeze({ sakura: 'https://tenki.jp/sakura/6/', autumn: 'https://tenki.jp/kouyou/6/', fireworks: FIREWORKS_URL }),
    zhHans: Object.freeze({ sakura: 'https://www.japan-travel.cn/things-to-do/nature/cherry-blossoms/', autumn: 'https://www.japan-travel.cn/things-to-do/nature/autumn-leaves/', fireworks: FIREWORKS_URL })
  });

  const normalize = language => {
    const value = String(language || '').trim().toLowerCase();
    if (value === 'zh-cn' || value === 'zh-hans' || value.startsWith('zh-hans-')) return 'zhHans';
    if (value === 'zh' || value.startsWith('zh-hant') || value === 'zh-tw' || value === 'zh-hk') return 'zh';
    const short = value.split('-')[0];
    return copy[short] ? short : 'zh';
  };

  const localizedLinks = language => {
    if (links[language]) return links[language];
    const jnto = JNTO_LOCALES[language] || 'en';
    const base = `https://www.japan.travel/${jnto}/see-and-do/`;
    return Object.freeze({
      sakura: `${base}cherry-blossom-forecast/`,
      autumn: `${base}autumn-leaves-forecast/`,
      fireworks: FIREWORKS_URL
    });
  };

  const text = (selector, value, language) => {
    const node = root.querySelector(selector);
    if (!node) return;
    node.textContent = value;
    node.lang = localeTags[language] || language;
  };

  function apply(language) {
    const key = normalize(language);
    const strings = copy[key];
    const urls = localizedLinks(key);
    root.dataset.guideLanguage = key === 'zhHans' ? 'zh-Hans' : key;
    text('[data-seasonal-i18n="kicker"]', strings.kicker, key);
    text('[data-seasonal-i18n="title"]', strings.title, key);
    text('[data-seasonal-i18n="intro"]', strings.intro, key);
    const nav = root.querySelector('.seasonal-guide-links');
    nav?.setAttribute('aria-label', strings.nav);
    ['sakura', 'autumn', 'fireworks'].forEach(kind => {
      const card = root.querySelector(`[data-seasonal-guide="${kind}"]`);
      if (!card) return;
      const [eyebrow, title, detail] = strings[kind];
      card.href = urls[kind];
      card.hreflang = kind === 'fireworks' ? 'ja' : (localeTags[key] || key);
      card.setAttribute('aria-label', `${title} — ${detail}`);
      const cardCopy = card.querySelector('.seasonal-guide-copy');
      const small = cardCopy?.querySelector('small');
      const strong = cardCopy?.querySelector('strong');
      const sub = cardCopy?.querySelector('b');
      if (small) small.textContent = eyebrow;
      if (strong) strong.textContent = title;
      if (sub) sub.textContent = detail;
      [small, strong, sub].forEach(node => { if (node) node.lang = localeTags[key] || key; });
    });
  }

  document.addEventListener('guide-language-change', event => apply(event.detail));
  apply(select.value || document.documentElement.lang);
})();
