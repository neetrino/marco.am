# Поиск в проекте WhiteShop.am

Документ описывает, как реализован поиск в проекте. **Сторонние поисковые движки (Meilisearch, Algolia и т.п.) не используются** — только собственный поиск через Prisma и PostgreSQL.

---

## Единая логика (`src/lib/product-search/`)

Все product search paths используют **одинаковую token-AND семантику**:

- Запрос разбивается на слова (пробелы).
- **Каждый** token должен совпасть хотя бы с одним полем.
- Регистронезависимо (`insensitive` / `ILIKE`).

| Модуль | Назначение |
|--------|------------|
| `match.ts` | `splitProductSearchTokens`, `matchesProductSearchFields` — client-side filter (admin discounts) |
| `listing-row-where.ts` | `buildListingRowSearchWhereInput` — Prisma WHERE для `ProductListingRow` |
| `find-product-ids-by-sku.ts` | `findProductIdsBySkuSearch` — SKU fallback по variant.sku |
| `operational-where.ts` | `buildOperationalProductSearchWhere`, `buildOperationalCategorySearchWhere` — instant search |

### Поля поиска

**Listing row (admin products, PLP, facets):** `title`, `slug`, `searchText` + SKU через `productId IN (...)`.

**Operational tables (instant search):** `title`, `subtitle`, `sku` (товары); `title`, `slug`, `fullPath` (категории).

**Client-side (admin discounts):** те же поля, что listing row + `sku` на строке.

---

## Где используется

| Место | Execution | Модуль |
|-------|-----------|--------|
| Admin → Products | Server API | `listing-row-where` + `find-product-ids-by-sku` |
| Admin → Discounts | Client filter на preloaded list | `match.ts` |
| Storefront PLP (`/products?search=`) | Server read model | `listing-row-where` + SKU |
| PLP sidebar facets | Server SQL | token-AND на `searchText` + SKU |
| Instant search (header) | Server API | `operational-where.ts` |

---

## Instant Search (поиск по мере ввода в хедере)

**Реализован** через `GET /api/search/instant` с debounce на клиенте (`useInstantSearch`).

### Контракт API

- Query: `q` (обяз.), `lang` (`en|hy|ru`, optional), `limit`, `productLimit`, `categoryLimit`.
- Response: `results[]`, `categories[]`, `suggestions[]`.

### Ключевые файлы

| Файл | Назначение |
|------|------------|
| `src/components/hooks/useInstantSearch.ts` | Debounce, fetch, keyboard nav |
| `src/app/api/search/instant/route.ts` | API endpoint |
| `src/lib/services/instant-search.service.ts` | Бизнес-логика |
| `src/components/SearchDropdown.tsx` | UI dropdown |

### Важно

- `AbortController` при новом вводе.
- Без кэша ответа — новые товары из админки сразу видны.
- Enter → `/products?search=...` (тот же token-AND на PLP).

---

## Когда имеет смысл внешний движок

- Очень большой каталог и жёсткие требования к релевантности / опечаткам.
- Meilisearch/Algolia — отдельное решение, сейчас не используется.

---

*Документ актуален для WhiteShop.am. Поиск — только через Prisma/PostgreSQL и shared `lib/product-search`.*
