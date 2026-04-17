import { logger } from "@/lib/utils/logger";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_FETCH_TIMEOUT_MS = 10_000;

type TurnstileVerifyJson = {
  success?: boolean;
  "error-codes"?: string[];
};

/**
 * Verifies a Cloudflare Turnstile token when `TURNSTILE_SECRET_KEY` is set.
 * When the secret is not configured, returns `true` (dev / no captcha).
 */
export async function verifyContactTurnstileToken(
  token: string | undefined,
  remoteIp: string | undefined
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return true;
  }
  if (!token || typeof token !== "string" || !token.trim()) {
    return false;
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token.trim());
  if (remoteIp && remoteIp !== "unknown") {
    body.set("remoteip", remoteIp);
  }

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
      signal: AbortSignal.timeout(TURNSTILE_FETCH_TIMEOUT_MS),
    });
    const json = (await res.json()) as TurnstileVerifyJson;
    if (!json.success) {
      logger.warn("Turnstile verification failed", {
        errorCodes: json["error-codes"],
      });
    }
    return json.success === true;
  } catch (error: unknown) {
    logger.error("Turnstile verification request failed", { error });
    return false;
  }
}
