# Shop PLP performance audit and rebuild plan

Дата: 2026-06-19

Цель: страница `/products` должна открываться и реагировать на фильтры максимально быстро. На практике "миллисекундно без кэша" возможно только для уже подготовленных данных: статическая/материализованная read-модель, индексы, маленький payload и минимум client JS. Если каждый запрос заново считает фасеты по товарам, вариантам, переводам и ценам, это физически не будет стабильно занимать миллисекунды на реальной базе.

## Главный вывод

Проект уже содержит несколько оптимизаций PLP: lean listing query, Redis/read-through cache, разделение core/extended фильтров, client session cache, idle prefetch. Но текущая архитектура всё ещё строит страницу из нескольких дорогих частей:

- RSC страница ждёт server data для listing и частей фильтров.
- Фильтры частично догружаются клиентом через `/api/v1/products/filters/extended`.
- При изменении фильтров есть искусственная задержка 280 ms перед refetch фасетов.
- Listing обычно считает точный `total` отдельным count-запросом.
- Карточка товара может рендерить слайдер со всеми картинками товара на PLP.
- Фасеты строятся несколькими SQL/Prisma запросами по продуктам, вариантам, option rows, категориям, брендам и sample для технических атрибутов.
- Большая часть storefront UI является client component, что увеличивает hydration/JS cost.

## Конкретные найденные причины

### 1. Фильтры не полностью server-first

Файл: `src/components/ProductsFiltersProvider.tsx`

- `FACET_REFETCH_DELAY_MS = 280` на строке 68 уже добавляет почти треть секунды задержки.
- Extended фильтры грузятся клиентом через `/api/v1/products/filters/extended` на строках 263-281.
- При отсутствии client cache provider дополнительно вызывает category fallback и extended fetch на строках 330-350.
- На событие изменения URL запускается отложенный full filters fetch на строках 353-370.

Результат: пользователь видит, что фильтры появляются/обновляются не сразу. Даже идеальная база не исправит искусственную задержку и client round-trip.

### 2. Listing API не включает быстрый approximate total

Файл: `src/lib/shop-products-listing-api-params.ts`

- API params выставляют `listingOmitProductAttributes`, `plpLeanListing`, `compact`, `limit`, но не выставляют `skipExactTotalCount` на строках 11-18.

Файл: `src/lib/services/products-find-query.service.ts`

- Если `skipExactTotalCount` не включён, listing делает `getProductsListingCountCached(filters)` параллельно с запросом товаров на строках 224-226.
- Быстрый approximate total уже существует (`deriveApproximateTotal`) на строках 96-114 и используется только когда `skipExactTotalCount` включён.

Результат: фильтр/пагинация часто ждёт не только 12 товаров, но и точный count всей выборки.

### 3. Фасеты строятся на лету, а не из read-модели

Файл: `src/lib/services/products-filters-sql-path.ts`

- Core фасеты одновременно считают price bounds, brands, category product rows, parent map на строках 78-85.
- Extended фасеты получают product IDs, затем color facets, size facets, attribute sample на строках 117-127.
- Full aggregation просто объединяет core и extended на строках 148-155.

Результат: это нормальная оптимизация по сравнению с полным include, но не архитектура для "за миллисекунды" на холодном запросе. Нужно хранить готовые facet rows и counters.

### 4. PLP карточки могут рендерить слишком много изображений

Файл: `src/components/home/SpecialOfferImageSlider.tsx`

- Если у карточки больше одной картинки, компонент мапит `images.map` и создаёт `next/image` для каждого slide на строках 151-166.
- На PLP это умножается на количество карточек. Даже при `loading="lazy"` остаётся React tree, layout, observers и props processing.

Результат: список товаров может тормозить CPU/hydration и layout, особенно на мобильных и при 12-21 карточках.

### 5. Слишком много client components в storefront

Проверка по `src/components` и `src/app`: найдено 349 файлов с `'use client'`.

