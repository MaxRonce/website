import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import styles from './cv.module.css';
import { cvEducation, cvResearch, cvSkillGroups, type CvEntry } from '@/content/cv';
import { getContent } from '@/lib/getContent';

export const metadata: Metadata = {
  title: 'Curriculum vitae · Maxime Ronceray',
  description:
    'Interactive curriculum vitae of Maxime Ronceray, working across astrophysics, scientific machine learning and statistical inference.',
};

function Timeline({ entries }: { entries: CvEntry[] }) {
  return (
    <div className={styles.timeline}>
      {entries.map((entry, index) => (
        <details className={styles.timelineEntry} key={`${entry.period}-${entry.title}`} open={index < 2}>
          <summary>
            <span className={styles.period}>{entry.period}</span>
            <span className={styles.entryHeading}>
              <strong>{entry.title}</strong>
              <span>
                {entry.organization}
                {entry.location ? ` · ${entry.location}` : ''}
              </span>
            </span>
            <span className={styles.expandMark} aria-hidden="true" />
          </summary>
          <div className={styles.entryBody}>
            <p>{entry.summary}</p>
            <ul>
              {entry.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            {entry.href ? (
              <a href={entry.href} target="_blank" rel="noopener noreferrer">
                Open related work
              </a>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}
export default async function CvPage() {
  const { identity, externalLinks } = await getContent();
  const linkedIn = externalLinks.find((link) => link.id === 'linkedin');

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.backLink}>
          <span aria-hidden="true">←</span> Portfolio
        </Link>
        <div className={styles.topActions}>
          <a href="#pdf">PDF reader</a>
          <a className={styles.downloadAction} href={identity.cvHref} download>
            Download PDF
          </a>
        </div>
      </header>

      <section className={styles.cvHero} id="profile" aria-labelledby="cv-name">
        <div className={styles.heroPortrait}>
          <Image
            src={identity.photo}
            alt={`Portrait of ${identity.fullName}`}
            fill
            priority
            sizes="(max-width: 640px) 128px, 220px"
          />
        </div>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Astrophysics · Scientific machine learning</p>
          <h1 id="cv-name">{identity.fullName}</h1>
          <p className={styles.heroLead}>{identity.intro}</p>
          <ul className={styles.contactList} aria-label="Contact links">
            <li><a href={`mailto:${identity.email}`}>{identity.email}</a></li>
            <li><a href={identity.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>
            {linkedIn ? <li><a href={linkedIn.href} target="_blank" rel="noopener noreferrer">LinkedIn</a></li> : null}
          </ul>
        </div>
      </section>

      <div className={styles.cvLayout}>
        <aside className={styles.sidebar}>
          <p>Curriculum vitae</p>
          <nav aria-label="CV sections">
            <a href="#research">Research & experience</a>
            <a href="#education">Education</a>
            <a href="#skills">Skills</a>
            <a href="#selected-work">Selected work</a>
            <a href="#pdf">PDF reader</a>
          </nav>
        </aside>

        <div className={styles.cvContent}>
          <section className={styles.cvSection} id="research" aria-labelledby="research-heading">
            <p className={styles.sectionNumber}>01</p>
            <h2 id="research-heading">Research & experience</h2>
            <p className={styles.sectionIntro}>
              Work at the intersection of astronomical surveys, probabilistic inference,
              representation learning and scientific software.
            </p>
            <Timeline entries={cvResearch} />
          </section>

          <section className={styles.cvSection} id="education" aria-labelledby="education-heading">
            <p className={styles.sectionNumber}>02</p>
            <h2 id="education-heading">Education</h2>
            <Timeline entries={cvEducation} />
          </section>

          <section className={styles.cvSection} id="skills" aria-labelledby="skills-heading">
            <p className={styles.sectionNumber}>03</p>
            <h2 id="skills-heading">Skills</h2>
            <div className={styles.skillGrid}>
              {cvSkillGroups.map((group) => (
                <div key={group.title} className={styles.skillGroup}>
                  <h3>{group.title}</h3>
                  <ul>
                    {group.skills.map((skill) => <li key={skill}>{skill}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.cvSection} id="selected-work" aria-labelledby="work-heading">
            <p className={styles.sectionNumber}>04</p>
            <h2 id="work-heading">Selected work</h2>
            <div className={styles.workLinks}>
              <a href="/#papers">
                <span>Publication</span>
                Benchmarking foundation models for unsupervised discovery
              </a>
              <a href="/#posters">
                <span>Research poster</span>
                Variational inference for data-driven galaxy population priors
              </a>
              <a href="/#reports">
                <span>Technical report</span>
                PLASMAG simulation environment for space magnetic sensors
              </a>
            </div>
          </section>

          <section className={styles.cvSection} id="pdf" aria-labelledby="pdf-heading">
            <div className={styles.pdfHeading}>
              <div>
                <p className={styles.sectionNumber}>05</p>
                <h2 id="pdf-heading">Original PDF</h2>
              </div>
              <a href={identity.cvHref} download>Download PDF</a>
            </div>
            <div className={styles.pdfFrame}>
              <iframe src={`${identity.cvHref}#view=FitH&toolbar=1`} title="Maxime Ronceray CV PDF" />
            </div>
            <a className={styles.pdfFallback} href={identity.cvHref} target="_blank" rel="noopener noreferrer">
              Open the PDF in a new tab
            </a>
          </section>
        </div>
      </div>
    </main>
  );
}
