import type Lenis from 'lenis';

/**
 * Tiny module-level bus so the section navigation can drive the Lenis
 * instance created by <SmoothScroll /> without prop drilling.
 */
export const scrollBus: { lenis: Lenis | null } = {
  lenis: null,
};
