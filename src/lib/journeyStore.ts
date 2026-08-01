import { milestones } from '@/content/site';

export type ScreenAnchor = {
  x: number;
  y: number;
  visible: boolean;
  /** 1 when this milestone is in focus, 0 when a neighbour is. */
  focus: number;
};

/**
 * Mutable, render-loop-friendly shared state for the cosmic journey.
 *
 * GSAP's ScrollTrigger writes into it, the R3F frame loop and the HTML overlay
 * read from it every frame. Keeping it outside React state avoids re-rendering
 * the tree 60 times per second.
 */
export type JourneyState = {
  /** Scroll progress through the pinned journey, 0 → 1. */
  progress: number;
  /** progress × (milestones - 1); fractional stage index, 0 → 3. */
  stage: number;
  /** Pointer position in canvas UV space (origin bottom-left), for the lens. */
  pointerUv: { x: number; y: number };
  /** Projected screen-space anchors for the milestone labels. */
  screen: ScreenAnchor[];
};

export const journey: JourneyState = {
  progress: 0,
  stage: 0,
  pointerUv: { x: 0.5, y: 0.5 },
  screen: milestones.map(() => ({ x: -9999, y: -9999, visible: false, focus: 0 })),
};

/** Triangular focus curve for milestone i at fractional stage s. */
export function milestoneFocus(stage: number, index: number): number {
  const d = Math.abs(stage - index);
  const f = Math.max(0, 1 - d);
  return f * f * (3 - 2 * f);
}
