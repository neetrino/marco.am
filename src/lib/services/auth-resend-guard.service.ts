import { db } from "@white-shop/db";
import type { VerificationChannel } from "../auth/verification-session-token";

const RESEND_COOLDOWN_MS = 60_000;

/**
 * Prevents OTP spam on resend — first issue is not subject to this (no prior row).
 */
export async function assertOtpResendAllowed(
  userId: string,
  channel: VerificationChannel
): Promise<void> {
  const recent = await db.authVerificationCode.findFirst({
    where: {
      userId,
      channel,
      createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recent) {
    throw {
      status: 429,
      type: "https://api.shop.am/problems/rate-limit",
      title: "Too many requests",
      detail: "Please wait before requesting a new verification code",
    };
  }
}
