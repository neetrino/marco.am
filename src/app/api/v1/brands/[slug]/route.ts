import { NextRequest, NextResponse } from "next/server";
import { db } from "@white-shop/db";

/**
 * GET /api/v1/brands/[slug]
 * Public: get brand by slug with translations (for use on brand landing page).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const lang = req.nextUrl.searchParams.get("lang") || "en";

    const brand = await db.brand.findFirst({
      where: {
        slug: slug.trim(),
        published: true,
        deletedAt: null,
      },
      include: {
        translations: true,
      },
    });

    if (!brand) {
      return NextResponse.json(
        { type: "not-found", title: "Not found", status: 404, detail: "Brand not found" },
        { status: 404 }
      );
    }

    const translation =
      brand.translations.find((t) => t.locale === lang) || brand.translations[0];
    const name = translation?.name ?? slug;
    const description = translation?.description ?? null;

    return NextResponse.json({
      data: {
        id: brand.id,
        slug: brand.slug,
        name,
        description,
        logoUrl: brand.logoUrl,
      },
    });
  } catch (error) {
    console.error("[BRANDS]", error);
    return NextResponse.json(
      { type: "internal", title: "Error", status: 500, detail: "Failed to load brand" },
      { status: 500 }
    );
  }
}
