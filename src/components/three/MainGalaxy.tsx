'use client';

import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import type { Milestone } from '@/content/site';
import { milestones } from '@/content/site';
import { createGalaxyTexture, createRadialGlowTexture, mulberry32 } from '@/lib/galaxyPainter';
import { journey, milestoneFocus } from '@/lib/journeyStore';

/**
 * One of the four milestone galaxies: a billboarded plane carrying a
 * procedurally painted texture, a faint particle halo, and an extremely slow
 * spin. Scale and opacity respond to scroll focus so the current milestone
 * dominates the frame while its neighbours recede.
 */
export function MainGalaxy({ milestone, index }: { milestone: Milestone; index: number }) {
  const innerRef = useRef<THREE.Mesh>(null);
  const scaleRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const haloMaterialRef = useRef<THREE.PointsMaterial>(null);
  const coreGlowRef = useRef<THREE.Sprite>(null);
  const coreGlowMaterialRef = useRef<THREE.SpriteMaterial>(null);
  const currentScale = useRef(1);

  const texture = useMemo(() => createGalaxyTexture(milestone.look), [milestone.look]);
  const coreGlowTexture = useMemo(() => createRadialGlowTexture(96, 1.8), []);
  const coreGlowColor = useMemo(() => {
    const [r, g, b] = milestone.look.core;
    return new THREE.Color(r / 255, g / 255, b / 255).lerp(new THREE.Color('#d9efff'), 0.28);
  }, [milestone.look.core]);

  const halo = useMemo(() => {
    const rand = mulberry32(milestone.look.seed * 7 + 3);
    const count = 90;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const angle = rand() * Math.PI * 2;
      const radius = 1.6 + rand() * 1.9;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius * milestone.look.inclination;
      positions[i * 3 + 2] = (rand() - 0.5) * 0.6;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [milestone.look]);

  useEffect(() => {
    return () => {
      texture.dispose();
      coreGlowTexture.dispose();
      halo.dispose();
    };
  }, [texture, coreGlowTexture, halo]);

  useFrame((_, delta) => {
    const inner = innerRef.current;
    const wrapper = scaleRef.current;
    const material = materialRef.current;
    const haloMaterial = haloMaterialRef.current;
    const coreGlow = coreGlowRef.current;
    const coreGlowMaterial = coreGlowMaterialRef.current;
    if (!inner || !wrapper || !material || !haloMaterial || !coreGlow || !coreGlowMaterial) return;

    inner.rotation.z += delta * 0.02 * (index % 2 === 0 ? 1 : -1);

    const focus = milestoneFocus(journey.stage, index);
    const target = milestone.baseScale * (0.62 + 0.55 * focus);
    currentScale.current = THREE.MathUtils.damp(currentScale.current, target, 4, delta);
    wrapper.scale.setScalar(currentScale.current);

    // Once the portfolio takes over, galaxies dissolve much faster than the
    // rest of the scene (the star field lingers as the shared background).
    // The last galaxy — still centred when the sections arrive — already
    // starts dimming over the final stretch of the pinned journey, then
    // vanishes almost instantly on the first scroll into the portfolio.
    const isLast = index === milestones.length - 1;
    let releaseFade = THREE.MathUtils.clamp(1 - journey.release * (isLast ? 8 : 2.5), 0, 1);
    if (isLast) {
      releaseFade *= 1 - 0.5 * THREE.MathUtils.smoothstep(journey.progress, 0.9, 1);
    }
    material.opacity = (0.45 + 0.55 * focus) * releaseFade;
    haloMaterial.opacity = (0.12 + 0.35 * focus) * releaseFade;

    const dx = journey.routeHead.x - milestone.worldPosition[0];
    const dy = journey.routeHead.y - milestone.worldPosition[1];
    const dz = journey.routeHead.z - milestone.worldPosition[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const impact = 1 - THREE.MathUtils.smoothstep(distance, 0.08, 0.9);
    const glowSize = 0.17 + impact * 0.13;
    coreGlow.scale.set(glowSize, glowSize, 1);
    coreGlowMaterial.opacity = (0.025 + impact * 0.82) * releaseFade;
  });

  return (
    <Billboard position={milestone.worldPosition} follow>
      <group ref={scaleRef}>
        <mesh ref={innerRef}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={materialRef}
            map={texture}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        <sprite ref={coreGlowRef} scale={[0.17, 0.17, 1]}>
          <spriteMaterial
            ref={coreGlowMaterialRef}
            map={coreGlowTexture}
            color={coreGlowColor}
            transparent
            opacity={0.025}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
        <points geometry={halo} scale={[0.5, 0.5, 0.5]}>
          <pointsMaterial
            ref={haloMaterialRef}
            size={0.014}
            sizeAttenuation
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            color="#c9d8f5"
            opacity={0.25}
          />
        </points>
      </group>
    </Billboard>
  );
}
