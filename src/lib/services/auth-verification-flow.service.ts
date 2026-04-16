import { db } from "@white-shop/db";
import { parseVerificationSessionToken } from "../auth/verification-session-token";
import { verifyOtpChallenge, createOtpChallenge } from "./auth-otp.service";
import { deliverVerificationCode } from "./verification-delivery.service";
import { buildAuthSuccessPayload, type AuthSuccessPayload } from "./auth-session.service";
import { assertOtpResendAllowed } from "./auth-resend-guard.service";
import { logger } from "../utils/logger";

export async function verifyCredentialsWithOtp(
  verificationToken: string,
  code: string
): Promise<AuthSuccessPayload> {
  const { userId, channel } = parseVerificationSessionToken(verificationToken);
  const trimmed = code.trim();
  if (!/^\d{4,8}$/.test(trimmed)) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation failed",
      detail: "Enter a valid verification code",
    };
  }

  const ok = await verifyOtpChallenge(userId, channel, trimmed);
  if (!ok) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Verification failed",
      detail: "Invalid or expired verification code",
    };
  }

  await db.user.update({
    where: { id: userId },
    data:
      channel === "email"
        ? { emailVerified: true }
        : { phoneVerified: true },
  });

  logger.info("Auth verification success", { userId, channel });
  return buildAuthSuccessPayload(userId);
}

export async function resendVerificationOtp(
  verificationToken: string
): Promise<void> {
  const { userId, channel } = parseVerificationSessionToken(verificationToken);

  const user = await db.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { email: true, phone: true },
  });

  if (!user) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Not found",
      detail: "User not found",
    };
  }

  const target =
    channel === "email" ? user.email ?? undefined : user.phone ?? undefined;
  if (!target) {
    throw {
      status: 400,
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation failed",
      detail: "No contact address for this verification channel",
    };
  }

  await assertOtpResendAllowed(userId, channel);
  const plain = await createOtpChallenge(userId, channel);
  await deliverVerificationCode(channel, target, plain);
}
