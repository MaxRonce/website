import Image from 'next/image';
import Link from 'next/link';

import styles from '@/components/styles/sections.module.css';
import type { Paper } from '@/content/site';

export function PapersSection({ papers }: { papers: Paper[] }) {
  const featured = papers.find((paper) => paper.featured) ?? papers[0];
  const rest = papers.filter((paper) => paper !== featured);

  return (
    <section id="papers" className={styles.section} data-reveal aria-labelledby="papers-heading">
      <div className={styles.sectionHead} data-parallax>
        <p className={styles.eyebrow}>Publications</p>
        <h2 id="papers-heading" className={styles.title}>
          Papers
        </h2>
      </div>

      <div className={styles.sectionBody}>
        {featured ? (
          <article className={styles.featured} data-reveal-side="left">
            <Link
              className={styles.researchMedia}
              href="/paper"
              aria-label={`Explore ${featured.title}`}
            >
              <Image
                className={styles.researchImage}
                src={featured.preview}
                alt={featured.previewAlt}
                fill
                sizes="(max-width: 860px) 100vw, 760px"
              />
              <span className={styles.mediaLabel}>Euclid × DESI · anomaly candidates</span>
            </Link>
            <div className={styles.featuredCopy}>
              <p className={styles.featuredTag}>Featured paper · {featured.year}</p>
              <h3 className={styles.featuredTitle}>
                <Link href="/paper">{featured.title}</Link>
              </h3>
              <p className={styles.meta}>
                {featured.authors} · {featured.venue}
              </p>
              <p className={styles.abstract}>{featured.abstract}</p>
              <ul className={styles.linkRow} aria-label="Paper links">
                <li><Link href="/paper">Overview</Link></li>
                {featured.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ) : null}

        <ul className={styles.rowList}>
          {rest.map((paper) => (
            <li key={paper.id} className={styles.row}>
              <div className={styles.rowPreview}>
                <Image src={paper.preview} alt={paper.previewAlt} fill sizes="180px" />
              </div>
              <div>
                <h3 className={styles.rowTitle}>{paper.title}</h3>
                <p className={styles.meta}>
                  {paper.authors} · {paper.venue} · {paper.year}
                </p>
                <p className={styles.rowExcerpt}>{paper.abstract}</p>
              </div>
              <ul className={styles.linkRow} aria-label="Paper links">
                {paper.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
