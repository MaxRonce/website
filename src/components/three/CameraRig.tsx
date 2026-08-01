'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

import { milestones } from '@/content/site';
import { journey } from '@/lib/journeyStore';

/**
 * Drives the camera along a smooth Catmull-Rom path through the four
 * per-milestone camera positions (and a matching path of look-at targets), so
 * the camera genuinely travels through the scene instead of zooming in place.
 *
 * Within each stage the scroll fraction is eased (smoothstep) so the camera
 * dwells briefly at every milestone, and both position and target are damped
 * for a fluid, scrub-responsive ride. Scroll is the only input — the camera
 * never reacts to the mouse.
 */
export function CameraRig() {
  const curves = useMemo(() => {
    const positions = milestones.map((m) => new THREE.Vector3(...m.cameraPosition));
    const targets = milestones.map((m) => new THREE.Vector3(...m.cameraTarget));
    return {
      position: new THREE.CatmullRomCurve3(positions, false, 'catmullrom', 0.6),
      target: new THREE.CatmullRomCurve3(targets, false, 'catmullrom', 0.6),
    };
  }, []);

  const state = useRef({
    position: new THREE.Vector3(...milestones[0].cameraPosition),
    target: new THREE.Vector3(...milestones[0].cameraTarget),
    scratchPosition: new THREE.Vector3(),
    scratchTarget: new THREE.Vector3(),
  });

  useFrame(({ camera }, delta) => {
    const s = state.current;
    const stage = Math.min(journey.stage, milestones.length - 1);
    const i = Math.min(milestones.length - 2, Math.floor(stage));
    const f = stage - i;
    const eased = f * f * (3 - 2 * f);
    const t = (i + eased) / (milestones.length - 1);

    curves.position.getPoint(t, s.scratchPosition);
    curves.target.getPoint(t, s.scratchTarget);

    const lambda = 5.5;
    s.position.x = THREE.MathUtils.damp(s.position.x, s.scratchPosition.x, lambda, delta);
    s.position.y = THREE.MathUtils.damp(s.position.y, s.scratchPosition.y, lambda, delta);
    s.position.z = THREE.MathUtils.damp(s.position.z, s.scratchPosition.z, lambda, delta);
    s.target.x = THREE.MathUtils.damp(s.target.x, s.scratchTarget.x, lambda, delta);
    s.target.y = THREE.MathUtils.damp(s.target.y, s.scratchTarget.y, lambda, delta);
    s.target.z = THREE.MathUtils.damp(s.target.z, s.scratchTarget.z, lambda, delta);

    camera.position.copy(s.position);
    camera.lookAt(s.target);
  });

  return null;
}
