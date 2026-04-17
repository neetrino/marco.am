import { NextRequest, NextResponse } from "next/server";
import { db } from "@white-shop/db";
import { safeParseContactForm } from "@/lib/schemas/contact-form.schema";
import { consumeContactSubmissionSlot } from "@/lib/services/contact-rate-limit.service";
import { verifyContactTurnstileToken } from "@/lib/services/contact-turnstile.service";
import { toApiError } from "@/lib/types/errors";
import { getRequestClientIp } from "@/lib/utils/client-ip";
import { logger } from "@/lib/utils/logger";

function validationProblem(req: NextRequest, detail: string) {
  return NextResponse.json(
    {
      type: "https://api.shop.am/problems/validation-error",
      title: "Validation failed",
      status: 400,
      detail,
      instance: req.url,
    },
    { status: 400 }
  );
}

/**
 * POST /api/v1/contact
 * Submit contact form (Zod validation, honeypot, rate limit, optional Turnstile).
 */
export async function POST(req: NextRequest) {
  try {
    const raw: unknown = await req.json();
    const parsed = safeParseContactForm(raw);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const detail =
        Object.entries(first)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("; ") || parsed.error.message;
      return validationProblem(req, detail);
    }

    const { website, turnstileToken, name, email, subject, message } =
      parsed.data;
    if (website?.trim()) {
      logger.warn("Contact form honeypot triggered");
      return validationProblem(req, "Request could not be processed");
    }

    const ip = getRequestClientIp(req);
    const limit = await consumeContactSubmissionSlot(ip);
    if (!limit.allowed) {
      const headers: Record<string, string> = {};
      if (limit.resetMs !== undefined) {
        const retrySec = Math.max(
          1,
          Math.ceil((limit.resetMs - Date.now()) / 1000)
        );
        headers["Retry-After"] = String(retrySec);
      }
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/too-many-requests",
          title: "Too Many Requests",
          status: 429,
          detail:
            "Too many contact form submissions from this address. Please try again later.",
          instance: req.url,
        },
        { status: 429, headers }
      );
    }

    const captchaOk = await verifyContactTurnstileToken(turnstileToken, ip);
    if (!captchaOk) {
      return validationProblem(
        req,
        process.env.TURNSTILE_SECRET_KEY
          ? "Captcha verification failed or was missing"
          : "Request could not be processed"
      );
    }

    const contactMessage = await db.contactMessage.create({
      data: {
        name,
        email: email.trim(),
        subject,
        message,
      },
    });

    logger.info("Contact message created", { id: contactMessage.id });

    return NextResponse.json(
      {
        data: {
          id: contactMessage.id,
          name: contactMessage.name,
          email: contactMessage.email,
          subject: contactMessage.subject,
          message: contactMessage.message,
          createdAt: contactMessage.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logger.error("Contact form error", { error });
    const apiError = toApiError(error, req.url);
    return NextResponse.json(apiError, { status: apiError.status ?? 500 });
  }
}
