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
 * Paints a procedural galaxy in a dense, painterly "nebula" style, after the
 * user's references: a fully filled disc of saturated colour — blazing
 * cream/gold core, hot mid-tones, deep navy/violet rim masses — built from
 * hundreds of soft, tangentially stretched cloud blobs following the spiral
 * flow, an irregular blotchy silhouette, dust darkening, and a heavy speckle
 * of thousands of tiny stars over the whole disc.
 */
export function paintGalaxy(
  ctx: CanvasRenderingContext2D,
  size: number,
  look: GalaxyLook,
): void {
  const rand = mulberry32(look.seed);
  const gauss = () => rand() + rand() + rand() - 1.5;
  const c = size / 2;
  const maxR = c * 0.88;
  const detailed = size >= 512;
  const px = size / 512;

  const armStep = (Math.PI * 2) / look.arms;
  const swirlAt = (radius: number) => look.tightness * Math.log(1 + radius / (maxR * 0.1));
  const armPhases: number[] = [];
  for (let arm = 0; arm < look.arms; arm += 1) {
    armPhases.push(arm * armStep + (rand() - 0.5) * 0.25);
  }

  /** Colour across the disc: core → mid → rim. */
  const discColourAt = (frac: number): RGB => {
    const t = Math.min(1.15, frac);
    if (t < 0.3) return mixRgb(look.core, look.arm, t / 0.3);
    return mixRgb(look.arm, look.rim, Math.min(1, (t - 0.3) / 0.65));
  };

  /** A point on the spiral flow at a given radial fraction. */
  const armSample = (frac: number): { x: number; y: number; theta: number } => {
    const arm = Math.floor(rand() * look.arms);
    const radius = frac * maxR;
    // Tight enough that individual arms stay legible with 4–5 of them.
    const spread = 0.15 + 0.36 * frac;
    const theta = swirlAt(radius) + armPhases[arm] + gauss() * spread;
    return { x: Math.cos(theta) * radius, y: Math.sin(theta) * radius, theta };
  };

  /** Soft elliptical cloud, stretched along the local flow direction. */
  const blob = (
    x: number,
    y: number,
    radius: number,
    angle: number,
    stretch: number,
    colour: RGB,
    alpha: number,
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(stretch, 1);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, rgba(colour, alpha));
    gradient.addColorStop(1, rgba(colour, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(c, c);
  ctx.rotate(look.positionAngle);
  ctx.scale(1, look.inclination);

  // 1 — deep rim wash: broad dark-navy masses defining the outskirts,
  // extending past maxR for an irregular, blotchy silhouette.
  const rimCount = detailed ? 170 : 75;
  for (let i = 0; i < rimCount; i += 1) {
    const frac = 0.45 + rand() * 0.62;
    const p = armSample(frac);
    blob(
      p.x,
      p.y,
      maxR * (0.09 + rand() * 0.1),
      p.theta + Math.PI / 2,
      1.6 + rand() * 1.1,
      mixRgb(look.rim, look.arm, rand() * 0.3),
      0.055,
    );
  }
  // Detached outer clumps breaking the ellipse edge.
  const clumpCount = detailed ? 13 : 6;
  for (let i = 0; i < clumpCount; i += 1) {
    const frac = 0.85 + rand() * 0.35;
    const p = armSample(frac);
    for (let j = 0; j < 3; j += 1) {
      blob(
        p.x + gauss() * maxR * 0.06,
        p.y + gauss() * maxR * 0.06,
        maxR * (0.05 + rand() * 0.05),
        p.theta + Math.PI / 2,
        1.4 + rand(),
        look.rim,
        0.06,
      );
    }
  }

  // 2 — mid-disc clouds: the dominant hue, filling the disc.
  const midCount = detailed ? 270 : 115;
  for (let i = 0; i < midCount; i += 1) {
    const frac = 0.14 + rand() * 0.68;
    const p = armSample(frac);
    blob(
      p.x,
      p.y,
      maxR * (0.05 + rand() * 0.075),
      p.theta + Math.PI / 2,
      1.5 + rand() * 1.2,
      discColourAt(frac + gauss() * 0.08),
      0.065,
    );
  }

  // 3 — warm inner clouds swirling into the core.
  const warmCount = detailed ? 140 : 60;
  for (let i = 0; i < warmCount; i += 1) {
    const frac = 0.03 + rand() * 0.32;
    const p = armSample(frac);
    blob(
      p.x,
      p.y,
      maxR * (0.035 + rand() * 0.055),
      p.theta + Math.PI / 2,
      1.4 + rand(),
      mixRgb(look.core, look.arm, Math.min(1, frac * 2.6)),
      0.08,
    );
  }

  // 4 — dust darkening: deep shadows carving depth into the bright disc.
  const dust: RGB = [8, 10, 28];
  const dustCount = detailed ? 150 : 60;
  for (let i = 0; i < dustCount; i += 1) {
    const frac = 0.35 + rand() * 0.7;
    const p = armSample(frac);
    blob(
      p.x,
      p.y,
      maxR * (0.05 + rand() * 0.09),
      p.theta + Math.PI / 2,
      1.8 + rand() * 1.2,
      dust,
      0.1,
    );
  }

  // 5 — the signature dense star speckle, everywhere on the disc.
  const starCount = detailed ? 5200 : 1900;
  for (let i = 0; i < starCount; i += 1) {
    const frac = Math.min(1.12, 0.02 + 1.05 * Math.sqrt(rand()));
    const p = armSample(frac);
    const local = discColourAt(frac);
    const colour = mixRgb(local, [255, 255, 255], 0.55 + rand() * 0.35);
    const alpha = (0.22 + rand() * 0.6) * (1 - Math.min(1, frac) * 0.35);
    const r = (0.28 + rand() * 0.75) * px;
    ctx.fillStyle = rgba(colour, alpha);
    if (r < 0.7) {
      ctx.fillRect(p.x, p.y, r * 2, r * 2);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Brighter sparkles.
  const sparkCount = detailed ? 46 : 20;
  for (let i = 0; i < sparkCount; i += 1) {
    const frac = 0.05 + rand() * 0.9;
    const p = armSample(frac);
    ctx.fillStyle = rgba([255, 255, 255], 0.75 + rand() * 0.25);
    ctx.beginPath();
    ctx.arc(p.x, p.y, (0.9 + rand() * 0.8) * px, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6 — glowing accent knots.
  const knotCount = Math.max(4, Math.round((detailed ? 280 : 130) * look.knotFraction));
  for (let i = 0; i < knotCount; i += 1) {
    const frac = 0.25 + rand() * 0.6;
    const p = armSample(frac);
    const r = (5 + rand() * 8) * px;
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    glow.addColorStop(0, rgba(look.knot, 0.35));
    glow.addColorStop(1, rgba(look.knot, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7 — blazing core: broad saturated glow + white-hot centre, elongated.
  ctx.save();
  ctx.rotate(0.35);
  ctx.scale(1.3, 1);
  const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR * 0.4);
  coreGlow.addColorStop(0, rgba(look.core, 0.85));
  coreGlow.addColorStop(0.35, rgba(mixRgb(look.core, look.arm, 0.45), 0.35));
  coreGlow.addColorStop(1, rgba(look.arm, 0));
  ctx.fillStyle = coreGlow;
  ctx.beginPath();
  ctx.arc(0, 0, maxR * 0.4, 0, Math.PI * 2);
  ctx.fill();

  const hotCore = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR * 0.13);
  hotCore.addColorStop(0, rgba(mixRgb(look.core, [255, 255, 255], 0.9), 1));
  hotCore.addColorStop(0.55, rgba(mixRgb(look.core, [255, 255, 255], 0.4), 0.55));
  hotCore.addColorStop(1, rgba(look.core, 0));
  ctx.fillStyle = hotCore;
  ctx.beginPath();
  ctx.arc(0, 0, maxR * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
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
