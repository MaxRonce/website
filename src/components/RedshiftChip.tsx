import styles from '@/components/styles/journey.module.css';
import { formatRedshift, redshiftBetweenDates } from '@/lib/redshift';

/**
 * Small "z ≈ 1.8 × 10⁻¹¹" chip: elapsed time poetically mapped onto the
 * low-redshift approximation.
 */
export function RedshiftChip({ date, epochStart }: { date: string; epochStart: string }) {
  const z = redshiftBetweenDates(epochStart, date);
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
