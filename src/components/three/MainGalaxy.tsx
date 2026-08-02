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
  const outerGlowRef = useRef<THREE.Sprite>(null);
  const outerGlowMaterialRef = useRef<THREE.SpriteMaterial>(null);
  const illuminationRef = useRef(0);
  const currentScale = useRef(1);

  const texture = useMemo(() => createGalaxyTexture(milestone.look), [milestone.look]);
  const coreGlowTexture = useMemo(() => createRadialGlowTexture(96, 1.8), []);
  const outerGlowTexture = useMemo(() => createRadialGlowTexture(128, 1.15), []);
  const coreGlowColor = useMemo(() => {
    const [r, g, b] = milestone.look.core;
    return new THREE.Color(r / 255, g / 255, b / 255).lerp(new THREE.Color('#d9efff'), 0.28);
  }, [milestone.look.core]);
  const outerGlowColor = useMemo(() => {
    const [r, g, b] = milestone.look.arm;
    return new THREE.Color(r / 255, g / 255, b / 255).lerp(new THREE.Color('#8dbeff'), 0.16);
  }, [milestone.look.arm]);

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
      outerGlowTexture.dispose();
      halo.dispose();
    };
  }, [texture, coreGlowTexture, outerGlowTexture, halo]);

  useFrame((state, delta) => {
    const inner = innerRef.current;
    const wrapper = scaleRef.current;
    const material = materialRef.current;
    const haloMaterial = haloMaterialRef.current;
    const coreGlow = coreGlowRef.current;
    const coreGlowMaterial = coreGlowMaterialRef.current;
    const outerGlow = outerGlowRef.current;
    const outerGlowMaterial = outerGlowMaterialRef.current;
    if (
      !inner || !wrapper || !material || !haloMaterial || !coreGlow || !coreGlowMaterial ||
      !outerGlow || !outerGlowMaterial
    ) return;

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
    const dx = journey.routeHead.x - milestone.worldPosition[0];
    const dy = journey.routeHead.y - milestone.worldPosition[1];
    const dz = journey.routeHead.z - milestone.worldPosition[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const impact = 1 - THREE.MathUtils.smoothstep(distance, 0.06, 0.62);
    const illuminationTarget = Math.pow(impact, 0.72);
    const illuminationSpeed = illuminationTarget > illuminationRef.current ? 13 : 0.45;
    illuminationRef.current = THREE.MathUtils.damp(
      illuminationRef.current,
      illuminationTarget,
      illuminationSpeed,
      delta,
    );

    const illumination = illuminationRef.current;
    const shimmer = 0.96 + Math.sin(state.clock.elapsedTime * 2.8 + index * 1.7) * 0.04;
    material.opacity = (0.43 + 0.5 * focus + 0.38 * illumination) * releaseFade;
    haloMaterial.opacity = (0.1 + 0.3 * focus + 0.5 * illumination) * releaseFade;
    haloMaterial.size = 0.014 + 0.009 * illumination;

    const glowSize = (0.16 + illumination * 0.27) * shimmer;
    coreGlow.scale.set(glowSize, glowSize, 1);
    coreGlowMaterial.opacity = (0.018 + illumination * 0.94) * releaseFade;
    const outerGlowSize = (0.36 + illumination * 0.48) * shimmer;
    outerGlow.scale.set(outerGlowSize, outerGlowSize, 1);
    outerGlowMaterial.opacity = illumination * 0.2 * releaseFade;
  });

  return (
    <Billboard position={milestone.worldPosition} follow>
      <group ref={scaleRef}>
        <sprite ref={outerGlowRef} scale={[0.36, 0.36, 1]}>
          <spriteMaterial
            ref={outerGlowMaterialRef}
            map={outerGlowTexture}
            color={outerGlowColor}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </sprite>
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
