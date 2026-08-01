'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import styles from '@/components/styles/journey.module.css';
import type { Milestone } from '@/content/site';
import type { IdentityContent } from '@/content/types';
import { journey } from '@/lib/journeyStore';
import type { MediaFlags } from '@/lib/useMediaFlags';
import { useMediaFlags } from '@/lib/useMediaFlags';
import { HeroContent } from '@/components/HeroContent';
import { MilestoneOverlay } from '@/components/MilestoneOverlay';
import { MobileJourney } from '@/components/MobileJourney';
import { StaticJourney } from '@/components/StaticJourney';

const CosmicCanvas = dynamic(() => import('@/components/CosmicCanvas'), {
  ssr: false,
  loading: () => <div className="cosmic-css-fallback" aria-hidden="true" />,
});

export type CosmicJourneyProps = {
  identity: IdentityContent;
  milestones: Milestone[];
  epochStart: string;
};

/**
 * Entry point of the cosmic journey. Chooses the right experience:
 *
 * - desktop / tablet with motion allowed → pinned 400vh WebGL journey;
 * - touch / narrow viewport → simplified vertical sequence, no hijacking;
 * - prefers-reduced-motion or no WebGL → static overview of the milestones.
 *
 * Before hydration completes we render the hero plus an sr-only milestone
 * list, so all journey content exists as crawlable, accessible HTML.
 */
export default function CosmicJourney(props: CosmicJourneyProps) {
  const flags = useMediaFlags();

  if (!flags.mounted) {
    return <JourneyShellFallback {...props} />;
  }
  if (flags.reducedMotion) {
    return (
      <StaticJourney
        identity={props.identity}
        milestones={props.milestones}
        epochStart={props.epochStart}
      />
    );
  }
  if (flags.isMobile) {
    return (
      <MobileJourney
        identity={props.identity}
        milestones={props.milestones}
        epochStart={props.epochStart}
      />
    );
  }
  return <DesktopJourney {...props} flags={flags} />;
}

/** SSR / pre-hydration markup: crisp hero + sr-only milestone content. */
function JourneyShellFallback({ identity, milestones }: CosmicJourneyProps) {
  return (
    <section className={styles.journey} aria-label="Research journey">
      <div className={styles.sticky}>
        <div className="cosmic-css-fallback" aria-hidden="true" />
        <HeroContent identity={identity} />
        <SrMilestoneList milestones={milestones} />
      </div>
    </section>
  );
}

function SrMilestoneList({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="sr-only">
      {milestones.map((milestone, index) => (
        <li key={milestone.id}>
          {String(index + 1).padStart(2, '0')} — {milestone.title} ({milestone.dateLabel}):{' '}
          {milestone.description}
        </li>
      ))}
    </ol>
  );
}

function DesktopJourney({
  identity,
  milestones,
  epochStart,
  flags,
}: CosmicJourneyProps & { flags: MediaFlags }) {
  const wrapperRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const stageCount = milestones.length;

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const ctx = gsap.context(() => {
      // Scroll → journey store. The CSS-sticky inner viewport does the
      // pinning; this trigger only maps scroll progress onto the 3D stages.
      ScrollTrigger.create({
        trigger: wrapper,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          journey.progress = self.progress;
          journey.stage = self.progress * (stageCount - 1);
          const index = Math.min(stageCount - 1, Math.round(self.progress * (stageCount - 1)));
          setActiveIndex((previous) => (previous === index ? previous : index));
        },
      });

      // Scrubbed HTML choreography: the hero recedes without vanishing, hints
      // disappear early, and the whole scene breathes out at the very end so
      // the release into the portfolio feels continuous.
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      });
      timeline
        .to('[data-scroll-hint]', { opacity: 0, duration: 0.05 }, 0.02)
        .to('[data-hero-block]', { opacity: 0.78, y: -34, duration: 0.2 }, 0.05)
        .to('[data-hero-block]', { opacity: 0, y: -80, duration: 0.15 }, 0.78)
        .to('[data-canvas-wrap]', { opacity: 0.45, duration: 0.12 }, 0.88);
    }, wrapper);

    return () => {
      ctx.revert();
      journey.progress = 0;
      journey.stage = 0;
    };
  }, [stageCount]);

  const fieldCount = flags.isTablet ? 1800 : 3400;
  const lensing = !flags.coarsePointer;
  const lensingRadiusPx = flags.isTablet ? 230 : 330;

  return (
    <section className={styles.journey} ref={wrapperRef} aria-label="Research journey">
      <div className={styles.sticky}>
        <div className={styles.canvasWrap} data-canvas-wrap>
          <CosmicCanvas
            fieldCount={fieldCount}
            lensing={lensing}
            lensingRadiusPx={lensingRadiusPx}
          />
        </div>

        <HeroContent identity={identity} />
        <MilestoneOverlay
          milestones={milestones}
          epochStart={epochStart}
          activeIndex={activeIndex}
        />
        <SrMilestoneList milestones={milestones} />

        <p className={styles.scrollHint} data-scroll-hint aria-hidden="true">
          scroll to explore
          <span className={styles.scrollHintLine} />
        </p>
      </div>
    </section>
  );
}
