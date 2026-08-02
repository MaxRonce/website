import Image from 'next/image';

import styles from '@/components/styles/sections.module.css';
import type { Report } from '@/content/site';

export function ReportsSection({ reports }: { reports: Report[] }) {
  return (
    <section id="reports" className={styles.section} data-reveal aria-labelledby="reports-heading">
      <div className={styles.sectionHead} data-parallax>
        <p className={styles.eyebrow}>Documents</p>
        <h2 id="reports-heading" className={styles.title}>
          Reports
        </h2>
      </div>

      <div className={styles.sectionBody}>
        <ul className={styles.reportList}>
          {reports.map((report) => (
            <li key={report.id} className={styles.reportCard}>
              <a
                className={styles.reportPreview}
                href={report.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Read ${report.title}`}
              >
                <Image
                  className={styles.reportLogo}
                  src={report.preview}
                  alt={report.previewAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, 360px"
                />
              </a>
              <div className={styles.reportCopy}>
                <p className={styles.documentKind}>Technical report · {report.year}</p>
                <h3 className={styles.rowTitle}>{report.title}</h3>
                <p className={styles.meta}>{report.context}</p>
                <p className={styles.rowExcerpt}>{report.description}</p>
                <a
                  className={styles.quietLink}
                  href={report.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read full report
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
