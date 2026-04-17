/** Max length for contact form name (characters). */
export const CONTACT_FORM_NAME_MAX = 120;

/** Max length for contact form subject (characters). */
export const CONTACT_FORM_SUBJECT_MAX = 200;

/** Max length for contact form message body (characters). */
export const CONTACT_FORM_MESSAGE_MAX = 5000;

/** Max submissions per client IP per sliding window (when rate limiting is active). */
export const CONTACT_FORM_RATE_LIMIT_MAX = 5;

/** Sliding window duration for contact rate limiting (ms). */
export const CONTACT_FORM_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

/** Upstash Ratelimit prefix (avoids collisions with other Redis keys). */
export const CONTACT_FORM_RATELIMIT_PREFIX = "@upstash/ratelimit/contact";
