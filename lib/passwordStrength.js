/**
 * Get password strength: 'weak' | 'medium' | 'strong'
 * @param {string} password
 * @returns {{ level: 'weak'|'medium'|'strong', score: number, checks: object }}
 */
export function getPasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return { level: 'weak', score: 0, checks: { length: false, lower: false, upper: false, number: false, special: false } };
  }

  const checks = {
    length: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };

  const metCount = Object.values(checks).filter(Boolean).length;
  const minLength = password.length >= 6;

  let score = 0;
  if (minLength) score += 1;
  if (checks.length) score += 1;
  if (checks.lower) score += 1;
  if (checks.upper) score += 1;
  if (checks.number) score += 1;
  if (checks.special) score += 1;

  let level = 'weak';
  if (score >= 5) level = 'strong';
  else if (score >= 3 || (minLength && metCount >= 2)) level = 'medium';

  return { level, score, checks };
}