Файл: `src/app/layout.tsx`, `src/components/ClientProviders.tsx`

- Всё приложение проходит через общий client provider tree: theme, query, auth, cart, language sync, toast, popup.

Результат: даже страницы, которым нужен быстрый первый paint, получают широкий client runtime. Для PLP это особенно больно, потому что фильтры, grid, карточки, header/cart/wishlist logic и prefetch logic активны одновременно.

### 6. Глобальный prefetch/warm конкурирует за ресурсы

Файл: `src/components/navigation/GlobalRoutePrefetch.tsx`

- На idle прогреваются route prefetch и тяжёлые payloads `/products`/`/reels` на строках 165-180.
- На pointer/focus прогревается route и API payload на строках 217-227.

Результат: повторные переходы могут быть быстрыми, но текущая страница может терять сеть/CPU. Это надо делать через строгий budget, отмену и приоритеты.

### 7. Версии Next/React выглядят несовместимо

Файл: `package.json`

- `next` = `^16.1.7`, `@next/env` = `16.1.7`, но `react`/`react-dom` = `^18.3.0` на строках 62-64.

Результат: для Next 16 это системный риск. Надо привести React/React DOM к версии, поддерживаемой Next 16, либо откатить Next до версии, совместимой с React 18. Это не единственная причина медленного PLP, но это нельзя оставлять.

## План реализации

### Phase 0. Измерить, чтобы не лечить вслепую

1. Добавить PLP perf trace endpoint/script:
   - `/api/v1/products` duration, DB listing duration, count duration, transform duration, payload bytes.
   - `/api/v1/products/filters/core`, `/extended`, `/filters` duration по подзапросам: price, brands, categories, productIds, colors, sizes, attribute sample.
2. Снять baseline для:
   - `/products`
   - `/products?category=...`
   - `/products?brand=...`
   - `/products?minPrice=...&maxPrice=...`
   - `/products?spec...`
3. В браузере замерить:
   - TTFB, LCP, INP, JS downloaded, hydration time.
   - количество image requests на первый экран.
   - размер JSON для listing и filters.

Exit criteria: есть таблица baseline p50/p95 и понятно, что медленнее всего.

### Phase 1. Быстрые исправления без смены БД-модели

1. Убрать искусственную задержку `FACET_REFETCH_DELAY_MS = 280` или заменить на 0-50 ms debounce только для typed search.
2. Передавать `skipExactTotalCount=1` из `buildShopListingApiParams` для PLP и показывать approximate total/hasNextPage. Точный total догружать фоном только если нужен SEO/пагинация.
3. Для PLP карточек рендерить только главное изображение. Слайдер включать:
   - только на PDP/home sections, или
   - только после hover/tap, или
   - только для активной карточки.
4. Ограничить payload `images` в listing response до `image` + максимум 1 secondary image. Полную галерею грузить на PDP.
5. Убрать full filters fetch после filter change, если уже есть core/extended scoped payload. Не делать `/filters`, `/filters/core`, `/filters/extended` для одного и того же scope одновременно.
6. Проверить `Cache-Control` и Redis env в production. Если Redis отсутствует, `requireSharedCache` в production у listing уходит напрямую в DB.

Expected effect: меньше видимых задержек, меньше CPU на карточках, меньше DB count pressure.

### Phase 2. Перевести PLP на server-composed first response

1. Сделать единый server payload для PLP shell:
   - listing rows
   - visible filters core + extended для текущего scope
   - category tree
   - price range
2. Убрать обязательный client fetch фильтров при первом заходе.
3. Передавать initial filters напрямую в `ProductsFiltersProvider`, не через post-mount hydration effects.
4. На client navigation сначала применять optimistic UI, затем заменять одним compact API response.
5. Сделать один endpoint `/api/v1/products/plp` вместо пары `/products` + `/filters*` для интерактивных фильтров.

