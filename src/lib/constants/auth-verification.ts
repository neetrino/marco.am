/** Length of numeric OTP sent to email or SMS. */
export const AUTH_OTP_LENGTH = 6;

/** OTP validity window (ms). */
export const AUTH_OTP_TTL_MS = 15 * 60 * 1000;

/** Max wrong code attempts per issued OTP row before it is invalidated. */
export const AUTH_OTP_MAX_ATTEMPTS = 5;

/**
 * When `AUTH_REQUIRE_VERIFICATION=true`, new registrations and logins must pass
 * OTP before a session JWT is issued. When false, identifiers are marked verified on register.
 */
export function isAuthVerificationRequired(): boolean {
  return process.env.AUTH_REQUIRE_VERIFICATION === "true";
}
