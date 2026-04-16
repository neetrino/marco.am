import * as jwt from "jsonwebtoken";
import { db } from "@white-shop/db";
import { logger } from "../utils/logger";

export interface SessionUserPayload {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
}

export interface AuthSuccessPayload {
  user: SessionUserPayload;
  token: string;
}

export async function buildAuthSuccessPayload(
  userId: string
): Promise<AuthSuccessPayload> {
  const user = await db.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      roles: true,
    },
  });

  if (!user) {
    logger.error("Auth session: user missing", { userId });
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Not found",
      detail: "User not found",
    };
  }

  if (!process.env.JWT_SECRET) {
    logger.error("Auth config error: JWT_SECRET is not set");
    throw {
      status: 500,
      type: "https://api.shop.am/problems/internal-error",
      title: "Internal Server Error",
      detail: "Server configuration error",
    };
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } as jwt.SignOptions
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles,
    },
    token,
  };
}
