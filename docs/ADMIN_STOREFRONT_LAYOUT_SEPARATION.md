# Задача: разделить storefront chrome и admin shell на `/supersudo/*`

> **Для AI-агента:** прочитай этот документ целиком, изучи указанные файлы, **сам выбери лучший профессиональный подход** из вариантов ниже, реализуй минимально и чисто. Не усложняй. Следуй правилам проекта в `.cursor/rules/`.

---

## Цель

На маршрутах админки (`/supersudo/*`) пользователь должен видеть **только admin UI**:
- сайдбар (`AdminSidebar`)
- контент страницы (`admin-main`)

На маршрутах витрины (`/`, `/products`, …) — **только storefront UI**:
- `Header` (поиск, корзина, навигация)
- `Footer`, `MobileBottomNav`

**Смешивание двух shell'ов недопустимо.**

---

## Симптом (баг)

При работе в админке одновременно видны:
1. **Storefront header** — логотип Marco Group, Home/Shop/Brands, поиск, корзина, язык/валюта
2. **Admin sidebar** — Orders, Products (Categories/Brands/Attributes), Promo codes, …
3. Контент со **скелетоном** загрузки

Скриншот: admin sidebar слева + полная шапка магазина сверху + серые placeholder-блоки в main.

Типичный маршрут при баге: `/supersudo/products`, `/supersudo`, и т.д.

**Это НЕ баг «Quick Access → Home»:** при переходе на `/` layout `supersudo` размонтируется, сайдбар уходит. На `/` storefront header — норма.

---

## Архитектура сейчас

```
src/app/layout.tsx (RootLayout)
  └── ClientProviders
        └── AppChrome                    ← storefront chrome для ВСЕХ маршрутов
              ├── Header                 ← всегда монтируется
              ├── <main>{children}</main>
              ├── Footer (dynamic, ssr: false)
              └── MobileBottomNav
                    └── children
                          └── [только /supersudo/*]
                                src/app/supersudo/layout.tsx
                                  └── AdminLayoutClient
                                        └── AdminShell
                                              ├── AdminSidebar (fixed top-0 left-0)
                                              └── admin-main → page content
```

Ключевые файлы:
| Файл | Роль |
|------|------|
| `src/app/layout.tsx` | Root layout, оборачивает всё в `AppChrome` |
| `src/components/AppChrome.tsx` | Storefront chrome (Header/Footer/Nav) |
| `src/components/Header.tsx` | Шапка магазина; внутри `if supersudo → return null` |
| `src/components/Footer.tsx` | `if pathname.startsWith('/supersudo') → return null` |
| `src/app/supersudo/layout.tsx` | Admin layout |
| `src/app/supersudo/AdminLayoutClient.tsx` | Theme guard + AdminShell + AdminAccessGate |
| `src/app/supersudo/components/AdminShell.tsx` | Сайдбар + main column |
| `src/app/supersudo/components/AdminSidebar.tsx` | `nav` с `fixed left-0 top-0 z-40 h-screen w-64` |

---

## Корневые причины

### 1. Вложенные layout'ы без структурного разделения

`AppChrome` оборачивает **и** storefront, **и** admin. Скрытие storefront на admin — через условия внутри дочерних компонентов, а не через layout tree.

### 2. Hydration deferral ломает скрытие Header на admin

В `Header.tsx` и `AppChrome.tsx`:

```ts
const [isHydrated, setIsHydrated] = useState(false);
const stablePathname = isHydrated ? pathname : '';
```

До гидрации `stablePathname === ''`, поэтому:
- `stablePathname.startsWith('/supersudo')` → **false**
- `Header` **рендерится** на `/supersudo/*` при SSR и первом client render
- после `useEffect` → `isHydrated = true` → Header исчезает

Пользователь видит смесь storefront + admin (особенно при загрузке / медленной гидрации).

`Footer.tsx` проверяет `pathname` напрямую — там этой проблемы нет.

### 3. CSS-конфликт при одновременном показе

- Header: `sticky top-0 z-50`
- Admin sidebar: `fixed left-0 top-0 z-40 h-screen`

Оба цепляются к `top: 0` viewport → визуальный коллапс layout.

### 4. Размазанная ответственность

Логика «не показывать storefront на admin» есть в:
- `AppChrome` (только `MobileBottomNav`, не Header)
- `Header` (return null)
- `Footer` (return null)
- `TidioDynamicLoader` (отдельный prefix check)

Нет единого gate. Легко забыть при добавлении нового chrome.

---

## Что уже работает правильно

- `MobileBottomNav` в `AppChrome` скрывается на `/supersudo` (через `isSupersudoRoute`, но тоже с hydration deferral — проверить после фикса)
- `Footer` скрывается на `/supersudo` по `pathname`
- Admin sidebar **не** должен показываться на `/` — layout `supersudo` не применяется
- `AdminAccessGate` показывает `AdminMainSkeleton` пока auth грузится — скелетон на скриншоте может быть отсюда

---

## Варианты решения (выбери лучший сам)

### Вариант A — Hotfix (минимальный diff, не идеал)

