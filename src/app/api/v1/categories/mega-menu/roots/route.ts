import { NextRequest, NextResponse } from 'next/server';

import { toApiErrorResponse } from '@/lib/api/next-route-error';
import { categoriesMegaMenuService } from '@/lib/services/categories-mega-menu.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lang = searchParams.get('lang') || 'en';
    const result = await categoriesMegaMenuService.getRoots(lang);
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=240',
      },
    });
  } catch (error: unknown) {
    console.error('❌ [CATEGORIES MEGA MENU ROOTS] Error:', error);
    return toApiErrorResponse(error, req.url);
  }
}