Expected effect: меньше waterfall и меньше React state churn.

### Phase 3. Главная архитектурная переделка: read-модель каталога

Чтобы реально получить миллисекундные ответы без зависимости от тяжёлых joins, нужна отдельная read-модель:

1. Создать таблицу `product_listing_rows`:
   - `productId`, `locale`, `slug`, `title`, `subtitle`, `brandId`, `brandName`, `brandSlug`
   - `primaryCategoryId`, `categoryIds`, `categorySlugPaths`
   - `priceMin`, `priceSort`, `discountPercent`, `stockState`
   - `image`, `secondaryImage`, `labelsJson`, `colorsJson`, `warrantyYears`
   - `createdAt`, `publishedAt`, `isPublished`
2. Создать таблицу `product_facet_rows` или `facet_counts`:
   - `scopeType`, `scopeKey`, `locale`, `facetType`, `facetKey`, `value`, `label`, `count`
   - Для default/category/brand/filter scope предрассчитать заранее.
3. Обновлять read-модель при:
   - product create/update/delete
   - variant update
   - category/brand/attribute translation update
   - discount settings update
4. Для сложных combined filters использовать:
   - быстрый indexed query по `product_listing_rows`
   - facet counts из precomputed scope, либо background recompute/stale fallback.
5. Prisma оставить для admin/write model, а storefront listing/facets читать через SQL/read model.

Expected effect: PLP перестаёт собирать карточки и фасеты из operational schema на каждый запрос.

### Phase 4. DB/index work

1. Добавить/проверить partial indexes:
   - published non-deleted products ordered by createdAt.
   - product listing rows by locale/category/brand/priceSort/createdAt.
   - facet counts by locale/scope/facet/value.
2. Проверить query plans через `EXPLAIN (ANALYZE, BUFFERS)` для всех baseline URL.
3. Убрать Prisma relation-heavy paths из storefront hot path.
4. Для search использовать trigram/full-text только на dedicated search endpoint, не смешивать с обычным listing path.

### Phase 5. Frontend/hydration diet

1. Разделить global providers:
   - минимальный storefront shell
   - cart/auth providers lazy или только где нужны
   - admin providers только под `/supersudo`
2. Перевести статичные части PLP карточки в server components, client оставить только actions/wishlist/compare.
3. Стабилизировать view mode без mount flicker: initial mode через cookie или CSS default, localStorage после idle.
4. Ограничить global prefetch:
   - network idle only
   - abort on navigation
   - no warming heavy routes on low-end/mobile saveData
   - max one warm request at a time.

### Phase 6. Version and build hygiene

1. Привести Next/React версии в совместимое состояние.
2. Проверить production build bundle analyzer.
3. Включить performance budgets:
   - PLP JS initial <= agreed threshold.
   - PLP listing JSON <= agreed threshold.
   - first-screen images <= agreed threshold.
4. Добавить CI perf smoke для `/products` и 2-3 filtered URLs.

## Приоритетный порядок работ

1. Phase 0 baseline.
2. Phase 1 items 1-4: delay, count, PLP images, payload.
3. Phase 1 item 5: убрать duplicate filters fetch.
4. Phase 2: единый PLP payload.
5. Phase 3: read-модель storefront каталога.
6. Phase 5/6 параллельно после стабилизации hot path.

## Implementation status

### 2026-06-19 pass 1

Сделано:

- Убран видимый 280 ms delay в `ProductsFiltersProvider`; refetch фасетов теперь читает `queryString` напрямую из `SHOP_PRODUCTS_LISTING_PARAMS_EVENT`, а не ждёт обновления URL/searchParams.
- Добавлена защита от stale responses: старые responses фильтров не должны перезаписывать новый scope после быстрых кликов.
- PLP карточки больше не монтируют многоизображенческий slider; для product grid используется одно hero image, но PDP navigation seed остаётся полноценным.
- Listing API params теперь запрашивают `listingImageLimit=1`, чтобы PLP JSON не тащил всю галерею.
- Добавлен опциональный `skipExactTotalCount` в `buildShopListingApiParams`.
- Count cache key больше не зависит от output-shape флагов (`listingImageLimit`, visual/lean flags), что уменьшает лишние cache misses.
- На `/api/v1/products`, `/api/v1/products/filters`, `/core`, `/extended` добавлен `Server-Timing` header для проверки parse/listing/filter/total durations.

