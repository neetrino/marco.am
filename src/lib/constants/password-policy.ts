/** Minimum password length for registration and password changes. */
export const MIN_PASSWORD_LENGTH = 8;

/** bcrypt cost factor for password hashing (OWASP-aligned for 2024+). */
export const BCRYPT_ROUNDS = 12;

export function isPasswordLongEnough(password: string): boolean {
  return password.trim().length >= MIN_PASSWORD_LENGTH;
}
