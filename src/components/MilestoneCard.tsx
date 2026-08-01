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
  index,
  epochStart,
  galaxySize = 220,
}: {
  milestone: Milestone;
  index: number;
  epochStart: string;
  galaxySize?: number;
}) {
  return (
    <article className={styles.card} data-milestone-card>
      <div className={styles.cardGalaxy}>
        <GalaxyCanvasView look={milestone.look} size={galaxySize} />
      </div>
      <div className={styles.cardBody}>
        <p className={styles.labelNumber}>{String(index + 1).padStart(2, '0')}</p>
        <h3 className={styles.cardTitle}>{milestone.title}</h3>
        <p className={styles.labelDate}>
          <time dateTime={milestone.date}>{milestone.dateLabel}</time>
          <RedshiftChip date={milestone.date} epochStart={epochStart} />
        </p>
        <p className={styles.cardDescription}>{milestone.description}</p>
        {milestone.href ? (
          <a
            className={styles.labelLink}
            href={milestone.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn more
          </a>
        ) : null}
      </div>
    </article>
  );
}
