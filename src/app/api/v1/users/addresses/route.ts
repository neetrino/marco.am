import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken } from "@/lib/middleware/auth";
import {
  safeParseShippingAddressCreate,
} from "@/lib/schemas/shipping-address.schema";
import { shippingAddressesService } from "@/lib/services/shipping-addresses.service";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/unauthorized",
          title: "Unauthorized",
          status: 401,
          detail: "Authentication token required",
          instance: req.url,
        },
        { status: 401 }
      );
    }

    const result = await shippingAddressesService.getAddresses(user.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Users addresses GET error", { error });
    return toApiErrorResponse(error, req.url);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/unauthorized",
          title: "Unauthorized",
          status: 401,
          detail: "Authentication token required",
          instance: req.url,
        },
        { status: 401 }
      );
    }

    const raw = await req.json();
    const parsed = safeParseShippingAddressCreate(raw);
    if (!parsed.success) {
      const detail = parsed.error.issues.map((i) => i.message).join("; ");
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/validation-error",
          title: "Validation Error",
          status: 400,
          detail,
          instance: req.url,
        },
        { status: 400 }
      );
    }

    const result = await shippingAddressesService.addAddress(user.id, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    logger.error("Users addresses POST error", { error });
    return toApiErrorResponse(error, req.url);
  }
}
