'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';

import { milestones } from '@/content/site';
import { journey, milestoneFocus } from '@/lib/journeyStore';

/**
 * Projects each milestone galaxy's world position into screen space every
 * frame and writes the result into the shared journey store, where the HTML
 * milestone overlay (outside the canvas) reads it to position its labels.
 */
export function ScreenProjector() {
  const scratch = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, size }) => {
    for (let i = 0; i < milestones.length; i += 1) {
      const m = milestones[i];
      scratch.set(m.worldPosition[0], m.worldPosition[1], m.worldPosition[2]);
      scratch.project(camera);

      const anchor = journey.screen[i];
      anchor.x = (scratch.x * 0.5 + 0.5) * size.width;
      anchor.y = (1 - (scratch.y * 0.5 + 0.5)) * size.height;
      anchor.visible =
        scratch.z < 1 &&
        anchor.x > -160 &&
        anchor.x < size.width + 160 &&
        anchor.y > -160 &&
        anchor.y < size.height + 160;
      anchor.focus = milestoneFocus(journey.stage, i);
    }
  });

  return null;
}
