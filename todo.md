# План ускорения админки (`/supersudo/*`)

**Цель:** первый заход — 1 (или документированный N) API; повтор < 2 мин — 0 API; тяжёлые страницы — без full scan БД.

**Базовый паттерн (уже на большинстве страниц):** `readAdminSessionCache` → cache skip → `dedupedAdminRequest` → warm по hover (`admin-page-warm.ts`).

**Статус на старт:** ~14/18 страниц уже оптимизированы. Ниже — оставшаяся работа по фазам.

---

## Фаза 0 — Quick wins (баги + лишние запросы)

> Оценка: ~1–2 ч. Эффект сразу на Orders и Products.

- [x] **Orders — fix empty-list cache**  
  `useOrders.ts`: `cached?.data?.length` → `cached !== null` (пустой `[]` = valid cache).  
  Файлы: `src/app/supersudo/orders/useOrders.ts`

- [x] **Products — fix empty-list cache**  
  `products/page.tsx`: то же правило + `beginAdminDataFetch` не зависеть от `length`.  
  Файлы: `src/app/supersudo/products/page.tsx`

- [x] **Products — убрать лишний fetch brands**  
  На list page не вызывать `warmAdminReferenceDataCaches()` (тянет brands без нужды).  
  Warm только categories lite или page-specific warm.  
  Файлы: `src/app/supersudo/products/page.tsx`, при необходимости `admin-page-warm.ts`

**DoD фазы 0:** повторный заход Orders/Products с пустым списком = 0 API; cold Products −1 supersudo call.

---

## Фаза 1 — Backend hot spots (макс. ROI при росте каталога)

> Оценка: 1–2 дня. Критично при 5k+ SKU.

- [ ] **Categories — counts без full product scan**  
  Сейчас: `findMany` все products для subtree counts.  
  Цель: SQL `GROUP BY` / read-model (`ProductListingRow.primaryCategoryId`) или lazy «обновить counts».  
  Файлы: `src/lib/services/admin/admin-categories.service.ts`

- [ ] **Quick Settings — discounts без scan всего каталога**  
  Сейчас: `getProductDiscountsList` → `findMany` all products.  
  Цель: pagination + search на бэкенде, или кеш списка с invalidation on product change.  
  Файлы: `src/lib/services/admin/admin-products-read/product-discounts-list.ts`, API route, `useQuickSettings.ts`

**DoD фазы 1:** cold Categories и Quick Settings < 1 с на production-каталоге (замер до/после).

---

## Фаза 2 — Средний приоритет (editor + analytics)

> Оценка: ~1 день.

- [ ] **Product editor sheet — reuse admin cache**  
  `?create=1` / `?edit=`: settings, brands, categories, attributes через `fetchAdminBrands` / session cache, не raw `apiClient.get`.  
  Файлы: `useProductDataLoading.ts`, `admin-reference-data-cache.ts`

- [ ] **Analytics — customer block**  
  Убедиться, что period orders не full scan; при необходимости SQL aggregate.  
  Файлы: `src/lib/services/admin/admin-stats/customer-analytics.ts`

- [ ] **Analytics — warm для частых period**  
  Расширить warm: `month` или prefetch при hover (сейчас только `week`).  
  Файлы: `admin-page-warm.ts`, `useAnalytics.ts`

**DoD фазы 2:** открытие create/edit product без 4 cold API; custom analytics period быстрее cold.

---

## Фаза 3 — UX polish (воспринимаемая скорость)

> Оценка: ~0.5 дня. API count не меняется.

- [ ] **Skeleton вместо fullscreen loader**  
  Hero banner, Delivery, Settings — паттерн как promo-codes (`AdminPageLayout` + skeleton).  
  Файлы: `hero-banner/page.tsx`, `delivery/page.tsx`, `settings/page.tsx`

**DoD фазы 3:** нет fullscreen block на этих трёх страницах.

---

## Фаза 4 — Архитектура (по согласованию, не блокер)

> Делать после фаз 0–2, если нужен следующий уровень.

- [ ] **`GET /api/v1/supersudo/bootstrap?paths=...`**  
  Схлопнуть round-trips: Dashboard (4) + Quick Settings (4) → 1 запрос.

- [ ] **Redis server cache для analytics/stats**  
  Снять нагрузку с Postgres на тяжёлых отчётах (TTL + invalidation on order).

- [ ] **Order detail warm по hover**  
  Осознанно не делали (лишние запросы при скролле). Пересмотреть только если есть жалобы.

---

## Страницы без работ (эталон / N/A)

| Страница | Статус |
|----------|--------|
| Dashboard | ✅ cache + dedup + warm (опц. bootstrap в фазе 4) |
| Promo codes | ✅ эталон |
| Users, Messages, Brands, Attributes | ✅ |
| Reels, Price filter | ✅ |
| Order detail | ✅ (warm skip — by design) |
| Products add | ✅ redirect only |

---

## Как проверять каждую фазу

1. DevTools → Network → filter `supersudo`: cold vs repeat < 2 min.
2. Hover menu → 1 warm; click → 0 дублей.
3. Server/Prisma: нет sequential N+1, нет full table scan без need.
4. Зафиксировать before/after (ms + count API) в комментарии к PR.

---

## Порядок старта

**Сейчас:** Фаза 0 → Фаза 1 → Фаза 2 → Фаза 3 → Фаза 4 (если нужно).
