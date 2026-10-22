(() => {
  'use strict';

  const STORAGE_KEY = 'kansai-seasonal-sound-v2';
  const HALLOWEEN_AUDIO_SRC = 'assets/seasonal/halloween-ambience-v2.m4a';
  const JINGLE_AUDIO_SRC = 'assets/seasonal/jingle-bells-cc0.mp3';
  const SANTA_AUDIO_SRC = 'assets/seasonal/santa-hoho-cc0.mp3';
  const SUPPORTED_THEMES = new Set(['halloween', 'christmas']);
  const JINGLE_LEVEL = 0.42;
  const JINGLE_DUCKED_LEVEL = 0.2;
  const SANTA_LEVEL = 1;
  const SANTA_VISIBLE_RATIO = 0.08;
  const COPY = {
    zh: {
      halloweenOn: '万圣节音效：开', halloweenOff: '万圣节音效：关', halloweenLoading: '万圣节音效：加载中', halloweenPaused: '万圣节音效：暂停', halloweenError: '音效加载失败，请再点一次', halloweenHint: '切换低音量万圣节风声与幽灵音效',
      christmasOn: '圣诞音效：开', christmasOff: '圣诞音效：关', christmasHint: '全程播放第一段英文《铃儿响叮当》，圣诞老人出现时播放真人笑声'
    },
    'zh-hant': {
      halloweenOn: '萬聖節音效：開', halloweenOff: '萬聖節音效：關', halloweenLoading: '萬聖節音效：載入中', halloweenPaused: '萬聖節音效：暫停', halloweenError: '音效載入失敗，請再點一次', halloweenHint: '切換低音量萬聖節風聲與幽靈音效',
      christmasOn: '聖誕音效：開', christmasOff: '聖誕音效：關', christmasHint: '全程播放第一段英文《鈴兒響叮噹》，聖誕老人出現時播放真人笑聲'
    },
    ja: {
      halloweenOn: 'ハロウィーン音：オン', halloweenOff: 'ハロウィーン音：オフ', halloweenLoading: 'ハロウィーン音：読み込み中', halloweenPaused: 'ハロウィーン音：一時停止', halloweenError: '音声を読み込めません。もう一度押してください', halloweenHint: '小音量の風とゴースト音を切り替え',
      christmasOn: 'クリスマス音：オン', christmasOff: 'クリスマス音：オフ', christmasHint: '英語版ジングルベルを連続再生し、サンタ登場時に本物の笑い声を再生'
    },
    en: {
      halloweenOn: 'Halloween sound: on', halloweenOff: 'Halloween sound: off', halloweenLoading: 'Halloween sound: loading', halloweenPaused: 'Halloween sound: paused', halloweenError: 'Sound failed to load; tap again', halloweenHint: 'Toggle low-volume Halloween wind and ghost sounds',
      christmasOn: 'Christmas sound: on', christmasOff: 'Christmas sound: off', christmasHint: 'Play the selected English Jingle Bells continuously and the real Santa laugh when Santa appears'
    }
  };

  let enabled = false;
  let halloweenAudio;
  let halloweenState = 'idle';
  let jingleAudio;
  let santaAudio;
  let santaObserver;
  let santaObservedElement;
  let santaWasVisible = false;
  let jingleRequest = 0;
  let santaRequest = 0;
  try { localStorage.setItem(STORAGE_KEY, 'off'); } catch (_) {}

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'seasonal-sound-toggle is-off';
  button.hidden = true;
  button.innerHTML = '<span aria-hidden="true">♫</span><b></b>';
  document.body.append(button);

  function activeTheme() {
    const theme = document.documentElement.dataset.season || '';
    return SUPPORTED_THEMES.has(theme) ? theme : '';
  }

  function copy() {
    const language = (document.documentElement.lang || 'en').toLowerCase();
    return COPY[language] || COPY[language.split('-')[0]] || COPY.en;
  }

  function mediaPlaying() {
    return [...document.querySelectorAll('audio,video')].some(media =>
      !media.hasAttribute('data-seasonal-ambience') && !media.paused && !media.ended
    );
  }

  function updateButton() {
    const theme = activeTheme();
    const text = copy();
    let label = '';
    let hint = '';
    if (theme === 'halloween') {
      if (!enabled || halloweenState === 'idle') label = text.halloweenOff;
      else if (halloweenState === 'playing') label = text.halloweenOn;
      else if (halloweenState === 'loading') label = text.halloweenLoading;
      else if (halloweenState === 'error') label = text.halloweenError;
      else label = text.halloweenPaused;
      hint = text.halloweenHint;
    } else if (theme === 'christmas') {
      label = enabled ? text.christmasOn : text.christmasOff;
      hint = text.christmasHint;
    }
    button.hidden = !theme;
    button.classList.toggle('is-off', !enabled || (theme === 'halloween' && halloweenState !== 'playing'));
    button.querySelector('b').textContent = label;
    button.title = hint;
    button.setAttribute('aria-label', `${label}. ${hint}`);
    button.setAttribute('aria-pressed', String(enabled && (theme !== 'halloween' || halloweenState === 'playing')));
  }

  function ensureHalloweenAudio() {
    if (halloweenAudio) return halloweenAudio;
    halloweenAudio = new Audio(HALLOWEEN_AUDIO_SRC);
    halloweenAudio.loop = true;
    halloweenAudio.preload = 'auto';
    halloweenAudio.volume = 0.62;
    halloweenAudio.hidden = true;
    halloweenAudio.setAttribute('aria-hidden', 'true');
    halloweenAudio.setAttribute('data-seasonal-ambience', 'halloween');
    halloweenAudio.addEventListener('playing', () => {
      if (enabled && activeTheme() === 'halloween') halloweenState = 'playing';
      updateButton();
    });
    halloweenAudio.addEventListener('pause', () => {
      halloweenState = enabled && activeTheme() === 'halloween' ? 'paused' : 'idle';
      updateButton();
    });
    halloweenAudio.addEventListener('error', () => {
      halloweenState = 'error';
      updateButton();
    });
    document.body.append(halloweenAudio);
    return halloweenAudio;
  }

  function stopHalloween(reset = false) {
    if (!halloweenAudio) return;
    halloweenAudio.pause();
    if (reset) {
      try { halloweenAudio.currentTime = 0; } catch (_) {}
      halloweenState = 'idle';
    }
    updateButton();
  }

  async function updateHalloweenPlayback(restart = false) {
    const shouldPlay = enabled && activeTheme() === 'halloween' && !document.hidden && !mediaPlaying();
    if (!shouldPlay) {
      stopHalloween(!enabled || activeTheme() !== 'halloween');
      return;
    }
    const audio = ensureHalloweenAudio();
    if (restart) {
      try { audio.currentTime = 0; } catch (_) {}
    }
    if (!audio.paused) return;
    halloweenState = 'loading';
    updateButton();
    try {
      await audio.play();
      halloweenState = 'playing';
    } catch (_) {
      halloweenState = 'error';
    }
    updateButton();
  }

  function ensureChristmasAudio() {
    if (!jingleAudio) {
      jingleAudio = new Audio(JINGLE_AUDIO_SRC);
      jingleAudio.loop = true;
      jingleAudio.preload = 'auto';
      jingleAudio.volume = JINGLE_LEVEL;
      jingleAudio.hidden = true;
      jingleAudio.setAttribute('aria-hidden', 'true');
      jingleAudio.setAttribute('data-seasonal-ambience', 'christmas');
      jingleAudio.addEventListener('error', () => console.warn('Jingle Bells could not be loaded.'));
      document.body.append(jingleAudio);
    }
    if (!santaAudio) {
      santaAudio = new Audio(SANTA_AUDIO_SRC);
      santaAudio.preload = 'auto';
      santaAudio.volume = SANTA_LEVEL;
      santaAudio.hidden = true;
      santaAudio.setAttribute('aria-hidden', 'true');
      santaAudio.setAttribute('data-seasonal-ambience', 'christmas');
      const restoreJingle = () => {
        if (jingleAudio) jingleAudio.volume = JINGLE_LEVEL;
        try { santaAudio.currentTime = 0; } catch (_) {}
      };
      santaAudio.addEventListener('ended', restoreJingle);
      santaAudio.addEventListener('error', restoreJingle);
      document.body.append(santaAudio);
    }
    return { jingleAudio, santaAudio };
  }

  function stopChristmas(reset = false) {
    jingleRequest += 1;
    santaRequest += 1;
    if (jingleAudio) {
      jingleAudio.pause();
      jingleAudio.volume = JINGLE_LEVEL;
      if (reset) try { jingleAudio.currentTime = 0; } catch (_) {}
    }
    if (santaAudio) {
      santaAudio.pause();
      if (reset) try { santaAudio.currentTime = 0; } catch (_) {}
    }
  }

  async function updateChristmasPlayback(restart = false) {
    const shouldPlay = enabled && activeTheme() === 'christmas' && !document.hidden && !mediaPlaying();
    if (!shouldPlay) {
      stopChristmas(!enabled || activeTheme() !== 'christmas');
      return;
    }
    const audio = ensureChristmasAudio().jingleAudio;
    if (restart) {
      audio.pause();
      try { audio.currentTime = 0; } catch (_) {}
    }
    if (!audio.paused) return;
    const request = ++jingleRequest;
    audio.volume = JINGLE_LEVEL;
    try {
      await audio.play();
      if (request !== jingleRequest || !enabled || activeTheme() !== 'christmas' || document.hidden || mediaPlaying()) audio.pause();
    } catch (_) {
      if (request === jingleRequest) console.warn('Jingle Bells could not start.');
    }
  }

  function santaVisibilityRatio(element = santaObservedElement) {
    if (!element || !element.isConnected) return 0;
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || Number(getComputedStyle(element).opacity) <= 0.08) return 0;
    const visibleWidth = Math.max(0, Math.min(innerWidth, rect.right) - Math.max(0, rect.left));
    const visibleHeight = Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top));
    return (visibleWidth * visibleHeight) / (rect.width * rect.height);
  }

  async function playSantaHoHo() {
    if (!enabled || activeTheme() !== 'christmas' || document.hidden || mediaPlaying()) return;
    const audio = ensureChristmasAudio().santaAudio;
    const request = ++santaRequest;
    audio.pause();
    try { audio.currentTime = 0; } catch (_) {}
    if (jingleAudio) jingleAudio.volume = JINGLE_DUCKED_LEVEL;
    try {
      await audio.play();
      if (request !== santaRequest || !enabled || activeTheme() !== 'christmas' || document.hidden || mediaPlaying()) {
        audio.pause();
        if (jingleAudio) jingleAudio.volume = JINGLE_LEVEL;
      }
    } catch (_) {
      if (jingleAudio) jingleAudio.volume = JINGLE_LEVEL;
      if (request === santaRequest) console.warn('Santa voice recording could not start.');
    }
  }

  function syncSantaObserver() {
    const element = document.querySelector('.seasonal-theme-christmas .seasonal-santa-flight');
    if (element === santaObservedElement) return;
    santaObserver?.disconnect();
    santaObservedElement = element || null;
    santaWasVisible = false;
    if (!element || !('IntersectionObserver' in window)) return;
    santaObserver = new IntersectionObserver(entries => {
      const entry = entries.find(item => item.target === santaObservedElement);
      if (!entry) return;
      const visible = entry.isIntersecting && entry.intersectionRatio >= SANTA_VISIBLE_RATIO && santaVisibilityRatio(entry.target) >= SANTA_VISIBLE_RATIO;
      if (visible && !santaWasVisible) playSantaHoHo();
      santaWasVisible = visible;
    }, { threshold: [0, SANTA_VISIBLE_RATIO] });
    santaObserver.observe(element);
  }

  function updateForPageMedia() {
    updateHalloweenPlayback();
    updateChristmasPlayback();
  }

  button.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem(STORAGE_KEY, 'off'); } catch (_) {}
    updateButton();
    document.dispatchEvent(new CustomEvent('kansai-seasonal-audio-toggle', {
      detail: { theme: activeTheme(), enabled }
    }));
    if (!enabled) {
      stopHalloween(true);
      stopChristmas(true);
      return;
    }
    if (activeTheme() === 'halloween') {
      updateHalloweenPlayback(true);
      return;
    }
    if (activeTheme() === 'christmas') {
      updateChristmasPlayback(true);
      syncSantaObserver();
      const visible = santaVisibilityRatio() >= SANTA_VISIBLE_RATIO;
      santaWasVisible = visible;
      if (visible) playSantaHoHo();
    }
  });

  document.addEventListener('play', updateForPageMedia, true);
  document.addEventListener('pause', updateForPageMedia, true);
  document.addEventListener('ended', updateForPageMedia, true);
  document.addEventListener('visibilitychange', updateForPageMedia);
  document.addEventListener('guide-language-change', updateButton);
  document.addEventListener('kansai-season-change', () => {
    updateButton();
    updateHalloweenPlayback();
    updateChristmasPlayback(true);
    requestAnimationFrame(syncSantaObserver);
  });
  window.addEventListener('pagehide', () => {
    stopHalloween();
    stopChristmas();
  });
  window.addEventListener('pageshow', updateForPageMedia);
  new MutationObserver(() => {
    updateButton();
    requestAnimationFrame(syncSantaObserver);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'data-season'] });
  new MutationObserver(syncSantaObserver).observe(document.body, { childList: true });

  syncSantaObserver();
  updateButton();
})();
