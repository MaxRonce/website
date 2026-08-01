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
              <div className={styles.posterThumb} aria-hidden="true">
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className={styles.rowTitle}>{poster.title}</h3>
              <p className={styles.meta}>
                {poster.event} · {poster.year}
              </p>
              <a
                className={styles.quietLink}
                href={poster.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download poster
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
