import { NextRequest, NextResponse } from "next/server";
import {
  handleIdramResult,
  parseIdramFields,
} from "@/lib/payments/idram/handle-result";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

async function readFields(request: NextRequest): Promise<Record<string, string>> {
  const contentType = request.headers.get("content-type") ?? "";
  const fields: Record<string, string> = {};

  if (contentType.includes("application/json")) {
    const json = (await request.json()) as Record<string, unknown>;
    for (const [key, value] of Object.entries(json)) {
      if (typeof value === "string" || typeof value === "number") {
        fields[key] = String(value);
      }
    }
    return fields;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    form.forEach((value, key) => {
      if (typeof value === "string") {
        fields[key] = value;
      }
    });
    return fields;
  }

  // Some gateways POST without content-type; also accept query on GET.
  request.nextUrl.searchParams.forEach((value, key) => {
    fields[key] = value;
  });

  try {
    const text = await request.text();
    if (text) {
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        fields[key] = value;
      });
    }
  } catch {
    // ignore empty body
  }

  return fields;
}

async function processResult(request: NextRequest): Promise<NextResponse> {
  try {
    const fields = parseIdramFields(await readFields(request));
    const result = await handleIdramResult(fields);
    return new NextResponse(result.body, {
      status: result.status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logger.error("Idram RESULT handler error", { error });
    return new NextResponse("", { status: 500 });
  }
}

/** Idram server-to-server RESULT_URL (POST preferred; GET tolerated). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return processResult(request);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return processResult(request);
}
