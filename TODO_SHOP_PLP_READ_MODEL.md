# Shop PLP Read-Model Rebuild TODO

Дата старта: 2026-06-20

Цель: `/products` и фильтры должны открываться визуально быстрее 1 секунды, а storefront API для обычных каталоговых сценариев должен отвечать в десятки/сотни миллисекунд. Next.js и PostgreSQL остаются. Меняется hot-path архитектура: storefront читает подготовленную read-model, а не собирает карточки и facets из operational schema на каждый запрос.

## Важные условия

- Проект на этапе разработки, поэтому допускается глубокая переделка архитектуры.
- Текущие товары можно удалить и перезалить, но это не должно быть обязательным для разработки read-model.
- Operational tables (`products`, `product_variants`, `categories`, `brands`, `attributes`) остаются source of truth для админки.
- Storefront hot path должен читать projection/read-model tables.
- Любая фаза считается готовой только после тестов и runtime-замеров.

## Целевая архитектура

1. Админка пишет в нормализованные таблицы.
2. После изменения товара/варианта/категории/бренда/скидок обновляется storefront projection.
3. `/products` читает `product_listing_rows`.
4. Фильтры читают `product_facet_counts`.
5. PDP по-прежнему может читать детальные normalized данные, но PLP не должен тащить PDP-level relations.
6. Для fallback на время миграции старый Prisma path остается, пока новый path не пройдет проверку.

## Phase 1. DB foundation

- [x] Добавить Prisma models для:
  - `product_listing_rows`
  - `product_facet_counts`
- [x] Добавить SQL migration с индексами:
  - locale + published + createdAt
  - locale + categoryIds/categorySlugs GIN
  - colorTokens/sizeTokens/technicalSpecTokens GIN
  - locale + brand
  - locale + priceSort
  - facet lookup by locale/scope/facet/value
- [x] Проверить `prisma validate` и `db:generate`.

Exit criteria:

- Prisma schema валидна.
- Миграция additive, без удаления существующих таблиц.

## Phase 2. Backfill builder

- [x] Создать сервис/скрипт `rebuild-product-listing-read-model`.
- [x] Для каждого published non-deleted product и locale собрать:
  - [x] id/productId/locale/slug/title/subtitle
  - [x] brand id/slug/name/logo
  - [x] primaryCategoryId/categoryIds/categorySlugs
  - [x] price/current/compare/original/discount flags
  - [x] defaultVariantId/stock/inStock
  - [x] image/images limited for PLP
  - [x] labels/warranty/colors/requiresAttributeSelection
  - [x] colorTokens/sizeTokens/technicalSpecTokens
  - [x] technicalSpecs projection JSON
  - [x] searchText
- [x] Пересобирать rows в `product_listing_rows` через full projection rebuild.
- [x] Удалять stale rows для продуктов, которых больше нет или которые unpublished/deleted, через очистку projection table перед rebuild.
- [x] Добавить тесты на transformer.
- [x] Прогнать backfill на реальной dev DB после применения migration.

Exit criteria:

- Backfill строит rows для всех locale.
- Повторный запуск idempotent.
- Последний dev backfill: `productsRead=1919`, `rowsWritten=7676`, `locales=en/hy/ru/ka`, `durationMs=66969`.

## Phase 3. Facet counts builder

- [x] Построить default scope counts:
  - [x] category с ancestor counts и `parentId` meta
  - [x] brand
  - [x] color
  - [x] size, если такие данные есть в каталоге
  - [x] technical attribute facets
  - [x] price bounds metadata
- [x] Построить scoped counts минимум для:
  - [x] category scope
  - [ ] brand scope
  - [ ] promotion/filter scope
- [x] Добавить инвалидацию stale facet rows через full projection table rebuild.
- [x] Добавить тесты на counts и базовые edge cases.

Exit criteria:

