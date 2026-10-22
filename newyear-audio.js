(() => {
  'use strict';

  const FIREWORK_SRC = 'assets/seasonal/newyear-firework-burst-cc0.m4a';
  const MASTER_LEVEL = 0.17;
  const FIREWORK_LEVEL = 0.3;
  const FIREWORK_COOLDOWN_MS = 2200;
  const COPY = {
    zh: {
      off: '新年声景：关', on: '新年声景：开', starting: '新年声景：启动中', paused: '新年声景：暂停', error: '新年声景无法启动',
      hint: '切换低音量除夜钟、神社铃、轻风、和风器乐与同步花火声'
    },
    'zh-hant': {
      off: '新年聲景：關', on: '新年聲景：開', starting: '新年聲景：啟動中', paused: '新年聲景：暫停', error: '新年聲景無法啟動',
      hint: '切換低音量除夜鐘、神社鈴、輕風、和風器樂與同步花火聲'
    },
    ja: {
      off: 'お正月の音：オフ', on: 'お正月の音：オン', starting: 'お正月の音：準備中', paused: 'お正月の音：一時停止', error: 'お正月の音を再生できません',
      hint: '小音量の除夜の鐘、神社の鈴、風、和風器楽と花火音を切り替え'
    },
    en: {
      off: 'New Year soundscape: off', on: 'New Year soundscape: on', starting: 'New Year soundscape: starting', paused: 'New Year soundscape: paused', error: 'New Year soundscape unavailable',
      hint: 'Toggle quiet temple bells, shrine chimes, wind, Japanese instrumental texture and synchronized fireworks'
    }
  };

  let enabled = false;
  let state = 'off';
  let context = null;
  let master = null;
  let reverb = null;
  let reverbLevel = null;
  let phraseTimer = 0;
  let templeBellTimer = 0;
  let shrineBellTimer = 0;
  let transition = 0;
  let phraseIndex = 0;
  const liveSources = new Set();
  const pluckBuffers = new Map();

  let fireworkAudio = null;
  let fireworkRequest = 0;
  let fireworkPrimed = false;
  let lastFireworkAt = Number.NEGATIVE_INFINITY;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'seasonal-sound-toggle newyear-sound-toggle is-off';
  button.hidden = true;
  button.innerHTML = '<span aria-hidden="true">♫</span><b aria-live="polite"></b>';
  document.body.append(button);

  function isNewYear() {
    return document.documentElement.dataset.season === 'newyear';
  }

  function pageMediaPlaying() {
    return [...document.querySelectorAll('audio,video')].some(media =>
      !media.hasAttribute('data-seasonal-ambience') && !media.paused && !media.ended
    );
  }

  function shouldPlay() {
    return enabled && isNewYear() && !document.hidden && !pageMediaPlaying();
  }

  function handlePageMediaEvent(event) {
    const media = event.target;
    if (!(media instanceof HTMLMediaElement) || media.hasAttribute('data-seasonal-ambience')) return;
    syncPlayback();
  }

  function copy() {
    const language = (document.documentElement.lang || 'en').toLowerCase();
    return COPY[language] || COPY[language.split('-')[0]] || COPY.en;
  }

  function updateButton() {
    const text = copy();
    const key = state in text ? state : (enabled ? 'on' : 'off');
    const label = text[key];
    button.hidden = !isNewYear();
    button.classList.toggle('is-off', state !== 'on');
    button.querySelector('b').textContent = label;
    button.title = text.hint;
    button.setAttribute('aria-label', `${label}. ${text.hint}`);
    button.setAttribute('aria-pressed', String(enabled));
    if (state === 'starting') button.setAttribute('aria-busy', 'true');
    else button.removeAttribute('aria-busy');
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function registerSource(source) {
    liveSources.add(source);
    source.addEventListener('ended', () => liveSources.delete(source), { once: true });
    return source;
  }

  function stopLiveSources() {
    for (const source of liveSources) {
      try { source.stop(); } catch (_) {}
    }
    liveSources.clear();
  }

  function clearSceneTimers() {
    window.clearTimeout(phraseTimer);
    window.clearTimeout(templeBellTimer);
    window.clearTimeout(shrineBellTimer);
    phraseTimer = templeBellTimer = shrineBellTimer = 0;
  }

  function createImpulse(audioContext) {
    const duration = 2.4;
    const buffer = audioContext.createBuffer(2, Math.round(audioContext.sampleRate * duration), audioContext.sampleRate);
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const samples = buffer.getChannelData(channel);
      for (let index = 0; index < samples.length; index += 1) {
        const time = index / audioContext.sampleRate;
        const earlyReflection = index % Math.round(audioContext.sampleRate * 0.037) < 2 ? 0.12 : 0;
        samples[index] = ((Math.random() * 2 - 1) * 0.19 + earlyReflection) * Math.exp(-time * 2.15);
      }
    }
    return buffer;
  }

  function ensureContext() {
    if (context && context.state !== 'closed') return context;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error('Web Audio is unavailable');
    context = new AudioContextClass({ latencyHint: 'playback' });
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.04;
    compressor.release.value = 0.5;
    master = context.createGain();
    master.gain.value = 0.0001;
    master.connect(compressor).connect(context.destination);
    reverb = context.createConvolver();
    reverb.buffer = createImpulse(context);
    reverbLevel = context.createGain();
    reverbLevel.gain.value = 0.22;
    reverb.connect(reverbLevel).connect(master);
    pluckBuffers.clear();
    return context;
  }

  function connectWithSpace(node, dryLevel = 1, wetLevel = 0.28) {
    const dry = context.createGain();
    dry.gain.value = dryLevel;
    node.connect(dry).connect(master);
    if (wetLevel > 0 && reverb) {
      const send = context.createGain();
      send.gain.value = wetLevel;
      node.connect(send).connect(reverb);
    }
  }

  function startWind() {
    if (!context || !master) return;
    const seconds = 9;
    const buffer = context.createBuffer(1, Math.round(context.sampleRate * seconds), context.sampleRate);
    const samples = buffer.getChannelData(0);
    let smoothed = 0;
    for (let index = 0; index < samples.length; index += 1) {
      smoothed = smoothed * 0.986 + (Math.random() * 2 - 1) * 0.014;
      samples[index] = smoothed;
    }
    const source = registerSource(context.createBufferSource());
    source.buffer = buffer;
    source.loop = true;
    const highpass = context.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 95;
    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 720;
    lowpass.Q.value = 0.38;
    const windGain = context.createGain();
    windGain.gain.value = 0.045;
    const lfo = registerSource(context.createOscillator());
    const lfoDepth = context.createGain();
    lfo.frequency.value = 0.075;
    lfoDepth.gain.value = 0.012;
    lfo.connect(lfoDepth).connect(windGain.gain);
    source.connect(highpass).connect(lowpass).connect(windGain).connect(master);
    source.start();
    lfo.start();
  }

  function pluckBuffer(frequency) {
    const key = Math.round(frequency * 100);
    if (pluckBuffers.has(key)) return pluckBuffers.get(key);
    const duration = 2.8;
    const buffer = context.createBuffer(1, Math.round(context.sampleRate * duration), context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) {
      const time = index / context.sampleRate;
      const attack = Math.min(1, time / 0.012);
      const decay = Math.exp(-time * 1.72);
      const body =
        Math.sin(Math.PI * 2 * frequency * time) * 0.66 +
        Math.sin(Math.PI * 2 * frequency * 2.01 * time + 0.23) * 0.22 * Math.exp(-time * 0.72) +
        Math.sin(Math.PI * 2 * frequency * 3.97 * time + 0.51) * 0.09 * Math.exp(-time * 1.15);
      const touch = (Math.random() * 2 - 1) * 0.055 * Math.exp(-time * 52);
      samples[index] = (body + touch) * attack * decay;
    }
    pluckBuffers.set(key, buffer);
    return buffer;
  }

  function playPluck(frequency, when, level = 0.13, pan = 0) {
    if (!context || context.state !== 'running') return;
    const source = registerSource(context.createBufferSource());
    source.buffer = pluckBuffer(frequency);
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(3400, frequency * 7.5);
    filter.Q.value = 0.35;
    const gain = context.createGain();
    gain.gain.value = level;
    source.connect(filter).connect(gain);
    if (typeof context.createStereoPanner === 'function') {
      const panner = context.createStereoPanner();
      panner.pan.value = pan;
      gain.connect(panner);
      connectWithSpace(panner, 0.82, 0.36);
    } else {
      connectWithSpace(gain, 0.82, 0.36);
    }
    source.start(when);
  }

  function playInstrumentPhrase() {
    if (!shouldPlay() || !context || context.state !== 'running') return;
    const notes = [293.66, 329.63, 369.99, 440, 493.88, 587.33];
    const phrases = [[0, 2, 4], [1, 3], [4, 2, 0], [5, 4, 2], [0, 1, 3], [3, 1]];
    const phrase = phrases[phraseIndex % phrases.length];
    phraseIndex += 1;
    const start = context.currentTime + 0.04;
    phrase.forEach((noteIndex, index) => {
      playPluck(notes[noteIndex], start + index * random(0.54, 0.72), index === 0 ? 0.105 : 0.078, index % 2 ? 0.2 : -0.18);
    });
    phraseTimer = window.setTimeout(playInstrumentPhrase, random(5600, 7800));
  }

  function playTempleBell() {
    if (!shouldPlay() || !context || context.state !== 'running') return;
    const now = context.currentTime + 0.03;
    const base = phraseIndex % 2 ? 110 : 98;
    const ratios = [1, 1.46, 2.04, 2.57, 3.78];
    const levels = [0.125, 0.061, 0.034, 0.021, 0.009];
    const decays = [10.5, 8.2, 6.4, 5.2, 3.8];
    ratios.forEach((ratio, index) => {
      const oscillator = registerSource(context.createOscillator());
      oscillator.type = 'sine';
      oscillator.frequency.value = base * ratio;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(levels[index], now + 0.075 + index * 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[index]);
      oscillator.connect(gain);
      connectWithSpace(gain, 0.74, 0.5);
      oscillator.start(now);
      oscillator.stop(now + decays[index] + 0.08);
    });
    templeBellTimer = window.setTimeout(playTempleBell, random(28500, 39000));
  }

  function playShrineBell() {
    if (!shouldPlay() || !context || context.state !== 'running') return;
    const now = context.currentTime + 0.03;
    [0, 0.12, 0.29].forEach((delay, index) => {
      const oscillator = registerSource(context.createOscillator());
      oscillator.type = index === 1 ? 'triangle' : 'sine';
      oscillator.frequency.value = [783.99, 1174.66, 987.77][index];
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(index === 1 ? 0.018 : 0.026, now + delay + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 2.35);
      oscillator.connect(gain);
      connectWithSpace(gain, 0.52, 0.62);
      oscillator.start(now + delay);
      oscillator.stop(now + delay + 2.45);
    });
    shrineBellTimer = window.setTimeout(playShrineBell, random(19000, 31000));
  }

  function scheduleScene() {
    startWind();
    phraseTimer = window.setTimeout(playInstrumentPhrase, 450);
    templeBellTimer = window.setTimeout(playTempleBell, 1900);
    shrineBellTimer = window.setTimeout(playShrineBell, 8500);
  }

  function ensureFireworkAudio() {
    if (fireworkAudio) return fireworkAudio;
    fireworkAudio = new Audio(FIREWORK_SRC);
    fireworkAudio.preload = 'auto';
    fireworkAudio.volume = FIREWORK_LEVEL;
    fireworkAudio.hidden = true;
    fireworkAudio.setAttribute('aria-hidden', 'true');
    fireworkAudio.setAttribute('data-seasonal-ambience', 'newyear');
    fireworkAudio.addEventListener('error', () => console.warn('New Year firework recording could not be loaded.'));
    document.body.append(fireworkAudio);
    return fireworkAudio;
  }

  function primeFireworkFromGesture() {
    if (fireworkPrimed) return;
    const audio = ensureFireworkAudio();
    const request = ++fireworkRequest;
    audio.pause();
    try { audio.currentTime = 0; } catch (_) {}
    audio.volume = 0.0001;
    audio.play().then(() => {
      if (request !== fireworkRequest) return;
      audio.pause();
      try { audio.currentTime = 0; } catch (_) {}
      audio.volume = FIREWORK_LEVEL;
      fireworkPrimed = true;
    }).catch(() => {
      if (request === fireworkRequest) audio.volume = FIREWORK_LEVEL;
    });
  }

  function stopFirework(reset = false) {
    fireworkRequest += 1;
    if (!fireworkAudio) return;
    fireworkAudio.pause();
    fireworkAudio.volume = FIREWORK_LEVEL;
    if (reset) {
      try { fireworkAudio.currentTime = 0; } catch (_) {}
    }
  }

  function playFirework(event) {
    if (state !== 'on' || !shouldPlay()) return;
    const now = performance.now();
    if (now - lastFireworkAt < FIREWORK_COOLDOWN_MS) return;
    lastFireworkAt = now;
    const intensity = Math.max(0.78, Math.min(1.12, Number(event.detail?.intensity) || 1));
    const audio = ensureFireworkAudio();
    const request = ++fireworkRequest;
    audio.pause();
    audio.muted = false;
    audio.volume = Math.min(0.34, FIREWORK_LEVEL * intensity);
    try { audio.currentTime = 0; } catch (_) {}
    audio.play().then(() => {
      if (request !== fireworkRequest || state !== 'on' || !shouldPlay()) audio.pause();
    }).catch(() => {
      if (request === fireworkRequest) console.warn('New Year firework recording could not start.');
    });
  }

  function pauseScene() {
    clearSceneTimers();
    stopLiveSources();
    stopFirework();
    if (context && context.state === 'running') context.suspend().catch(() => {});
  }

  function closeScene() {
    clearSceneTimers();
    stopLiveSources();
    stopFirework(true);
    const closing = context;
    context = master = reverb = reverbLevel = null;
    pluckBuffers.clear();
    if (closing && closing.state !== 'closed') closing.close().catch(() => {});
  }

  async function syncPlayback({ restart = false } = {}) {
    const request = ++transition;
    if (!shouldPlay()) {
      pauseScene();
      state = enabled && isNewYear() ? 'paused' : 'off';
      updateButton();
      return;
    }
    state = 'starting';
    updateButton();
    try {
      const audioContext = ensureContext();
      if (audioContext.state !== 'running') await audioContext.resume();
      if (request !== transition || !shouldPlay()) return;
      clearSceneTimers();
      stopLiveSources();
      if (restart) phraseIndex = 0;
      const now = audioContext.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
      master.gain.linearRampToValueAtTime(MASTER_LEVEL, now + 0.85);
      scheduleScene();
      state = 'on';
    } catch (error) {
      enabled = false;
      state = 'error';
      closeScene();
      console.warn('New Year soundscape could not start.', error);
    }
    updateButton();
  }

  button.addEventListener('click', () => {
    enabled = state === 'error' ? true : !enabled;
    document.dispatchEvent(new CustomEvent('kansai-seasonal-audio-toggle', {
      detail: { theme: 'newyear', enabled }
    }));
    if (!enabled) {
      transition += 1;
      state = 'off';
      closeScene();
      updateButton();
      return;
    }
    // Both audio engines are created/resumed only inside this explicit click.
    primeFireworkFromGesture();
    syncPlayback({ restart: true });
  });

  document.addEventListener('kansai:firework', playFirework);
  document.addEventListener('play', handlePageMediaEvent, true);
  document.addEventListener('pause', handlePageMediaEvent, true);
  document.addEventListener('ended', handlePageMediaEvent, true);
  document.addEventListener('visibilitychange', () => syncPlayback());
  document.addEventListener('guide-language-change', updateButton);
  document.addEventListener('kansai-season-change', () => {
    if (!isNewYear()) {
      enabled = false;
      state = 'off';
      fireworkPrimed = false;
      transition += 1;
      closeScene();
    }
    updateButton();
  });
  window.addEventListener('pagehide', () => {
    enabled = false;
    state = 'off';
    transition += 1;
    closeScene();
  });
  window.addEventListener('pageshow', updateButton);
  new MutationObserver(updateButton).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'data-season'] });
  updateButton();
})();
