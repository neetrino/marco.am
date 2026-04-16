import { logger } from "../utils/logger";
import type { VerificationChannel } from "../auth/verification-session-token";
import { getPublicAppUrl } from "../config/deployment-env";

/**
 * Sends OTP via email (Resend) when configured; logs in development otherwise.
 * SMS providers are not wired — phone OTP is logged server-side until integrated.
 */
export async function deliverVerificationCode(
  channel: VerificationChannel,
  address: string,
  code: string
): Promise<void> {
  const masked =
    channel === "email"
      ? address.replace(/(^.).*(@.*$)/, "$1***$2")
      : address.replace(/(\d{2})\d+(\d{2})$/, "$1***$2");

  if (channel === "email") {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (apiKey && from) {
      const origin = getPublicAppUrl();
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [address],
          subject: "Your verification code",
          text: `Your verification code is: ${code}\n\nThis code expires in 15 minutes.\n${origin}`,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        logger.error("Resend verification email failed", {
          status: res.status,
          errText,
        });
        throw {
          status: 502,
          type: "https://api.shop.am/problems/bad-gateway",
          title: "Verification delivery failed",
          detail: "Could not send verification email",
        };
      }
      logger.info("Verification email sent", { to: masked });
      return;
    }

    logger.warn(
      "RESEND_API_KEY or RESEND_FROM_EMAIL missing — OTP not emailed (dev/log only)",
      { to: masked }
    );
    logger.info("Verification code (email not sent)", { to: masked, code });
    return;
  }

  logger.warn(
    "SMS provider not configured — verification code logged server-side only",
    { to: masked }
  );
  logger.info("Verification code (SMS not sent)", { to: masked, code });
}
