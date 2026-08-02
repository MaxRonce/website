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
    cameraPosition: [-0.2, 0.7, 12.4],
    cameraTarget: [1.2, -1.25, -3],
    baseScale: 5.0,
    labelSide: 'right',
    look: {
      seed: 11,
      arms: 4,
      tightness: 2.8,
      inclination: 0.62,
      positionAngle: -0.5,
      core: [255, 241, 214],
      arm: [206, 110, 206],
      rim: [44, 42, 110],
      knot: [255, 182, 228],
      knotFraction: 0.035,
    },
  },
  {
    worldPosition: [3.2, 1.6, -14],
    cameraPosition: [-0.6, 1.5, -4.5],
    cameraTarget: [2.3, 1.3, -16],
    baseScale: 5.8,
    labelSide: 'right',
    look: {
      seed: 42,
      arms: 3,
      tightness: 2.5,
      inclination: 0.72,
      positionAngle: 0.65,
      core: [255, 214, 140],
      arm: [255, 118, 64],
      rim: [30, 48, 110],
      knot: [255, 170, 90],
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
      arms: 4,
      tightness: 3.05,
      inclination: 0.8,
      positionAngle: 1.9,
      core: [235, 244, 255],
      arm: [110, 160, 255],
      rim: [42, 38, 105],
      knot: [160, 225, 255],
      knotFraction: 0.045,
      agnStrength: 1,
    },
  },
  {
    worldPosition: [2.8, 8.2, -46],
    cameraPosition: [-1.1, 7.1, -36],
    cameraTarget: [2.1, 7.0, -48],
    baseScale: 5.6,
    labelSide: 'left',
    look: {
      seed: 128,
      arms: 5,
      tightness: 2.95,
      inclination: 0.72,
      positionAngle: -1.15,
      core: [255, 228, 245],
      arm: [202, 103, 226],
      rim: [60, 29, 126],
      knot: [226, 177, 255],
      knotFraction: 0.065,
      density: 1.32,
    },
  },
];

/**
 * Merges editable milestone text with the code-owned 3D layout, newest first.
 * The journey always shows exactly as many milestones as there are layouts
 * (four): extra JSON entries are ignored, so /admin edits cannot break the 3D
 * choreography.
 */
export function buildMilestones(entries: MilestoneContent[]): Milestone[] {
  return [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, milestoneLayouts.length)
    .map((milestone, index) => ({
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
