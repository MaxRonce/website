'use client';

import { useEffect, useRef } from 'react';

import styles from '@/components/styles/journey.module.css';
import type { Milestone } from '@/content/site';
import { journey } from '@/lib/journeyStore';
import { RedshiftChip } from '@/components/RedshiftChip';

/**
 * HTML milestone labels floating over the WebGL scene.
 *
 * A requestAnimationFrame loop reads the screen-space anchors that
 * <ScreenProjector /> writes into the journey store and moves each label with
 * a transform — no React re-renders, and the text stays crisp real HTML that
 * the lensing shader never touches. Only the focused milestone is interactive
 * and exposed to assistive tech; a canonical list lives in the sr-only DOM of
 * the journey shell.
 */
export function MilestoneOverlay({
  milestones,
  epochStart,
  activeIndex,
}: {
  milestones: Milestone[];
  epochStart: string;
  activeIndex: number;
}) {
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const sides = milestones.map((m) => m.labelSide);
  const sidesKey = sides.join(',');

  useEffect(() => {
    const sideList = sidesKey.split(',');
    let raf = 0;
    const tick = () => {
      // Labels sit beside their galaxy, outside the bright disc.
      const offset = Math.min(Math.max(window.innerWidth * 0.22, 180), 400);
      for (let i = 0; i < sideList.length; i += 1) {
        const el = itemRefs.current[i];
        const anchor = journey.screen[i];
        if (!el || !anchor) continue;
        const opacity = anchor.visible ? Math.pow(anchor.focus, 1.5) : 0;
        const x = anchor.x + (sideList[i] === 'right' ? offset : -offset);
        el.style.opacity = opacity.toFixed(3);
        el.style.visibility = opacity < 0.03 ? 'hidden' : 'visible';
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${anchor.y.toFixed(1)}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sidesKey]);

  return (
    <ol className={styles.overlay} aria-label="Research milestones">
      {milestones.map((milestone, index) => {
        const isActive = index === activeIndex;
        return (
          <li
            key={milestone.id}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className={styles.label}
            data-side={milestone.labelSide}
            aria-hidden={isActive ? undefined : true}
            aria-current={isActive ? 'step' : undefined}
          >
            <div className={styles.labelInner}>
              <p className={styles.labelNumber}>{String(index + 1).padStart(2, '0')}</p>
              <h2 className={styles.labelTitle}>{milestone.title}</h2>
              <p className={styles.labelDate}>
                <time dateTime={milestone.date}>{milestone.dateLabel}</time>
                <RedshiftChip
                  date={milestone.date}
                  epochStart={epochStart}
                  id={`overlay-${milestone.id}`}
                />
              </p>
              <p className={styles.labelDescription}>{milestone.description}</p>
              {milestone.href ? (
                <a
                  className={styles.labelLink}
                  href={milestone.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={isActive ? 0 : -1}
                >
                  Learn more
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
