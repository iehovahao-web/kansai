(() => {
  'use strict';

  const AUDIO_SRC = 'assets/seasonal/newyear-firework-burst-cc0.m4a';
  const LEVEL = 0.68;
  const COOLDOWN_MS = 2800;
  const COPY = {
    zh: ['新年花火音效：关', '新年花火音效：开', '切换真实新年花火声'],
    'zh-hant': ['新年花火音效：關', '新年花火音效：開', '切換真實新年花火聲'],
    ja: ['新年花火音：オフ', '新年花火音：オン', '実録の新年花火音を切り替え'],
    en: ['New Year fireworks: off', 'New Year fireworks: on', 'Toggle the real New Year firework recording']
  };

  let enabled = false;
  let audio = null;
  let playRequest = 0;
  let primed = false;
  let lastPlayedAt = Number.NEGATIVE_INFINITY;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'seasonal-sound-toggle newyear-sound-toggle is-off';
  button.hidden = true;
  button.innerHTML = '<span aria-hidden="true">♫</span><b></b>';
  document.body.append(button);

  function isNewYear() {
    return document.documentElement.dataset.season === 'newyear';
  }

  function pageMediaPlaying() {
    return [...document.querySelectorAll('audio,video')].some(media =>
      !media.hasAttribute('data-seasonal-ambience') && !media.paused && !media.ended
    );
  }

  function copy() {
    const language = (document.documentElement.lang || 'en').toLowerCase();
    return COPY[language] || COPY[language.split('-')[0]] || COPY.en;
  }

  function updateButton() {
    const text = copy();
    button.hidden = !isNewYear();
    button.classList.toggle('is-off', !enabled);
    button.querySelector('b').textContent = text[enabled ? 1 : 0];
    button.title = text[2];
    button.setAttribute('aria-label', `${text[enabled ? 1 : 0]}. ${text[2]}`);
    button.setAttribute('aria-pressed', String(enabled));
  }

  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio(AUDIO_SRC);
    audio.preload = 'auto';
    audio.volume = LEVEL;
    audio.hidden = true;
    audio.setAttribute('aria-hidden', 'true');
    audio.setAttribute('data-seasonal-ambience', 'newyear');
    audio.addEventListener('error', () => console.warn('New Year firework recording could not be loaded.'));
    document.body.append(audio);
    return audio;
  }

  function stop({ reset = false } = {}) {
    playRequest += 1;
    if (!audio) return;
    audio.pause();
    audio.volume = LEVEL;
    if (reset) {
      try { audio.currentTime = 0; } catch (_) {}
    }
  }

  function primeFromGesture() {
    if (primed) return;
    const element = ensureAudio();
    const request = ++playRequest;
    element.pause();
    try { element.currentTime = 0; } catch (_) {}
    element.volume = 0.0001;
    element.play().then(() => {
      if (request !== playRequest) return;
      element.pause();
      try { element.currentTime = 0; } catch (_) {}
      element.volume = LEVEL;
      primed = true;
    }).catch(() => {
      if (request === playRequest) element.volume = LEVEL;
    });
  }

  function playBurst() {
    if (!enabled || !isNewYear() || document.hidden || pageMediaPlaying()) return;
    const now = performance.now();
    if (now - lastPlayedAt < COOLDOWN_MS) return;
    lastPlayedAt = now;
    const element = ensureAudio();
    const request = ++playRequest;
    element.pause();
    element.muted = false;
    element.volume = LEVEL;
    try { element.currentTime = 0; } catch (_) {}
    element.play().then(() => {
      if (request !== playRequest || !enabled || !isNewYear() || document.hidden || pageMediaPlaying()) element.pause();
    }).catch(() => {
      if (request === playRequest) console.warn('New Year firework recording could not start.');
    });
  }

  button.addEventListener('click', () => {
    enabled = !enabled;
    updateButton();
    if (!enabled) {
      stop({ reset: true });
      return;
    }
    // The media element is created and primed only inside this explicit click.
    primeFromGesture();
  });

  document.addEventListener('kansai:firework', playBurst);
  document.addEventListener('play', () => {
    if (pageMediaPlaying()) stop();
  }, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
  document.addEventListener('guide-language-change', updateButton);
  document.addEventListener('kansai-season-change', () => {
    if (!isNewYear()) {
      enabled = false;
      primed = false;
      stop({ reset: true });
    }
    updateButton();
  });
  window.addEventListener('pagehide', () => stop());
  new MutationObserver(updateButton).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'data-season'] });
  updateButton();
})();
