'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { useEffect } from 'react';

import { scrollBus } from '@/lib/scrollBus';

/**
 * Mounts Lenis smooth scrolling and wires it into GSAP's ticker and
 * ScrollTrigger. Renders nothing.
 */
export function SmoothScroll() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      lerp: 0.11,
      smoothWheel: true,
    });
    scrollBus.lenis = lenis;

    lenis.on('scroll', () => ScrollTrigger.update());

    const update = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
      scrollBus.lenis = null;
    };
  }, []);

  return null;
}
