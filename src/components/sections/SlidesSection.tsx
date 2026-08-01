import styles from '@/components/styles/sections.module.css';
import type { SlideDeck } from '@/content/site';

export function SlidesSection({ slides }: { slides: SlideDeck[] }) {
  return (
    <section id="slides" className={styles.section} data-reveal aria-labelledby="slides-heading">
      <div className={styles.sectionHead} data-parallax>
        <p className={styles.eyebrow}>Talks</p>
        <h2 id="slides-heading" className={styles.title}>
          Slides
        </h2>
      </div>

      <div className={styles.sectionBody}>
        <ul className={styles.rowList}>
          {slides.map((deck) => (
            <li key={deck.id} className={styles.row}>
              <div>
                <h3 className={styles.rowTitle}>{deck.title}</h3>
                <p className={styles.meta}>
                  {deck.event} · {deck.date}
                </p>
              </div>
              <a
                className={styles.quietLink}
                href={deck.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                View slides
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
