import { getBrandsPageDataCached } from '@/lib/brands-page-server-data';

import { BrandsDirectoryGrid } from './BrandsDirectoryGrid';

/** Brand grid — streamed from deduped server payload. */
export async function BrandsPageContent() {
  const { brands, pageTitle, emptyMessage } = await getBrandsPageDataCached();

  return (
    <div className="w-full pb-16 pt-10">
      <div className="marco-header-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#383838] dark:text-white md:text-4xl">
            {pageTitle}
          </h1>
        </div>
        {brands.length === 0 ? (
          <p className="text-center text-slate-600 dark:text-slate-400">
            {emptyMessage}
          </p>
        ) : (
          <BrandsDirectoryGrid brands={brands} />
        )}
      </div>
    </div>
  );
}