- Default/category/brand filters не сканируют operational product tables на request.
- Последний dev facet rebuild: `sourceRows=7676`, `facetRows=7570`, `durationMs=11572`.

## Phase 4. Fast storefront API

- [x] Добавить `/api/v1/products/plp`.
- [x] Endpoint читает:
  - [x] listing rows из `product_listing_rows`
  - [x] core/extended facets из `product_facet_counts`
- [x] Поддержать:
  - [x] page/limit
  - [x] category с descendants через category metadata lookup + `categoryIds hasSome`
  - [x] brand
  - [x] filter/promotion
  - [x] min/max price
  - [x] colors/sizes
  - [x] technical `spec.*`
  - [x] sort createdAt/price/name
  - [x] locale
- [x] Вернуть compact payload для PLP:
  - [x] products
  - [x] pagination
  - [x] filters core
  - [x] filters extended
  - [x] serverTiming
- [x] Добавить `includeFilters=0` для listing-only запросов.
- [x] Добавить `includeItems=0` для filters-only запросов.
- [x] Старый API оставить как fallback.

Exit criteria:

- Default PLP API p95 target locally/prod-like: <= 200 ms без Redis.
- Текущий локальный замер против удаленного Neon:
  - `/api/v1/products/plp?includeFilters=0`: cold `2201 ms`, warm `328 ms`.
  - `/api/v1/products/plp?includeItems=0&includeFilters=1`: cold `5754 ms`, warm `575 ms`.
  - `/api/v1/products/plp` combined filters: warm `690-1149 ms`.
  - Ограничение: локальная машина ходит в удаленный Neon, поэтому эти цифры включают сетевой/Prisma jitter.

## Phase 5. Switch `/products`

- [x] SSR `/products` listing читает новый read-model service с `includeFilters=false`.
- [x] Client filter navigation listing ходит в `/api/v1/products/plp?includeFilters=0`.
- [x] Убрать initial waterfall `/products` + `/filters/core` + `/filters/extended` из текущего `/products` render path.
- [x] Сохранить optimistic UI и session cache.
- [x] Перевести filter provider/hydration на `product_facet_counts`, чтобы убрать старые `/filters/core` и `/filters/extended`.
- [x] Проверить базовый `/products` render в браузере: контент есть, products links есть, filters UI есть, error overlay/console errors нет.
- [ ] Проверить pagination, counts, selected filters, empty states в браузере.

Exit criteria:

- First `/products` visual response быстрее 1 секунды на нормальном соединении.
- Filter click визуально мгновенный, network reconciliation <= 200 ms target.
- Текущий `/products` production `next start`:
  - TTFB default cold `~186 ms`.
  - TTFB default warm `~36 ms`.
  - Full stream default cold `~1.24 s`.
  - Full stream default warm `~0.78 s`.
  - Category `dishwashers` warm full stream `~0.48 s` after category metadata lookup is warm.

## Phase 6. Write-side sync

- [x] При product create/update/delete обновлять affected listing rows.
- [x] При variant update обновлять affected product row через общий product update hook.
- [x] При brand/category/attribute translation update пересобирать rows/facets:
  - brand update/delete: full storefront read-model rebuild
  - category update: full storefront read-model rebuild
  - category move/reorder/delete: facet counts rebuild
  - attribute translation/value update: full storefront read-model rebuild
- [x] При discount settings update пересобирать prices/facets через full storefront read-model rebuild.
- [x] Добавить admin action hooks и reusable rebuild commands.
- [x] Оптимизировать broad metadata hooks с full storefront rebuild до affected product batch sync:
  - brand update/delete синхронизирует только товары бренда
  - category update синхронизирует только товары affected category subtree
  - attribute translation/value update синхронизирует только товары, где attribute/value реально используется
- [x] Оптимизировать facet rebuild до targeted scope rebuild:
  - product/brand/attribute/category affected sync пересобирает `catalog/default` и только affected category scopes
  - old/new category slugs учитываются через старые listing rows и существующие facet rows
