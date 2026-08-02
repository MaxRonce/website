import Image from 'next/image';

import styles from '@/components/styles/journey.module.css';
import type { IdentityContent } from '@/content/types';

/**
 * The crisp HTML layer of the hero: identity, research field, short intro and
 * two primary destinations. Shared between the 3D journey, the mobile journey
 * and the reduced-motion overview.
 */
export function HeroContent({ identity }: { identity: IdentityContent }) {
  const [firstName, ...familyNameParts] = identity.fullName.trim().split(/\s+/);
  const familyName = familyNameParts.join(' ').toUpperCase();

  return (
    <>
      <figure className={styles.portrait} data-hero-portrait>
        <Image
          src={identity.photo}
          alt={`Portrait of ${identity.fullName}`}
          fill
          priority
          sizes="(max-width: 640px) 148px, 340px"
        />
      </figure>

      <div className={styles.heroBlock} data-hero-block>
        <h1 className={styles.headline}>
          {firstName} <strong>{familyName}</strong>
        </h1>
        <p className={styles.heroRole}>{identity.role}</p>
        <p className={styles.intro}>{identity.intro}</p>
        <div className={styles.heroActions}>
          <a className={styles.primaryButton} href="/cv">
            View CV
          </a>
          <a
            className={styles.secondaryButton}
            href={identity.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.42 7.42 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </>
  );
}
