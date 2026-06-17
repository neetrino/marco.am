# План оптимизации админ-панели (`/supersudo/*`)

Цель: открытие страниц за **миллисекунды–секунды**, а не 3–7 с.

Подход (уже применён на 4 страницах):

1. Найти корневую причину (Network + бэкенд), не чинить вслепую.
2. Минимальный diff: убрать лишние запросы и тяжёлые запросы к БД.
3. Повторить установленные паттерны (см. ниже).

---

## Уже оптимизировано

| Страница | Маршрут | Ключевые файлы |
|----------|---------|----------------|
| Dashboard | `/supersudo` | `admin-dashboard-client-cache.ts`, `admin-stats/*` |
| Products | `/supersudo/products` | `products/page.tsx`, `admin-products-read/*`, `admin-reference-data-cache.ts` |
| Orders (список) | `/supersudo/orders` | `orders/useOrders.ts`, `admin-orders/order-operations.ts` |
| Promo codes | `/supersudo/promo-codes` | `usePromoCodesAdmin.ts`, `promo-codes.service.ts` |

**Ожидаемое поведение после оптимизации любой страницы:**

- Первый заход: **1** API-запрос на сущность (или осознанный набор параллельных).
- Повтор < 2 мин: **0** API (sessionStorage cache).
- Warm по hover/click не дублирует запрос страницы (`dedupedAdminRequest`).

---

## Общие паттерны (копировать с готовых страниц)

| Паттерн | Где смотреть |
|---------|--------------|
| Dedup in-flight | `src/lib/admin/admin-request-dedup.ts` |
| Cache skip (`cached !== null` → return) | `usePromoCodesAdmin.ts`, `useOrders.ts`, `products/page.tsx` |
| Общий cache key (page + warm) | `src/lib/admin/admin-cache-keys.ts` |
| Warm только hover/click | `AdminNavProvider.tsx` → `warmAdminPageCacheForPath` |
| `force: true` после мутаций | orders, promo-codes |
| `tRef` вместо `t` в deps `useCallback` | `usePromoCodesAdmin.ts` |
| Бэкенд: `_count` / `groupBy` вместо полных join | orders, dashboard, promo-codes |
| Skeleton внутри `AdminPageLayout` | promo-codes `page.tsx` |

**Warm без dedup** (нужно дотянуть при оптимизации страницы):  
`warmUsersCache`, `warmMessagesCache`, `warmAttributesCache`, `warmSettingsCache`, `warmDeliveryCache`, `warmBannersCache`, `warmPriceFilterCache`, `warmAnalyticsCache`, `warmReelsAdminCache` — в `admin-page-warm.ts`.

---

## Очередь оптимизации (по приоритету)

### P0 — критично (много запросов / тяжёлый бэкенд)

#### 1. Quick Settings — `/supersudo/quick-settings`

**Симптомы (код):**

- Нет session cache вообще.
- При mount: **4 независимых fetch** — settings, **все страницы products** (limit 100, цикл по `totalPages`), categories, brands (`quick-settings/page.tsx`).
- При большом каталоге — десятки параллельных `GET /products` + медленные list-запросы.

**План:**

- [ ] **Frontend:** session cache для settings + categories + brands (переиспользовать `ADMIN_CACHE_KEYS` / `admin-reference-data-cache`).
- [ ] **Frontend:** не грузить весь каталог — только поиск/пагинация или отдельный лёгкий endpoint `GET /products/discounts` (id + discountPercent).
- [ ] **Frontend:** `dedupedAdminRequest`, cache skip, warm с теми же ключами что страница.
- [ ] **Backend (если остаётся list):** endpoint только `{ id, title, discountPercent }` без тяжёлых include.

**Файлы:** `src/app/supersudo/quick-settings/page.tsx`, `admin-page-warm.ts`, новый или существующий products read API.

---

#### 2. Analytics — `/supersudo/analytics`

**Симптомы (код):**

- До **4 API** на mount: `analytics`, `order-status-breakdown`, `stats` (только total users), `analytics/stock` (`useAnalytics.ts`, `useStockAnalytics.ts`).
- Всегда бьёт в API даже при валидном cache (`beginAdminDataFetch` без early return).
- Warm покрывает 3 endpoint, но **без dedup** → дубли с страницей.
- **`getAnalytics`** (`admin-stats/analytics.ts`): `order.findMany` за период с полным `items → variant → product → categories` — O(все заказы × позиции). Аналогичная проблема была на dashboard до `groupBy`.

