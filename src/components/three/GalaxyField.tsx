'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { journey } from '@/lib/journeyStore';
import { mulberry32 } from '@/lib/galaxyPainter';

/**
 * Deep-field background: thousands of barely resolved elliptical Gaussian
 * sources, LSST-style, rendered as a single THREE.Points draw call.
 *
 * The field is attached to the camera (copied every frame) so the backdrop is
 * always present while the camera travels; three depth layers get different
 * mouse-parallax factors so the nearest sources drift slightly more.
 */

const VERTEX = /* glsl */ `
  uniform vec2 uParallax;
  uniform float uPixelRatio;

  attribute float aSize;
  attribute float aRatio;
  attribute float aAngle;
  attribute float aBright;
  attribute float aLayer;
  attribute float aSpike;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vRatio;
  varying float vAngle;
  varying float vBright;
  varying float vSpike;

  void main() {
    vec3 p = position;
    // Layer 0 = far, 2 = near. Nearer layers drift more with scroll depth.
    float parallaxFactor = mix(0.5, 2.4, aLayer * 0.5);
    p.xy += uParallax * parallaxFactor;


    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp(aSize * uPixelRatio * (140.0 / -mvPosition.z), 1.5, 18.0 * uPixelRatio);
    gl_Position = projectionMatrix * mvPosition;

    vColor = aColor;
    vRatio = aRatio;
    vAngle = aAngle;
    vBright = aBright;
    vSpike = aSpike;
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vRatio;
  varying float vAngle;
  varying float vBright;
  varying float vSpike;

  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float s = sin(vAngle);
    float co = cos(vAngle);
    vec2 rc = vec2(co * c.x - s * c.y, s * c.x + co * c.y);
    rc.y /= vRatio;

    float r2 = dot(rc, rc);
    if (r2 > 1.0) discard;

    // Elliptical Gaussian profile — a crude single-component Sérsic stand-in.
    float profile = exp(-r2 * 4.5);

    // A few rare sharp four-pointed stars.
    float spikes = 0.0;
    if (vSpike > 0.5) {
      spikes = (exp(-abs(rc.x) * 22.0) + exp(-abs(rc.y) * 22.0)) * exp(-r2 * 1.4) * 0.55;
    }

    float amount = (profile + spikes) * vBright;
    gl_FragColor = vec4(vColor * amount, amount);
  }
`;

type FieldBuffers = {
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
  points: THREE.Points;
};

function buildField(count: number): FieldBuffers {
  const rand = mulberry32(20240501);

  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const ratios = new Float32Array(count);
  const angles = new Float32Array(count);
  const brights = new Float32Array(count);
  const layers = new Float32Array(count);
  const spikes = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  const warm: [number, number, number] = [1.0, 0.86, 0.7];
  const cool: [number, number, number] = [0.72, 0.82, 1.0];
  const violet: [number, number, number] = [0.82, 0.74, 1.0];

  for (let i = 0; i < count; i += 1) {
    // Weighted layers: mostly distant sources.
    const roll = rand();
    const layer = roll < 0.5 ? 0 : roll < 0.82 ? 1 : 2;
    const depth = layer === 0 ? 150 : layer === 1 ? 100 : 62;
    const spread = depth * 1.2;

    positions[i * 3] = (rand() * 2 - 1) * spread;
    positions[i * 3 + 1] = (rand() * 2 - 1) * spread * 0.72;
    positions[i * 3 + 2] = -depth + (rand() * 2 - 1) * 14;

    const isSpike = layer === 2 && rand() < 0.03;
    spikes[i] = isSpike ? 1 : 0;

    const sizeBase = layer === 0 ? 2.2 : layer === 1 ? 3.2 : 4.4;
    sizes[i] = sizeBase + rand() * sizeBase * 1.3 + (isSpike ? 3 : 0);
    ratios[i] = isSpike ? 1 : 0.32 + rand() * 0.68;
    angles[i] = rand() * Math.PI;
    brights[i] = (0.16 + rand() * rand() * 0.5) * (layer === 0 ? 0.7 : 1);
    layers[i] = layer;

    const t = rand();
    const base = t < 0.45 ? warm : t < 0.9 ? cool : violet;
    const jitter = 0.9 + rand() * 0.1;
    colors[i * 3] = base[0] * jitter;
    colors[i * 3 + 1] = base[1] * jitter;
    colors[i * 3 + 2] = base[2] * jitter;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aRatio', new THREE.BufferAttribute(ratios, 1));
  geometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
  geometry.setAttribute('aBright', new THREE.BufferAttribute(brights, 1));
  geometry.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));
  geometry.setAttribute('aSpike', new THREE.BufferAttribute(spikes, 1));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uParallax: { value: new THREE.Vector2(0, 0) },
      uPixelRatio: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return { geometry, material, points };
}

export function GalaxyField({ count }: { count: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const parallax = useRef(new THREE.Vector2(0, 0));
  const gl = useThree((state) => state.gl);

  const field = useMemo(() => buildField(count), [count]);

  useEffect(() => {
    field.material.uniforms.uPixelRatio.value = gl.getPixelRatio();
  }, [field, gl]);

  useEffect(() => {
    return () => {
      field.geometry.dispose();
      field.material.dispose();
    };
  }, [field]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    group.position.copy(state.camera.position);
    group.quaternion.copy(state.camera.quaternion);

    // Depth drift driven by scroll only — the field never reacts to the mouse.
    const p = parallax.current;
    p.x = THREE.MathUtils.damp(p.x, journey.progress * 1.2, 2.5, delta);
    p.y = THREE.MathUtils.damp(p.y, -journey.progress * 4.5, 2.5, delta);
    const uniform = field.material.uniforms.uParallax.value as THREE.Vector2;
    uniform.set(p.x, p.y);
  });

  return (
    <group ref={groupRef}>
      <primitive object={field.points} />
    </group>
  );
}
