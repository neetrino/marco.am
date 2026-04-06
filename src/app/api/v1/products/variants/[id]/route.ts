import { NextRequest, NextResponse } from "next/server";
import { toApiErrorResponse } from "@/lib/api/next-route-error";
import { db } from "@white-shop/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const variant = await db.productVariant.findUnique({
      where: { id },
      select: {
        id: true,
        productId: true,
        stock: true,
        published: true,
      },
    });

    if (!variant) {
      return NextResponse.json(
        {
          type: "https://api.shop.am/problems/not-found",
          title: "Variant not found",
          status: 404,
          detail: `Variant with id '${id}' not found`,
          instance: req.url,
        },
        { status: 404 }
      );
    }

    // Calculate available based on stock > 0 and published === true
    const available = variant.stock > 0 && variant.published === true;

    return NextResponse.json({
      id: variant.id,
      productId: variant.productId,
      stock: variant.stock,
      available: available,
    });
  } catch (error: unknown) {
    console.error("❌ [PRODUCTS] Get variant error:", error);
    return toApiErrorResponse(error, req.url);
  }
}

