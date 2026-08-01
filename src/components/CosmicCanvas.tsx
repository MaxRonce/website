'use client';

import { Canvas } from '@react-three/fiber';
import { useEffect, useState } from 'react';

import { milestones } from '@/content/site';
import { journey } from '@/lib/journeyStore';
import { CameraRig } from '@/components/three/CameraRig';
import { CursorLensingEffect } from '@/components/three/CursorLensingEffect';
import { GalaxyField } from '@/components/three/GalaxyField';
import { GalaxyRoute } from '@/components/three/GalaxyRoute';
import { MainGalaxy } from '@/components/three/MainGalaxy';
import { ScreenProjector } from '@/components/three/ScreenProjector';
import { VisibilityGuard } from '@/components/three/VisibilityGuard';

export type CosmicCanvasProps = {
  /** Number of background field sources. */
  fieldCount: number;
  /** Enables the cursor gravitational-lensing pass. */
  lensing: boolean;
  /** Lensing radius in CSS pixels. */
  lensingRadiusPx: number;
};

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
}

/**
 * The persistent 3D environment of the cosmic journey. Rendered inside the
 * pinned hero; everything textual stays in real HTML above this canvas.
 */
export default function CosmicCanvas({ fieldCount, lensing, lensingRadiusPx }: CosmicCanvasProps) {
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglAvailable(detectWebGL());
  }, []);

  // Pointer tracking (fine pointers only) — feeds the lensing pass exclusively;
  // nothing in the scene moves with the mouse.
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const onMove = (event: PointerEvent) => {
      journey.pointerUv.x = event.clientX / window.innerWidth;
      journey.pointerUv.y = 1 - event.clientY / window.innerHeight;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  if (webglAvailable === false) {
    return <div className="cosmic-css-fallback" aria-hidden="true" />;
  }
  if (webglAvailable === null) {
    return null;
  }

  return (
    <Canvas
      dpr={[1, 1.5]}
      flat
      camera={{
        fov: 48,
        near: 0.1,
        far: 400,
        position: milestones[0].cameraPosition,
      }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#030711', 1);
      }}
    >
      <VisibilityGuard />
      <CameraRig />
      <ScreenProjector />
      <GalaxyField count={fieldCount} />
      {milestones.map((milestone, index) => (
        <MainGalaxy key={milestone.id} milestone={milestone} index={index} />
      ))}
      <GalaxyRoute />
      {lensing ? <CursorLensingEffect radiusPx={lensingRadiusPx} /> : null}
    </Canvas>
  );
}
