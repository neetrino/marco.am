import { NextRequest, NextResponse } from 'next/server';

import { toApiErrorResponse } from '@/lib/api/next-route-error';
import { categoriesMegaMenuService } from '@/lib/services/categories-mega-menu.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'en';
    const { slug } = await params;
    const result = await categoriesMegaMenuService.getBranch(slug, lang);
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=240',
      },
    });
  } catch (error: unknown) {
    console.error('❌ [CATEGORIES MEGA MENU BRANCH] Error:', error);
    return toApiErrorResponse(error, req.url);
  }
}
