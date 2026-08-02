import styles from '@/components/styles/journey.module.css';
import type { Milestone } from '@/content/site';
import { GalaxyCanvasView } from '@/components/GalaxyCanvasView';
import { RedshiftChip } from '@/components/RedshiftChip';

/**
 * Full-width milestone block used by the simplified mobile journey and the
 * reduced-motion overview.
 */
export function MilestoneCard({
  milestone,
  redshiftRef,
  galaxySize = 220,
}: {
  milestone: Milestone;
  redshiftRef: string;
  galaxySize?: number;
}) {
  const internalHref = milestone.href?.startsWith('/') ?? false;
  const linkLabel = milestone.href === '/paper'
    ? 'Explore paper'
    : milestone.href === '/cv'
      ? 'View CV'
      : 'Open project';

  return (
    <article className={styles.card} data-milestone-card>
      <div className={styles.cardGalaxy}>
        <GalaxyCanvasView look={milestone.look} size={galaxySize} />
      </div>
      <div className={styles.cardBody}>
        <p className={styles.labelDate}>
          <time dateTime={milestone.date}>{milestone.dateLabel}</time>
        </p>
        <h3 className={styles.cardTitle}>{milestone.title}</h3>
        <p className={styles.labelMeta}>
          <RedshiftChip date={milestone.date} redshiftRef={redshiftRef} />
        </p>
        <p className={styles.cardDescription}>{milestone.description}</p>
        {milestone.href ? (
          <a
            className={styles.labelLink}
            href={milestone.href}
            target={internalHref ? undefined : '_blank'}
            rel={internalHref ? undefined : 'noopener noreferrer'}
          >
            {linkLabel}
          </a>
        ) : null}
      </div>
    </article>
  );
}
