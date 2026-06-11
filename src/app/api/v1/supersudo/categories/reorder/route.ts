import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken, requireAdmin } from '@/lib/middleware/auth';
import { adminService } from '@/lib/services/admin.service';
import { logger } from '@/lib/utils/logger';

type ReorderScope = 'roots' | 'subcategories';

function isValidScope(value: unknown): value is ReorderScope {
  return value === 'roots' || value === 'subcategories';
}

/**
 * POST /api/v1/supersudo/categories/reorder
 * Reorder categories by drag-and-drop within current scope.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (!user || !requireAdmin(user)) {
      return NextResponse.json(
        {
          type: 'https://api.shop.am/problems/forbidden',
          title: 'Forbidden',
          status: 403,
          detail: 'Admin access required',
          instance: req.url,
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const categoryId = typeof body?.categoryId === 'string' ? body.categoryId.trim() : '';
    const targetCategoryId =
      typeof body?.targetCategoryId === 'string' ? body.targetCategoryId.trim() : '';
    const scope = body?.scope;
    const parentId = body?.parentId === null
      ? null
      : typeof body?.parentId === 'string'
      ? body.parentId.trim() || null
      : undefined;

    if (!categoryId || !targetCategoryId || !isValidScope(scope)) {
      return NextResponse.json(
        {
          type: 'https://api.shop.am/problems/bad-request',
          title: 'Invalid request',
          status: 400,
          detail: 'categoryId, targetCategoryId, and scope are required',
          instance: req.url,
        },
        { status: 400 },
      );
    }

    logger.devLog('↕️ [ADMIN CATEGORIES] Reorder request:', {
      categoryId,
      targetCategoryId,
      scope,
      parentId,
    });

    const result = await adminService.reorderCategory({
      categoryId,
      targetCategoryId,
      scope,
      parentId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('❌ [ADMIN CATEGORIES] REORDER Error:', error);
    return NextResponse.json(
      {
        type: error.type || 'https://api.shop.am/problems/internal-error',
        title: error.title || 'Internal Server Error',
        status: error.status || 500,
        detail: error.detail || error.message || 'An error occurred',
        instance: req.url,
      },
      { status: error.status || 500 },
    );
  }
}
