/**
 * Client-safe email format validation (no Node deps)
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}
