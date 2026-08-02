'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

import styles from '@/components/styles/journey.module.css';
import type { Milestone } from '@/content/site';
import type { IdentityContent } from '@/content/types';
import { HeroContent } from '@/components/HeroContent';
import { MilestoneCard } from '@/components/MilestoneCard';

/**
 * Simplified vertical journey for touch / narrow viewports: no pinning, no
 * WebGL, no scroll hijacking. Each galaxy becomes a full-width milestone and
 * the pale-blue route is an SVG path progressively drawn while scrolling.
 */
export function MobileJourney({
  identity,
  milestones,
  redshiftRef,
}: {
  identity: IdentityContent;
  milestones: Milestone[];
  redshiftRef: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const path = pathRef.current;
    const list = listRef.current;
    if (!path || !list) return;

    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        path,
        { strokeDashoffset: length },
        {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: list,
            start: 'top 75%',
            end: 'bottom 55%',
            scrub: true,
          },
        },
      );

      gsap.utils.toArray<HTMLElement>('[data-milestone-card]').forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: { trigger: card, start: 'top 82%' },
          },
        );
      });
    }, list);

    return () => ctx.revert();
  }, []);

  return (
    <section className={styles.mobileJourney} aria-label="Research journey">
      <div className={styles.mobileHero}>
        <HeroContent identity={identity} />
        <p className={styles.scrollHint} aria-hidden="true">
          scroll to explore
        </p>
      </div>

      <div className={styles.mobileList} ref={listRef}>
        <svg
          className={styles.mobileRoute}
          viewBox="0 0 100 1000"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            ref={pathRef}
            d="M50 0 C 68 90, 32 160, 50 250 C 68 340, 32 410, 50 500 C 68 590, 32 660, 50 750 C 68 840, 32 910, 50 1000"
            fill="none"
            stroke="#8DBEFF"
            strokeWidth="1.6"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity="0.75"
          />
        </svg>
        <ol className={styles.mobileMilestones}>
          {milestones.map((milestone) => (
            <li key={milestone.id}>
              <MilestoneCard
                milestone={milestone}
                redshiftRef={redshiftRef}
                galaxySize={200}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
