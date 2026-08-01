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
        <ul className={styles.rowList}>
          {reports.map((report) => (
            <li key={report.id} className={styles.row}>
              <div>
                <h3 className={styles.rowTitle}>{report.title}</h3>
                <p className={styles.meta}>
                  {report.context} · {report.year}
                </p>
                <p className={styles.rowExcerpt}>{report.description}</p>
              </div>
              <a
                className={styles.quietLink}
                href={report.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read report
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