**План:**

- [ ] **Frontend:** cache skip + dedup для всех 4 запросов; убрать лишний `GET /stats` — взять `users.total` из analytics или кэша dashboard.
- [ ] **Frontend:** `t` убрать из deps эффекта в `useAnalytics`.
- [ ] **Backend:** переписать `getAnalytics` на агрегаты: `groupBy` по продуктам/категориям, raw SQL для orders-by-day (уже есть), bounded `take` для top/least lists.
- [ ] **Backend:** `getCustomerAnalytics` — проверить full-scan заказов.
- [ ] **Warm:** `dedupedAdminRequest` для analytics week + breakdown + stock.

**Файлы:** `analytics/hooks/*`, `admin-stats/analytics.ts`, `customer-analytics.ts`, `admin-page-warm.ts`.

---

#### 3. Attributes — `/supersudo/attributes`

**Симптомы (код):**

- **`ensureColorsColumnsExist()`** на каждый `GET` — 2× `information_schema` + потенциальный `ALTER` (`admin-attributes-read.service.ts`).
- Тяжёлый `findMany` с nested translations/values.
- Нет cache skip — всегда refetch.
- Warm без dedup.
- Избыточный `logger.devLog` в цикле по каждому value.

**План:**

- [ ] **Backend:** миграцию columns вынести в Prisma migration / one-time flag; убрать runtime DDL из read path.
- [ ] **Frontend:** cache skip + dedup в `useAttributes.ts`.
- [ ] **Frontend:** `cached !== null` для пустого списка атрибутов.
- [ ] **Warm:** dedup в `warmAttributesCache`.

**Файлы:** `admin-attributes-read.service.ts`, `attributes/useAttributes.ts`, `admin-page-warm.ts`.

---

### P1 — высокий (дубли запросов + заметный бэкенд)

#### 4. Categories — `/supersudo/categories`

**Симптомы:**

- `GET /categories` по умолчанию `includeCounts: true` → **scan всех products** (`admin-categories.service.ts`).
- Products page уже использует `counts=false`; categories page — **нет**.
- Нет cache skip, нет dedup (`categories/hooks/useCategories.ts`).
- Warm через `warmAdminCategoriesCache` — полный список с counts.

**План:**

- [ ] **Frontend:** `counts=false` если `productCount` не нужен в UI списка (или отдельный lazy load counts).
- [ ] **Frontend:** cache skip + dedup; общий ключ с warm (`categories:${lang}`).
- [ ] **Backend:** опционально кэш subtree counts или materialized count (если counts нужны на UI).

**Файлы:** `useCategories.ts`, `admin-categories.service.ts`, `admin-reference-data-cache.ts`.

---

#### 5. Users — `/supersudo/users`

**Симптомы:**

- Cache есть, но **всегда идёт API** после показа cache (`users/page.tsx` — нет early return).
- Warm без dedup.
- **Баг бэкенда:** route игнорирует query `page`, `search`, `role`; service `take: 100` фиксировано (`admin-users.service.ts`, `users/route.ts`). UI пагинация/фильтры могут работать только на клиенте.

**План:**

- [ ] **Frontend:** cache skip + dedup; `buildAdminListCacheKey` уже есть.
- [ ] **Backend:** реальная пагинация + фильтры в Prisma; `_count.orders` уже ок.
- [ ] **Warm:** dedup + те же params что default list.

**Файлы:** `users/page.tsx`, `admin-users.service.ts`, `api/.../users/route.ts`.

---

#### 6. Messages — `/supersudo/messages`

**Симптомы:** как users — cache + unconditional refetch, warm без dedup.

**План:**

- [ ] Cache skip + dedup.
- [ ] Проверить messages service на тяжёлые поля (полный `message` body в list — ок для 20 строк).

**Файлы:** `messages/page.tsx`, `admin-page-warm.ts`.

---

#### 7. Reels — `/supersudo/reels`

**Симптомы:**

- 3 parallel API (`reels`, `likes`, `views`) — ок, но **без dedup** с warm.
- `reload` зависит от `[t]` → лишний refetch.
- `loading` initial `useState(false)` при наличии cache — неконсистентно.
- Нет cache skip.

**План:**

- [ ] Cache skip + dedup (один составной ключ `reelsAdmin` уже есть).
- [ ] `tRef`, исправить initial loading.
- [ ] Warm: обернуть bundle в `dedupedAdminRequest`.

