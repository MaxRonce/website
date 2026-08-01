'use client';

import { useEffect, useRef } from 'react';

import type { GalaxyLook } from '@/content/site';
import { paintGalaxy } from '@/lib/galaxyPainter';

/**
 * A static 2D-canvas rendering of a procedural galaxy, reusing the same
 * painter as the WebGL textures. Used by the mobile journey and the
 * reduced-motion overview, where no WebGL scene is mounted.
 */
export function GalaxyCanvasView({
  look,
  size = 220,
  className,
}: {
  look: GalaxyLook;
  size?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scale = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * scale;
    canvas.height = size * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    paintGalaxy(ctx, size * scale, look);
  }, [look, size]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
