/**
 * A poetic "one-year redshift scale".
 *
 * We map elapsed time onto an (extremely small) cosmological redshift using the
 * low-redshift approximation z ≈ H0 · Δt. This is an artistic visual mapping,
 * not a measured cosmological redshift — one full year corresponds to
 * Δz ≈ 7.2 × 10⁻¹¹.
 */

export const MPC_IN_METERS = 3.0856775814913673e22;
export const H0_KM_S_PER_MPC = 70;

/** Hubble constant expressed in s⁻¹. */
export const H0_PER_SECOND = (H0_KM_S_PER_MPC * 1000) / MPC_IN_METERS;

export const SECONDS_PER_YEAR = 365.25 * 24 * 3600;

/** z ≈ H0 · Δt for a duration expressed in seconds. */
export function elapsedSecondsToRedshift(elapsedSeconds: number): number {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return 0;
  return H0_PER_SECOND * elapsedSeconds;
}

/**
 * Redshift accumulated between the start of the selected one-year interval and
 * a given event date. Both arguments are ISO date strings (e.g. "2023-05-02").
 */
export function redshiftBetweenDates(intervalStartIso: string, eventIso: string): number {
  const start = Date.parse(intervalStartIso);
  const event = Date.parse(eventIso);
  if (Number.isNaN(start) || Number.isNaN(event)) return 0;
  return elapsedSecondsToRedshift((event - start) / 1000);
}

export type ScientificNotation = {
  mantissa: string;
  exponent: number;
};

/**
 * Split a positive number into scientific notation parts, e.g.
 * 1.83e-11 → { mantissa: "1.8", exponent: -11 }.
 * Returns null for zero or negative values.
 */
export function formatRedshift(z: number): ScientificNotation | null {
  if (!Number.isFinite(z) || z <= 0) return null;
  let exponent = Math.floor(Math.log10(z));
  let mantissa = z / 10 ** exponent;
  // Guard against rounding artefacts such as 9.97 → "10.0".
  if (Number(mantissa.toFixed(1)) >= 10) {
    mantissa /= 10;
    exponent += 1;
  }
  return { mantissa: mantissa.toFixed(1), exponent };
}
