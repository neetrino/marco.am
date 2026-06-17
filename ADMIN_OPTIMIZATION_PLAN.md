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

#### 1. Quick Settings — `/supersudo/quick-settings` ✅

**Было:** N× `GET /products` (полный list API, все страницы) + 3 тяжёлых запроса без cache skip.

**Сделано:**

- [x] `GET /api/v1/supersudo/products/discounts` — один лёгкий запрос (`id`, `title`, `image`, `price`, `discountPercent`)
- [x] `useQuickSettings.ts` — cache skip, dedup, `counts=false` для categories
- [x] Убран refetch всего каталога после save settings; optimistic update после save product discount
- [x] Warm: settings + product discounts + reference data с dedup

**Файлы:** `product-discounts-list.ts`, `products/discounts/route.ts`, `useQuickSettings.ts`, `admin-page-warm.ts`

---

#### 2. Analytics — `/supersudo/analytics` ✅

**Было:** `getAnalytics` грузил все заказы с items/variants/products; `getCustomerAnalytics` — все заказы для first-order map; 5 API (analytics + breakdown + stats + stock + дубли).

**Сделано:**

- [x] Backend: SQL aggregates — order stats, product sales, top categories, orders-by-day
- [x] Backend: `buildFirstOrderAtMap` → один `GROUP BY` SQL вместо full scan
- [x] `totalUsers` в ответе analytics — убран лишний `GET /stats`
- [x] Frontend: cache skip + dedup в `useAnalytics` и `useStockAnalytics`
- [x] Warm: dedup + правильный stock cache key (locale + limit)

---

#### 3. Attributes — `/supersudo/attributes` ✅

**Было:** runtime DDL + ~200 строк fallback; debug-логи per value; всегда refetch.

**Сделано:** чистый `findMany`, cache skip + dedup, warm с dedup.

---

### P1 — высокий (дубли запросов + заметный бэкенд)

#### 4. Categories — `/supersudo/categories` ✅

**Сделано:** раздельные cache keys (`lite` / `counts`), cache skip + dedup, warm с counts для categories page.

---

#### 5. Users — `/supersudo/users` ✅

**Сделано:** backend pagination + search + role filter; `useUsersAdmin` — cache skip, dedup, `force` после мутаций; warm с dedup; убран client-side role filter.

**Файлы:** `useUsersAdmin.ts`, `users/page.tsx`, `admin-users.service.ts`, `admin-cache-keys.ts`, `admin-page-warm.ts`.

---

#### 6. Messages — `/supersudo/messages` ✅

**Сделано:** `useMessagesAdmin` — cache skip + dedup; warm с dedup; backend `count` + `findMany` параллельно; `force` после bulk delete.

**Файлы:** `useMessagesAdmin.ts`, `messages/page.tsx`, `admin-cache-keys.ts`, `admin-page-warm.ts`, `messages/route.ts`.

---

#### 7. Reels — `/supersudo/reels` ✅

**Сделано:** cache skip + dedup (bundle из 3 API); `tRef` вместо `[t]` в deps; initial `loading` из cache; warm с dedup + исправлена форма cache payload (`likesByReelId` / `viewsByReelId`).

**Файлы:** `reels/page.tsx`, `admin-page-warm.ts`.

---

#### 8. Brands — `/supersudo/brands` ✅

**Сделано:** `fetchAdminBrands` (cache skip + dedup); страница без unconditional refetch; R2 logos — lazy через IntersectionObserver + Refresh; `force` после мутаций; empty list = valid cache.

**Файлы:** `brands/page.tsx`, `admin-reference-data-cache.ts`.

---

#### 9. Settings — `/supersudo/settings` ✅

**Сделано:** cache skip + dedup на load.

**Файлы:** `settings/page.tsx`, `admin-page-warm.ts` (warm уже с dedup).

---

#### 10. Delivery — `/supersudo/delivery` ✅

**Сделано:** cache skip + dedup; `force` после save; warm с dedup.

**Файлы:** `delivery/page.tsx`, `admin-page-warm.ts`.

---

#### 11. Hero Banner — `/supersudo/hero-banner` ✅

**Сделано:** cache skip + dedup; warm с dedup.

**Файлы:** `hero-banner/page.tsx`, `admin-page-warm.ts`.

---

#### 12. Price Filter Settings — `/supersudo/price-filter-settings` ✅

**Сделано:** cache skip + dedup; initial `loading` из cache; warm с dedup.

**Файлы:** `price-filter-settings/page.tsx`, `admin-page-warm.ts`.

---

### P3 — отдельные маршруты

#### 13. Order detail — `/supersudo/orders/[id]` (следующий)

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
5. ~~**Users / Messages**~~ ✅  
6. ~~**Brands / Settings / Delivery / Hero / Price Filter**~~ ✅  
7. **Order detail** — следующий (P3).

---

## Как проверять

1. DevTools → Network: фильтр `supersudo`, hard reload страницы.
2. Повторный заход в течение 2 мин — 0 API.
3. Hover по пункту меню → 1 warm-запрос; клик → 0 дублей.
4. Server logs / Prisma: время запроса, отсутствие sequential N+1.

---

*Обновлено: 2026-06-17 · Оптимизированы: dashboard, products, orders, promo-codes, quick-settings, analytics, attributes, **categories***
