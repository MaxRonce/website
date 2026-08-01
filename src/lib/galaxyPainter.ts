import * as THREE from 'three';

import type { GalaxyLook, RGB } from '@/content/types';

/** Deterministic 32-bit PRNG so galaxies look identical on every visit. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rgba([r, g, b]: RGB, alpha: number): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixRgb(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/**
 * Paints a procedural spiral galaxy — "light painting" style.
 *
 * Instead of a pointillist cloud, each logarithmic arm is drawn as a smooth,
 * tapering ribbon of light in three passes (wide ambient glow → mid band →
 * thin bright ridge), with a gentle sine wobble for an organic flow. Colour
 * runs core → arm → violet edge along the arm. On top: a fainter offset
 * wisp per arm, sparse fine stars hugging the arms, a handful of glowing
 * accent knots, a dust lane carved along the ridge's inner edge, and an
 * elongated two-scale core with a lens-flare streak lying in the disc plane.
 */
export function paintGalaxy(
  ctx: CanvasRenderingContext2D,
  size: number,
  look: GalaxyLook,
): void {
  const rand = mulberry32(look.seed);
  const c = size / 2;
  const maxR = c * 0.94;
  const detailed = size >= 512;
  const px = size / 512;

  const armStep = (Math.PI * 2) / look.arms;
  const swirlAt = (radius: number) => look.tightness * Math.log(1 + radius / (maxR * 0.09));
  const edgeColour = mixRgb(look.arm, [190, 160, 255], 0.45);
  const armColourAt = (t: number): RGB =>
    t < 0.5 ? mixRgb(look.core, look.arm, t * 2) : mixRgb(look.arm, edgeColour, (t - 0.5) * 2);

  const armPhases: number[] = [];
  for (let arm = 0; arm < look.arms; arm += 1) {
    armPhases.push(arm * armStep + (rand() - 0.5) * 0.2);
  }

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(c, c);
  ctx.rotate(look.positionAngle);
  ctx.scale(1, look.inclination);

  // Ambient halo.
  const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR);
  halo.addColorStop(0, rgba(look.arm, 0.15));
  halo.addColorStop(0.5, rgba(look.arm, 0.06));
  halo.addColorStop(1, rgba(look.arm, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(-c, -c, size, size);

  // Flowing arms: three ribbon passes, wide → narrow.
  const passes = [
    { width: 0.085, alpha: 0.05 },
    { width: 0.042, alpha: 0.095 },
    { width: 0.016, alpha: 0.16 },
  ];
  const steps = detailed ? 300 : 140;
  for (let arm = 0; arm < look.arms; arm += 1) {
    const phase = armPhases[arm];
    for (const pass of passes) {
      for (let i = 0; i < steps; i += 1) {
        const t = i / steps;
        const radius = (0.05 + 0.95 * t) * maxR;
        const theta = swirlAt(radius) + phase + Math.sin(t * 7.3 + look.seed) * 0.045;
        const x = Math.cos(theta) * radius;
        const y = Math.sin(theta) * radius;
        const blobR = maxR * pass.width * (0.35 + 0.95 * t);
        const alpha = pass.alpha * (1 - t * 0.72);
        const colour = armColourAt(t);
        const glow = ctx.createRadialGradient(x, y, 0, x, y, blobR);
        glow.addColorStop(0, rgba(colour, alpha));
        glow.addColorStop(1, rgba(colour, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, blobR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // A fainter offset wisp trailing each arm.
    const wispSteps = Math.floor(steps / 2);
    for (let i = 0; i < wispSteps; i += 1) {
      const t = 0.25 + (0.75 * i) / wispSteps;
      const radius = (0.05 + 0.95 * t) * maxR;
      const theta = swirlAt(radius) + phase + 0.17 - t * 0.06;
      const x = Math.cos(theta) * radius;
      const y = Math.sin(theta) * radius;
      const blobR = maxR * 0.024 * (0.4 + t);
      const colour = armColourAt(Math.min(1, t * 1.15));
      const glow = ctx.createRadialGradient(x, y, 0, x, y, blobR);
      glow.addColorStop(0, rgba(colour, 0.05 * (1 - t * 0.6)));
      glow.addColorStop(1, rgba(colour, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, blobR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Fine stars hugging the arms.
  const starCount = detailed ? 950 : 380;
  for (let i = 0; i < starCount; i += 1) {
    const arm = i % look.arms;
    const frac = 0.08 + 0.92 * Math.sqrt(rand());
    const radius = frac * maxR;
    const jitter = (rand() + rand() - 1) * 0.11;
    const theta = swirlAt(radius) + armPhases[arm] + jitter;
    const x = Math.cos(theta) * radius;
    const y = Math.sin(theta) * radius;
    const colour = mixRgb(armColourAt(frac), [255, 255, 255], 0.4);
    const alpha = (0.18 + rand() * 0.55) * (1 - frac * 0.45);
    ctx.fillStyle = rgba(colour, alpha);
    ctx.beginPath();
    ctx.arc(x, y, (0.3 + rand() * 0.8) * px, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glowing accent knots.
  const knotCount = Math.max(4, Math.round((detailed ? 340 : 170) * look.knotFraction));
  for (let i = 0; i < knotCount; i += 1) {
    const arm = i % look.arms;
    const frac = 0.3 + rand() * 0.6;
    const radius = frac * maxR;
    const theta = swirlAt(radius) + armPhases[arm] + (rand() - 0.5) * 0.06;
    const x = Math.cos(theta) * radius;
    const y = Math.sin(theta) * radius;
    const r = (5 + rand() * 9) * px;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, rgba(look.knot, 0.4));
    glow.addColorStop(0.4, rgba(look.knot, 0.14));
    glow.addColorStop(1, rgba(look.knot, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(mixRgb(look.knot, [255, 255, 255], 0.5), 0.75);
    ctx.beginPath();
    ctx.arc(x, y, 1.1 * px, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dust lane carved along the inner edge of each ridge.
  ctx.globalCompositeOperation = 'destination-out';
  const dustCount = detailed ? 650 : 260;
  for (let i = 0; i < dustCount; i += 1) {
    const arm = i % look.arms;
    const frac = 0.16 + rand() * 0.6;
    const radius = frac * maxR;
    const theta = swirlAt(radius) + armPhases[arm] - 0.075 + (rand() - 0.5) * 0.05;
    const x = Math.cos(theta) * radius;
    const y = Math.sin(theta) * radius;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.04 + rand() * 0.07})`;
    ctx.beginPath();
    ctx.arc(x, y, (1 + rand() * 2.4) * px, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  // Elongated warm core.
  ctx.save();
  ctx.rotate(0.3);
  ctx.scale(1.35, 1);
  const warmSpread = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR * 0.3);
  warmSpread.addColorStop(0, rgba(look.core, 0.55));
  warmSpread.addColorStop(0.45, rgba(look.core, 0.2));
  warmSpread.addColorStop(1, rgba(look.core, 0));
  ctx.fillStyle = warmSpread;
  ctx.beginPath();
  ctx.arc(0, 0, maxR * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Hot centre.
  const hotCore = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR * 0.1);
  hotCore.addColorStop(0, rgba(mixRgb(look.core, [255, 255, 255], 0.85), 0.98));
  hotCore.addColorStop(0.5, rgba(mixRgb(look.core, [255, 255, 255], 0.35), 0.45));
  hotCore.addColorStop(1, rgba(look.core, 0));
  ctx.fillStyle = hotCore;
  ctx.beginPath();
  ctx.arc(0, 0, maxR * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Lens-flare streak lying in the disc plane.
  ctx.save();
  ctx.scale(1, 0.1);
  const streak = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR * 0.6);
  streak.addColorStop(0, rgba(mixRgb(look.core, [255, 255, 255], 0.6), 0.28));
  streak.addColorStop(1, rgba(look.core, 0));
  ctx.fillStyle = streak;
  ctx.beginPath();
  ctx.arc(0, 0, maxR * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();

  // A few sharp foreground stars, unsquashed.
  const foreground = detailed ? 8 : 4;
  for (let i = 0; i < foreground; i += 1) {
    const x = rand() * size;
    const y = rand() * size;
    const r = (0.5 + rand()) * px;
    const star = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    star.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    star.addColorStop(0.3, 'rgba(220, 230, 255, 0.22)');
    star.addColorStop(1, 'rgba(220, 230, 255, 0)');
    ctx.fillStyle = star;
    ctx.beginPath();
    ctx.arc(x, y, r * 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Renders a galaxy into a THREE.CanvasTexture. Client-side only. */
export function createGalaxyTexture(look: GalaxyLook, size = 1024): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D canvas context unavailable');
  }
  paintGalaxy(ctx, size, look);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}
