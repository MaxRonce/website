'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { journey } from '@/lib/journeyStore';

/**
 * Screen-space gravitational-lensing post-processing pass.
 *
 * The scene is rendered into an offscreen target, then blitted through a
 * fullscreen shader that bends UVs radially around the (smoothed) pointer —
 * light from nearby sources appears to wrap around the cursor, with a touch
 * of magnification and an extremely subtle chromatic separation. A faint
 * onboarding ring appears for a few seconds after the first pointer move and
 * then never again. Only the WebGL canvas is distorted; the HTML interface
 * sits above it untouched.
 */

const FRAGMENT = /* glsl */ `
  uniform sampler2D uScene;
  uniform vec2 uMouse;
  uniform float uAspect;
  uniform float uRadius;
  uniform float uStrength;

  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uAspect, 1.0);

    vec2 delta = (uv - uMouse) * aspect;
    float radius = length(delta);
    float influence = smoothstep(uRadius, 0.0, radius);
    float safeRadius = max(radius, 0.015);
    vec2 direction = delta / safeRadius;

    // Radial bend, stronger near the pointer, plus slight magnification.
    float bend = influence * uStrength / (safeRadius + 0.08);
    vec2 offset = (direction * bend) / aspect;

    vec3 colour;
    colour.r = texture2D(uScene, uv - offset * 1.06).r;
    colour.g = texture2D(uScene, uv - offset).g;
    colour.b = texture2D(uScene, uv - offset * 0.94).b;

    gl_FragColor = vec4(colour, 1.0);

    #include <colorspace_fragment>
  }
`;

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export function CursorLensingEffect({ radiusPx = 150 }: { radiusPx?: number }) {
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);
  const mouse = useRef(new THREE.Vector2(0.5, 0.5));

  const pass = useMemo(() => {
    const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
    );
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms: {
        uScene: { value: renderTarget.texture },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uAspect: { value: 1 },
        uRadius: { value: 0.15 },
        uStrength: { value: 0.0022 },
      },
      depthTest: false,
      depthWrite: false,
    });

    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(geometry, material));
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    return { renderTarget, geometry, material, scene, camera };
  }, []);

  useEffect(() => {
    const dpr = gl.getPixelRatio();
    pass.renderTarget.setSize(
      Math.max(1, Math.round(size.width * dpr)),
      Math.max(1, Math.round(size.height * dpr)),
    );
    pass.material.uniforms.uAspect.value = size.width / size.height;
    pass.material.uniforms.uRadius.value = radiusPx / size.height;
  }, [gl, size, pass, radiusPx]);

  useEffect(() => {
    return () => {
      pass.renderTarget.dispose();
      pass.geometry.dispose();
      pass.material.dispose();
    };
  }, [pass]);

  // Priority 1 takes over R3F's render loop: scene → target → lensing blit.
  useFrame((state, delta) => {
    const m = mouse.current;
    m.x = THREE.MathUtils.damp(m.x, journey.pointerUv.x, 8, delta);
    m.y = THREE.MathUtils.damp(m.y, journey.pointerUv.y, 8, delta);
    (pass.material.uniforms.uMouse.value as THREE.Vector2).copy(m);

    state.gl.setRenderTarget(pass.renderTarget);
    state.gl.render(state.scene, state.camera);
    state.gl.setRenderTarget(null);
    state.gl.render(pass.scene, pass.camera);
  }, 1);

  return null;
}