В `Header.tsx` и `AppChrome.tsx` проверку `/supersudo` делать по **`pathname` напрямую**, не через `stablePathname` / `isHydrated`.

```ts
// Пример — только для supersudo gate
const isSupersudoRoute = pathname.startsWith('/supersudo');
```

Паттерн `isHydrated` оставить только там, где реально нужен (reels watch, compact nav, auto-hide row2).

**Плюсы:** 2–5 строк, быстро.  
**Минусы:** логика остаётся размазанной; `Header` знает про admin.

---

### Вариант B — Gate в AppChrome (рекомендуемый компромисс)

**`AppChrome` — единственное место**, которое решает какой chrome показывать.

На `/supersudo/*` рендерить только:
```tsx
<main>{children}</main>
// + GlobalRoutePrefetch, RouteNavigationIndicator при необходимости
```

Без `Header`, `Footer`, `MobileBottomNav`.

Убрать дублирующую проверку `supersudo` из `Header.tsx` (Header не должен знать про admin).

Использовать `pathname` напрямую (без hydration deferral) для route gate.

**Плюсы:** правильная ответственность, малый diff, без реструктуризации папок.  
**Минусы:** условный рендер в client component (но один раз, в одном месте).

---

### Вариант C — Route groups (самый профессиональный архитектурно)

Разделить app tree:

```
src/app/
  (storefront)/
    layout.tsx          → AppChrome (Header, Footer, MobileBottomNav)
    page.tsx
    products/
    ...
  (admin)/
    supersudo/
      layout.tsx        → AdminLayoutClient (без AppChrome)
      page.tsx
      products/
      ...
  layout.tsx            → RootLayout (html, body, providers, БЕЗ AppChrome)
```

Root `layout.tsx` оставляет только: `html`, `body`, scripts, `ClientProviders`, i18n — **без** `AppChrome`.

Storefront layout добавляет `AppChrome`. Admin layout — только `AdminShell`.

**Плюсы:** структурное разделение, нет if-pathname, корректный SSR, масштабируется.  
**Минусы:** перенос файлов, проверка всех ссылок `/supersudo/*`, больше тестирования.

**Важно:** URL `/supersudo/*` не меняются — route group `(admin)` не влияет на path.

---

## Критерии выбора (для AI)

| Критерий | A | B | C |
|----------|---|---|---|
| Минимальный diff | ✅ | ✅ | ❌ |
| Правильная ответственность | ❌ | ✅ | ✅✅ |
| Нет hydration бага | ✅ | ✅ | ✅ |
| Next.js best practice | ❌ | ⚠️ | ✅ |
| Риск регрессий | низкий | низкий | средний |

**Рекомендация автора анализа:** если нет времени на рефакторинг папок → **B**. Если готовы к структурному изменению → **C**. **A** — только как экстренный патч.

**Твоё решение:** выбери B или C обоснованно. Не делай A, если B укладывается в тот же объём работ.

---

## Ограничения и правила проекта

- TypeScript strict, named exports, no `any`
- Не inline styles — Tailwind/CSS
- Минимальный scope: не рефакторить admin optimization, products editor и т.д.
- Не удалять тесты, не отключать lint
- Не коммитить без явной просьбы
- Функции ≤ 50 строк, файлы ≤ 300 строк
- Прочитать перед работой: `docs/01-ARCHITECTURE.md`, `.cursor/rules/04-react-nextjs.mdc`

---

## Definition of Done

1. Открыть `/supersudo`, `/supersudo/products`, `/supersudo/orders` — **нет** storefront Header/Footer/MobileBottomNav
2. Нет flash storefront header при загрузке admin (проверить hard refresh)
3. Открыть `/`, `/products` — storefront chrome **на месте**
4. Переход admin → Home (`/` из Quick Access в сайдбаре) — только storefront, **без** admin sidebar
5. Mobile: admin без bottom nav; storefront с bottom nav
6. `pnpm run build` проходит
7. Нет дублирующих `startsWith('/supersudo')` в 3+ местах без причины

---

## Связанные места (проверить после фикса)

- `src/components/TidioDynamicLoader.tsx` — уже скрывает Tidio на `/supersudo`
- `src/components/MobileBottomNav.tsx` — не должен показываться на admin
- `src/app/globals.css` — `.admin-page`, `.admin-layout`, sidebar `fixed top-0`
- `src/app/supersudo/components/AdminSidebar.tsx` — после фикса header можно оставить `top-0`; если header убран — sidebar корректен

---

## Не входит в scope

- Оптимизация скорости admin (`ADMIN_OPTIMIZATION_PLAN.md`) — отдельная задача
- Редактор продуктов (`PricingInventorySection`, `ProductTypeTabs`) — не связан с layout bug
- Изменение бизнес-логики admin menu / Quick Access Home

---

## Контекст репозитория

- Stack: Next.js App Router, React, TypeScript, Tailwind, pnpm, Prisma
- Admin prefix: `/supersudo`
- Workspace: `marco.am` (e-commerce Marco Group)
