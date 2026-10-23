(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.KansaiJapanHolidays = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  'use strict';

  const DAY_MS = 86400000;
  const OFFICIAL_NAME_TO_ID = Object.freeze({
    '元日': 'newyear',
    '成人の日': 'comingage',
    '建国記念の日': 'foundation',
    '天皇誕生日': 'emperor',
    '春分の日': 'vernal',
    '昭和の日': 'showa',
    '憲法記念日': 'constitution',
    'みどりの日': 'greenery',
    'こどもの日': 'children',
    '海の日': 'marine',
    '山の日': 'mountain',
    '敬老の日': 'respect',
    '秋分の日': 'autumnal',
    'スポーツの日': 'sports',
    '文化の日': 'culture',
    '勤労感謝の日': 'labor'
  });
  const OFFICIAL_ID_TO_NAME = Object.freeze(Object.fromEntries(
    Object.entries(OFFICIAL_NAME_TO_ID).map(([name, id]) => [id, name])
  ));
  const EXPECTED_NATIONAL_IDS = Object.freeze(Object.values(OFFICIAL_NAME_TO_ID));

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function dateKey(year, month, day) {
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  function partsFromKey(key) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
    if (!match) throw new TypeError(`Invalid holiday date: ${key}`);
    return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  }

  function addDays(key, amount) {
    const { year, month, day } = partsFromKey(key);
    const date = new Date(Date.UTC(year, month - 1, day) + amount * DAY_MS);
    return dateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  }

  function weekday(key) {
    const { year, month, day } = partsFromKey(key);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  }

  function nthWeekday(year, month, targetWeekday, ordinal) {
    const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    return 1 + ((targetWeekday - firstWeekday + 7) % 7) + (ordinal - 1) * 7;
  }

  // The equinox dates are formally announced every February. These formulae are
  // only a future fallback until the Cabinet Office CSV contains that year.
  function vernalEquinoxDay(year) {
    const constant = year <= 2099 ? 20.8431 : 21.8510;
    return Math.floor(constant + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  }

  function autumnalEquinoxDay(year) {
    const constant = year <= 2099 ? 23.2488 : 24.2488;
    return Math.floor(constant + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
  }

  function nationalRecord(key, id) {
    return Object.freeze({
      date: key,
      nameJa: OFFICIAL_ID_TO_NAME[id],
      id,
      kind: 'national-holiday',
      legalBasis: '国民の祝日に関する法律第2条',
      source: 'calculated-fallback'
    });
  }

  function statutoryRecord(key, id) {
    const paragraph = id === 'substitute' ? '第3条第2項' : '第3条第3項';
    return Object.freeze({
      date: key,
      nameJa: '休日',
      id,
      kind: 'statutory-day-off',
      legalBasis: `国民の祝日に関する法律${paragraph}`,
      source: 'calculated-fallback'
    });
  }

  function buildFallbackYear(year) {
    if (!Number.isInteger(year) || year < 2022 || year > 2150) return new Map();
    const national = new Map();
    const add = (month, day, id) => {
      const key = dateKey(year, month, day);
      national.set(key, nationalRecord(key, id));
    };

    add(1, 1, 'newyear');
    add(1, nthWeekday(year, 1, 1, 2), 'comingage');
    add(2, 11, 'foundation');
    add(2, 23, 'emperor');
    add(3, vernalEquinoxDay(year), 'vernal');
    add(4, 29, 'showa');
    add(5, 3, 'constitution');
    add(5, 4, 'greenery');
    add(5, 5, 'children');
    add(7, nthWeekday(year, 7, 1, 3), 'marine');
    add(8, 11, 'mountain');
    add(9, nthWeekday(year, 9, 1, 3), 'respect');
    add(9, autumnalEquinoxDay(year), 'autumnal');
    add(10, nthWeekday(year, 10, 1, 2), 'sports');
    add(11, 3, 'culture');
    add(11, 23, 'labor');

    const statutory = new Map();
    for (const [key] of national) {
      if (weekday(key) !== 0) continue;
      let candidate = addDays(key, 1);
      while (national.has(candidate)) candidate = addDays(candidate, 1);
      statutory.set(candidate, statutoryRecord(candidate, 'substitute'));
    }

    const first = Date.UTC(year, 0, 2);
    const last = Date.UTC(year, 11, 30);
    for (let time = first; time <= last; time += DAY_MS) {
      const date = new Date(time);
      const key = dateKey(year, date.getUTCMonth() + 1, date.getUTCDate());
      if (national.has(key) || statutory.has(key)) continue;
      if (national.has(addDays(key, -1)) && national.has(addDays(key, 1))) {
        statutory.set(key, statutoryRecord(key, 'citizens'));
      }
    }

    return new Map([...national, ...statutory].sort(([left], [right]) => left.localeCompare(right)));
  }

  function createOfficialCalendar(data) {
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.holidays)) {
      throw new TypeError('Unsupported official holiday data schema');
    }
    const years = new Set((data.coverage?.years || []).map(Number));
    const entries = new Map();
    for (const raw of data.holidays) {
      const parts = partsFromKey(raw.date);
      if (!years.has(parts.year)) throw new TypeError(`Holiday outside declared coverage: ${raw.date}`);
      if (!OFFICIAL_ID_TO_NAME[raw.id] && !['substitute', 'citizens'].includes(raw.id)) {
        throw new TypeError(`Unknown holiday id: ${raw.id}`);
      }
      if (!['national-holiday', 'statutory-day-off'].includes(raw.kind)) {
        throw new TypeError(`Unknown holiday kind: ${raw.kind}`);
      }
      if (entries.has(raw.date)) throw new TypeError(`Duplicate official holiday date: ${raw.date}`);
      entries.set(raw.date, Object.freeze({ ...raw, source: 'cabinet-office-csv' }));
    }
    return Object.freeze({ years, entries, metadata: Object.freeze({ ...data }) });
  }

  function resolve(parts, officialCalendar = null) {
    const key = dateKey(parts.year, parts.month, parts.day);
    if (officialCalendar?.years?.has(parts.year)) return officialCalendar.entries.get(key) || null;
    return buildFallbackYear(parts.year).get(key) || null;
  }

  return Object.freeze({
    OFFICIAL_NAME_TO_ID,
    EXPECTED_NATIONAL_IDS,
    dateKey,
    partsFromKey,
    nthWeekday,
    vernalEquinoxDay,
    autumnalEquinoxDay,
    buildFallbackYear,
    createOfficialCalendar,
    resolve
  });
});
