import { createHash, timingSafeEqual } from 'crypto';

/**
 * Constant-time password check for the /admin APIs. Both sides are hashed
 * first so the comparison length never depends on the submitted value.
 */
export function passwordMatches(submitted: string | null): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !submitted) return false;
  const a = createHash('sha256').update(submitted).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export function adminUnauthorizedMessage(): string {
  return process.env.ADMIN_PASSWORD
    ? 'Mot de passe incorrect.'
    : "L'éditeur est désactivé : aucune variable ADMIN_PASSWORD n'est configurée (voir README).";
}
