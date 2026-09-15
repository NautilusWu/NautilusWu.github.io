import { onReady, prefersReducedMotion } from './ready';

/**
 * The generative hero: a drifting node field crossed by curving particle
 * tracks — an event display, loosely. When a track passes close to a node the
 * node flashes, which is the detail that makes the two layers feel like one
 * system instead of two animations sharing a canvas.
 *
 * Performance notes:
 * - Node count scales with area and is hard-capped, so the O(n²) link pass is
 *   bounded at ~3k distance checks per frame. A spatial grid would be faster
 *   in principle and slower to read; measured, the whole draw costs ~0.08 ms
 *   per frame, so it buys nothing. (A version that batched the link strokes
 *   into four alpha tiers measured *slower*, 0.10 ms, because of the per-frame
 *   array churn. It is not the draw calls that cost anything here.)
 * - What actually costs on weak hardware is fill rate: the backing store is
 *   cleared and repainted every frame, and at `devicePixelRatio: 2` that is
 *   four times the pixels. Hence the 1.5x cap — on a soft particle field the
 *   difference is invisible and it halves the bandwidth.
 * - `QUALITY` tiers plus a frame-time monitor: rather than guessing at device
 *   class from user-agent hints, the loop measures itself and steps down —
 *   fewer nodes, then a single static frame — if the machine cannot hold a
 *   reasonable frame rate. It never steps back up, so it cannot oscillate.
 * - Colours are applied as `globalAlpha` over a single CSS colour string, so
 *   nothing has to parse `oklch()` by hand.
 * - The loop is not scheduled at all while the canvas is off screen or the
 *   tab is hidden — no rAF, no idle wake-ups.
 */

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** 0…1 excitation, decays each frame. Driven by passing tracks. */
  hit: number;
}

interface Track {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Constant turn per frame — a uniform magnetic field, in effect. */
  curl: number;
  life: number;
  trail: Float32Array;
  used: number;
}

const LINK_DIST = 132;
const LINK_DIST_SQ = LINK_DIST * LINK_DIST;
const TRAIL_POINTS = 30;

/**
 * Quality tiers, richest first. `area` is the viewport area each node gets, so
 * a bigger number means fewer nodes; `dpr` caps the backing-store scale.
 * Tier 0 draws one composed frame and stops.
 */
const QUALITY = [
  { maxNodes: 78, area: 15500, dpr: 1.5, tracks: 4 },
  { maxNodes: 34, area: 34000, dpr: 1, tracks: 2 },
  { maxNodes: 0, area: 0, dpr: 1, tracks: 0 },
] as const;

/** Frames per quality assessment. */
const SAMPLE_FRAMES = 90;

/**
 * How much slower than the display's own frame interval the average frame is
 * allowed to be before quality steps down.
 *
 * Calibrated against the fastest frame actually observed rather than a fixed
 * millisecond budget. A fixed budget bakes in an assumption of 60Hz: at a flat
 * 22ms, a 30Hz panel (or anything capped at 30fps) reports ~33ms frames, is
 * judged to be failing, and has the hero degraded twice and switched off while
 * performing perfectly for its refresh rate.
 */
const FRAME_BUDGET_RATIO = 1.6;

/** Floor for the calibrated budget, so a freak fast frame cannot make the
 *  threshold unreachably strict. */
const MIN_FRAME_BUDGET_MS = 20;

