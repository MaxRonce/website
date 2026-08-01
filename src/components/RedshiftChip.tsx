import styles from '@/components/styles/journey.module.css';
import { redshiftTooltip } from '@/content/site';
import { formatRedshift, redshiftBetweenDates } from '@/lib/redshift';

/**
 * Small "z ≈ 1.8 × 10⁻¹¹" chip with an explanatory tooltip. The value is a
 * poetic mapping of elapsed time onto the low-redshift approximation — the
 * tooltip says so explicitly.
 */
export function RedshiftChip({
  date,
  epochStart,
  id,
}: {
  date: string;
  epochStart: string;
  id: string;
}) {
  const z = redshiftBetweenDates(epochStart, date);
  const parts = formatRedshift(z);
  const tooltipId = `redshift-tip-${id}`;

  return (
    <span className={styles.redshiftChip} tabIndex={0} aria-describedby={tooltipId}>
      {parts ? (
        <>
          z ≈ {parts.mantissa} × 10<sup>{parts.exponent}</sup>
        </>
      ) : (
        <>z ≈ 0</>
      )}
      <span role="tooltip" id={tooltipId} className={styles.redshiftTooltip}>
        {redshiftTooltip}
      </span>
    </span>
  );
}
