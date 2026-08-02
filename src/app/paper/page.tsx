import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import styles from './paper.module.css';
import { getContent } from '@/lib/getContent';

export const metadata: Metadata = {
  title: 'Foundation models for anomaly detection · Maxime Ronceray',
  description:
    'A concise research overview of foundation-model representations for unsupervised discovery in matched Euclid and DESI observations.',
};

export default async function PaperPage() {
  const { papers } = await getContent();
  const paper = papers.find((entry) => entry.featured) ?? papers[0];
  if (!paper) notFound();

  const pdf = paper.links.find((link) => link.label === 'PDF');
  const slides = paper.links.find((link) => link.label === 'Slides');

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/#papers" className={styles.backLink}>
          <span aria-hidden="true">←</span> Papers
        </Link>
        <div className={styles.topActions}>
          {slides ? <a href={slides.href}>Slides</a> : null}
          {pdf ? <a className={styles.pdfAction} href={pdf.href} target="_blank" rel="noopener noreferrer">Full paper PDF</a> : null}
        </div>
      </header>

      <article>
        <header className={styles.paperHero}>
          <p className={styles.kicker}>{paper.venue} · {paper.year}</p>
          <h1>{paper.title}</h1>
          <p className={styles.authors}>{paper.authors}</p>
          <p className={styles.abstract}>{paper.abstract}</p>
          <dl className={styles.factGrid}>
            <div><dt>Models</dt><dd>AstroPT · AION · AstroCLIP</dd></div>
            <div><dt>Data</dt><dd>Euclid imaging × DESI spectra</dd></div>
            <div><dt>Task</dt><dd>Unsupervised anomaly discovery</dd></div>
          </dl>
        </header>

        <section className={styles.storySection} aria-labelledby="approach-heading">
          <div className={styles.sectionLabel}>
            <p>01 · Approach</p>
            <h2 id="approach-heading">One dataset, three representation spaces</h2>
          </div>
          <div className={styles.prose}>
            <p>
              We encode the same matched galaxy sample with three astronomical foundation
              models. Lightweight density estimators then rank objects that are rare in an
              individual modality or unusually misaligned across image and spectrum.
            </p>
            <ol>
              <li>Extract image, spectral and joint embeddings for each object.</li>
              <li>Estimate rarity inside each representation with normalizing flows.</li>
              <li>Compare rankings and inspect the highest-scoring candidates across models.</li>
            </ol>
          </div>
        </section>

        <figure className={styles.figure}>
          <div className={styles.figureImage}>
            <Image
              src="/images/research/foundation-model-latent-space.jpg"
              alt="UMAP projections, representative galaxy thumbnails and image-spectrum alignment distributions for AstroPT, AION and AstroCLIP"
              width={1599}
              height={1030}
              sizes="(max-width: 900px) 100vw, 1180px"
            />
          </div>
          <figcaption>
            <span>Figure 01</span>
            <p>
              Latent geometry differs substantially across models. AstroPT and AION form
              relatively continuous manifolds, while AstroCLIP is more fragmented and shows
              a broader image-spectrum alignment distribution.
            </p>
          </figcaption>
        </figure>

        <section className={styles.storySection} aria-labelledby="findings-heading">
          <div className={styles.sectionLabel}>
            <p>02 · Findings</p>
            <h2 id="findings-heading">The ranking is model-dependent</h2>
          </div>
          <div className={styles.prose}>
            <p>
              The most extreme candidates partly agree across models, but the broader rankings
              diverge. This makes cross-model comparison useful: consensus highlights robust
              rare systems, while disagreement exposes architecture-specific sensitivity.
            </p>
            <p>
              Visual inspection surfaces both astrophysical candidates and data-quality issues,
              including AGN-like spectra, strong-lens morphologies, unusual quiescent systems,
              diffraction spikes and residual imaging artefacts.
            </p>
          </div>
        </section>

        <figure className={styles.figure}>
          <div className={styles.figureImage}>
            <Image
              src="/images/research/foundation-model-anomalies.jpg"
              alt="Four high-ranking Euclid anomaly candidates with their matched DESI spectra"
              width={1440}
              height={976}
              sizes="(max-width: 900px) 100vw, 1180px"
            />
          </div>
          <figcaption>
            <span>Figure 02</span>
            <p>
              Representative high-ranking candidates pair Euclid image cutouts with DESI
              spectra, keeping the physical and instrumental interpretation visible together.
            </p>
          </figcaption>
        </figure>

        <section className={styles.takeaway} aria-labelledby="takeaway-heading">
          <p className={styles.kicker}>Takeaway</p>
          <h2 id="takeaway-heading">Foundation models do not define a single notion of rarity.</h2>
          <p>
            Their anomaly rankings reflect different representation geometries and training
            objectives. Comparing those views is therefore part of the discovery method, not
            only a benchmarking exercise.
          </p>
          {pdf ? <a href={pdf.href} target="_blank" rel="noopener noreferrer">Read the full paper</a> : null}
        </section>
      </article>
    </main>
  );
}
