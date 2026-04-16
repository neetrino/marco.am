import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken } from "@/lib/middleware/auth";
import { safeParseShippingAddressUpdate } from "@/lib/schemas/shipping-address.schema";
import { shippingAddressesService } from "@/lib/services/shipping-addresses.service";
import { logger } from "@/lib/utils/logger";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
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

    const { addressId } = await params;
    const raw = await req.json();
    const parsed = safeParseShippingAddressUpdate(raw);
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

    const result = await shippingAddressesService.updateAddress(user.id, addressId, parsed.data);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Users addresses PUT error", { error });
    return toApiErrorResponse(error, req.url);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ addressId: string }> }
) {
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

    const { addressId } = await params;
    await shippingAddressesService.deleteAddress(user.id, addressId);
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    logger.error("Users addresses DELETE error", { error });
    return toApiErrorResponse(error, req.url);
  }
}
