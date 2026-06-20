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

---

# Часть 2. Форвард-план после QA-аудита (2026-06-20)

Источники: QA-аудит read-model + бизнес-заметки `todo.md` (4 пункта). Эта часть фиксирует, что и в каком порядке доделывать. Реализация по фазам строго сверху вниз; каждая фаза закрывается только после тестов и runtime-замеров.

## Связь требований и фаз

| Откуда | Требование | Где решается |
|---|---|---|
| Аудит P0 #1 | Фасеты для brand/price/search/комбинаций показывают глобальные counts, не совпадающие с листингом | Phase 8 |
| `todo.md` #3 | Фильтры должны показывать только то, что применимо к товарам выбранной категории | Phase 8 + Phase 9 |
| `todo.md` #2 | Категории в сайдбаре всегда видимы и переключаемы, не скрываются при выборе | Phase 8 (drill-down semantics) + Phase 9 (UI) |
| `todo.md` #1 | With/Without price не должен давать пустую категорию; сегментировать, а не жёстко исключать | Phase 9 |
| Аудит P0 #2 | Полный нетранзакционный rebuild фасетов на admin-write (окно пустых фасетов, блокировка запроса) | Phase 10 |
| Аудит P1 | Категорийный фильтр ходит в operational tables на hot-path | Phase 10 |
| Аудит P1 | Next 16 + React 18.3 несовместимы | Phase 11 |
| Аудит P2 | Нет EXPLAIN, CI perf, дублирование `items/data` в payload | Phase 11 |
| `todo.md` #4 | Ускорить весь сайт: приоритет — главная страница и PDP | Phase 12 |

## Рекомендованный порядок и обоснование

1. **Сначала архитектурный фикс фасетов (Phase 8), а не быстрые UX-правки.** Причина: `todo.md` #3 и #2 невозможно сделать корректно поверх текущего предрасчёта scope — нужны корректные scoped-counts для произвольных комбинаций. Live-агрегация закрывает и баг аудита P0 #1, и требование #3 одной заменой.
2. Затем **UX PLP (Phase 9)** — #1/#2/#3 как видимое поведение поверх корректных фасетов.
3. Затем **упрощение/харднинг write-side (Phase 10)** — после перехода на live-агрегацию вся тяжёлая rebuild-машина фасетов удаляется, write становится дешёвым.
4. Затем **perf-харднинг (Phase 11)** — EXPLAIN, версии, CI, payload.
5. В конце — **скорость всего сайта (Phase 12)**: главная + PDP.

Альтернатива: сделать дешёвые #1/#2 раньше Phase 8. Не рекомендую — #2 (категории не скрываются) корректно завязано на drill-down семантику фасетов из Phase 8, иначе придётся переписывать дважды.

---

## Phase 8. Фасеты через live-агрегацию (архитектурный фикс)

Цель: убрать предрасчёт `product_facet_counts` как источник, считать фасеты на лету агрегатом по узкой `product_listing_rows` с теми же фильтрами, что и листинг. Это даёт всегда-корректные counts для любых комбинаций и удешевляет запись.

- [x] Реализовать SQL-агрегацию фасетов по `product_listing_rows` (`$queryRaw` + `Prisma.sql`/`Prisma.join`):
  - brand: `GROUP BY brandSlug` + meta
  - category: `unnest(categoryIds)` → (categoryId, productId) пары + ancestor rollup distinct-продуктов в JS
  - color: `jsonb_array_elements(colors) GROUP BY lower(value)` (label/imageUrl/hex из JSON)
  - size: `unnest(sizeTokens) GROUP BY`
  - attribute: `jsonb_array_elements(technicalSpecs) GROUP BY key,value` (с label/type)
  - price: `min/max(priceSort)`
