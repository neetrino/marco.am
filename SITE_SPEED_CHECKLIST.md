# Чек-лист ускорения сайта

Короткая инструкция: как делать быстро, дёшево для БД и CDN. Подходит для любого Next.js storefront.

**Цель:** первый экран — мгновенно; тяжёлые данные — из кеша; БД — только на cache miss и при изменениях.

---

## 1. Три слоя (в таком порядке)

| Слой | Что даёт | Когда |
|------|----------|-------|
| **Static / ISR** | HTML с данными с CDN, без lambda | Маркeting, about, brands, home |
| **Redis read-through** | Тёплый ответ ~50–200 ms | PLP, PDP, категории, бренды |
| **Read-model (проекция)** | Один индексный запрос вместо JOIN | Каталог, PDP, фильтры брендов |

Не прыгай сразу в Redis — сначала убери всё, что ломает статику.

---

## 2. Чек-лист по шагам

### A. Не ломай статический рендер

- [ ] **Root `layout.tsx` без `cookies()` / `headers()`** — иначе весь сайт dynamic.
- [ ] Язык/валюта — дефолт на сервере + клиентский скрипт / `localStorage`, не SSR-cookie.
- [ ] Контентные страницы (about, contact, legal) — `'use client'` + `useTranslation`, страница static.

### B. Статика и ISR

- [ ] **`export const revalidate = N`** + при необходимости `dynamic = 'force-static'`.
- [ ] **Данные в HTML**, не client-fetch после гидрации — иначе пользователь ждёт skeleton (пример: `/brands`).
- [ ] **`unstable_cache` + tag** для Next.js CDN-кеша; **`revalidateTag` / `revalidatePath`** из admin PUT/POST.
- [ ] Home, brands, legal — prerender при build; обновление по событию, не по короткому TTL.

### C. Read-model (дешёвая БД)

- [ ] Горячие пути — **денormalized таблицы** (`ProductListingRow`, `ProductPdpRow`), не deep Prisma include.
- [ ] Фильтры/фасеты — по проекции, не `EXISTS` на каждую строку (пример: бренды через `GROUP BY brandId`).
- [ ] Синк проекции — одна точка (`product-read-model-sync`); после sync — инвалидация кешей.

### D. Redis read-through

- [ ] **`getCachedJson(key, ttl, fetcher)`** — один паттерн для всех public GET.
- [ ] Upstash: **`automaticDeserialization: false`** (строка JSON in/out).
- [ ] **Длинный TTL (24h)** + **явная инвалидация** при изменении данных — не короткий TTL «ради свежести».
- [ ] Инвалидация по **scoped patterns** (`cache:products:plp:*`, `cache:products:pdp:*`, `home:brand-partners:*`).
- [ ] **`invalidateProductReadCaches()`** — PLP + PDP + brands в одном месте после sync товара.

### E. Прогрев (warm-up)

- [ ] После deploy / cold start — **loopback POST** на internal warm route (не import Redis в instrumentation).
- [ ] Прогрев: home rails, default PLP, top-N PDP, categories, **brands** (3 локали).
- [ ] **Bounded concurrency** — не 100 параллельных запросов в БД на старте.
- [ ] На Vercel: standalone + env `CACHE_WARM_ON_START=1`; serverless без warm = холодный каждый раз.

### F. Клиент — мгновенная навигация

- [ ] PLP → PLP / menu → shop: **client-side URL** (`history.pushState`), не full RSC navigation.
- [ ] PLP → PDP: **seed из карточки** (фото, цена, title) + фоновый fetch полного PDP.
- [ ] React Query: `initialData` / `placeholderData`, не пустой экран при переходе.
- [ ] Prefetch: pointerdown / idle, **узко** (route + API params), не blast всего каталога.

### G. PDP

- [ ] Detail + related — **parallel** SSR; один Redis key на slug+lang.
- [ ] Listing shell (`isListingShell`) — UI сразу, кнопки disabled до полных данных.
- [ ] Long TTL + invalidation on product change; optional warm top-24 from page-1 PLP.

---

## 3. Правило TTL

```
Короткий TTL без invalidation = постоянные cache miss = дорогая БД.
Длинный TTL + invalidation on write     = быстро + свежо после правок.
```

Admin меняет данные → `revalidatePath` / `revalidateTag` + `deletePattern` Redis → пользователь видит новое сразу.

---

## 4. Анти-паттерны

| Не делать | Почему |
|-----------|--------|
| Client-only fetch для первого экрана | +300–800 ms skeleton после каждого захода |
| `cookies()` в root layout | Весь сайт dynamic |
| Короткий TTL «на всякий случай» | Кеш почти не работает |
| `products: { some: ... }` на списках | N× EXISTS, секунды на cold |
| Warm без auth / CSRF exempt internal route | Warm не запускается (403) |
| `next start` при `output: standalone` | Нет instrumentation → нет warm |

---

## 5. Быстрая проверка после внедрения

1. **`pnpm build`** — hot routes `○` (static/ISR), не `ƒ` без причины.
2. **Cold vs warm** — `curl -w '%{time_total}'` на page HTML и API; warm &lt; 200 ms.
3. **Browser** — переход menu → page: нет skeleton там, где данные уже есть.
4. **После admin PUT** — страница/API обновились без ожидания TTL.
5. **Production** — Vercel CDN отдаёт `/brands`, `/` из edge; БД не дергается на каждый визит.

---

## 6. Порядок работ на новом сайте

1. Убрать dynamic из layout (cookies/headers).
2. Статика / ISR для marketing + embed данных в HTML.
3. Read-model для каталога и PDP.
4. Redis read-through + long TTL + invalidation map.
5. Warm на старте + revalidate из admin.
6. Client navigation + seeds для переходов внутри shop.

---

*Marco.am — реализация: см. commits от 2026-06-20, `docs/PLP_CACHE_PERFORMANCE_DONE.md`, `docs/ARCHITECTURE_PERFORMANCE_STANDARDS.md`.*