Осталось:

- Прогнать unit tests, lint/build.
- Снять browser/API baseline по `Server-Timing`.
- Реализовать Phase 2: единый `/api/v1/products/plp` payload, чтобы убрать первый client fetch фильтров.
- Реализовать Phase 3 read-модель для настоящих миллисекунд на холодном пути.

### 2026-06-19 pass 2

Сделано:

- Основной SSR `/products` теперь использует `listingImageLimit=1` и `skipExactTotalCount=true`; первый HTML больше не тащит лишние gallery images и не обязан ждать `COUNT(*)`.
- PLP API params теперь по умолчанию отправляют `skipExactTotalCount=1`; точный count можно явно вернуть через `skipExactTotalCount: false`.
- Skip-count pagination стала корректнее: listing queries берут `limit + 1`, отдают только `limit` карточек и вычисляют `hasNextPage` без отдельного count.
- В `meta` добавлен `totalIsExact`, чтобы клиент отличал точную и приблизительную пагинацию.
- `ProductsPagination` получил approximate mode: в этом режиме показываются текущая страница и prev/next без ложной кнопки `last`.
- `/filters/core` и `/filters/extended` больше не обязаны на unscoped cache miss строить общий full filters payload; core и extended считаются раздельно.
- SSR core filters для дефолтной PLP страницы больше не считают category counts, потому что category tree уже стримится отдельным section.

Проверка после build на локальном production server `next start -p 3001`:

- `/api/v1/products?...plpLeanListing=1&listingImageLimit=1&skipExactTotalCount=1&limit=12`: `Server-Timing listing=4381ms`, повторно `2581ms`; payload 12 items, `maxImages=1`, `totalIsExact=false`.
- `/api/v1/products/filters/core?lang=en&includeCategories=0`: `filters=2976ms`.
- `/api/v1/products/filters/core?lang=en&includeCategories=1`: `filters=4470ms`.
- `/api/v1/products/filters/extended?lang=en`: `filters=3429ms`.
- `/products`: HTTP 200, HTML примерно 392 KB, ответ около 3.8s.

Вывод после pass 2: UI/payload/count исправлены, но холодный normalized DB path всё ещё слишком дорогой. Для цели "миллисекунды без кэша" следующий обязательный шаг — read-модель/материализованная projection таблица для listing rows и facet counts либо raw SQL projection с проверенным `EXPLAIN (ANALYZE, BUFFERS)`.

Осталось:

- Реализовать read-model/materialized storefront projection для listing rows и facet counts.
- Если делать промежуточный шаг до read-model: заменить Prisma relation graph для PLP на проверенный raw SQL projection и подтвердить план через `EXPLAIN (ANALYZE, BUFFERS)`.

## Что считать успехом

Минимальные цели:

- First `/products` TTFB p95 <= 250 ms на production region с прогретым DB connection.
- Client transition to filtered listing: visual response <= 100 ms, network reconciliation in background.
- `/api/v1/products/plp` p95 <= 150 ms для default/category/brand scopes после read-модели.
- First-screen PLP image requests: только изображения видимых карточек, без скрытых slide images.
- No required client filter fetch on first render.

Жёсткая цель "миллисекундно":

- Только для cached/precomputed/read-model scopes: default, category, brand, simple price ranges.
- Для произвольных combined technical specs без cache/read model честные миллисекунды не гарантируются; нужен предрасчёт или staged/stale UI.
