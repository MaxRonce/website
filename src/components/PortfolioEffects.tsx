'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect } from 'react';

/**
 * Gentle entrance + parallax choreography for the portfolio after the cosmic
 * journey:
 *
 * - the blue route-continuation line draws itself downward onto the section
 *   index as the portfolio scrolls into view;
 * - each section fades up softly the first time it enters the viewport;
 * - section headers drift slightly slower than their content (vertical
 *   parallax);
 * - selected elements slide in from the sides ([data-reveal-side]) with a
 *   scrubbed, parallax-like motion.
 *
 * Skipped entirely under prefers-reduced-motion.
 */
export function PortfolioEffects() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const continuation = document.querySelector('[data-route-continuation]');
      if (continuation) {
        gsap.fromTo(
          continuation,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: continuation,
              start: 'top 96%',
              end: 'bottom 62%',
              scrub: true,
            },
          },
        );
      }

      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 56 },
          {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: 'power2.out',
            scrollTrigger: { trigger: element, start: 'top 84%', once: true },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((element) => {
        gsap.fromTo(
          element,
          { y: 44 },
          {
            y: -44,
            ease: 'none',
            scrollTrigger: {
              trigger: element.parentElement ?? element,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>('[data-reveal-side]').forEach((element) => {
        const fromLeft = element.dataset.revealSide === 'left';
        gsap.fromTo(
          element,
          { opacity: 0, x: fromLeft ? -110 : 110 },
          {
            opacity: 1,
            x: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: element,
              start: 'top 96%',
              end: 'top 58%',
              scrub: true,
            },
          },
        );
      });
    });

    return () => ctx.revert();
  }, []);

  return null;
}
