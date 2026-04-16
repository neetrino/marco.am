import * as bcrypt from "bcryptjs";
import { db } from "@white-shop/db";
import { logger } from "../utils/logger";
import { isAuthVerificationRequired } from "../constants/auth-verification";
import {
  type VerificationChannel,
  signVerificationSessionToken,
} from "../auth/verification-session-token";
import { createOtpChallenge } from "./auth-otp.service";
import { deliverVerificationCode } from "./verification-delivery.service";
import { buildAuthSuccessPayload, type AuthSuccessPayload } from "./auth-session.service";
import {
  verifyCredentialsWithOtp,
  resendVerificationOtp,
} from "./auth-verification-flow.service";

export interface RegisterData {
  email?: string;
  phone?: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginData {
  email?: string;
  phone?: string;
  password: string;
}

export type AuthSuccess = AuthSuccessPayload;

export type AuthPendingVerification = {
  needsVerification: true;
  channel: VerificationChannel;
  verificationToken: string;
};

export type RegisterResult = AuthSuccess | AuthPendingVerification;
export type LoginResult = AuthSuccess | AuthPendingVerification;

function normalizeEmail(email?: string): string | undefined {
  const t = email?.trim().toLowerCase();
  return t || undefined;
}

function normalizePhone(phone?: string): string | undefined {
  const t = phone?.trim();
  return t || undefined;
}

class AuthService {
  async register(data: RegisterData): Promise<RegisterResult> {
    const email = normalizeEmail(data.email);
    const phone = normalizePhone(data.phone);

    logger.debug("Auth registration attempt", {
      hasEmail: !!email,
      hasPhone: !!phone,
      hasFirstName: !!data.firstName,
      hasLastName: !!data.lastName,
    });

    if (!email && !phone) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation failed",
        detail: "Either email or phone is required",
      };
    }

    if (!data.password || data.password.length < 6) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation failed",
        detail: "Password must be at least 6 characters",
      };
    }

    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existingUser) {
      logger.info("Auth registration rejected: user already exists");
      throw {
        status: 409,
        type: "https://api.shop.am/problems/conflict",
        title: "User already exists",
        detail: "User with this email or phone already exists",
      };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const requireVerification = isAuthVerificationRequired();
    const emailVerified = Boolean(email && !requireVerification);
    const phoneVerified = Boolean(phone && !requireVerification);

    let user;
    try {
      user = await db.user.create({
        data: {
          email: email || null,
          phone: phone || null,
          passwordHash,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          locale: "en",
          roles: ["customer"],
          emailVerified,
          phoneVerified,
        },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          roles: true,
        },
      });
      logger.info("Auth user created", { userId: user.id });
    } catch (error: unknown) {
      const err = error as { code?: string };
      logger.error("Auth user creation failed", { error: err });
      if (err.code === "P2002") {
        throw {
          status: 409,
          type: "https://api.shop.am/problems/conflict",
          title: "User already exists",
          detail: "User with this email or phone already exists",
        };
      }
      throw error;
    }

    if (requireVerification) {
      const channel: VerificationChannel = email ? "email" : "phone";
      const target = email || phone;
      if (!target) {
        throw {
          status: 400,
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation failed",
          detail: "Either email or phone is required",
        };
      }
      const plain = await createOtpChallenge(user.id, channel);
      await deliverVerificationCode(channel, target, plain);
      const verificationToken = signVerificationSessionToken(user.id, channel);
      return {
        needsVerification: true,
        channel,
        verificationToken,
      };
    }

    return buildAuthSuccessPayload(user.id);
  }

  async login(data: LoginData): Promise<LoginResult> {
    const email = normalizeEmail(data.email);
    const phone = normalizePhone(data.phone);

    logger.debug("Auth login attempt", { hasEmail: !!email, hasPhone: !!phone });

    if (!email && !phone) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation failed",
        detail: "Either email or phone is required",
      };
    }

    if (!data.password) {
      throw {
        status: 400,
        type: "https://api.shop.am/problems/validation-error",
        title: "Validation failed",
        detail: "Password is required",
      };
    }

    const user = await db.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        passwordHash: true,
        roles: true,
        blocked: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    if (!user || !user.passwordHash) {
      logger.debug("Auth login: user not found or no password");
      throw {
        status: 401,
        type: "https://api.shop.am/problems/unauthorized",
        title: "Invalid credentials",
        detail: "Invalid email/phone or password",
      };
    }

    const isValidPassword = await bcrypt.compare(
      data.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      logger.debug("Auth login: invalid password");
      throw {
        status: 401,
        type: "https://api.shop.am/problems/unauthorized",
        title: "Invalid credentials",
        detail: "Invalid email/phone or password",
      };
    }

    if (user.blocked) {
      logger.info("Auth login rejected: account blocked", { userId: user.id });
      throw {
        status: 403,
        type: "https://api.shop.am/problems/forbidden",
        title: "Account blocked",
        detail: "Your account has been blocked",
      };
    }

    const requireVerification = isAuthVerificationRequired();
    if (requireVerification) {
      const channel: VerificationChannel = email ? "email" : "phone";
      const needsOtp =
        (channel === "email" && Boolean(user.email) && !user.emailVerified) ||
        (channel === "phone" && Boolean(user.phone) && !user.phoneVerified);

      if (needsOtp) {
        const target = channel === "email" ? user.email! : user.phone!;
        const plain = await createOtpChallenge(user.id, channel);
        await deliverVerificationCode(channel, target, plain);
        const verificationToken = signVerificationSessionToken(user.id, channel);
        return {
          needsVerification: true,
          channel,
          verificationToken,
        };
      }
    }

    return buildAuthSuccessPayload(user.id);
  }

  async verifyWithCode(
    verificationToken: string,
    code: string
  ): Promise<AuthSuccess> {
    return verifyCredentialsWithOtp(verificationToken, code);
  }

  async resendVerification(verificationToken: string): Promise<void> {
    return resendVerificationOtp(verificationToken);
  }
}

export const authService = new AuthService();
