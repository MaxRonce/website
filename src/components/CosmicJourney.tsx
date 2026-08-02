'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';

import styles from '@/components/styles/journey.module.css';
import type { Milestone } from '@/content/site';
import type { IdentityContent } from '@/content/types';
import { journey } from '@/lib/journeyStore';
import type { MediaFlags } from '@/lib/useMediaFlags';
import { useMediaFlags } from '@/lib/useMediaFlags';
import { HeroContent } from '@/components/HeroContent';
import { MilestoneOverlay } from '@/components/MilestoneOverlay';
import { MobileJourney } from '@/components/MobileJourney';

const CosmicCanvas = dynamic(() => import('@/components/CosmicCanvas'), {
  ssr: false,
  loading: () => <div className="cosmic-css-fallback" aria-hidden="true" />,
});

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        canvas.getContext('experimental-webgl'),
    );
  } catch {
    return false;
  }
}

export type CosmicJourneyProps = {
  identity: IdentityContent;
  milestones: Milestone[];
  redshiftRef: string;
};

/**
 * Entry point of the cosmic journey. Chooses the right experience:
 *
 * - desktop / tablet → pinned 400vh WebGL journey;
 * - touch / narrow viewport → simplified vertical sequence, no hijacking.
 *
 * The full experience is shown regardless of the OS "reduced motion"
 * preference (explicit product decision — many Windows machines have
 * animation effects switched off without the user knowing).
 *
 * Before hydration completes we render the hero plus an sr-only milestone
 * list, so all journey content exists as crawlable, accessible HTML.
 */
export default function CosmicJourney(props: CosmicJourneyProps) {
  const flags = useMediaFlags();
  const [webglAvailable, setWebglAvailable] = useState<boolean | null>(null);
  const [experienceReady, setExperienceReady] = useState(false);
  const loaderStartedAt = useRef(0);
  const readyTimer = useRef<number | null>(null);

  const revealExperience = useCallback(() => {
    const elapsed = performance.now() - loaderStartedAt.current;
    const delay = Math.max(0, 650 - elapsed);
    if (readyTimer.current !== null) window.clearTimeout(readyTimer.current);
    readyTimer.current = window.setTimeout(() => setExperienceReady(true), delay);
  }, []);

  useEffect(() => {
    loaderStartedAt.current = performance.now();
    setWebglAvailable(detectWebGL());
    return () => {
      if (readyTimer.current !== null) window.clearTimeout(readyTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!flags.mounted || webglAvailable === null || (!flags.isMobile && webglAvailable)) return;

    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(revealExperience);
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [flags.isMobile, flags.mounted, revealExperience, webglAvailable]);

  if (!flags.mounted || webglAvailable === null) {
    return (
      <>
        <JourneyShellFallback {...props} />
        <UniverseLoader ready={false} />
      </>
    );
  }
  // Without WebGL (hardware acceleration off, old GPU…) the vertical journey
  // still shows real galaxies — they are painted with the 2D canvas API.
  if (flags.isMobile || !webglAvailable) {
    return (
      <>
        <MobileJourney
          identity={props.identity}
          milestones={props.milestones}
          redshiftRef={props.redshiftRef}
        />
        <UniverseLoader ready={experienceReady} />
      </>
    );
  }
  return (
    <>
      <DesktopJourney
        {...props}
        flags={flags}
        ready={experienceReady}
        onSceneReady={revealExperience}
      />
      <UniverseLoader ready={experienceReady} />
    </>
  );
}

function UniverseLoader({ ready }: { ready: boolean }) {
  return (
    <div
      className={styles.universeLoader}
      data-ready={ready ? 'true' : 'false'}
      role="status"
      aria-live="polite"
      aria-label={ready ? 'Universe ready' : 'Loading the universe'}
    >
      <div className={styles.loaderInner}>
        <p className={styles.loaderTitle}>Loading the universe</p>
        <span className={styles.loaderTrack} aria-hidden="true" />
        <p className={styles.loaderDetail}>Redshifting galaxies...</p>
      </div>
    </div>
  );
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
      {milestones.map((milestone) => (
        <li key={milestone.id}>
          {milestone.dateLabel} — {milestone.title}:{' '}
          {milestone.description}
        </li>
      ))}
    </ol>
  );
}

function DesktopJourney({
  identity,
  milestones,
  redshiftRef,
  flags,
  ready,
  onSceneReady,
}: CosmicJourneyProps & { flags: MediaFlags; ready: boolean; onSceneReady: () => void }) {
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

      // The identity itself travels from the opening composition into a small
      // top-left signature. Supporting copy and portrait clear the stage first.
      const timeline = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
        },
      });
      const timelineClock = { progress: 0 };
      gsap.set('[data-hero-name]', { transformOrigin: 'left top' });
      timeline
        .to(timelineClock, { progress: 1, duration: 1 }, 0)
        .to('[data-scroll-hint]', { opacity: 0, duration: 0.05 }, 0.02)
        .to('[data-hero-portrait]', { opacity: 0, scale: 0.9, x: 48, duration: 0.12 }, 0.04)
        .to('[data-hero-details]', { opacity: 0, y: -18, duration: 0.1 }, 0.035)
        .to('[data-hero-block]', { top: 24, y: 0, duration: 0.22 }, 0.035)
        .to('[data-hero-name]', { scale: 0.36, duration: 0.22 }, 0.035)
        .to('[data-hero-block]', { opacity: 0, duration: 0.055 }, 0.945);

      // Galaxies and the route dissolve as the portfolio arrives. The fixed
      // deep-field canvas remains untouched so its stars and lensing continue
      // behind every section without switching backgrounds.
      ScrollTrigger.create({
        trigger: wrapper,
        start: 'bottom 92%',
        end: 'bottom -30%',
        scrub: true,
        onUpdate: (self) => {
          journey.release = self.progress;
        },
      });
    }, wrapper);

    return () => {
      ctx.revert();
      journey.progress = 0;
      journey.stage = 0;
      journey.release = 0;
    };
  }, [stageCount]);

  const fieldCount = flags.isTablet ? 1800 : 3400;
  const lensing = !flags.coarsePointer;
  const lensingRadiusPx = flags.isTablet ? 900 : 1280;

  return (
    <>
      <div className={styles.canvasWrap} data-canvas-wrap>
        <CosmicCanvas
          fieldCount={fieldCount}
          lensing={lensing}
          lensingRadiusPx={lensingRadiusPx}
          onReady={onSceneReady}
        />
      </div>
      <section className={styles.journey} ref={wrapperRef} aria-label="Research journey">
        <div className={styles.sticky}>
          <HeroContent identity={identity} />
          <MilestoneOverlay
            milestones={milestones}
            redshiftRef={redshiftRef}
            activeIndex={activeIndex}
          />
          <SrMilestoneList milestones={milestones} />

          <p className={styles.scrollHint} data-scroll-hint aria-hidden="true">
            <span className={styles.scrollHintBody} data-visible={ready ? 'true' : 'false'}>
              <span>scroll to explore</span>
              <span className={styles.scrollHintLine} />
            </span>
          </p>
        </div>
      </section>
    </>
  );
}
