'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { milestones } from '@/content/site';
import { journey } from '@/lib/journeyStore';

/**
 * The luminous pale-blue route connecting the four milestone galaxies.
 *
 * A Catmull-Rom curve threads a lead-in point, the four galaxy centres and an
 * exit point that dives toward the lower page. The tube's fragment shader
 * reveals the line progressively with scroll (`uReveal`), continues a fainter
 * hint segment toward the next destination (`uFaint`), keeps a soft glow at
 * the drawing head and sends a slow pulse of light travelling along the
 * revealed portion.
 */

const VERTEX = /* glsl */ `
  varying float vU;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    vU = uv.x;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPosition.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uReveal;
  uniform float uFaint;
  uniform float uPulse;
  uniform float uOpacity;
  uniform vec3 uColor;

  varying float vU;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    float solid = 1.0 - smoothstep(uReveal - 0.012, uReveal, vU);
    float faint = (1.0 - smoothstep(uFaint - 0.02, uFaint, vU)) * 0.16;
    float base = max(solid, faint);
    if (base <= 0.002) discard;

    // Tube centre (normal facing the camera) is brighter than its silhouette.
    float rim = abs(dot(normalize(vNormalW), normalize(vViewDir)));
    float core = pow(rim, 1.6);

    float headGlow = exp(-pow((uReveal - vU) * 90.0, 2.0)) * 1.3;
    float pulse = vU < uReveal ? exp(-pow((uPulse - vU) * 120.0, 2.0)) : 0.0;
    float softStart = smoothstep(0.0, 0.03, vU);

    float alpha = base * (0.3 + 0.7 * core) * uOpacity * softStart;
    vec3 colour = uColor * (alpha + (headGlow + pulse) * base * 0.8);
    gl_FragColor = vec4(colour, alpha);
  }
`;

export function GalaxyRoute() {
  const reveal = useRef(0.08);

  const { geometry, material, anchors } = useMemo(() => {
    const first = milestones[0].worldPosition;
    // The exit dives straight down through the final camera target's vertical
    // column: points directly below the look-at target project onto the exact
    // horizontal centre of the screen (whatever the aspect ratio), so the 3D
    // line leaves the viewport dead-centre and vertical — perfectly aligned
    // with the DOM route-continuation line that leads to the section index.
    const finalTarget = milestones[milestones.length - 1].cameraTarget;
    const points = [
      new THREE.Vector3(first[0] - 1.4, first[1] - 1.2, first[2] + 0.6),
      ...milestones.map((m) => new THREE.Vector3(...m.worldPosition)),
      new THREE.Vector3(finalTarget[0], finalTarget[1] - 3.5, finalTarget[2]),
      new THREE.Vector3(finalTarget[0], finalTarget[1] - 14, finalTarget[2]),
    ];
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    const tube = new THREE.TubeGeometry(curve, 380, 0.05, 10, false);

    // Curve parameter of each galaxy along the tube, found by nearest sample.
    const samples = 600;
    const sampled = curve.getSpacedPoints(samples);
    const anchorParams = milestones.map((m) => {
      const target = new THREE.Vector3(...m.worldPosition);
      let best = 0;
      let bestDistance = Infinity;
      for (let i = 0; i <= samples; i += 1) {
        const d = sampled[i].distanceToSquared(target);
        if (d < bestDistance) {
          bestDistance = d;
          best = i;
        }
      }
      return best / samples;
    });

    const shader = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uReveal: { value: anchorParams[0] + 0.05 },
        uFaint: { value: anchorParams[0] + 0.2 },
        uPulse: { value: 0 },
        uOpacity: { value: 0.85 },
        uColor: { value: new THREE.Color('#8DBEFF') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    return { geometry: tube, material: shader, anchors: anchorParams };
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state, delta) => {
    const shader = material;
    const stage = Math.min(journey.stage, milestones.length - 1);
    const i = Math.min(milestones.length - 2, Math.floor(stage));
    const f = stage - i;
    const eased = f * f * (3 - 2 * f);
    const head = THREE.MathUtils.lerp(anchors[i], anchors[i + 1], eased);

    // Small hint ahead of the head; at the very end, run out toward the page.
    const tail = THREE.MathUtils.smoothstep(stage, 2.55, 3) * (1 - anchors[milestones.length - 1] - 0.05);
    const target = Math.min(1, head + 0.05 + tail);
    reveal.current = THREE.MathUtils.damp(reveal.current, target, 5, delta);

    shader.uniforms.uReveal.value = reveal.current;
    shader.uniforms.uFaint.value = Math.min(1, reveal.current + 0.16);
    // Like the galaxies, the route dissolves quickly once the portfolio
    // scrolls over the scene — only the star field lingers.
    shader.uniforms.uOpacity.value = 0.85 * THREE.MathUtils.clamp(1 - journey.release * 4, 0, 1);
    shader.uniforms.uPulse.value = (state.clock.elapsedTime * 0.11) % 1 > reveal.current
      ? -1
      : (state.clock.elapsedTime * 0.11) % 1;
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}