**Файлы:** `reels/page.tsx`, `admin-page-warm.ts`.

---

### P2 — средний (простые страницы, типовые фиксы)

#### 8. Brands — `/supersudo/brands`

- Cache есть, нет skip/dedup.
- **Дополнительно:** `fetchR2Logos()` на каждый mount — отдельный `GET /brands/r2-logos` (R2 list). Lazy: только при открытии секции R2 или по кнопке Refresh.

**Файлы:** `brands/page.tsx`, warm для brands list.

---

#### 9. Settings — `/supersudo/settings`

- Простой `GET /settings`, cache без skip.
- Warm дублирует с quick-settings (тот же endpoint) — dedup по `ADMIN_CACHE_KEYS.settings`.

**Файлы:** `settings/page.tsx`, `admin-page-warm.ts`.

---

#### 10. Delivery — `/supersudo/delivery`

- Аналогично settings: cache + always refetch.

**Файлы:** `delivery/page.tsx`.

---

#### 11. Hero Banner — `/supersudo/hero-banner`

- Cache + always refetch; один endpoint, низкий риск.

**Файлы:** `hero-banner/page.tsx`.

---

#### 12. Price Filter Settings — `/supersudo/price-filter-settings`

- Cache + always refetch; `loading` initial false при cache (как reels).

**Файлы:** `price-filter-settings/page.tsx`.

---

### P3 — отдельные маршруты

#### 13. Order detail — `/supersudo/orders/[id]`

- **Нет cache** (`useOrderDetail.ts`).
- Каждый fetch: `setOrderDetails(null)` → мигание UI.
- Бэкенд: глубокий `include` (items → variant → product → options → attributeValue → translations).

**План:**

- [ ] Session cache по `orderId` (короткий TTL или invalidate on PUT).
- [ ] Не сбрасывать order при refetch если уже есть данные (`beginAdminDataFetch` pattern).
- [ ] Бэкенд: сузить select; lazy-load audit trail если тяжёлый.

**Файлы:** `orders/useOrderDetail.ts`, `admin-orders/order-operations.ts`.

---

#### 14. Products add — `/supersudo/products/add`

- Только redirect на `?create=1` — **оптимизация не нужна**.

---

## Чеклист на одну страницу (DoD)

```
[ ] Network: 1 запрос (или документированный N) на первый заход
[ ] Network: 0 запросов на повтор < 2 мин
[ ] Warm hover не дублирует запрос страницы
[ ] Cache skip: cached !== null → return (включая пустой массив)
[ ] dedupedAdminRequest с тем же key что warm
[ ] Мутации: force refetch или optimistic + invalidate
[ ] Loading: skeleton внутри AdminPageLayout, не fullscreen
[ ] Бэкенд: нет N+1, нет full table scan без need
[ ] Логи: devLog только summary, не per-row в prod path
```

---

## Глобальные улучшения (после P0–P2, по согласованию)

| Идея | Зачем |
|------|--------|
| Redis / server cache для analytics & stats | Снять нагрузку с Postgres на тяжёлых отчётах |
| Индекс `Order.couponCode`, `Order.createdAt` | Уже полезно для promo/dashboard; проверить EXPLAIN |
| Единый `GET /supersudo/bootstrap?paths=...` | Сократить round-trips для settings+reference data |
| SSR / RSC для статичных admin shell | Быстрее first paint (архитектурное решение) |

---

## Рекомендуемый порядок работ

1. **Quick Settings** — максимальный выигрыш при большом каталоге.  
2. **Analytics** — самый тяжёлый бэкенд среди оставшихся.  
3. **Attributes** — runtime migration на каждый read.  
4. **Categories** — counts=false + cache skip.  
5. **Users / Messages** — быстрые фронтовые фиксы + users backend pagination.  
6. Остальные P2 по одному шаблону.  
7. **Order detail** — когда трогаем orders глубже.

---

## Как проверять

1. DevTools → Network: фильтр `supersudo`, hard reload страницы.
2. Повторный заход в течение 2 мин — 0 API.
3. Hover по пункту меню → 1 warm-запрос; клик → 0 дублей.
4. Server logs / Prisma: время запроса, отсутствие sequential N+1.

---

*Обновлено: 2026-06-17 · Оптимизированы: dashboard, products, orders, promo-codes*
