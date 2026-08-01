/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CONTENT ENTRY POINT
 *
 *  All *text* content (identity, milestones, papers, posters, slides, reports,
 *  biography, links) lives in `content.json`, editable either directly or —
 *  without touching any code — through the /admin editor page.
 *
 *  This file only adds what a non-coder should never have to touch: the 3D
 *  layout of the cosmic journey (galaxy positions, camera keyframes, galaxy
 *  looks) which is merged with the JSON milestones by array order.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import rawContent from './content.json';
import type {
  GalaxyLook,
  MilestoneContent,
  SiteContent,
  Vec3,
} from './types';

export type { GalaxyLook, RGB, Vec3 } from './types';

const content = rawContent as SiteContent;

export type Paper = SiteContent['papers'][number];
export type Poster = SiteContent['posters'][number];
export type SlideDeck = SiteContent['slides'][number];
export type Report = SiteContent['reports'][number];
export type ExternalLink = SiteContent['externalLinks'][number];

export const redshiftTooltip =
  'A poetic visual mapping: elapsed time converted through the low-redshift approximation z ≈ H0 · Δt (H0 = 70 km/s/Mpc). One year ≈ Δz of 7.2 × 10⁻¹¹. Not a measured cosmological redshift.';

/** 3D layout of one journey stage — code-owned, not editable from /admin. */
type MilestoneLayout = {
  /** Position of the galaxy in the 3D scene. */
  worldPosition: Vec3;
  /** Where the camera rests when this milestone is in focus. */
  cameraPosition: Vec3;
  /** What the camera looks at when this milestone is in focus. */
  cameraTarget: Vec3;
  /** Base size of the galaxy billboard in world units. */
  baseScale: number;
  /** Which side of its galaxy the HTML label sits on. */
  labelSide: 'left' | 'right';
  look: GalaxyLook;
};

export type Milestone = Omit<MilestoneContent, 'href'> & { href?: string } & MilestoneLayout;

const milestoneLayouts: MilestoneLayout[] = [
  {
    worldPosition: [0.5, -2.6, 0],
    cameraPosition: [-0.2, 0.6, 10],
    cameraTarget: [1.2, -0.7, -3],
    baseScale: 5.0,
    labelSide: 'right',
    look: {
      seed: 11,
      arms: 2,
      tightness: 3.1,
      inclination: 0.62,
      positionAngle: -0.5,
      core: [255, 228, 190],
      arm: [148, 174, 232],
      knot: [255, 158, 128],
      knotFraction: 0.035,
    },
  },
  {
    worldPosition: [3.2, 1.6, -14],
    cameraPosition: [-0.6, 1.5, -4.5],
    cameraTarget: [2.3, 1.3, -16],
    baseScale: 5.8,
    labelSide: 'left',
    look: {
      seed: 42,
      arms: 3,
      tightness: 2.6,
      inclination: 0.72,
      positionAngle: 0.65,
      core: [255, 241, 224],
      arm: [150, 182, 255],
      knot: [255, 122, 142],
      knotFraction: 0.06,
    },
  },
  {
    worldPosition: [-3.2, 4.8, -30],
    cameraPosition: [1.3, 3.5, -20],
    cameraTarget: [-2.2, 4.3, -32],
    baseScale: 5.2,
    labelSide: 'right',
    look: {
      seed: 77,
      arms: 2,
      tightness: 3.6,
      inclination: 0.8,
      positionAngle: 1.9,
      core: [242, 228, 255],
      arm: [182, 162, 255],
      knot: [140, 200, 255],
      knotFraction: 0.045,
    },
  },
  {
    worldPosition: [2.8, 8.2, -46],
    cameraPosition: [-1.1, 7.1, -36],
    cameraTarget: [2.1, 7.9, -48],
    baseScale: 5.6,
    labelSide: 'left',
    look: {
      seed: 128,
      arms: 2,
      tightness: 2.9,
      inclination: 0.68,
      positionAngle: -1.15,
      core: [232, 246, 255],
      arm: [122, 198, 224],
      knot: [255, 194, 128],
      knotFraction: 0.04,
    },
  },
];

/**
 * Merges editable milestone text with the code-owned 3D layout, by array
 * order. The journey always shows exactly as many milestones as there are
 * layouts (four): extra JSON entries are ignored, so /admin edits cannot
 * break the 3D choreography.
 */
export function buildMilestones(entries: MilestoneContent[]): Milestone[] {
  return entries.slice(0, milestoneLayouts.length).map((milestone, index) => ({
    ...milestone,
    href: milestone.href === '' ? undefined : milestone.href,
    ...milestoneLayouts[index],
  }));
}

/**
 * Static snapshot used by the 3D components (positions, camera keyframes,
 * galaxy looks) — layout is code-owned, so build-time content is fine there.
 * Components that display *text* receive fresh content via props instead.
 */
export const milestones: Milestone[] = buildMilestones(content.milestones);

export const sectionIndex = [
  { id: 'papers', label: 'Papers' },
  { id: 'posters', label: 'Posters' },
  { id: 'slides', label: 'Slides' },
  { id: 'reports', label: 'Reports' },
  { id: 'about', label: 'About' },
  { id: 'links', label: 'CV / Links' },
] as const;
