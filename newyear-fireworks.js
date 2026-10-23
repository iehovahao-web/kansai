(() => {
  'use strict';

  let controller = null;
  let activeCanvas = null;
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  function createEngine(canvas, compact) {
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return { destroy() {} };

    const reduced = motionQuery.matches;
    const palettes = [
      ['#fffdf2', '#ffd96a', '#f5a42b', '#d92f3c'],
      ['#fffbed', '#ffd44c', '#ef536f', '#f5a9bb'],
      ['#f8ffff', '#8ee8ff', '#5c8fff', '#8b5ad9'],
      ['#fff8df', '#ffc64c', '#ff7658', '#d62e55']
    ];
    const anchors = compact
      ? [[.22, .28], [.76, .3], [.5, .42], [.25, .56], [.75, .56]]
      : [[.16, .24], [.5, .27], [.84, .23], [.28, .47], [.72, .46], [.17, .62], [.83, .61]];
    const rockets = [];
    const particles = [];
    const flashes = [];
    let width = 1;
    let height = 1;
    let frameId = 0;
    let destroyed = false;
    let launchIndex = 0;
    let lastTick = performance.now();
    let nextLaunch = lastTick + 520;
    let safeZoneKey = '';
    let safeZones = [];

    const random = (min, max) => min + Math.random() * (max - min);
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const easeOut = value => 1 - Math.pow(1 - value, 3);

    function updateSafeZones(force = false) {
      const key = `${Math.round(scrollX)}:${Math.round(scrollY)}:${width}:${height}`;
      if (!force && key === safeZoneKey) return;
      safeZoneKey = key;
      const selectors = [
        '.site-nav', '.seasonal-holiday-note', '.hero h1', '.hero-copy>p',
        '.hero-actions', '.guide-thanks', '.media-gallery .video-stage',
        '.media-gallery .single-controls', '.mobile-bar', 'button', 'select',
        'input', 'video', 'audio'
      ];
      safeZones = [...document.querySelectorAll(selectors.join(','))]
        .map(node => node.getBoundingClientRect())
        .filter(rect => rect.width && rect.height && rect.bottom > 0 && rect.top < height && rect.right > 0 && rect.left < width)
        .map(rect => ({
          x: Math.max(0, rect.left - 12),
          y: Math.max(0, rect.top - 12),
          w: Math.min(width, rect.right + 12) - Math.max(0, rect.left - 12),
          h: Math.min(height, rect.bottom + 12) - Math.max(0, rect.top - 12)
        }));
    }

    function overlapsSafeZone(x, y, radius) {
      return safeZones.some(zone => {
        const nearestX = clamp(x, zone.x, zone.x + zone.w);
        const nearestY = clamp(y, zone.y, zone.y + zone.h);
        return Math.hypot(x - nearestX, y - nearestY) < radius;
      });
    }

    function chooseSite(radius, preferred) {
      updateSafeZones();
      const minimum = compact ? 44 : 72;
      let fallback = null;
      for (const testRadius of [radius, radius * .84, radius * .7, radius * .58].map(value => Math.max(minimum, value))) {
        const margin = testRadius + 8;
        const candidates = [preferred, ...anchors].map((point, index) => ({
          x: clamp(width * point[0] + Math.sin((launchIndex + index) * 2.7) * width * .012, margin, width - margin),
          y: clamp(height * point[1] + Math.cos((launchIndex + index) * 1.9) * height * .014, Math.max(margin, compact ? 118 : 102), height - margin - (compact ? 68 : 14)),
          radius: testRadius
        }));
        const clear = candidates.find(candidate => !overlapsSafeZone(candidate.x, candidate.y, candidate.radius));
        if (clear) return clear;
        fallback = candidates[0];
      }
      // The canvas is cleared over live controls and copy after each frame, so a
      // clipped fallback remains decorative without ever covering page content.
      return fallback;
    }

    function addParticle(x, y, angle, speed, color, options = {}) {
      if (particles.length >= (compact ? 210 : 430)) return;
      particles.push({
        x, y, px: x, py: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        decay: options.decay ?? random(.012, .018),
        drag: options.drag ?? random(.955, .971),
        gravity: options.gravity ?? random(.045, .073),
        width: options.width ?? random(.75, 1.25),
        delay: options.delay ?? 0,
        flicker: options.flicker ?? false
      });
    }

    function radialShell(rocket, count, speed, colors, options = {}) {
      for (let index = 0; index < count; index += 1) {
        const angle = Math.PI * 2 * index / count + random(-.019, .019);
        addParticle(
          rocket.x + Math.cos(angle) * (options.opening ?? 5),
          rocket.y + Math.sin(angle) * (options.opening ?? 5),
          angle,
          speed * random(options.speedMin ?? .91, options.speedMax ?? 1.08),
          colors[index % colors.length],
          options
        );
      }
    }

    function explode(rocket) {
      const { palette, scale } = rocket;
      const outerCount = Math.round((compact ? 52 : 82) * scale);
      if (rocket.pattern === 2) {
        // Kamuro: long, warm-gold fronds from traditional Japanese displays.
        radialShell(rocket, outerCount, 3.75 * scale, ['#fffbe8', '#ffd96c', '#efa92e'], {
          speedMin: .78, speedMax: 1.12, decay: compact ? .0095 : .0075,
          drag: .976, gravity: .086, width: compact ? 1.2 : 1.48, flicker: true, opening: 7
        });
        radialShell(rocket, Math.round(outerCount * .38), 2.25 * scale, ['#fffdf0', '#ffc84e'], {
          decay: .014, drag: .968, gravity: .06, width: .78, opening: 3
        });
      } else {
        // Chrysanthemum / peony: two concentric colour layers.
        radialShell(rocket, outerCount, (rocket.pattern === 0 ? 4.45 : 4.05) * scale, [palette[1], palette[2], palette[3]], {
          speedMin: .94, speedMax: 1.055, decay: compact ? .0135 : .0105,
          drag: .964, gravity: .056, width: compact ? 1.02 : 1.28, opening: 7
        });
        radialShell(rocket, Math.round(outerCount * .48), 2.25 * scale, [palette[0], palette[3], palette[1]], {
          speedMin: .94, speedMax: 1.05, decay: .017,
          drag: .958, gravity: .045, width: compact ? .78 : .98, opening: 3
        });
      }
      for (let index = 0; index < (compact ? 9 : 16); index += 1) {
        addParticle(rocket.x, rocket.y, random(0, Math.PI * 2), random(.45, 1.7) * scale, index % 3 ? '#ffd66b' : '#fffdf0', {
          decay: random(.021, .033), drag: .94, gravity: .08, width: .7,
          delay: random(0, 3), flicker: true
        });
      }
      flashes.push({ x: rocket.x, y: rocket.y, radius: 4, alpha: .48, color: palette[1] });
      document.dispatchEvent(new CustomEvent('kansai:firework', {
        detail: { intensity: Number(scale.toFixed(2)), x: rocket.x / width, y: rocket.y / height }
      }));
    }

    function launch() {
      updateSafeZones(true);
      const anchor = anchors[launchIndex % anchors.length];
      const pattern = launchIndex % 3;
      const scale = random(compact ? .82 : .94, compact ? 1.04 : 1.16);
      const radius = clamp(Math.min(width, height) * (compact ? .16 : .195) * scale, compact ? 54 : 96, compact ? 88 : 154);
      const site = chooseSite(radius, anchor);
      if (!site) return false;
      const adjustedScale = scale * site.radius / radius;
      const startX = clamp(site.x + random(-width * .055, width * .055), 10, width - 10);
      rockets.push({
        startX, startY: height + 12,
        targetX: site.x,
        targetY: site.y - (pattern === 2 ? Math.min(18, site.radius * .13) : 0),
        x: startX, y: height + 12, px: startX, py: height + 12,
        curve: random(-width * .025, width * .025),
        elapsed: 0,
        duration: random(compact ? 980 : 1060, compact ? 1230 : 1350),
        palette: palettes[launchIndex % palettes.length],
        scale: adjustedScale,
        pattern
      });
      launchIndex += 1;
      return true;
    }

    function update(elapsedMs) {
      const step = elapsedMs / (1000 / 60);
      for (let index = rockets.length - 1; index >= 0; index -= 1) {
        const rocket = rockets[index];
        rocket.px = rocket.x;
        rocket.py = rocket.y;
        rocket.elapsed += elapsedMs;
        const progress = Math.min(1, rocket.elapsed / rocket.duration);
        const eased = easeOut(progress);
        rocket.x = rocket.startX + (rocket.targetX - rocket.startX) * eased + Math.sin(Math.PI * progress) * rocket.curve;
        rocket.y = rocket.startY + (rocket.targetY - rocket.startY) * eased;
        if (progress >= 1) {
          explode(rocket);
          rockets.splice(index, 1);
        }
      }
      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        if (particle.delay > 0) {
          particle.delay -= step;
          continue;
        }
        particle.px = particle.x;
        particle.py = particle.y;
        particle.vx *= Math.pow(particle.drag, step);
        particle.vy = particle.vy * Math.pow(particle.drag, step) + particle.gravity * step;
        particle.x += particle.vx * step;
        particle.y += particle.vy * step;
        particle.alpha -= particle.decay * step;
        if (particle.alpha <= .015 || particle.y > height + 36) particles.splice(index, 1);
      }
      for (let index = flashes.length - 1; index >= 0; index -= 1) {
        flashes[index].radius += 3.4 * step;
        flashes[index].alpha -= .11 * step;
        if (flashes[index].alpha <= 0) flashes.splice(index, 1);
      }
    }

    function clearSafeZones() {
      updateSafeZones();
      safeZones.forEach(zone => ctx.clearRect(zone.x, zone.y, zone.w, zone.h));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      rockets.forEach(rocket => {
        ctx.beginPath();
        ctx.moveTo(rocket.px, rocket.py + 11);
        ctx.lineTo(rocket.x, rocket.y);
        ctx.strokeStyle = '#ffd56f';
        ctx.globalAlpha = .66;
        ctx.lineWidth = compact ? 1 : 1.25;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(rocket.x, rocket.y, compact ? 1.35 : 1.7, 0, Math.PI * 2);
        ctx.fillStyle = '#fffdf4';
        ctx.globalAlpha = .95;
        ctx.fill();
      });
      particles.forEach(particle => {
        if (particle.delay > 0) return;
        const flicker = particle.flicker && Math.random() < .15 ? .42 : 1;
        ctx.beginPath();
        ctx.moveTo(particle.px, particle.py);
        ctx.lineTo(particle.x, particle.y);
        ctx.strokeStyle = particle.color;
        ctx.globalAlpha = Math.max(0, particle.alpha * flicker * .92);
        ctx.lineWidth = particle.width;
        ctx.stroke();
        if (particle.alpha > .48) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, Math.max(.58, particle.width * .72), 0, Math.PI * 2);
          ctx.globalAlpha = particle.alpha * .82;
          ctx.fillStyle = particle.color;
          ctx.fill();
        }
      });
      flashes.forEach(flash => {
        const radius = Math.min(25, flash.radius * 1.8);
        const glow = ctx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, radius);
        glow.addColorStop(0, '#fffef4');
        glow.addColorStop(.22, flash.color);
        glow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(flash.x, flash.y, radius, 0, Math.PI * 2);
        ctx.globalAlpha = flash.alpha;
        ctx.fillStyle = glow;
        ctx.fill();
      });
      clearSafeZones();
      ctx.restore();
    }

    function drawStaticScene() {
      ctx.clearRect(0, 0, width, height);
      updateSafeZones(true);
      const targets = compact ? anchors.slice(0, 2) : [anchors[0], anchors[1], anchors[2]];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      targets.forEach((anchor, burstIndex) => {
        const site = chooseSite(compact ? 48 : 82, anchor);
        if (!site) return;
        const count = compact ? 38 : 58;
        for (let index = 0; index < count; index += 1) {
          const angle = Math.PI * 2 * index / count;
          const outer = site.radius * (.84 + Math.sin(index * 2.9) * .05);
          ctx.beginPath();
          ctx.moveTo(site.x + Math.cos(angle) * site.radius * .14, site.y + Math.sin(angle) * site.radius * .14);
          ctx.lineTo(site.x + Math.cos(angle) * outer, site.y + Math.sin(angle) * outer);
          ctx.strokeStyle = palettes[burstIndex % palettes.length][index % 4];
          ctx.globalAlpha = .36;
          ctx.lineWidth = index % 5 ? .72 : 1.12;
          ctx.stroke();
        }
      });
      clearSafeZones();
      ctx.restore();
    }

    function resize() {
      width = Math.max(1, innerWidth);
      height = Math.max(1, innerHeight);
      const pixelRatio = Math.min(devicePixelRatio || 1, compact ? 1 : 1.15);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      safeZoneKey = '';
      if (reduced) drawStaticScene();
    }

    function animate(now) {
      if (destroyed) return;
      frameId = requestAnimationFrame(animate);
      const layer = canvas.closest('.seasonal-layer');
      if (document.hidden || layer?.classList.contains('is-paused') || layer?.classList.contains('media-fullscreen')) {
        lastTick = now;
        nextLaunch = now + 700;
        return;
      }
      const elapsedMs = now - lastTick;
      if (elapsedMs < (compact ? 42 : 32)) return;
      lastTick = now;
      if (now >= nextLaunch && rockets.length < 1) {
        launch();
        nextLaunch = now + random(compact ? 3200 : 2700, compact ? 4700 : 4100);
      }
      update(Math.min(50, elapsedMs));
      draw();
    }

    resize();
    addEventListener('resize', resize, { passive: true });
    if (!reduced) frameId = requestAnimationFrame(animate);
    return {
      destroy() {
        destroyed = true;
        cancelAnimationFrame(frameId);
        removeEventListener('resize', resize);
        rockets.length = 0;
        particles.length = 0;
        flashes.length = 0;
        ctx.clearRect(0, 0, width, height);
      }
    };
  }

  function compactMode() {
    return matchMedia('(max-width: 680px)').matches ||
      motionQuery.matches ||
      navigator.connection?.saveData === true ||
      navigator.deviceMemory <= 4 || navigator.hardwareConcurrency <= 4;
  }

  function syncFireworks(force = false) {
    const canvas = document.querySelector('.seasonal-theme-newyear .seasonal-fireworks-canvas');
    if (!force && canvas === activeCanvas) return;
    controller?.destroy();
    controller = null;
    activeCanvas = canvas || null;
    if (!canvas) return;
    requestAnimationFrame(() => {
      if (!canvas.isConnected || canvas !== activeCanvas) return;
      controller = createEngine(canvas, compactMode());
    });
  }

  document.addEventListener('kansai-season-change', syncFireworks);
  const syncMotionPreference = () => syncFireworks(true);
  if (typeof motionQuery.addEventListener === 'function') motionQuery.addEventListener('change', syncMotionPreference);
  else motionQuery.addListener(syncMotionPreference);
  addEventListener('pageshow', syncFireworks);
  addEventListener('pagehide', () => {
    controller?.destroy();
    controller = null;
    activeCanvas = null;
  });
  syncFireworks();
})();
