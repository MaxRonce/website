import styles from '@/components/styles/journey.module.css';
import type { Milestone } from '@/content/site';
import type { IdentityContent } from '@/content/types';
import { HeroContent } from '@/components/HeroContent';
import { MilestoneCard } from '@/components/MilestoneCard';

/**
 * Reduced-motion (and no-WebGL) experience: no 400vh pin, no camera travel,
 * no lensing — a calm static overview of the four connected milestones with
 * all content and links preserved.
 */
export function StaticJourney({
  identity,
  milestones,
  epochStart,
}: {
  identity: IdentityContent;
  milestones: Milestone[];
  epochStart: string;
}) {
  return (
    <section className={styles.staticJourney} aria-label="Research journey">
      <div className={styles.staticHero}>
        <HeroContent identity={identity} />
      </div>
      <div className={styles.staticGridWrap}>
        <svg
          className={styles.staticRoute}
          viewBox="0 0 1000 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M20 90 C 220 30, 330 100, 500 60 C 670 20, 780 95, 980 40"
            fill="none"
            stroke="#8DBEFF"
            strokeWidth="1.4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            opacity="0.6"
          />
        </svg>
        <ol className={styles.staticGrid}>
          {milestones.map((milestone, index) => (
            <li key={milestone.id}>
              <MilestoneCard
                milestone={milestone}
                index={index}
                epochStart={epochStart}
                galaxySize={180}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
