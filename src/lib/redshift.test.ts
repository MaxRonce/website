import { describe, expect, it } from 'vitest';

import {
  H0_PER_SECOND,
  SECONDS_PER_YEAR,
  elapsedSecondsToRedshift,
  formatRedshift,
  redshiftBetweenDates,
} from './redshift';

describe('redshift utility', () => {
  it('converts H0 = 70 km/s/Mpc to roughly 2.27e-18 s⁻¹', () => {
    expect(H0_PER_SECOND).toBeGreaterThan(2.2e-18);
    expect(H0_PER_SECOND).toBeLessThan(2.3e-18);
  });

  it('maps one full year to Δz ≈ 7.2 × 10⁻¹¹', () => {
    const z = elapsedSecondsToRedshift(SECONDS_PER_YEAR);
    expect(z / 7.2e-11).toBeGreaterThan(0.98);
    expect(z / 7.2e-11).toBeLessThan(1.02);
  });

  it('returns 0 for non-positive or invalid durations', () => {
    expect(elapsedSecondsToRedshift(0)).toBe(0);
    expect(elapsedSecondsToRedshift(-100)).toBe(0);
    expect(elapsedSecondsToRedshift(Number.NaN)).toBe(0);
  });

  it('computes the offset of an event inside the one-year interval', () => {
    const z = redshiftBetweenDates('2023-05-01', '2023-11-01');
    // Roughly half a year → roughly half of 7.2e-11.
    expect(z).toBeGreaterThan(3.2e-11);
    expect(z).toBeLessThan(4.0e-11);
  });

  it('formats values in scientific notation', () => {
    expect(formatRedshift(1.83e-11)).toEqual({ mantissa: '1.8', exponent: -11 });
    expect(formatRedshift(7.16e-11)).toEqual({ mantissa: '7.2', exponent: -11 });
  });

  it('carries the exponent when the mantissa rounds up to 10', () => {
    expect(formatRedshift(9.97e-12)).toEqual({ mantissa: '1.0', exponent: -11 });
  });

  it('returns null for zero so the UI can hide the chip', () => {
    expect(formatRedshift(0)).toBeNull();
  });
});
