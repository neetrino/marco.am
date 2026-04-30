import { NextResponse } from "next/server";
import { CURRENCY_RATES_CACHE_KEY } from "@/lib/cache/public-cache-keys";
import { adminService } from "@/lib/services/admin.service";
import { getCachedJson } from "@/lib/services/read-through-json-cache";

const CURRENCY_RATES_TTL_SEC = 300;

export async function GET() {
  try {
    const rates = await getCachedJson(CURRENCY_RATES_CACHE_KEY, CURRENCY_RATES_TTL_SEC, async () => {
      const settings = await adminService.getSettings();
      return settings.currencyRates || {
        USD: 1,
        AMD: 400,
        EUR: 0.92,
        RUB: 90,
        GEL: 2.7,
      };
    });
    return NextResponse.json(rates);
  } catch (error: unknown) {
    console.error("❌ [CURRENCY RATES] Error:", error);
    return NextResponse.json({
      USD: 1,
      AMD: 400,
      EUR: 0.92,
      RUB: 90,
      GEL: 2.7,
    });
  }
}
