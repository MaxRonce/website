import styles from '@/components/styles/sections.module.css';
import type { AboutContent } from '@/content/types';

export function AboutSection({ about }: { about: AboutContent }) {
  return (
    <section id="about" className={styles.section} data-reveal aria-labelledby="about-heading">
      <div className={styles.sectionHead} data-parallax>
        <p className={styles.eyebrow}>Research focus</p>
        <h2 id="about-heading" className={styles.title}>
          About
        </h2>
      </div>

      <div className={styles.sectionBody}>
        <p className={styles.position}>{about.position}</p>
        {about.bio.map((paragraph) => (
          <p key={paragraph.slice(0, 32)} className={styles.bio}>
            {paragraph}
          </p>
        ))}

        <div className={styles.aboutColumns} data-reveal-side="right">
          <div>
            <h3 className={styles.subheading}>Research interests</h3>
            <ul className={styles.tagList}>
              {about.interests.map((interest) => (
                <li key={interest}>{interest}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className={styles.subheading}>Tools & methods</h3>
            <ul className={styles.tagList}>
              {about.skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
