/** Max OTP verify attempts per IP per sliding window (middleware). */
export const AUTH_VERIFY_RATE_LIMIT_MAX = 15;

/** Sliding window for POST /api/v1/auth/verify (Upstash format). */
export const AUTH_VERIFY_RATE_LIMIT_WINDOW = "15 m" as const;

/** Max OTP resend requests per IP per sliding window (middleware). */
export const AUTH_RESEND_RATE_LIMIT_MAX = 5;

/** Sliding window for POST /api/v1/auth/resend-verification (Upstash format). */
export const AUTH_RESEND_RATE_LIMIT_WINDOW = "60 m" as const;

export const AUTH_VERIFY_RATELIMIT_PREFIX = "ratelimit:auth-verify";

export const AUTH_RESEND_RATELIMIT_PREFIX = "ratelimit:auth-resend";