- [ ] Довести facet rebuild до fully incremental counters или durable background job, если понадобится еще быстрее для больших category updates.

Текущее Phase 6 решение намеренно conservative: storefront hot path всегда читает свежую projection, а редкие admin writes платят стоимость sync/rebuild. Full storefront rebuild больше не используется для brand/category/attribute metadata changes, а facets теперь пересобираются targeted по затронутым scopes. Для production-scale следующая итерация может заменить scoped rebuild на incremental counters или durable queue.

Проверка после refactor:

- `pnpm run rebuild:plp-read-model`: `productsRead=1919`, `rowsWritten=7676`, `durationMs=65218`.
- `pnpm run rebuild:plp-facets`: `sourceRows=7676`, `facetRows=7570`, `durationMs=8015`.
- Product-level DB smoke: affected product rows `4`, facet rows `7570`.
- Affected helper DB smoke:
  - brand sample `1` product: listing `2446 ms`, facets `7745 ms`
  - attribute value sample `1` product: listing `3089 ms`, facets `9116 ms`
  - category sample `1125` products after batch-size tuning: listing `14948 ms`, facets `8822 ms`
- Targeted facets DB smoke:
  - brand sample `1` product: listing `3018 ms`, targeted facets `2170 rows / 5661 ms`
  - category sample `1125` products: listing `17505 ms`, targeted facets `6580 rows / 8448 ms`

Exit criteria:

- После изменения в админке storefront projection обновляется без ручного full rebuild.
- Product-level sync делает delete/create строк товара в одной транзакции.

## Phase 7. Performance hardening

- [x] Удалить legacy PLP/filter code, который больше не нужен новому `/products` path:
  - старые streamed filter sections `ProductsShopCategoryTreeSection` / `ProductsShopFiltersCoreSection`
  - legacy `/api/v1/products/filters*` endpoints
  - legacy `/api/v1/products/price-range` endpoint
  - old filters Redis wrapper and old products filters service/sql helper pipeline
  - old category facet tree warm cache
- [x] Перевести fallback/prefetch клиентские вызовы фильтров и PLP pagination warmup на `/api/v1/products/plp`.
- [x] Перевести home strips, wishlist/cart catalog fetch и featured tabs на `/api/v1/products/plp`.
- [x] Старый `/api/v1/products` оставить только как compatibility alias на read-model с `includeFilters=0` по умолчанию.
- [x] Удалить legacy listing service/cache слой:
  - `productsFindService`
  - old listing Redis/count/cache-key helpers
  - old operational-table PLP query service/filter service/query executor
  - old home-strip/promotion/price-sorted listing helpers
- [ ] `EXPLAIN (ANALYZE, BUFFERS)` для основных SQL запросов.
- [ ] CI smoke/perf script для:
  - `/products`
  - category PLP
  - brand PLP
  - promotion PLP
- [ ] Bundle/JS audit для PLP.
- [ ] React/Next version alignment: Next 16 должен идти с React 19.2+.
- [ ] Документировать rollback: env flag/use old API path.

Exit criteria:

- Есть измеримые budgets и regression checks.

## Текущий статус

- [x] Phase 1 complete.
- [x] Phase 2 complete: listing projection builder/script/tests/backfill готовы.
- [ ] Phase 3 mostly complete: default/category facets готовы; brand/promotion scoped facets еще отдельно не материализованы.
- [x] Phase 4 complete for listing + combined read-model endpoint.
- [ ] Phase 5 mostly complete: listing and filters sidebar switched; remaining browser QA for pagination/selected/empty states.
- [x] Phase 6 baseline complete: product/variant/brand/category/attribute/discount write hooks подключены; осталась optimization follow-up для non-blocking incremental rebuild.
- [ ] Phase 7 in progress: legacy PLP/filter/listing cleanup done; remaining perf/SQL/CI/bundle tasks open.