onReady(() => {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-field]');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let nodes: Node[] = [];
  let tracks: Track[] = [];
  let frame = 0;
  let raf = 0;
  let running = false;
  let inView = true;

  // Pointer parallax, eased toward the real position so it never snaps.
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false };

  /* Start one tier down on machines that report few cores, or when the user
     has asked for reduced data. These hints are weak, so they only pick the
     starting point — the frame monitor below is what actually decides. */
  let tier =
    (navigator.hardwareConcurrency ?? 8) <= 4 ||
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
      ? 1
      : 0;

  let sampleCount = 0;
  let sampleStart = 0;
  /** Fastest frame interval seen — stands in for the display's refresh rate. */
  let bestFrameMs = Infinity;
  let lastFrameAt = 0;

  const palette = { dim: 'rgb(120 128 140)', accent: 'rgb(60 90 190)' };

  const readPalette = () => {
    const styles = getComputedStyle(document.documentElement);
    const dim = styles.getPropertyValue('--fg-3').trim();
    const accent = styles.getPropertyValue('--accent').trim();
    if (dim) palette.dim = dim;
    if (accent) palette.accent = accent;
  };

  const seed = () => {
    const { maxNodes, area } = QUALITY[tier];
    const count = area ? Math.min(maxNodes, Math.max(12, Math.round((width * height) / area))) : 0;
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.14,
      vy: (Math.random() - 0.5) * 0.14,
      r: Math.random() * 1.15 + 0.55,
      hit: 0,
    }));
    tracks = [];
  };

  const resize = () => {
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, QUALITY[tier].dpr);
    width = box.width;
    height = box.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  };

  const spawnTrack = () => {
    const fromLeft = Math.random() > 0.5;
    const speed = 1.5 + Math.random() * 1.3;
    const angle = (Math.random() - 0.5) * 0.66;
    tracks.push({
      x: fromLeft ? -50 : width + 50,
      y: height * (0.12 + Math.random() * 0.76),
      vx: (fromLeft ? 1 : -1) * speed * Math.cos(angle),
      vy: speed * Math.sin(angle),
      curl: (Math.random() - 0.5) * 0.011,
      life: 1,
      trail: new Float32Array(TRAIL_POINTS * 2),
      used: 0,
    });
  };

  /* — Simulation ——————————————————————————————————————————————— */

  const step = () => {
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;

    for (const node of nodes) {
      node.x += node.vx;
      node.y += node.vy;
      node.hit *= 0.93;

      // Gentle repulsion so the field opens up around the cursor.
      if (pointer.active) {
        const dx = node.x - pointer.x;
        const dy = node.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14000 && d2 > 1) {
          const push = (1 - d2 / 14000) * 0.5;
          const d = Math.sqrt(d2);
          node.x += (dx / d) * push;
          node.y += (dy / d) * push;
        }
      }

      // Wrap rather than bounce: no visible walls.
      if (node.x < -24) node.x = width + 24;
      else if (node.x > width + 24) node.x = -24;
      if (node.y < -24) node.y = height + 24;
      else if (node.y > height + 24) node.y = -24;
    }

    for (const track of tracks) {
      const cos = Math.cos(track.curl);
      const sin = Math.sin(track.curl);
      const vx = track.vx * cos - track.vy * sin;
      const vy = track.vx * sin + track.vy * cos;
      track.vx = vx;
      track.vy = vy;
      track.x += vx;
      track.y += vy;

      // Ring buffer of trail points, oldest overwritten.
      const slot = (track.used % TRAIL_POINTS) * 2;
      track.trail[slot] = track.x;
      track.trail[slot + 1] = track.y;
      track.used += 1;

      // Excite any node the track passed near — this is the "hit".
      for (const node of nodes) {
        const dx = node.x - track.x;
        const dy = node.y - track.y;
        if (dx * dx + dy * dy < 900) node.hit = 1;
      }

      const out =
        track.x < -110 || track.x > width + 110 || track.y < -110 || track.y > height + 110;
      if (out && track.used > TRAIL_POINTS) track.life -= 0.045;
    }

    if (tracks.length) tracks = tracks.filter((track) => track.life > 0);
    if (tracks.length < QUALITY[tier].tracks && frame % 110 === 0) spawnTrack();
    frame += 1;
  };

  /* — Painting ————————————————————————————————————————————————— */

  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    // Links. Opacity falls off with distance, which reads as depth.
    ctx.strokeStyle = palette.dim;
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > LINK_DIST_SQ) continue;
        ctx.globalAlpha = 0.17 * (1 - d2 / LINK_DIST_SQ);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // Nodes. An excited node swells and switches to the accent colour.
    for (const node of nodes) {
      const excited = node.hit > 0.02;
      ctx.fillStyle = excited ? palette.accent : palette.dim;
      ctx.globalAlpha = 0.42 + node.hit * 0.55;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r + node.hit * 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tracks: the trail, then a bright head with a soft bloom.
    ctx.strokeStyle = palette.accent;
    ctx.lineCap = 'round';
    for (const track of tracks) {
      const points = Math.min(track.used, TRAIL_POINTS);
      for (let i = 1; i < points; i++) {
        const prev = ((track.used - points + i - 1) % TRAIL_POINTS) * 2;
        const curr = ((track.used - points + i) % TRAIL_POINTS) * 2;
        const fade = (i / points) * track.life;
        ctx.globalAlpha = 0.55 * fade;
        ctx.lineWidth = 0.4 + 1.5 * fade;
        ctx.beginPath();
        ctx.moveTo(track.trail[prev], track.trail[prev + 1]);
        ctx.lineTo(track.trail[curr], track.trail[curr + 1]);
        ctx.stroke();
      }

      ctx.fillStyle = palette.accent;
      ctx.globalAlpha = 0.12 * track.life;
      ctx.beginPath();
      ctx.arc(track.x, track.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.9 * track.life;
      ctx.beginPath();
      ctx.arc(track.x, track.y, 1.9, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  };

  /* — Scheduling ——————————————————————————————————————————————— */

  /**
   * Steps the quality down if the last batch of frames missed the budget.
   * Measures wall-clock frames rather than draw time on purpose: what matters
   * is whether the machine is keeping up overall, including the compositing
   * this canvas shares the frame with.
   */
  const assessFrameRate = (now: number) => {
    if (sampleStart === 0) {
      sampleStart = now;
      lastFrameAt = now;
      sampleCount = 0;
      return;
    }

    // Track the best interval as the stand-in for the refresh rate.
    const delta = now - lastFrameAt;
    lastFrameAt = now;
    if (delta > 0 && delta < bestFrameMs) bestFrameMs = delta;

    sampleCount += 1;
    if (sampleCount < SAMPLE_FRAMES) return;

    const average = (now - sampleStart) / sampleCount;
    sampleStart = now;
    sampleCount = 0;

    const budget = Math.max(MIN_FRAME_BUDGET_MS, bestFrameMs * FRAME_BUDGET_RATIO);
    if (average <= budget || tier >= QUALITY.length - 1) return;

    tier += 1;
    if (QUALITY[tier].maxNodes === 0) {
      // Out of tiers: leave the last frame on screen and stop burning cycles.
      stop();
      return;
    }
    resize();
  };

  const loop = (now: number) => {
    step();
    draw();
    assessFrameRate(now);
    if (running) raf = requestAnimationFrame(loop);
  };

  const start = () => {
    if (running || prefersReducedMotion()) return;
    if (QUALITY[tier].maxNodes === 0) return;
    running = true;
    sampleStart = 0;
    bestFrameMs = Infinity;
    raf = requestAnimationFrame(loop);
  };

  const stop = () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const sync = () => {
    if (inView && !document.hidden) start();
    else stop();
  };

  const onPointerMove = (event: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    pointer.tx = event.clientX - box.left;
    pointer.ty = event.clientY - box.top;
    pointer.active = true;
  };

  const onPointerLeave = () => {
    pointer.active = false;
  };

  const onThemeChange = () => {
    readPalette();
    if (!running) draw();
  };

  readPalette();
  resize();

  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (!running) draw();
  });
  resizeObserver.observe(canvas);

  const viewObserver = new IntersectionObserver((entries) => {
    inView = entries[0]?.isIntersecting ?? false;
    sync();
  });
  viewObserver.observe(canvas);

  const themeObserver = new MutationObserver(onThemeChange);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerleave', onPointerLeave);

  if (prefersReducedMotion()) {
    // One composed frame: the same picture, just not moving.
    for (let i = 0; i < 240; i++) step();
    draw();
  } else {
    sync();
  }

  return () => {
    stop();
    resizeObserver.disconnect();
    viewObserver.disconnect();
    themeObserver.disconnect();
    document.removeEventListener('visibilitychange', sync);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerleave', onPointerLeave);
  };
});
