import CosmicJourney from '@/components/CosmicJourney';
import { PortfolioBackdrop } from '@/components/PortfolioBackdrop';
import { PortfolioEffects } from '@/components/PortfolioEffects';
import { SectionNavigation } from '@/components/SectionNavigation';
import { AboutSection } from '@/components/sections/AboutSection';
import { LinksSection } from '@/components/sections/LinksSection';
import { PapersSection } from '@/components/sections/PapersSection';
import { PostersSection } from '@/components/sections/PostersSection';
import { ReportsSection } from '@/components/sections/ReportsSection';
import { SlidesSection } from '@/components/sections/SlidesSection';
import { buildMilestones } from '@/content/site';
import { getContent } from '@/lib/getContent';

/**
 * Content is re-read from content.json at most every 10 seconds, so edits
 * saved through /admin appear without a rebuild on hosts with a writable
 * filesystem (local dev, VPS). On Vercel, /admin commits to GitHub instead,
 * which triggers a redeploy.
 */
export const revalidate = 10;

export default async function Home() {
  const content = await getContent();
  const milestones = buildMilestones(content.milestones);
  // Poetic redshift reference: the most recent milestone is "the observer"
  // (z ≈ 0); older events sit at higher z, like real lookback time.
  const redshiftRef = content.milestones.reduce(
    (latest, milestone) => (milestone.date > latest ? milestone.date : latest),
    content.milestones[0]?.date ?? '',
  );

  return (
    <>
      <CosmicJourney
        identity={content.identity}
        milestones={milestones}
        redshiftRef={redshiftRef}
      />

      <main id="main" className="portfolio">
        <PortfolioBackdrop />
        <PortfolioEffects />
        <SectionNavigation />
        <PapersSection papers={content.papers} />
        <PostersSection posters={content.posters} />
        <SlidesSection slides={content.slides} />
        <ReportsSection reports={content.reports} />
        <AboutSection about={content.about} />
        <LinksSection identity={content.identity} externalLinks={content.externalLinks} />
      </main>

      <footer className="site-footer">
        <p>
          {content.identity.name} · {content.identity.role}
        </p>
      </footer>
    </>
  );
}
