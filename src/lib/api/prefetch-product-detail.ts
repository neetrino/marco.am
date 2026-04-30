import type { QueryClient } from '@tanstack/react-query';
import type { LanguageCode } from '@/lib/language';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
export function prefetchProductDetail(
  queryClient: QueryClient,
  slug: string,
  lang: LanguageCode,
): Promise<void> {
  if (!slug) {
    return Promise.resolve();
  }
  return queryClient
    .prefetchQuery({
      queryKey: queryKeys.productDetail(slug, lang),
      queryFn: () =>
        apiClient.get<unknown>(`/api/v1/products/${slug}`, {
          params: { lang },
        }),
      staleTime: 120_000,
    })
    .then(() => undefined);
}
