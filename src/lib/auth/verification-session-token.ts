import * as jwt from "jsonwebtoken";

const VERIFY_PURPOSE = "verify_credentials";

export type VerificationChannel = "email" | "phone";

export function signVerificationSessionToken(
  userId: string,
  channel: VerificationChannel
): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw {
      status: 500,
      type: "https://api.shop.am/problems/internal-error",
      title: "Internal Server Error",
      detail: "Server configuration error",
    };
  }
  return jwt.sign(
    { userId, purpose: VERIFY_PURPOSE, channel },
    secret,
    { expiresIn: "15m" } as jwt.SignOptions
  );
}

export function parseVerificationSessionToken(token: string): {
  userId: string;
  channel: VerificationChannel;
} {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw {
      status: 500,
      type: "https://api.shop.am/problems/internal-error",
      title: "Internal Server Error",
      detail: "Server configuration error",
    };
  }
  const decoded = jwt.verify(token, secret) as {
    userId?: string;
    purpose?: string;
    channel?: string;
  };
  if (
    decoded.purpose !== VERIFY_PURPOSE ||
    !decoded.userId ||
    (decoded.channel !== "email" && decoded.channel !== "phone")
  ) {
    throw {
      status: 401,
      type: "https://api.shop.am/problems/unauthorized",
      title: "Invalid verification session",
      detail: "Verification session is invalid or expired",
    };
  }
  return { userId: decoded.userId, channel: decoded.channel };
}
