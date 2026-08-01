import styles from '@/components/styles/journey.module.css';
import { formatRedshift, redshiftBetweenDates } from '@/lib/redshift';

/**
 * Small "z ≈ 1.8 × 10⁻¹¹" chip: elapsed time poetically mapped onto the
 * low-redshift approximation. Like real redshifts, older events sit "farther
 * away": z grows with lookback time from the most recent milestone
 * (`redshiftRef`), which itself sits at z ≈ 0.
 */
export function RedshiftChip({ date, redshiftRef }: { date: string; redshiftRef: string }) {
  const z = redshiftBetweenDates(date, redshiftRef);
  const parts = formatRedshift(z);

  return (
    <span className={styles.redshiftChip}>
      {parts ? (
        <>
          z ≈ {parts.mantissa} × 10<sup>{parts.exponent}</sup>
        </>
      ) : (
        <>z ≈ 0</>
      )}
    </span>
  );
}
