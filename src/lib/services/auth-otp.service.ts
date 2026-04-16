import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { db } from "@white-shop/db";
import {
  AUTH_OTP_LENGTH,
  AUTH_OTP_MAX_ATTEMPTS,
  AUTH_OTP_TTL_MS,
} from "../constants/auth-verification";
import { logger } from "../utils/logger";
import type { VerificationChannel } from "../auth/verification-session-token";

function getPepper(): string {
  const s = process.env.JWT_SECRET;
  if (!s) {
    throw {
      status: 500,
      type: "https://api.shop.am/problems/internal-error",
      title: "Internal Server Error",
      detail: "Server configuration error",
    };
  }
  return s;
}

export function hashOtpCode(code: string): string {
  return createHmac("sha256", getPepper())
    .update(`otp:v1:${code}`)
    .digest("hex");
}

function compareOtpHashes(storedHex: string, candidatePlain: string): boolean {
  const a = Buffer.from(storedHex, "hex");
  const b = Buffer.from(hashOtpCode(candidatePlain), "hex");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

function generateNumericOtp(): string {
  const max = 10 ** AUTH_OTP_LENGTH;
  return String(randomInt(0, max)).padStart(AUTH_OTP_LENGTH, "0");
}

/**
 * Replaces any pending OTP for this user/channel and returns the plaintext code for delivery only.
 */
export async function createOtpChallenge(
  userId: string,
  channel: VerificationChannel
): Promise<string> {
  await db.authVerificationCode.deleteMany({
    where: { userId, channel },
  });

  const plain = generateNumericOtp();
  const codeHash = hashOtpCode(plain);

  await db.authVerificationCode.create({
    data: {
      userId,
      channel,
      codeHash,
      expiresAt: new Date(Date.now() + AUTH_OTP_TTL_MS),
    },
  });

  logger.debug("Auth OTP challenge created", { userId, channel });
  return plain;
}

/**
 * Validates OTP for the latest non-expired challenge; clears challenges on success.
 */
export async function verifyOtpChallenge(
  userId: string,
  channel: VerificationChannel,
  code: string
): Promise<boolean> {
  const row = await db.authVerificationCode.findFirst({
    where: {
      userId,
      channel,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!row) {
    return false;
  }

  if (row.attempts >= AUTH_OTP_MAX_ATTEMPTS) {
    await db.authVerificationCode.delete({ where: { id: row.id } });
    return false;
  }

  if (!compareOtpHashes(row.codeHash, code.trim())) {
    await db.authVerificationCode.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    });
    return false;
  }

  await db.authVerificationCode.deleteMany({
    where: { userId, channel },
  });
  return true;
}
