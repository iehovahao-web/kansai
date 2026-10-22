(() => {
  'use strict';

  const STORAGE_KEY = 'kansai-halloween-sound-v2';
  const AUDIO_SOURCE = 'assets/seasonal/halloween-ambience-v2.m4a';
  const COPY = {
    zh: { on: '万圣节音效：开', off: '万圣节音效：关', loading: '万圣节音效：加载中', paused: '万圣节音效：暂停', error: '音效加载失败，请再点一次', hint: '切换低音量万圣节风声与幽灵音效' },
    'zh-hant': { on: '萬聖節音效：開', off: '萬聖節音效：關', loading: '萬聖節音效：載入中', paused: '萬聖節音效：暫停', error: '音效載入失敗，請再點一次', hint: '切換低音量萬聖節風聲與幽靈音效' },
    ja: { on: 'ハロウィーン音：オン', off: 'ハロウィーン音：オフ', loading: 'ハロウィーン音：読み込み中', paused: 'ハロウィーン音：一時停止', error: '音声を読み込めません。もう一度押してください', hint: '小音量の風とゴースト音を切り替え' },
    en: { on: 'Halloween sound: on', off: 'Halloween sound: off', loading: 'Halloween sound: loading', paused: 'Halloween sound: paused', error: 'Sound failed to load; tap again', hint: 'Toggle low-volume Halloween wind and ghost sounds' }
  };
  let enabled = localStorage.getItem(STORAGE_KEY) === 'on';
  let state = 'idle';
  let audio;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'seasonal-sound-toggle is-off';
  button.hidden = true;
  button.innerHTML = '<span aria-hidden="true">♪</span><b></b>';
  document.body.append(button);

  function activeTheme() { return document.documentElement.dataset.season || 'off'; }
  function languageCopy() {
    const language = (document.documentElement.lang || 'en').toLowerCase();
    return COPY[language] || COPY[language.split('-')[0]] || COPY.en;
  }
  function mediaPlaying() {
    return [...document.querySelectorAll('audio,video')].some(media => media !== audio && !media.paused && !media.ended);
  }
  function updateButton() {
    const copy = languageCopy();
    const label = !enabled || state === 'idle' ? copy.off : state === 'playing' ? copy.on : state === 'loading' ? copy.loading : state === 'error' ? copy.error : copy.paused;
    button.hidden = activeTheme() !== 'halloween';
    button.classList.toggle('is-off', !enabled || state !== 'playing');
    button.querySelector('b').textContent = label;
    button.title = copy.hint;
    button.setAttribute('aria-label', `${label}. ${copy.hint}`);
    button.setAttribute('aria-pressed', String(enabled && state === 'playing'));
  }
  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio(AUDIO_SOURCE);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = .62;
    audio.hidden = true;
    audio.setAttribute('aria-hidden', 'true');
    audio.setAttribute('data-seasonal-ambience', 'halloween');
    audio.addEventListener('playing', () => { state = 'playing'; updateButton(); });
    audio.addEventListener('pause', () => { state = enabled && activeTheme() === 'halloween' ? 'paused' : 'idle'; updateButton(); });
    audio.addEventListener('error', () => { state = 'error'; updateButton(); });
    document.body.append(audio);
    return audio;
  }
  function stop(reset = false) {
    if (!audio) return;
    audio.pause();
    if (reset) {
      try { audio.currentTime = 0; } catch (_) {}
      state = 'idle';
    }
    updateButton();
  }
  async function syncPlayback(restart = false) {
    const shouldPlay = enabled && activeTheme() === 'halloween' && !document.hidden && !mediaPlaying();
    if (!shouldPlay) {
      stop(!enabled || activeTheme() !== 'halloween');
      updateButton();
      return;
    }
    const player = ensureAudio();
    if (state === 'error') player.load();
    if (restart) {
      try { player.currentTime = 0; } catch (_) {}
    }
    state = 'loading';
    updateButton();
    try {
      await player.play();
      state = 'playing';
    } catch (_) {
      state = 'error';
    }
    updateButton();
  }
  button.addEventListener('click', () => {
    enabled = !enabled;
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    syncPlayback(enabled);
  });
  document.addEventListener('kansai-season-change', () => syncPlayback());
  document.addEventListener('guide-language-change', updateButton);
  document.addEventListener('visibilitychange', () => syncPlayback());
  document.addEventListener('play', event => { if (event.target !== audio) syncPlayback(); }, true);
  document.addEventListener('pause', event => { if (event.target !== audio) syncPlayback(); }, true);
  document.addEventListener('ended', event => { if (event.target !== audio) syncPlayback(); }, true);
  window.addEventListener('pagehide', () => stop());
  window.addEventListener('pageshow', () => syncPlayback());
  updateButton();
  syncPlayback();
})();
