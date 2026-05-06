'use client';

import { Button } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { toDomSafeImgSrcString, toSafeImgAttributeSrc } from '../../../../lib/utils/image-utils';
import type { Category, CategoryWithLevel } from '../types';

interface CategoryItemProps {
  category: CategoryWithLevel;
  parentCategory: Category | null;
  selected: boolean;
  onToggleSelect: (categoryId: string, checked: boolean) => void;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string, categoryTitle: string) => void;
}

export function CategoryItem({
  category,
  parentCategory,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
}: CategoryItemProps) {
  const { t } = useTranslation();
  const depthPrefix = category.level > 0 ? `${'— '.repeat(category.level)} ` : '';
  const safeCategoryImage = toSafeImgAttributeSrc(category.media?.[0] ?? null);

  return (
    <tr className="group border-b border-slate-100 transition-colors hover:bg-amber-50/50">
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(event) => onToggleSelect(category.id, event.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-amber-500 focus:ring-amber-400"
          aria-label={`Select ${category.title}`}
        />
      </td>
      <td className="px-2 py-2 align-middle">
        {safeCategoryImage ? (
          <img
            src={toDomSafeImgSrcString(safeCategoryImage)}
            alt=""
            className="h-12 w-12 rounded-lg border border-slate-200 bg-white object-cover"
          />
        ) : (
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-400"
            aria-hidden
          >
            —
          </div>
        )}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 group-hover:text-amber-900">
            {`${depthPrefix}${category.title}`}
          </span>
          {category.requiresSizes && (
            <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              Sizes
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-sm text-slate-600">{category.slug}</td>
      <td className="px-3 py-3 text-sm text-slate-600">{parentCategory?.title || '—'}</td>
      <td className="px-3 py-3">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
            className="border border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-900"
          >
            {t('admin.common.edit')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(category.id, category.title)}
            className="border border-red-100 bg-red-50/70 text-red-600 hover:border-amber-300 hover:bg-amber-100 hover:text-red-700"
          >
            {t('admin.common.delete')}
          </Button>
        </div>
      </td>
    </tr>
  );
}




