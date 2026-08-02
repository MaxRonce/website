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
    armPhases.push(arm * armStep + (rand() - 0.5) * 0.14);
  }

  /** Colour across the disc: core → mid → rim. */
  const discColourAt = (frac: number): RGB => {
    const t = Math.min(1.15, frac);
    if (t < 0.3) return mixRgb(look.core, look.arm, t / 0.3);
    return mixRgb(look.arm, look.rim, Math.min(1, (t - 0.3) / 0.65));
  };

  /** A point and true local tangent on one logarithmic spiral arm. */
  const pointOnArm = (
    arm: number,
    frac: number,
    angularOffset = 0,
  ): { x: number; y: number; flowAngle: number } => {
    const radius = frac * maxR;
    const theta = swirlAt(radius) + armPhases[arm] + angularOffset;
    const tangentOffset = Math.atan((look.tightness * radius) / (radius + maxR * 0.1));
    return {
      x: Math.cos(theta) * radius,
      y: Math.sin(theta) * radius,
      flowAngle: theta + tangentOffset,
    };
  };

  /** A softly scattered sample around a randomly selected arm. */
  const armSample = (frac: number, spreadScale = 1, angularOffset = 0) => {
    const arm = Math.floor(rand() * look.arms);
    const spread = (0.1 + 0.3 * frac) * spreadScale;
    return pointOnArm(arm, frac, angularOffset + gauss() * spread);
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

  /** Round glow used for luminous stars, associations and compact nuclei. */
  const radialGlow = (
    x: number,
    y: number,
    radius: number,
    colour: RGB,
    alpha: number,
  ) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, rgba(colour, alpha));
    gradient.addColorStop(0.18, rgba(colour, alpha * 0.48));
    gradient.addColorStop(1, rgba(colour, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  };

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(c, c);
  ctx.rotate(look.positionAngle);
  ctx.scale(1, look.inclination);

  // A continuous exponential-like disc fills the inter-arm regions while its
  // low surface brightness keeps the spiral ridges distinguishable.
  const discWash = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR * 1.03);
  discWash.addColorStop(0, rgba(look.core, 0.2));
  discWash.addColorStop(0.26, rgba(mixRgb(look.core, look.arm, 0.55), 0.135));
  discWash.addColorStop(0.68, rgba(mixRgb(look.arm, look.rim, 0.55), 0.085));
  discWash.addColorStop(0.9, rgba(look.rim, 0.045));
  discWash.addColorStop(1, rgba(look.rim, 0));
  ctx.fillStyle = discWash;
  ctx.beginPath();
  ctx.arc(0, 0, maxR * 1.03, 0, Math.PI * 2);
  ctx.fill();

  // Low-contrast clouds are distributed over the whole disc, not only on the
  // spiral loci. This removes empty black wedges without flattening the arms.
  const discCloudCount = detailed ? 230 : 92;
  for (let i = 0; i < discCloudCount; i += 1) {
    const frac = 0.06 + Math.sqrt(rand()) * 0.94;
    const theta = rand() * Math.PI * 2;
    const radius = frac * maxR;
    blob(
      Math.cos(theta) * radius,
      Math.sin(theta) * radius,
      maxR * (0.045 + rand() * 0.055),
      theta + Math.PI / 2,
      1.35 + rand() * 0.8,
      mixRgb(discColourAt(frac), look.rim, 0.18 + rand() * 0.22),
      0.022 + (1 - frac) * 0.018,
    );
  }

  // 1 — deep rim wash: broad dark-navy masses defining the outskirts,
  // extending past maxR for an irregular, blotchy silhouette.
  const rimCount = detailed ? 160 : 70;
  for (let i = 0; i < rimCount; i += 1) {
    const frac = 0.45 + rand() * 0.62;
    const p = armSample(frac);
    blob(
      p.x,
      p.y,
      maxR * (0.07 + rand() * 0.075),
      p.flowAngle,
      1.5 + rand() * 0.8,
      mixRgb(look.rim, look.arm, rand() * 0.3),
      0.05,
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
        p.flowAngle,
        1.4 + rand(),
        look.rim,
        0.06,
      );
    }
  }

  // 2 — coherent arm ridges. These continuous, gently feathered backbones
  // keep the spiral structure legible beneath the more painterly cloud layers.
  const ridgeSteps = detailed ? 44 : 23;
  for (let arm = 0; arm < look.arms; arm += 1) {
    const armBrightness = 0.82 + rand() * 0.28;
    for (let step = 0; step < ridgeSteps; step += 1) {
      const frac = 0.08 + (step / (ridgeSteps - 1)) * 0.9;
      const p = pointOnArm(arm, frac, gauss() * (0.018 + 0.035 * frac));
      const outerFade = Math.min(1, Math.max(0, (1.04 - frac) / 0.18));
      blob(
        p.x,
        p.y,
        maxR * (0.022 + 0.018 * frac),
        p.flowAngle,
        2.2 + rand() * 0.65,
        mixRgb(discColourAt(frac), look.knot, 0.08 + rand() * 0.1),
        0.034 * armBrightness * outerFade,
      );
    }
  }

  // 3 — mid-disc clouds: the dominant hue, filling and feathering the arms.
  const midCount = detailed ? 270 : 115;
  for (let i = 0; i < midCount; i += 1) {
    const frac = 0.14 + rand() * 0.68;
    const p = armSample(frac);
    blob(
      p.x,
      p.y,
      maxR * (0.04 + rand() * 0.06),
      p.flowAngle,
      1.75 + rand(),
      discColourAt(frac + gauss() * 0.08),
      0.06,
    );
  }

  // 4 — warm inner clouds swirling into the core.
  const warmCount = detailed ? 140 : 60;
  for (let i = 0; i < warmCount; i += 1) {
    const frac = 0.03 + rand() * 0.32;
    const p = armSample(frac);
    blob(
      p.x,
      p.y,
      maxR * (0.035 + rand() * 0.055),
      p.flowAngle,
      1.4 + rand(),
      mixRgb(look.core, look.arm, Math.min(1, frac * 2.6)),
      0.08,
    );
  }

  // An older, diffuse stellar population follows the disc rather than the
  // arms. These mostly faint sources give the galaxy a continuous body.
  const discStarCount = detailed ? 4300 : 1450;
  for (let i = 0; i < discStarCount; i += 1) {
    const frac = 0.035 + Math.sqrt(rand()) * 0.94;
    const theta = rand() * Math.PI * 2;
    const radius = frac * maxR;
    const x = Math.cos(theta) * radius;
    const y = Math.sin(theta) * radius;
    const luminosity = Math.pow(rand(), 4.2);
    const colour = mixRgb(discColourAt(frac), [255, 247, 231], 0.4 + luminosity * 0.35);
    const alpha = (0.1 + luminosity * 0.46) * (1 - frac * 0.42);
    const starRadius = (0.17 + luminosity * 0.9) * px;
    ctx.fillStyle = rgba(colour, alpha);
    if (starRadius < 0.68) {
      ctx.fillRect(x, y, starRadius * 2, starRadius * 2);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, starRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 5 — dust darkening: narrow leading-edge lanes carve depth between arms.
  const dust: RGB = [8, 10, 28];
  const dustCount = detailed ? 150 : 60;
  for (let i = 0; i < dustCount; i += 1) {
    const frac = 0.35 + rand() * 0.7;
    const p = armSample(frac, 0.62, -0.07 - frac * 0.035);
    blob(
      p.x,
      p.y,
      maxR * (0.035 + rand() * 0.065),
      p.flowAngle,
      2 + rand(),
      dust,
      0.085,
    );
  }

  // 6 — resolved stellar populations. The steep luminosity distribution makes
  // most stars faint, with only a small high-mass tail producing visible glints.
  const starCount = detailed ? 8200 : 2800;
  for (let i = 0; i < starCount; i += 1) {
    const frac = Math.min(1.12, 0.02 + 1.05 * Math.pow(rand(), 0.62));
    const p = armSample(frac, 0.72 + rand() * 0.36);
    const local = discColourAt(frac);
    const luminosity = Math.pow(rand(), 3.4);
    const colour = mixRgb(local, [255, 255, 255], 0.6 + luminosity * 0.34);
    const radialFade = 1 - Math.min(1, frac) * 0.3;
    const alpha = (0.18 + luminosity * 0.78) * radialFade;
    const r = (0.22 + luminosity * 1.35) * px;
    ctx.fillStyle = rgba(colour, alpha);
    if (r < 0.7) {
      ctx.fillRect(p.x, p.y, r * 2, r * 2);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (luminosity > 0.82 && rand() > 0.48) {
      radialGlow(p.x, p.y, (2.8 + luminosity * 3.6) * px, colour, 0.15);
    }
  }

  // Young stellar associations trace short, clumpy sections inside the arms.
  const associationCount = detailed ? 120 : 46;
  for (let i = 0; i < associationCount; i += 1) {
    const frac = 0.14 + Math.pow(rand(), 0.78) * 0.78;
    const p = armSample(frac, 0.38);
    const memberCount = 5 + Math.floor(rand() * 9);
    const alongX = Math.cos(p.flowAngle);
    const alongY = Math.sin(p.flowAngle);
    const acrossX = -alongY;
    const acrossY = alongX;

    if (rand() > 0.56) {
      radialGlow(
        p.x,
        p.y,
        maxR * (0.012 + rand() * 0.012),
        mixRgb(look.knot, [255, 255, 255], 0.28),
        0.13,
      );
    }

    for (let member = 0; member < memberCount; member += 1) {
      const along = gauss() * maxR * 0.018;
      const across = gauss() * maxR * 0.006;
      const x = p.x + alongX * along + acrossX * across;
      const y = p.y + alongY * along + acrossY * across;
      const luminosity = 0.3 + Math.pow(rand(), 1.65) * 0.7;
      const radius = (0.32 + luminosity * 1.05) * px;
      const colour = mixRgb(look.knot, [255, 255, 255], 0.55 + luminosity * 0.35);
      ctx.fillStyle = rgba(colour, 0.38 + luminosity * 0.55);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Rare bright stars sit above the unresolved population.
  const sparkCount = detailed ? 72 : 28;
  for (let i = 0; i < sparkCount; i += 1) {
    const frac = 0.05 + rand() * 0.9;
    const p = armSample(frac, 0.72);
    const radius = (1 + rand() * 0.9) * px;
    radialGlow(p.x, p.y, radius * (3.2 + rand() * 1.8), [235, 245, 255], 0.16);
    ctx.fillStyle = rgba([255, 255, 255], 0.75 + rand() * 0.25);
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 7 — glowing accent knots.
  const knotCount = Math.max(4, Math.round((detailed ? 420 : 170) * look.knotFraction));
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

  const agnStrength = Math.max(0, Math.min(1, look.agnStrength ?? 0));

  // 8 — layered bulge: an extended old stellar population around a compact,
  // hotter centre gives the core a steeper and more natural light profile.
  ctx.save();
  ctx.rotate(0.35);
  ctx.scale(1.3, 1);
  ctx.globalCompositeOperation = 'screen';
  const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR * 0.38);
  coreGlow.addColorStop(0, rgba(look.core, 0.66));
  coreGlow.addColorStop(0.18, rgba(look.core, 0.48));
  coreGlow.addColorStop(0.48, rgba(mixRgb(look.core, look.arm, 0.48), 0.2));
  coreGlow.addColorStop(1, rgba(look.arm, 0));
  ctx.fillStyle = coreGlow;
  ctx.beginPath();
  ctx.arc(0, 0, maxR * 0.38, 0, Math.PI * 2);
  ctx.fill();

  const hotCoreRadius = maxR * (agnStrength > 0 ? 0.082 : 0.115);
  const hotCore = ctx.createRadialGradient(0, 0, 0, 0, 0, hotCoreRadius);
  hotCore.addColorStop(0, rgba(mixRgb(look.core, [255, 255, 255], 0.9), 1));
  hotCore.addColorStop(0.22, rgba(mixRgb(look.core, [255, 255, 255], 0.65), 0.82));
  hotCore.addColorStop(0.62, rgba(mixRgb(look.core, look.arm, 0.2), 0.34));
  hotCore.addColorStop(1, rgba(look.core, 0));
  ctx.fillStyle = hotCore;
  ctx.beginPath();
  ctx.arc(0, 0, hotCoreRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // One optional quasar: a blue-white unresolved point source with a compact
  // telescope-like PSF flare, kept small enough to preserve the host galaxy.
  if (agnStrength > 0) {
    const agnColour: RGB = [224, 242, 255];
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    radialGlow(0, 0, maxR * 0.12, agnColour, 0.13 * agnStrength);

    ctx.rotate(-0.18);
    const drawSpike = (length: number, width: number, alpha: number) => {
      const gradient = ctx.createLinearGradient(-length, 0, length, 0);
      gradient.addColorStop(0, rgba(agnColour, 0));
      gradient.addColorStop(0.42, rgba(agnColour, alpha * 0.16));
      gradient.addColorStop(0.5, rgba(agnColour, alpha));
      gradient.addColorStop(0.58, rgba(agnColour, alpha * 0.16));
      gradient.addColorStop(1, rgba(agnColour, 0));
      ctx.fillStyle = gradient;
      ctx.fillRect(-length, -width / 2, length * 2, width);
    };
    drawSpike(maxR * 0.23, Math.max(0.9, px * 0.85), 0.62 * agnStrength);
    ctx.rotate(Math.PI / 2);
    drawSpike(maxR * 0.14, Math.max(0.75, px * 0.65), 0.44 * agnStrength);

    radialGlow(0, 0, maxR * 0.038, agnColour, 0.98 * agnStrength);
    radialGlow(0, 0, maxR * 0.012, [255, 255, 255], agnStrength);
    ctx.fillStyle = rgba([255, 255, 255], agnStrength);
    ctx.beginPath();
    ctx.arc(0, 0, 1.8 * px, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

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
