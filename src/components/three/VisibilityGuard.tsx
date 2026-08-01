'use client';

import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

/** Pauses the render loop entirely while the tab is hidden. */
export function VisibilityGuard() {
  const setFrameloop = useThree((state) => state.setFrameloop);

  useEffect(() => {
    const onVisibility = () => {
      setFrameloop(document.hidden ? 'never' : 'always');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [setFrameloop]);

  return null;
}
