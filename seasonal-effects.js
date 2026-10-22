(() => {
  'use strict';

  const TIME_ZONE = 'Asia/Tokyo';
  const ASSET_ROOT = 'assets/seasonal/';
  const LEAF_ASSETS = [
    'openclipart-autumn-leaf-1.png',
    'openclipart-autumn-leaf-2.png',
    'openclipart-autumn-leaf-3.png',
    'openclipart-autumn-leaf-4.png',
    'openclipart-autumn-leaf-5.png',
    'openclipart-autumn-leaf-6.png'
  ];
  const SETTLED_LEAF_ASSETS = [...LEAF_ASSETS, 'thanksgiving-oak-leaf.svg', 'openclipart-oak-leaf.svg'];
  const LABELS = {
    halloween: {
      title: 'HALLOWEEN', ja: 'ハロウィン', zh: '萬聖夜',
      en: 'A playful night of ghosts, lanterns, and mischief.',
      hintJa: 'おばけと灯りが踊る、いたずらいっぱいの夜。',
      hintZh: '精靈、燈火與惡作劇共舞的夜晚。',
      when: 'OCTOBER 31 · 10月31日'
    },
    thanksgiving: {
      title: 'Thanksgiving', ja: '感謝祭（アメリカ）', zh: '感恩節（美國）',
      en: 'A day to share gratitude, harvest, and time together.',
      hintJa: '実りと感謝を分かち合う日。',
      hintZh: '分享豐收、團聚與感恩的一天。',
      when: 'FOURTH THURSDAY OF NOVEMBER · 11月第4木曜日'
    },
    christmas: {
      title: 'Christmas', ja: 'クリスマス', zh: '聖誕節',
      en: 'May light and joy fill the season.',
      hintJa: '光と喜びに包まれる季節。',
      hintZh: '願這個季節充滿光與喜悅。',
      when: 'DECEMBER 25 · 12月25日'
    }
  };
  const LIGHT_LABELS = {
    zh: ['开启万圣节标题彩灯', '关闭万圣节标题彩灯'],
    'zh-hant': ['開啟萬聖節標題彩燈', '關閉萬聖節標題彩燈'],
    ja: ['ハロウィン見出しのライトを点ける', 'ハロウィン見出しのライトを消す'],
    en: ['Turn on the Halloween title lights', 'Turn off the Halloween title lights']
  };

  const assetUrl = file => `${ASSET_ROOT}${file}`;
  const image = (className, file) => {
    const node = document.createElement('img');
    node.className = `seasonal-image ${className}`;
    node.src = assetUrl(file);
    node.alt = '';
    node.draggable = false;
    node.setAttribute('data-seasonal-asset', file);
    return node;
  };
  const accent = className => {
    const node = document.createElement('span');
    node.className = `seasonal-accent ${className}`;
    return node;
  };
  const random = (minimum, maximum) => minimum + Math.random() * (maximum - minimum);

  function osakaDateParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(date);
    const number = type => Number(parts.find(part => part.type === type)?.value);
    return { year: number('year'), month: number('month'), day: number('day') };
  }

  function daysFrom(parts, target) {
    return Math.round((Date.UTC(parts.year, parts.month - 1, parts.day) - Date.UTC(target.year, target.month - 1, target.day)) / 86400000);
  }

  function fourthThursday(year) {
    const first = new Date(Date.UTC(year, 10, 1));
    return { year, month: 11, day: 1 + ((4 - first.getUTCDay() + 7) % 7) + 21 };
  }

  function automaticTheme(parts) {
    if (parts.month === 10 && parts.day >= 20 && parts.day <= 31) return 'halloween';
    const distance = daysFrom(parts, fourthThursday(parts.year));
    if (distance >= -2 && distance <= 3) return 'thanksgiving';
    if (parts.month === 12 && parts.day >= 15 && parts.day <= 28) return 'christmas';
    return null;
  }

  function localPreviewTheme() {
    const local = location.protocol === 'file:' || !location.hostname || ['localhost', '127.0.0.1', '::1', '[::1]'].includes(location.hostname);
    if (!local) return null;
    const value = new URLSearchParams(location.search).get('season');
    return ['halloween', 'thanksgiving', 'christmas', 'off', 'none'].includes(value) ? (value === 'none' ? 'off' : value) : null;
  }

  function currentTheme() {
    const preview = localPreviewTheme();
    if (preview === 'off') return null;
    return preview || automaticTheme(osakaDateParts());
  }

  function compactMode() {
    return matchMedia('(max-width: 680px)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData === true;
  }

  function updateLightLabel(button) {
    if (!button) return;
    const language = (document.documentElement.lang || 'en').toLowerCase();
    const labels = LIGHT_LABELS[language] || LIGHT_LABELS[language.split('-')[0]] || LIGHT_LABELS.en;
    button.setAttribute('aria-label', labels[button.getAttribute('aria-pressed') === 'true' ? 1 : 0]);
  }

  function addCaption(theme) {
    const copy = LABELS[theme];
    const caption = document.createElement('aside');
    caption.className = `seasonal-holiday-note seasonal-caption-${theme}`;
    caption.setAttribute('role', 'note');

    const date = document.createElement('span');
    date.className = 'seasonal-label-date';
    date.textContent = copy.when;
    caption.append(date);

    const title = document.createElement('strong');
    if (theme === 'halloween') {
      title.className = 'seasonal-halloween-title';
      [...copy.title].forEach((character, index) => {
        const letter = document.createElement('span');
        letter.textContent = character;
        letter.style.setProperty('--letter-delay', `${(index * .11).toFixed(2)}s`);
        letter.style.setProperty('--letter-color', ['#ff784f', '#ffd15c', '#9be36a', '#65ccff', '#bd8cff'][index % 5]);
        title.append(letter);
      });
      const lightSwitch = document.createElement('button');
      lightSwitch.type = 'button';
      lightSwitch.className = 'seasonal-halloween-light-switch';
      lightSwitch.innerHTML = '<span aria-hidden="true">🕷</span>';
      lightSwitch.setAttribute('aria-pressed', 'false');
      lightSwitch.addEventListener('click', () => {
        const lit = !title.classList.contains('is-lit');
        title.classList.toggle('is-lit', lit);
        lightSwitch.classList.toggle('is-lit', lit);
        lightSwitch.setAttribute('aria-pressed', String(lit));
        updateLightLabel(lightSwitch);
      });
      caption.append(lightSwitch);
      updateLightLabel(lightSwitch);
    } else {
      title.textContent = copy.title;
    }

    if (theme === 'christmas') {
      const garland = image('seasonal-caption-christmas-lights', 'openclipart-christmas-garland.svg');
      const bulbs = document.createElement('span');
      bulbs.className = 'seasonal-caption-bulbs';
      for (let index = 0; index < 9; index += 1) bulbs.append(document.createElement('i'));
      const holly = image('seasonal-caption-mistletoe', 'openclipart-holly.svg');
      const bow = image('seasonal-caption-bow', 'openclipart-bow.svg');
      const caneLeft = image('seasonal-caption-candy-cane', 'openclipart-candy-cane.svg');
      const caneRight = image('seasonal-caption-candy-cane is-right', 'openclipart-candy-cane.svg');
      caption.append(garland, bulbs, holly, bow, caneLeft, caneRight);
    }

    const names = document.createElement('span');
    names.className = 'seasonal-label-names';
    const ja = document.createElement('i');
    ja.lang = 'ja';
    ja.textContent = copy.ja;
    const zh = document.createElement('i');
    zh.lang = 'zh-Hant';
    zh.textContent = copy.zh;
    names.append(ja, zh);

    const en = document.createElement('span');
    en.className = 'seasonal-label-hint';
    en.lang = 'en';
    en.textContent = copy.en;
    const hintJa = document.createElement('span');
    hintJa.className = 'seasonal-label-hint seasonal-label-hint-secondary';
    hintJa.lang = 'ja';
    hintJa.textContent = copy.hintJa;
    const hintZh = document.createElement('span');
    hintZh.className = 'seasonal-label-hint seasonal-label-hint-secondary';
    hintZh.lang = 'zh-Hant';
    hintZh.textContent = copy.hintZh;
    caption.append(title, names, en, hintJa, hintZh);
    document.body.append(caption);
  }

  function addBats(layer, compact) {
    const count = compact ? 12 : 24;
    for (let index = 0; index < count; index += 1) {
      const bat = document.createElement('i');
      bat.className = 'seasonal-bat';
      const direction = index % 2 ? -1 : 1;
      const duration = 24 + (index % 5) * 2.4;
      bat.style.setProperty('--x', direction > 0 ? '-8vw' : '108vw');
      bat.style.setProperty('--y', `${5 + ((index * 19) % 82)}vh`);
      bat.style.setProperty('--delay', `${-((index * 2.37) % 21).toFixed(2)}s`);
      bat.style.setProperty('--duration', `${duration}s`);
      bat.style.setProperty('--travel-half', `${direction * 58}vw`);
      bat.style.setProperty('--travel', `${direction * 116}vw`);
      bat.style.setProperty('--face-forward', direction > 0 ? '-1' : '1');
      bat.style.setProperty('--face-return', direction > 0 ? '1' : '-1');
      bat.style.setProperty('--scale', (0.55 + (index % 7) * .16).toFixed(2));
      bat.style.setProperty('--bat-opacity', (0.55 + (index % 3) * .085).toFixed(2));
      layer.append(bat);
    }
  }

  function addHalloween(layer, compact) {
    addBats(layer, compact);
    ['seasonal-halloween-haze', 'seasonal-web-left', 'seasonal-web-right'].forEach(name => layer.append(accent(name)));

    const spiders = accent('seasonal-spiders');
    for (let index = 0; index < 2; index += 1) {
      const line = document.createElement('i');
      line.className = 'seasonal-spider-line';
      line.append(image('', 'spider@16x.png'));
      spiders.append(line);
    }
    layer.append(spiders);

    const ghosts = accent('seasonal-ghost-pack');
    for (let index = 0; index < (compact ? 2 : 3); index += 1) ghosts.append(image('seasonal-ghost-image', 'ghost@16x.png'));
    layer.append(ghosts);

    const parade = accent('seasonal-monster-parade');
    [
      ['seasonal-zombie', 'openclipart-halloween-zombie.svg'],
      ['seasonal-mummy', 'openclipart_mummy.svg'],
      ['seasonal-vampire', 'openclipart-halloween-vampire.svg'],
      ['seasonal-skeleton', 'openclipart-halloween-skeleton.svg'],
      ['seasonal-monster', 'openclipart-halloween-frankenstein.svg'],
      ['seasonal-werewolf', 'openclipart-halloween-werewolf.svg']
    ].forEach(([className, file]) => parade.append(image(className, file)));
    layer.append(parade);

    const pumpkins = accent('seasonal-pumpkin-corners');
    pumpkins.append(image('', 'jack-o-lantern@16x.png'), image('', 'jack-o-lantern@16x.png'));
    layer.append(pumpkins);
  }

  function makeSettledLeaf(file, index, compact) {
    const leaf = image('seasonal-settled-leaf', file);
    leaf.style.setProperty('--settle-x', `${5 + Math.random() * 90}vw`);
    leaf.style.setProperty('--settle-y', `${Math.round(Math.pow(Math.random(), 1.7) * (compact ? 54 : 82))}px`);
    leaf.style.setProperty('--settle-slide', `${Math.round(Math.random() * 56 - 28)}px`);
    leaf.style.setProperty('--settle-angle', `${Math.round(Math.random() * 120 - 60)}deg`);
    const scale = (compact ? .7 : .78) + Math.random() * .48;
    leaf.style.setProperty('--settle-scale', scale.toFixed(2));
    leaf.style.setProperty('--settle-scale-entry', (scale * .82).toFixed(2));
    leaf.style.setProperty('--settle-delay', `${(index * .13).toFixed(2)}s`);
    return leaf;
  }

  function addThanksgiving(layer, compact) {
    const count = compact ? 10 : 20;
    const fallingLeaves = [];
    for (let index = 0; index < count; index += 1) {
      const file = LEAF_ASSETS[Math.floor(Math.random() * LEAF_ASSETS.length)];
      const leaf = image('seasonal-leaf', file);
      const direction = Math.random() < .5 ? -1 : 1;
      const duration = random(14.5, 27);
      const reach = random(18, compact ? 34 : 66);
      const firstRotation = random(-18, 18);
      const spinStep = random(10, 22) * (Math.random() < .5 ? -1 : 1);
      leaf.style.setProperty('--x', `${random(compact ? 12 : 7, compact ? 88 : 93)}vw`);
      leaf.style.setProperty('--duration', `${duration.toFixed(2)}s`);
      leaf.style.setProperty('--delay', `${-random(0, duration).toFixed(2)}s`);
      leaf.style.setProperty('--scale', random(.84, 1.18).toFixed(2));
      leaf.style.setProperty('--leaf-opacity', random(.65, .9).toFixed(2));
      leaf.style.setProperty('--leaf-drift-a', `${direction * reach}px`);
      leaf.style.setProperty('--leaf-drift-b', `${direction * -random(reach * .35, reach * .92)}px`);
      leaf.style.setProperty('--leaf-drift-c', `${direction * random(reach * .55, reach * 1.38)}px`);
      leaf.style.setProperty('--leaf-drift-d', `${direction * -random(reach * .18, reach * .76)}px`);
      leaf.style.setProperty('--leaf-rotation-0', `${firstRotation}deg`);
      leaf.style.setProperty('--leaf-rotation-1', `${firstRotation + spinStep}deg`);
      leaf.style.setProperty('--leaf-rotation-2', `${firstRotation - spinStep * .65}deg`);
      leaf.style.setProperty('--leaf-rotation-3', `${firstRotation + spinStep * .8}deg`);
      leaf.style.setProperty('--leaf-rotation-4', `${firstRotation - spinStep * .45}deg`);
      leaf.style.setProperty('--leaf-rotation-5', `${firstRotation + spinStep * .25}deg`);
      fallingLeaves.push(leaf);
      layer.append(leaf);
    }

    const tray = document.createElement('span');
    tray.className = 'seasonal-settled-leaves';
    const seedCount = compact ? 22 : 38;
    for (let index = 0; index < seedCount; index += 1) tray.append(makeSettledLeaf(SETTLED_LEAF_ASSETS[index % SETTLED_LEAF_ASSETS.length], index, compact));
    fallingLeaves.forEach((leaf, index) => leaf.addEventListener('animationiteration', () => {
      const current = tray.querySelectorAll('.seasonal-settled-leaf');
      [...current].slice(0, Math.max(0, current.length - (compact ? 58 : 118))).forEach(node => node.remove());
      tray.append(makeSettledLeaf(leaf.dataset.seasonalAsset, 0, compact));
      tray.append(makeSettledLeaf(leaf.dataset.seasonalAsset, 0, compact));
    }));
    layer.append(tray);

    const footer = document.createElement('div');
    footer.className = 'seasonal-thanksgiving-footer-decor';
    footer.setAttribute('aria-hidden', 'true');
    const left = document.createElement('span');
    left.className = 'seasonal-thanksgiving-footer-cluster is-left';
    left.append(image('seasonal-turkey-image', 'openclipart-turkey.webp'));
    left.append(image('seasonal-harvest-pumpkin-image', 'openclipart-pumpkin.svg'));
    left.append(image('seasonal-harvest-pumpkin-image', 'openclipart-pumpkin.svg'));
    const right = document.createElement('span');
    right.className = 'seasonal-thanksgiving-footer-cluster is-right';
    right.append(image('seasonal-harvest-pumpkin-image', 'openclipart-pumpkin.svg'));
    right.append(image('seasonal-harvest-pumpkin-image', 'openclipart-pumpkin.svg'));
    right.append(image('seasonal-harvest-pumpkin-image', 'openclipart-pumpkin.svg'));
    footer.append(left, right);
    document.body.append(footer);
  }

  function addChristmas(layer, compact) {
    const snowCount = compact ? 36 : 96;
    for (let index = 0; index < snowCount; index += 1) {
      const snow = image('seasonal-particle seasonal-snow', 'openclipart-snowflake.svg');
      const direction = index % 2 ? -1 : 1;
      snow.style.setProperty('--x', `${3 + ((index * 37 + 11) % 94)}vw`);
      snow.style.setProperty('--start-y', `${5 + ((index * 19) % 82)}vh`);
      snow.style.setProperty('--delay', `${-((index * 2.37) % 21).toFixed(2)}s`);
      snow.style.setProperty('--duration', `${11 + (index % 7) * 1.6}s`);
      snow.style.setProperty('--scale', `${(0.72 + (index % 5) * 0.11).toFixed(2)}`);
      snow.style.setProperty('--drift-7', `${direction * 7}px`);
      snow.style.setProperty('--drift-11', `${direction * 11}px`);
      snow.style.setProperty('--drift-18', `${direction * 18}px`);
      layer.append(snow);
    }

    layer.append(accent('seasonal-winter-glow'));

    const lights = image('seasonal-accent seasonal-string-lights', 'openclipart-christmas-garland.svg');
    const wreath = image('seasonal-accent seasonal-christmas-wreath', 'openclipart-christmas-wreath.webp');
    layer.append(lights, wreath);

    const trees = accent('seasonal-winter-trees');
    for (let index = 0; index < 2; index += 1) {
      const tree = image(`seasonal-tree-image ${index ? 'is-right' : 'is-left'}`, 'golden-spiral-tree.svg?v=20261022-9');
      trees.append(tree);
    }
    layer.append(trees);

    const gifts = accent('seasonal-gift-row');
    ['is-left', 'is-right'].forEach(side => {
      const cluster = document.createElement('span');
      cluster.className = `seasonal-gift-cluster ${side}`;
      const boxCount = compact ? 3 : 5;
      for (let index = 0; index < boxCount; index += 1) {
        const gift = document.createElement('i');
        gift.className = `seasonal-gift-box gift-${index + 1}`;
        cluster.append(gift);
      }
      cluster.append(image('seasonal-gift-candy-cane', 'openclipart-candy-cane.svg'));
      gifts.append(cluster);
    });
    layer.append(gifts, accent('seasonal-christmas-snowbank'));

    const flight = accent('seasonal-santa-flight');
    flight.append(image('seasonal-santa-flight-art', 'golden-running-reindeer-sleigh-cloud.svg?v=20261022-2'));
    layer.append(flight);
  }

  let renderedTheme;
  let renderedDate;
  function render(theme) {
    document.querySelector('.seasonal-layer')?.remove();
    document.querySelector('.seasonal-holiday-note')?.remove();
    document.querySelector('.seasonal-thanksgiving-footer-decor')?.remove();
    document.documentElement.dataset.season = theme || 'off';
    renderedTheme = theme;
    if (!theme) {
      document.dispatchEvent(new CustomEvent('kansai-season-change', { detail: { theme: null } }));
      return;
    }
    const compact = compactMode();
    const layer = document.createElement('div');
    layer.className = `seasonal-layer seasonal-theme-${theme}${compact ? ' is-compact' : ''}`;
    layer.setAttribute('aria-hidden', 'true');
    if (theme === 'halloween') addHalloween(layer, compact);
    if (theme === 'thanksgiving') addThanksgiving(layer, compact);
    if (theme === 'christmas') addChristmas(layer, compact);
    document.body.append(layer);
    addCaption(theme);
    document.dispatchEvent(new CustomEvent('kansai-season-change', { detail: { theme } }));
  }

  function dateKey(parts) {
    return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  }
  function sync() {
    const parts = osakaDateParts();
    const theme = currentTheme();
    const today = dateKey(parts);
    if (theme === renderedTheme && today === renderedDate) return;
    renderedDate = today;
    render(theme);
  }
  let midnightTimer;
  function scheduleNextOsakaMidnight() {
    clearTimeout(midnightTimer);
    const parts = osakaDateParts();
    const next = Date.UTC(parts.year, parts.month - 1, parts.day, 15, 0, 3);
    midnightTimer = setTimeout(() => { sync(); scheduleNextOsakaMidnight(); }, Math.max(1000, next - Date.now()));
  }
  function updateMediaFocus() {
    const layer = document.querySelector('.seasonal-layer');
    if (!layer) return;
    layer.classList.toggle('media-focus', [...document.querySelectorAll('video')].some(video => !video.paused && !video.ended));
    layer.classList.toggle('media-fullscreen', Boolean(document.fullscreenElement));
  }
  document.addEventListener('visibilitychange', () => {
    document.querySelector('.seasonal-layer')?.classList.toggle('is-paused', document.hidden);
    if (!document.hidden) { sync(); scheduleNextOsakaMidnight(); }
  });
  document.addEventListener('play', updateMediaFocus, true);
  document.addEventListener('pause', updateMediaFocus, true);
  document.addEventListener('ended', updateMediaFocus, true);
  document.addEventListener('fullscreenchange', updateMediaFocus);
  document.addEventListener('guide-language-change', () => updateLightLabel(document.querySelector('.seasonal-halloween-light-switch')));
  let lastSnowTrailAt = 0;
  function localSnowShower(x, y, requestedCount) {
    const layer = document.querySelector('.seasonal-layer.seasonal-theme-christmas');
    if (!layer || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const compact = matchMedia('(max-width: 680px)').matches || navigator.connection?.saveData === true;
    const count = compact ? Math.min(8, requestedCount) : requestedCount;
    const existing = layer.querySelectorAll('.seasonal-snow-burst');
    [...existing].slice(0, Math.max(0, existing.length + count - (compact ? 32 : 72))).forEach(node => node.remove());
    for (let index = 0; index < count; index += 1) {
      const flake = image('seasonal-snow-burst', 'openclipart-snowflake.svg');
      flake.style.setProperty('--burst-x', `${x + (index % 3 - 1) * (13 + index * 2)}px`);
      flake.style.setProperty('--burst-y', `${y - 18 - (index % 4) * 9}px`);
      const drift = ((index * 29) % 90) - 45;
      const scale = 0.62 + (index % 5) * 0.18;
      flake.style.setProperty('--burst-dx', `${drift}px`);
      flake.style.setProperty('--burst-dx-quarter', `${drift * 0.25}px`);
      flake.style.setProperty('--burst-scale', scale.toFixed(2));
      flake.style.setProperty('--burst-scale-end', (scale * 0.75).toFixed(2));
      flake.style.setProperty('--burst-delay', `${-(index % 3) * 0.12}s`);
      layer.append(flake);
      window.setTimeout(() => flake.remove(), 5900);
    }
  }
  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || matchMedia('(max-width: 680px)').matches) return;
    const now = performance.now();
    if (now - lastSnowTrailAt < 78) return;
    lastSnowTrailAt = now;
    localSnowShower(event.clientX, event.clientY, 9);
  }, { passive: true });
  document.addEventListener('pointerdown', event => localSnowShower(event.clientX, event.clientY, 24), { passive: true });
  matchMedia('(max-width: 680px)').addEventListener?.('change', () => render(currentTheme()));
  window.addEventListener('pageshow', () => { sync(); scheduleNextOsakaMidnight(); });
  sync();
  scheduleNextOsakaMidnight();
  window.KansaiSeasonal = Object.freeze({ resolve: date => automaticTheme(osakaDateParts(date)), active: () => renderedTheme });
})();
