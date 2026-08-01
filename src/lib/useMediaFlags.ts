'use client';

import { useEffect, useState } from 'react';

export type MediaFlags = {
  /** False during SSR and the very first client render. */
  mounted: boolean;
  reducedMotion: boolean;
  /** Coarse pointer — touch-first device. */
  coarsePointer: boolean;
  /** Narrow viewport or touch device: gets the simplified vertical journey. */
  isMobile: boolean;
  /** Mid-size viewport: full journey with reduced particle counts. */
  isTablet: boolean;
};

const initialFlags: MediaFlags = {
  mounted: false,
  reducedMotion: false,
  coarsePointer: false,
  isMobile: false,
  isTablet: false,
};

function computeFlags(): MediaFlags {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const width = window.innerWidth;
  return {
    mounted: true,
    reducedMotion,
    coarsePointer,
    isMobile: width < 820 || (coarsePointer && width < 1100),
    isTablet: width < 1240,
  };
}

export function useMediaFlags(): MediaFlags {
  const [flags, setFlags] = useState<MediaFlags>(initialFlags);

  useEffect(() => {
    const update = () => setFlags(computeFlags());
    update();

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => {
      motionQuery.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return flags;
}
