import Image from 'next/image';

import styles from '@/components/styles/sections.module.css';
import type { Poster } from '@/content/site';

export function PostersSection({ posters }: { posters: Poster[] }) {
  return (
    <section id="posters" className={styles.section} data-reveal aria-labelledby="posters-heading">
      <div className={styles.sectionHead} data-parallax>
        <p className={styles.eyebrow}>Conferences</p>
        <h2 id="posters-heading" className={styles.title}>
          Posters
        </h2>
      </div>

      <div className={styles.sectionBody}>
        <ul className={styles.cardGrid}>
          {posters.map((poster, index) => (
            <li
              key={poster.id}
              className={styles.posterCard}
              data-reveal-side={index % 2 === 0 ? 'left' : 'right'}
            >
              <a
                className={styles.posterThumb}
                href={poster.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${poster.title}`}
              >
                <Image
                  src={poster.preview}
                  alt={poster.previewAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, 360px"
                />
                <span>{String(index + 1).padStart(2, '0')}</span>
              </a>
              <div className={styles.posterCopy}>
                <p className={styles.documentKind}>Poster · {poster.year}</p>
                <h3 className={styles.rowTitle}>{poster.title}</h3>
                <p className={styles.meta}>{poster.event}</p>
                <p className={styles.rowExcerpt}>{poster.description}</p>
                <a
                  className={styles.quietLink}
                  href={poster.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open full poster
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
