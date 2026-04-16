import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { authenticateToken } from "@/lib/middleware/auth";
import { shippingAddressesService } from "@/lib/services/shipping-addresses.service";
import { logger } from "@/lib/utils/logger";

export async function PATCH(
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
    const result = await shippingAddressesService.setDefaultAddress(user.id, addressId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    logger.error("Users addresses default PATCH error", { error });
    return toApiErrorResponse(error, req.url);
  }
}
