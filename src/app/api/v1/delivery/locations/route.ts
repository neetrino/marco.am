import { NextResponse } from "next/server";
import { adminDeliveryService } from "@/lib/services/admin/admin-delivery.service";
import { logger } from "@/lib/utils/logger";

type DeliveryLocation = {
  id?: string;
  city: string;
  price: number;
};

/**
 * GET /api/v1/delivery/locations
 * Public endpoint for checkout city selector.
 */
export async function GET() {
  try {
    const settings = await adminDeliveryService.getDeliverySettings();
    const locations = (settings.locations ?? []) as DeliveryLocation[];

    const citySet = new Set<string>();
    for (const location of locations) {
      const city = location.city.trim();
      if (city.length > 0) {
        citySet.add(city);
      }
    }

    return NextResponse.json({
      cities: Array.from(citySet).sort((a, b) => a.localeCompare(b)),
    });
  } catch (error: unknown) {
    logger.error("Failed to load delivery locations for checkout", { error });
    return NextResponse.json(
      {
        type: "https://api.shop.am/problems/internal-error",
        title: "Internal Server Error",
        status: 500,
        detail: "Failed to load delivery locations",
      },
      { status: 500 }
    );
  }
}
