(() => {
  'use strict';

  let controller = null;
  let activeCanvas = null;
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  // Canvas rocket/particle model informed by the MIT-licensed fireworks-js project:
  // https://github.com/crashmax-dev/fireworks-js.  The local renderer uses large,
  // layered Japanese shell forms and chooses complete burst circles in the free
  // space around live page content instead of clipping shells into narrow edges.
  function createFireworkEngine(canvas, compact) {
    const context = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!context) return { destroy() {} };

    const reducedMotion = reducedMotionQuery.matches;
    const newYearMode = Boolean(canvas.closest('.seasonal-theme-newyear'));
    const palettes = [
      ['#fffbe5', '#ffd654', '#ff8f32', '#ef304f'],
      ['#fffdf1', '#ffc933', '#ff4e92', '#b849ff'],
      ['#f4ffff', '#4ce4ff', '#397cff', '#9a51ff'],
      ['#fbffe9', '#62edb1', '#ffe03b', '#ff624a'],
      ['#fff9df', '#ffac35', '#ff3e72', '#4bdcff']
    ];
    const burstAnchors = newYearMode
      ? (compact
        ? [[0.24, 0.3], [0.74, 0.28], [0.51, 0.42], [0.26, 0.55], [0.74, 0.56]]
        : [[0.18, 0.25], [0.5, 0.28], [0.82, 0.24], [0.31, 0.48], [0.69, 0.47], [0.16, 0.62], [0.84, 0.61]])
      : (compact
        ? [[0.22, 0.25], [0.76, 0.32], [0.78, 0.41], [0.2, 0.58], [0.79, 0.66], [0.5, 0.2], [0.52, 0.72]]
        : [[0.47, 0.25], [0.18, 0.22], [0.8, 0.24], [0.28, 0.4], [0.73, 0.42], [0.17, 0.66], [0.83, 0.68], [0.43, 0.2], [0.57, 0.72]]);
    const rockets = [];
    const particles = [];
    const flashes = [];
    let width = 0;
    let height = 0;
    let frameId = 0;
    let launchIndex = 0;
    let lastFrame = performance.now();
    let nextLaunch = lastFrame + 180;
    let destroyed = false;
    let safeZoneKey = '';
    let safeZones = [];
    const recentBurstSites = [];

    const random = (min, max) => min + Math.random() * (max - min);
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const easeOutCubic = value => 1 - Math.pow(1 - value, 3);

    function drawStaticBurst(x, y, radius, palette, styleIndex) {
      context.save();
      context.globalCompositeOperation = 'lighter';
      context.lineCap = 'round';
      const count = compact ? 52 : 92;
      for (let index = 0; index < count; index += 1) {
        const angle = (Math.PI * 2 * index) / count + Math.sin(index * 3.73) * 0.018;
        const inner = radius * 0.08;
        const variance = styleIndex === 2 ? 0.17 * Math.sin(index * 2.37) : 0.055 * Math.sin(index * 4.11);
        const outer = radius * (0.87 + variance);
        context.beginPath();
        context.moveTo(x + Math.cos(angle) * inner * 2.2, y + Math.sin(angle) * inner * 2.2);
        context.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
        context.strokeStyle = palette[index % palette.length];
        context.globalAlpha = styleIndex === 2 ? 0.28 : 0.35;
        context.lineWidth = index % 5 === 0 ? 1.45 : 0.7;
        context.shadowColor = palette[index % palette.length];
        context.shadowBlur = 3;
        context.stroke();
        context.beginPath();
        context.arc(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer, index % 7 === 0 ? 1.7 : 0.9, 0, Math.PI * 2);
        context.fillStyle = palette[index % palette.length];
        context.globalAlpha = 0.58;
        context.fill();
      }
      for (let index = 0; index < Math.round(count * 0.55); index += 1) {
        const angle = (Math.PI * 2 * index) / Math.round(count * 0.55);
        const innerRadius = radius * (0.42 + 0.025 * Math.sin(index * 5.1));
        context.beginPath();
        context.arc(x + Math.cos(angle) * innerRadius, y + Math.sin(angle) * innerRadius, 1.15, 0, Math.PI * 2);
        context.fillStyle = palette[(index + 2) % palette.length];
        context.globalAlpha = 0.72;
        context.fill();
      }
      context.restore();
    }

    function drawReducedMotionScene() {
      context.clearRect(0, 0, width, height);
      updateSafeZones(true);
      const staticTargets = compact ? burstAnchors.slice(0, 2) : [burstAnchors[0], burstAnchors[1], burstAnchors[4]];
      staticTargets.forEach((anchor, index) => {
        const radius = clamp(Math.min(width, height) * (compact ? 0.11 : 0.145), compact ? 40 : 78, compact ? 66 : 132);
        const site = findBurstSite(radius, anchor);
        if (site) drawStaticBurst(site.x, site.y, site.radius, palettes[index % palettes.length], index % 3);
      });
      clearSafeZones();
    }

    function resize() {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, compact ? 1.2 : 1.6);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      safeZoneKey = '';
      if (reducedMotion) drawReducedMotionScene();
    }

    function updateSafeZones(force = false) {
      const key = `${window.scrollX}:${window.scrollY}:${width}:${height}`;
      if (!force && safeZoneKey === key) return;
      safeZoneKey = key;
      const selectors = newYearMode
        ? ['.site-nav', '.seasonal-holiday-note', '.hero h1', '.hero-actions', '.guide-thanks', '.hero-copy>p', '.media-gallery .single-controls', '.media-gallery .video-stage', '.mobile-bar', 'a[href]', 'button', 'select', 'input', 'video', 'audio']
        : [
          '.site-nav', '.hero .eyebrow', '.hero h1', '.hero-subtitle', '.hero-copy>p',
          '.guide-thanks', '.hero-actions', '.hero-notes', '.hero-art',
          '.chapter-heading', '.story-copy', '.story-visual', '.sea-copy', '.sea-image',
          '.shop-card', '.coupon-copy', '.coupon-paper', '.media-gallery',
          '.address-section>.wrap', '.seasonal-holiday-note'
        ];
      safeZones = [...document.querySelectorAll(selectors.join(','))].map(element => element.getBoundingClientRect()).filter(rect => (
        rect.bottom > 0 && rect.top < height && rect.right > 0 && rect.left < width
      )).map(rect => ({
        x: Math.max(0, rect.left - 14),
        y: Math.max(0, rect.top - 14),
        width: Math.min(width, rect.right + 14) - Math.max(0, rect.left - 14),
        height: Math.min(height, rect.bottom + 14) - Math.max(0, rect.top - 14)
      }));
    }

    function overlapPenalty(x, y, radius) {
      return safeZones.reduce((score, zone) => {
        const closestX = clamp(x, zone.x, zone.x + zone.width);
        const closestY = clamp(y, zone.y, zone.y + zone.height);
        const distance = Math.hypot(x - closestX, y - closestY);
        return score + (distance < radius ? Math.pow(radius - distance, 2) : 0);
      }, 0);
    }

    function findBurstSite(radius, preferredAnchor) {
      updateSafeZones();
      const minimumRadius = newYearMode ? (compact ? 42 : 72) : (compact ? 23 : 54);
      const radiusSteps = (newYearMode
        ? [radius, radius * 0.86, radius * 0.72, radius * 0.58, radius * 0.46]
        : [radius, radius * 0.82, radius * 0.66, radius * 0.5])
        .map(value => Math.max(minimumRadius, value))
        .filter((value, index, list) => index === 0 || Math.abs(value - list[index - 1]) > 2);
      let fallback = null;

      for (const testRadius of radiusSteps) {
        const margin = testRadius + (compact ? 7 : 14);
        const minY = Math.max(margin, compact ? 112 : 98);
        const maxY = Math.max(minY, height - margin - (compact ? 68 : 14));
        const candidates = [preferredAnchor, ...burstAnchors].map(anchor => ({
          x: clamp(width * anchor[0] + random(-width * 0.014, width * 0.014), margin, width - margin),
          y: clamp(height * anchor[1] + random(-height * 0.02, height * 0.02), minY, maxY),
          radius: testRadius
        }));
        if (newYearMode) {
          const columns = compact ? 6 : 12;
          const rows = compact ? 5 : 7;
          for (let row = 0; row < rows; row += 1) {
            for (let column = 0; column < columns; column += 1) {
              candidates.push({
                x: margin + (Math.max(0, width - margin * 2) * (column + .5)) / columns,
                y: minY + (Math.max(0, maxY - minY) * (row + .5)) / rows,
                radius: testRadius
              });
            }
          }
        }
        for (let index = 0; index < (compact ? 16 : 28); index += 1) {
          candidates.push({
            x: random(margin, Math.max(margin, width - margin)),
            y: random(minY, maxY),
            radius: testRadius
          });
        }
        candidates.forEach(candidate => {
          const contentOverlap = overlapPenalty(candidate.x, candidate.y, testRadius);
          const centerBlocked = pointBlocked(candidate.x, candidate.y, testRadius * 0.14);
          const crowding = recentBurstSites.reduce((score, previous) => {
            const separation = Math.hypot(candidate.x - previous.x, candidate.y - previous.y);
            const preferred = testRadius + previous.radius + (compact ? 20 : 42);
            return score + (separation < preferred ? Math.pow(preferred - separation, 2) * 2.1 : 0);
          }, 0);
          candidate.contentOverlap = contentOverlap;
          candidate.centerBlocked = centerBlocked;
          candidate.score = contentOverlap * 1000 + crowding;
        });
        const cleanCandidates = candidates.filter(candidate => candidate.contentOverlap === 0);
        if (cleanCandidates.length) {
          cleanCandidates.sort((a, b) => a.score - b.score);
          return cleanCandidates[0];
        }
        const centerClearCandidates = newYearMode ? [] : candidates.filter(candidate => !candidate.centerBlocked).sort((a, b) => a.score - b.score);
        if (!fallback && centerClearCandidates.length) fallback = centerClearCandidates[0];
      }
      return newYearMode || compact ? null : fallback;
    }

    function clearSafeZones() {
      updateSafeZones();
      safeZones.forEach(zone => context.clearRect(zone.x, zone.y, zone.width, zone.height));
    }

    function pointBlocked(x, y, padding = 0) {
      return safeZones.some(zone => (
        x >= zone.x - padding && x <= zone.x + zone.width + padding &&
        y >= zone.y - padding && y <= zone.y + zone.height + padding
      ));
    }

    function addParticle(x, y, angle, speed, color, scale, options = {}) {
      const trailLength = options.trailLength || (compact ? 4 : 7);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        decay: options.decay || random(0.008, 0.0135),
        drag: options.drag || random(0.956, 0.974),
        gravity: options.gravity || random(0.035, 0.065),
        width: (options.width || random(0.8, 1.45)) * scale,
        flicker: options.flicker ?? Math.random() < 0.36,
        delay: options.delay || 0,
        glow: options.glow || 3.8,
        maxTrail: trailLength,
        trail: []
      });
    }

    function explode(rocket) {
      const pattern = rocket.pattern;
      const scale = rocket.scale;
      const palette = rocket.palette;
      const outerCount = Math.round((newYearMode ? (compact ? 70 : 132) : (compact ? 52 : 104)) * Math.max(0.82, scale));
      const particleCap = newYearMode ? (compact ? 430 : 1180) : (compact ? 300 : 760);
      if (particles.length + outerCount * 2 > particleCap) particles.splice(0, Math.min(particles.length, outerCount));

      const radialShell = (count, speed, colors, options = {}) => {
        for (let index = 0; index < count; index += 1) {
          const angle = (Math.PI * 2 * index) / count + random(newYearMode ? -0.027 : -0.016, newYearMode ? 0.027 : 0.016);
          const velocity = speed * random(options.speedMin || 0.92, options.speedMax || 1.07);
          const opening = (options.opening || 6) * scale;
          addParticle(rocket.x + Math.cos(angle) * opening, rocket.y + Math.sin(angle) * opening, angle, velocity, colors[index % colors.length], scale * (options.particleScale || 1), {
            decay: random(options.decayMin || 0.006, options.decayMax || 0.0105),
            drag: random(options.dragMin || 0.962, options.dragMax || 0.976),
            gravity: random(options.gravityMin || 0.035, options.gravityMax || 0.061),
            trailLength: options.trailLength || (compact ? 5 : 8),
            width: options.width || random(0.72, 1.25),
            glow: options.glow || 4,
            flicker: options.flicker
          });
        }
      };

      if (pattern === 2) {
        // KAMURO / weeping willow: warm gold fronds hang and fall for a long time.
        radialShell(Math.round(outerCount * 0.9), 4.55 * scale, ['#fff6d8', '#ffd56b', '#e8a52f'], {
          speedMin: 0.72, speedMax: 1.16, decayMin: 0.0035, decayMax: 0.0059,
          dragMin: 0.976, dragMax: 0.986, gravityMin: 0.07, gravityMax: 0.105,
          trailLength: compact ? 7 : 11, width: 1.3, glow: 5.5, flicker: true
        });
        radialShell(Math.round(outerCount * 0.38), 2.55 * scale, ['#fffbe8', '#ffcf58'], {
          decayMin: 0.005, decayMax: 0.008, dragMin: 0.968, dragMax: 0.979,
          gravityMin: 0.045, gravityMax: 0.075, trailLength: compact ? 5 : 8, width: 0.88
        });
      } else {
        // Round Japanese chrysanthemum / peony shell, with a clean coloured core.
        radialShell(outerCount, (pattern === 0 ? 5.25 : 4.75) * scale, pattern === 0 ? [palette[1], palette[2], palette[3]] : [palette[2], palette[1], palette[3]], {
          speedMin: pattern === 0 ? 0.95 : 0.82, speedMax: pattern === 0 ? 1.045 : 1.13,
          decayMin: pattern === 0 ? 0.0058 : 0.007, decayMax: pattern === 0 ? 0.009 : 0.0115,
          dragMin: 0.965, dragMax: 0.978, gravityMin: 0.044, gravityMax: 0.068,
          trailLength: compact ? 4 : (pattern === 0 ? 6 : 5), width: pattern === 0 ? 0.9 : 1.02,
          glow: 3.4, opening: 8
        });
        radialShell(Math.round(outerCount * 0.54), (pattern === 3 ? 2.65 : 2.3) * scale, [palette[3], palette[2], palette[1]], {
          speedMin: 0.93, speedMax: 1.06, decayMin: 0.007, decayMax: 0.012,
          dragMin: 0.958, dragMax: 0.972, gravityMin: 0.032, gravityMax: 0.056,
          trailLength: compact ? 3 : 5, width: 0.76, glow: 3.2, opening: 4
        });
      }

      const emberCount = compact ? 16 : 34;
      for (let index = 0; index < emberCount; index += 1) {
        addParticle(rocket.x, rocket.y, random(0, Math.PI * 2), random(0.45, 2.15) * scale, index % 3 ? '#ffd36b' : '#fff9df', scale * 0.72, {
          decay: random(0.011, 0.022), drag: random(0.93, 0.966), gravity: random(0.055, 0.11),
          trailLength: compact ? 2 : 4, width: random(0.55, 1), glow: 6, flicker: true,
          delay: random(0, pattern === 2 ? 8 : 4)
        });
      }

      flashes.push({ x: rocket.x, y: rocket.y, radius: 1.5, alpha: 0.46, color: palette[1], maxRadius: 12 * scale });
      document.dispatchEvent(new CustomEvent('kansai:firework', {
        detail: { intensity: Number(scale.toFixed(2)), x: rocket.x / width, y: rocket.y / height }
      }));
    }

    function launch() {
      updateSafeZones(true);
      const anchor = burstAnchors[launchIndex % burstAnchors.length];
      const palette = palettes[launchIndex % palettes.length];
      const pattern = launchIndex % 4;
      let scale = newYearMode
        ? random(compact ? 0.82 : 1.18, compact ? 1.08 : 1.62)
        : random(compact ? 0.7 : 0.88, compact ? 0.96 : 1.34);
      const radius = newYearMode
        ? clamp(Math.min(width, height) * (compact ? 0.19 : 0.27) * scale, compact ? 58 : 128, compact ? 100 : 245)
        : clamp(Math.min(width, height) * (compact ? 0.18 : 0.22) * scale, compact ? 46 : 110, compact ? 86 : 210);
      const site = findBurstSite(radius, anchor);
      if (!site) return false;
      // Keep the visible crown and its gravity tail inside the radius that was
      // proven clear of page content; particles travel farther than their
      // nominal launch speed while their glow remains visible.
      scale *= site.radius / radius * (newYearMode ? (pattern === 2 ? 0.92 : 1) : (pattern === 2 ? 0.66 : 0.78));
      const targetX = site.x;
      const targetY = site.y - (pattern === 2 ? Math.min(28, site.radius * 0.18) : 0);
      recentBurstSites.push({ x: targetX, y: targetY, radius: site.radius });
      if (recentBurstSites.length > (compact ? 3 : 5)) recentBurstSites.shift();
      const startX = clamp(targetX + width * random(-0.075, 0.075), 8, width - 8);
      const startY = height + 14;
      rockets.push({
        startX,
        startY,
        targetX,
        targetY,
        x: startX,
        y: startY,
        curve: width * random(-0.038, 0.038),
        elapsed: 0,
        duration: random(compact ? 980 : 1050, compact ? 1270 : 1450),
        color: palette[0],
        palette,
        scale,
        pattern,
        maxTrail: compact ? 6 : 8,
        trail: []
      });
      launchIndex += 1;
      return true;
    }

    function update(step, elapsedMs) {
      for (let index = rockets.length - 1; index >= 0; index -= 1) {
        const rocket = rockets[index];
        rocket.trail.unshift([rocket.x, rocket.y]);
        if (rocket.trail.length > rocket.maxTrail) rocket.trail.pop();
        rocket.elapsed += elapsedMs;
        const progress = Math.min(1, rocket.elapsed / rocket.duration);
        const eased = easeOutCubic(progress);
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
        particle.trail.unshift([particle.x, particle.y]);
        if (particle.trail.length > particle.maxTrail) particle.trail.pop();
        particle.vx *= Math.pow(particle.drag, step);
        particle.vy = particle.vy * Math.pow(particle.drag, step) + particle.gravity * step;
        particle.x += particle.vx * step;
        particle.y += particle.vy * step;
        particle.alpha -= particle.decay * step;
        if (particle.alpha <= 0.015) particles.splice(index, 1);
      }

      for (let index = flashes.length - 1; index >= 0; index -= 1) {
        const flash = flashes[index];
        flash.radius += 3.15 * step;
        flash.alpha -= 0.09 * step;
        if (flash.alpha <= 0) flashes.splice(index, 1);
      }
    }

    function tracePath(points, x, y) {
      context.beginPath();
      const oldest = points[points.length - 1] || [x, y];
      context.moveTo(oldest[0], oldest[1]);
      for (let index = points.length - 2; index >= 0; index -= 1) context.lineTo(points[index][0], points[index][1]);
      context.lineTo(x, y);
    }

    function draw() {
      context.clearRect(0, 0, width, height);
      context.save();
      context.globalCompositeOperation = 'lighter';
      context.lineCap = 'round';
      context.lineJoin = 'round';

      rockets.forEach(rocket => {
        if (pointBlocked(rocket.x, rocket.y, compact ? 3 : 5)) return;
        const path = [[rocket.x, rocket.y], ...rocket.trail.filter(point => (
          Math.hypot(point[0] - rocket.x, point[1] - rocket.y) < (compact ? 42 : 64) &&
          !pointBlocked(point[0], point[1], compact ? 2 : 4)
        ))];
        for (let index = path.length - 1; index > 0; index -= 1) {
          const age = index / path.length;
          const end = path[index - 1];
          const dx = end[0] - path[index][0];
          const dy = end[1] - path[index][1];
          const distance = Math.max(0.001, Math.hypot(dx, dy));
          const segment = Math.min(distance, compact ? 13 : 18);
          context.beginPath();
          context.moveTo(end[0] - dx / distance * segment, end[1] - dy / distance * segment);
          context.lineTo(end[0], end[1]);
          context.globalAlpha = 0.14 + (1 - age) * 0.58;
          context.strokeStyle = index % 3 ? '#ffd979' : '#fff4d0';
          context.lineWidth = (compact ? 0.75 : 1.05) * (1.2 - age * 0.5);
          context.shadowColor = '#f2b84d';
          context.shadowBlur = 5;
          context.stroke();
        }
        context.beginPath();
        context.globalAlpha = 0.92;
        context.arc(rocket.x, rocket.y, compact ? 1.45 : 1.85, 0, Math.PI * 2);
        context.fillStyle = '#fff8e7';
        context.fill();
      });

      context.shadowBlur = 0;
      particles.forEach(particle => {
        if (particle.delay > 0) return;
        const flicker = particle.flicker && Math.random() < 0.17 ? 0.32 : 1;
        const maxTrailDistance = particle.maxTrail >= 8 ? (compact ? 38 : 58) : (compact ? 23 : 34);
        const path = [[particle.x, particle.y], ...particle.trail.filter(point => Math.hypot(point[0] - particle.x, point[1] - particle.y) < maxTrailDistance)];
        for (let index = path.length - 1; index > 0; index -= 1) {
          const age = index / path.length;
          const end = path[index - 1];
          const dx = end[0] - path[index][0];
          const dy = end[1] - path[index][1];
          const distance = Math.max(0.001, Math.hypot(dx, dy));
          const maxSegment = particle.maxTrail >= 8 ? (compact ? 10 : 15) : (compact ? 7 : 11);
          const segment = Math.min(distance, maxSegment);
          context.beginPath();
          context.moveTo(end[0] - dx / distance * segment, end[1] - dy / distance * segment);
          context.lineTo(end[0], end[1]);
          context.globalAlpha = Math.max(0, particle.alpha * flicker * (0.18 + (1 - age) * 0.64));
          context.strokeStyle = particle.color;
          context.lineWidth = particle.width * (1.03 - age * 0.48);
          context.shadowColor = particle.color;
          context.shadowBlur = compact ? particle.glow * 0.45 : particle.glow * 0.72;
          context.stroke();
        }
        if (particle.alpha > 0.45) {
          context.beginPath();
          context.arc(particle.x, particle.y, Math.max(0.55, particle.width * 0.72), 0, Math.PI * 2);
          context.globalAlpha = particle.alpha * 0.82;
          context.fillStyle = particle.color;
          context.fill();
        }
      });

      context.shadowBlur = 0;
      flashes.forEach(flash => {
        const glowRadius = Math.min(flash.maxRadius, flash.radius * 1.9);
        const glow = context.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, glowRadius);
        glow.addColorStop(0, '#fffef2');
        glow.addColorStop(0.16, flash.color);
        glow.addColorStop(1, 'transparent');
        context.beginPath();
        context.arc(flash.x, flash.y, glowRadius, 0, Math.PI * 2);
        context.globalAlpha = flash.alpha * 0.84;
        context.fillStyle = glow;
        context.fill();
      });
      clearSafeZones();
      context.restore();
    }

    function animate(now) {
      if (destroyed) return;
      const layer = canvas.closest('.seasonal-layer');
      if (document.hidden || layer?.classList.contains('is-paused') || layer?.classList.contains('media-fullscreen')) {
        lastFrame = now;
        nextLaunch = now + 500;
        frameId = requestAnimationFrame(animate);
        return;
      }

      const elapsedMs = Math.min(42, Math.max(0, now - lastFrame));
      const step = elapsedMs / (1000 / 60);
      lastFrame = now;
      if (now >= nextLaunch && rockets.length < (compact ? 1 : 2)) {
        launch();
        const earlySequence = launchIndex < 3;
        const quickVolley = !compact && launchIndex % 5 === 0;
        nextLaunch = now + (newYearMode
          ? (earlySequence ? (compact ? 1160 : 720) : quickVolley ? 620 : random(compact ? 2600 : 1700, compact ? 3900 : 2850))
          : (earlySequence ? (compact ? 1280 : 680) : quickVolley ? 520 : random(compact ? 3000 : 2100, compact ? 4400 : 3500)));
      }
      update(step, elapsedMs);
      draw();
      frameId = requestAnimationFrame(animate);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    if (!reducedMotion) frameId = requestAnimationFrame(animate);

    return {
      destroy() {
        destroyed = true;
        cancelAnimationFrame(frameId);
        window.removeEventListener('resize', resize);
        rockets.length = 0;
        particles.length = 0;
        flashes.length = 0;
        context.clearRect(0, 0, width, height);
      }
    };
  }

  function compactMode() {
    return matchMedia('(max-width: 680px)').matches ||
      reducedMotionQuery.matches ||
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
      controller = createFireworkEngine(canvas, compactMode());
    });
  }

  document.addEventListener('kansai-season-change', syncFireworks);
  const syncMotionPreference = () => syncFireworks(true);
  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', syncMotionPreference);
  } else {
    reducedMotionQuery.addListener(syncMotionPreference);
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) syncFireworks();
  });
  window.addEventListener('pageshow', syncFireworks);
  window.addEventListener('pagehide', () => {
    controller?.destroy();
    controller = null;
    activeCanvas = null;
  });
  syncFireworks();
})();