- [x] Реализовать drill-down семантику: при подсчёте counts конкретной фасеты её собственное измерение исключается из WHERE (`buildFacetWhere(except)`); selected spec-keys считаются отдельными запросами с исключением своей группы.
- [x] Категорийная фасета считается без применения выбранной категории к самой себе → все категории остаются видимы (вход для `todo.md` #2).
- [x] Прочие фасеты считаются в scope выбранной категории/фильтров → показываются только применимые (вход для `todo.md` #3).
- [x] `getProductsPlpReadModelFilters` переключён на live-агрегацию; `fetchFilters`/`resolveFacetScope`/чтение `product_facet_counts` удалены из read-path.
- [x] `EXPLAIN (ANALYZE, BUFFERS)` для brand facet: index scan по `product_listing_rows_locale_priceSort_idx`, execution `2.297 ms`, без seq scan.
- [x] Тесты на drill-down исключение измерений и ancestor-rollup (`product-facet-live.test.ts`).

Файлы:

- `src/lib/read-model/product-facet-live-where.ts` — нормализация фильтров + `buildFacetWhere(except)`.
- `src/lib/read-model/product-facet-live-aggregation.ts` — facet-запросы + сборка `ProductsFiltersData` + `rollupCategoryCounts`.
- `src/lib/read-model/product-plp-filter-parse.ts` — общие парс-хелперы (DRY с листингом).
- `src/lib/read-model/products-plp-read-model-types.ts` — общие типы (разрыв циклического импорта).

Замеры (local → remote Neon, cold; DB-side aggregation ~2-5 ms, остальное — сетевой RTT и резолв slug категории через operational tables, см. Phase 10):

- default facets: `2416 ms` wall (brands=57, categories=3 root, colors=10, attrs=40, price 381-1197000).
- category facets (`furniture-making-accessories`): `4352 ms` wall, сужено до brands=1/colors=0/attrs=2 (drill-down подтверждён). Из них ~2.2s — `findCategoryBySlug` по operational tables.
- category+brand combined payload: `1349 ms` wall.

Exit criteria:

- [x] Counts сайдбара сужаются под активные фильтры (drill-down), не глобальные.
- [ ] Facet-агрегация p95 на prod-like (co-located Neon, warm pool) <= 50 ms — проверить после деплоя/прогретого пула; DB-side уже ~2-5 ms.
- [x] Планы запросов используют индексы без полного seq scan (подтверждено для brand facet).

Остаток (переходит в Phase 10): резолв slug категории через operational tables на hot-path даёт основной wall-clock; денормализовать.

## Phase 9. PLP UX: price-presence, категории, контекстные фильтры

- [x] `todo.md` #1 — With/Without price как сегментация, а не жёсткое исключение:
  - реализовано через денормализованную колонку `hasPrice` + сортировка `hasPrice` первым ключом (`with` → priced first, `without` → unpriced first), а не вторым запросом
  - жёсткий price-presence фильтр убран из listing `buildWhere`
  - категория с unpriced товарами больше не пустая
- [x] `todo.md` #2 — блок категорий в сайдбаре:
  - по факту закрыт Phase 8: drill-down исключает категорию из собственного фасета → соседние категории сохраняют counts и не пропадают (раньше scope-прун скрывал их)
  - price-presence убран из base-условий фасетов → категории с unpriced товарами больше не получают count 0 и не прячутся
  - `CategoryFilter` уже всегда рендерит полный список и лишь отмечает выбранную (схлопывания при выборе не было)
- [x] `todo.md` #3 — фильтры зависят от категории:
  - закрыт Phase 8: фасеты brand/color/size/attribute считаются в scope выбранной категории (drill-down)
  - filter-компоненты уже возвращают `null` при пустом фасете (`BrandFilter`, и т.д.) и скрывают группы без значений (`ShopAttributeFacetsFilter`)
- [x] Сохранить optimistic UI и session cache при переключениях (не затронуто).
- [x] Browser QA (закрывает остаток Phase 5): pagination, counts, selected filters, empty states — все 5 проверок PASS.

Изменения данных/схемы:

- Migration `20260620120000_storefront_read_model_has_price`: `hasPrice BOOLEAN` + backfill `("priceSort" > 0)` + index `(locale, hasPrice, productCreatedAt desc)`. Применена к dev DB, client перегенерирован. Полный rebuild не требовался (backfill в миграции).
- `product-listing-row-builder.ts`: пишет `hasPrice`.
- Facets: `pricePresence` убран из base; price range считается по `priceSort > 0`.

Фикс Prisma raw-query (выявлен в browser QA, не воспроизводился под `tsx`):

- Расширенный клиент (`shared/db/client.ts` `$extends`/`$allOperations`) несовместим с `$queryRaw(Prisma.sql`...`)` (→ «Argument query is missing»), а tagged-форма не инлайнит вложенные `Prisma.sql` (→ `syntax error at "$1"`).
- Решение: композиция остаётся на `Prisma.sql`/`Prisma.join`, выполнение — через `$queryRawUnsafe(query.text, ...query.values)` (хелпер `runFacetQuery`). Это совпадает с уже принятым в проекте паттерном (`admin-attributes-write/migration.ts`).

Проверка:

- dev DB (en): `hasPrice` priced=1164/unpriced=755; `with` → priced первыми; `without` → unpriced первыми; категория `furniture-making-accessories` (`with`) → priced первым, затем unpriced (не пустая).
- API: `/api/v1/products/plp?includeFilters=1` → 200; default brands=81/colors=10/attrs=40, категория → brands=25/colors=0/attrs=2 (drill-down).
- Browser QA (все PASS): сегментация, категории видимы при выборе, Furniture сужает фильтры до 1 бренда (Colors/Attributes скрыты), counts/selected/Clear, pagination.

Exit criteria:

- [x] Вход в непустую категорию никогда не даёт пустой экран из-за price-presence.
- [x] Категории не исчезают при выборе.
- [x] В категории видны только применимые фильтры; counts корректны (drill-down).
- [x] Подтверждено в браузере (pagination/selected/empty states).

## Phase 10. Write-side: упрощение и харднинг

- [x] Удалить rebuild-машину фасетов из write-path (после Phase 8 не нужна):
  - `product-read-model-sync.ts` переписан как listing-only (760 → ~370 строк): убраны `rebuildProductFacetCounts*`, `loadCategoryLabels`, `loadListingRowsForFacets`, `loadCategoryScopeKeysForCategoryIds`, `affectedFacetScopes`, scope-fingerprint-хелперы.
  - `...AndFacetCounts`-обёртки переименованы в чистые: `syncProductListingReadModel`, `syncProductListingReadModelByBrand/ByCategoryIds/ByAttributeId/ByAttributeValueId`, `deleteProductListingReadModel`, `rebuildProductListingReadModel`.
  - Обновлены все вызовы в admin-сервисах (products create/update/delete, brands, categories ×5, attributes, settings); убраны 4 dead-вызова `rebuildProductFacetCountsFromReadModel` после reorder/move/delete категорий (дерево фасетов теперь live).
- [x] Удалить мёртвый код: `product-facet-count-builder.ts`(+test), `src/scripts/rebuild-product-facet-counts.ts`, npm-скрипт `rebuild:plp-facets`.
- [x] Снять таблицу `product_facet_counts`: удалена модель `ProductFacetCount` из schema + миграция `20260620140000_drop_product_facet_counts` (DROP TABLE, применена к dev DB), client перегенерирован.
- [x] Денормализация категорийного дерева (вариант A — без новых колонок):
  - builder включает ancestor-категории в существующие `categoryIds`/`categorySlugs` (closure через `parentById`); GIN-индексы уже есть.
  - `loadCategoryAncestry()` в sync (parent-map + per-locale slugs), передаётся в builder во всех трёх путях (single/batch/rebuild).
  - read-path переведён на прямой slug-матч: listing `categorySlugs hasSome tokens`, facet `categorySlugs && tokens` (вместо id-резолва).
  - `resolveCategoryIdsForFilter` и `findCategoryBySlug` удалены (мёртвые); `buildWhere`/`buildFacetFilterInput` стали синхронными.
  - read-model перестроен (rebuild, 7676 строк) для backfill предков.
- [ ] Если где-то нужен тяжёлый пересчёт листинга (категория/бренд массово) — вынести в durable background job, не блокировать admin-ответ.

Проверка: `tsc --noEmit` чист, eslint изменённых файлов чист, read-model тесты (9) зелёные. Нет ссылок на `product_facet_counts`/`ProductFacetCount` в коде (только docs/TODO). Фильтр по родительской категории `furniture-making-accessories` → 24 товара из подкатегорий (`laminated-boards`/`laminated-chipboard`) через GIN, без operational `findCategoryBySlug`.

Exit criteria:

- [x] Admin-write больше не делает полный facet-rebuild (только транзакционный listing sync).
- [x] Storefront-фасеты не зависят от записи — нет окна пустых фасетов (live-агрегация).
- [x] Категорийный PLP-запрос не читает operational `categories` на каждый запрос (denorm slug-матч).

## Phase 11. Perf-харднинг (остаток Phase 7)

- [x] Схлопнуть дублирование payload `items/pagination` vs `data/meta`:
  - `PlpReadModelPayload` и `getProductsPlpReadModelPayload` → каноничная форма `{ items, pagination, filters }` (убраны дублирующие `data`/`meta` — массив товаров больше не сериализуется дважды в ответе `/plp`).
  - Прямые server-потребители переведены на `.items`/`.pagination` (`ProductsShopListingSection`, `home-product-rails-data`, `/api/v1/products` route).
  - HTTP-клиенты `/plp`, читавшие `.data`, мигрированы на `.items` (`HomeSpecialOffersSection`, `FeaturedProductsTabs` ×2, guest-cart, wishlist). Prefetch/listing-client уже читали `data ?? items` — фоллбэк сохранён.
  - `/api/v1/products` (legacy route) сохраняет `data`/`meta` алиасы для внешних клиентов (мобайл) — публичный API не ломаем.
  - Проверка: `tsc` чист, eslint изменённых файлов чист, вся тест-сюита **249/249** зелёная.
- [ ] Привести React к 19.2+ под Next 16; проверить сборку/гидрацию (мажорный бамп — отдельным шагом с прод-build).
- [ ] CI smoke/perf script: `/products`, category PLP, brand PLP, promotion PLP с budget-порогами.
- [~] Bundle/JS audit (snapshot):
  - Прод-build на текущем стеке (React 18.3.1 + Next 16.1.7) **успешен**, 126 static pages за ~485ms — стек стабилен (baseline).
  - Total client JS ~4.5MB; крупнейшие chunks: `zod` 336KB (отдельный chunk, грузится у форм checkout/login/register/admin — на PLP не на критическом пути), `react-dom` 220KB, `lucide` 120KB (проверить tree-shaking иконок), 160/132KB — app-код.
  - Точная привязка chunks→`/products` требует `@next/bundle-analyzer` (Next 16 не печатает per-route size). Follow-up.
- [ ] Документировать rollback.

Exit criteria:

- [ ] Зафиксированы измеримые budgets и regression-checks в CI.
- [ ] Версии Next/React совместимы, прод-сборка стабильна.

## Phase 12. Скорость всего сайта (`todo.md` #4)

- [ ] Снять baseline (TTFB/LCP/INP, payload, DB-времена) для главной и PDP.
- [ ] Главная страница: найти архитектурные и DB-узкие места; перевести горячие выборки на read-model/проекции, где оправдано.
- [ ] PDP: убрать тяжёлые operational joins из горячего рендера; рассмотреть PDP-проекцию или точечные индексы по результатам EXPLAIN.
- [ ] Применить общий паттерн (узкая проекция + индексы + минимум client JS) к остальным медленным маршрутам.

Exit criteria:

- Главная и PDP открываются в пределах согласованного budget на прогретом соединении.
- Есть baseline → after таблица по каждому маршруту.

## Примечание к старым фазам

- Phase 3 unchecked-пункты (brand/promotion scoped precomputed facets) **намеренно отменяются**: предрасчёт scope заменяется live-агрегацией (Phase 8), поэтому материализовать дополнительные scope не требуется.
