'use client';

import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';

import styles from '@/components/styles/nav.module.css';
import { sectionIndex } from '@/content/site';
import { scrollBus } from '@/lib/scrollBus';

/**
 * Compact sticky section index. It lives inside <main>, after the cosmic
 * journey, so it only ever appears once the journey has released — during the
 * cosmic sequence navigation stays minimal, as intended.
 */
export function SectionNavigation() {
  const [activeId, setActiveId] = useState<string>(sectionIndex[0].id);

  useEffect(() => {
    const sections = sectionIndex
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const onNavigate = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    if (scrollBus.lenis) {
      scrollBus.lenis.scrollTo(target, { offset: -96 });
    } else {
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <nav className={styles.nav} aria-label="Portfolio sections">
      <ul className={styles.list}>
        {sectionIndex.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={styles.link}
              aria-current={activeId === id ? 'true' : undefined}
              onClick={(event) => onNavigate(event, id)}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
