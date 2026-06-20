# План исправления и доработки импорта товаров Marco

**Дата:** 2026-06-20  
**Статус:** в работе — Phase A–D частично выполнены (2026-06-20)  
**Подход:** точечная правка данных + исправление правил импорта. **Полная перезаливка каталога не планируется** (ручная работа по категориям после прошлого импорта).

---

## 1. Источники данных

| Файл / лист | Назначение | Действие |
|---|---|---|
| `Products for import/Marco - Redy for import.xlsx` → **`Worksheet`** | Основной каталог (**1966** строк) | Source of truth для сверки и обновлений |
| Тот же файл → **`no articule`** | Артикулы для товаров, у которых не было SKU на `Worksheet` (**38** строк, все заполнены) | Применить артикулы в базе |
| Тот же файл → **`Sheet1`** | Старый тестовый экспорт (**35** строк) | **Не использовать** |
| CSV (генерируется из Excel) | Формат для `scripts/import-marco-csv-products.cjs` | Конвертировать после правок конвертера |

### Сводка по артикулам (`Worksheet`)

| Метрика | Кол-во |
|---|---|
| Строк всего | 1966 |
| С артикулом | 1887 |
| Без артикула | 79 |
| Закрыто листом `no articule` | 38 |
| **Ещё без артикула** | **41** |

**Решение по артикулам без SKU:** из **41** оставшегося товара **40 — черновики** (`Черновик`). Их **не запрашиваем у клиента** — артикулы не нужны, товары не должны быть в публичном каталоге.  
Единственный не-черновик без артикула: **HISENSE WDQA9014EVJMT** (ID `11618`) — уточнить у клиента или снять с публикации.

Отчёты (локально, в `Products for import/`):

- `missing-articules-for-client.csv` — 41 позиция (для справки; 40 из них — черновики)
- `articules-from-no-articule-sheet.csv` — 38 готовых артикулов с листа `no articule`
- `missing-articules-for-client.json` — полная сверка

---

## 2. Текущее состояние базы (на момент анализа)

| Метрика | Значение |
|---|---|
| Активных товаров | 1919 |
| Опубликованных | 1919 (все — ошибка) |
| Черновиков (unpublished) | 0 |
| Вариантов (`product_variants`) | 1966 |
| Удалённых товаров (старые дубликаты) | 47 |
| Orphan-вариантов на удалённых товарах | 47 |
| Товаров с >1 variant | 0 (variant — техническая модель, не WooCommerce-вариации) |
| Синтетических SKU `MARCO-{ID}-{hash}` | 79 (из них ~32 опубликованы — ошибка) |

---

## 3. Подтверждённые проблемы прошлого импорта

### 3.1 Черновики опубликованы

- В Excel **149** товаров с артикулом помечены `Черновик`
- В базе **148 из 149** всё ещё `published: true`
- **Причина:** `scripts/import-marco-csv-products.cjs` всегда ставит `published: true`

### 3.2 Лишние / ошибочные бренды

- Автосоздание любого бренда через `ensureBrand()` в импорте
- Догадка бренда из названия в `src/scripts/backfill-product-brands.ts`
- В базе есть мусорные бренды (**нет** в актуальном Excel): `SUS`, `Vikas`, `DEO`, `LARA`, `Weston`, `Simmer`, `Ugur`, `Uz8787`
- **32** товара без бренда в файле, но с брендом в базе

**Правило:** бренд ставить **только** если явно указан в колонке `Brand`. Не выводить из названия. Не создавать новые бренды автоматически при импорте.

### 3.3 Фейковые артикулы

- Строки без `Артикул` получили SKU `MARCO-{ID}-{hash}` и частично попали в каталог
- **79** таких SKU в базе; **38** уже имеют реальный артикул на листе `no articule`

### 3.4 Логотипы брендов

- `Pacific` (27 товаров) и `DISAKULP` (14 товаров) — в базе без `logoUrl`
- PNG лежат в `BRANDS MARCO/20/pacific.png` и `disa-kulp.png`

### 3.5 Конвертер Excel → CSV

- Колонка названия в Excel — `ƒ`, конвертер ищет `Name`
- Колонка `Черновик` ошибочно мапится в `Short description` вместо статуса публикации

### 3.6 Фильтры в каталоге

- В некоторых категориях (напр. «мягкая мебель») показываются нерелевантные фильтры
- Отдельная задача после чистки данных + rebuild read-model

---

## 4. План работ (порядок выполнения)

### Phase A — Подготовка (без изменений в prod)

- [x] **A1.** Зафиксировать этот план; добавить комментарии команды (см. §7)
- [x] **A2.** Dry-run: `scripts/build-marco-reconcile-manifest.py` + `scripts/marco-import-reconcile.cjs --dry-run`
- [x] **A3.** Review отчёта dry-run → approve

### Phase B — Исправление данных в базе

- [x] **B1.** Снято с публикации **149** черновиков
- [x] **B2.** Артикулы `no articule`: **3** MARCO→real; **35** конфликтов — артикул уже на каноническом товаре, MARCO-дубликаты удалены
- [x] **B3.** Все опубликованные `MARCO-*` сняты; **29** MARCO-дубликатов удалены
- [x] **B4.** Очищен `brandId` у **32** товаров
- [x] **B5.** Удалены 8 мусорных брендов
- [x] **B6.** Логотипы Pacific и DISAKULP загружены в R2
- [x] **B7.** Удалено **76** soft-deleted товаров (47 + 29)

### Phase C — Исправление импортного пайплайна

- [x] **C1.** `convert_marco_xlsx_for_import.py` — `ƒ`→Name, `DraftStatus`, `Артикул`→SKU
- [x] **C2.** `import-marco-csv-products.cjs` — skip без SKU, draft→unpublished, brand lookup-only, skip category update on existing
- [x] **C3.** `backfill-product-brands.ts` — deprecated, требует `--force`

### Phase D — Read-model и проверка витрины

- [x] **D1.** Rebuild read-model — **1738** published, **6952** rows
- [ ] **D2.** Проверить PLP на витрине
- [x] **D3.** Фильтры — аудит + quick fixes (см. §9)

---

## 9. Фильтры PLP — диагностика и план

### Как устроено сейчас

1. **Excel `Worksheet`** — одна широкая таблица: ~41 колонка характеристик (Հզորություն, Ծավալ, Չափս…).
2. **Импорт** создаёт attributes с ключами **`marco_filter_1` … `marco_filter_41`** по **номеру колонки**, а не по смыслу.
3. В админке **Attributes → 43 штуки** (41 marco + color + 1 битый пустой key) — это **ожидаемый побочный эффект** импорта, но **не финальная модель**.
4. **PLP** показывает фильтры из `technicalSpecs` товаров **в текущей категории** (или по всему каталогу без category).

### Что не так (найдено 2026-06-20)

| Проблема | Симптом | Статус |
|---|---|---|
| Названия «Marco Filter N» | Вместо «Հզորություն (BTU)» | **Исправлено** — options перезаписывают JSON snapshot |
| Слишком много групп | Техника: **38** фильтров на одной странице | **Смягчено** — cap 12 + min 3 товара |
| Непонятные ключи `marco_filter_N` | В URL `spec.marco_filter_15=…` | **Документировано** — нужна миграция ключей |
| Битый attribute с пустым key | 2 values в DB | TODO — удалить |
| Мягкая мебель | **0** фильтров (нет характеристик в Excel) | OK — не баг |

### Что сделано в коде

- `product-listing-row-builder.ts` — корректные labels из attribute translations
- `product-facet-visibility.ts` — max **12** групп, min **3** товара в scope
- `src/scripts/audit-plp-attribute-facets.ts` — аудит

```bash
pnpm exec tsx src/scripts/audit-plp-attribute-facets.ts
pnpm exec tsx src/scripts/audit-plp-attribute-facets.ts --category=tekhnika-ev-elektronika
pnpm run rebuild:plp-read-model   # после fix labels
```

### Что делать дальше (Phase E — фильтры)

- [ ] **E1.** Rebuild read-model после fix labels
- [ ] **E2.** Удалить битый attribute с пустым `key`
- [ ] **E3.** Согласовать с клиентом **whitelist фильтров по категориям** (мебель / техника / кухня…)
- [ ] **E4.** Миграция `marco_filter_N` → семантические keys (`power_btu`, `capacity_l`, `material`…)
- [ ] **E5.** Импорт v2: key = slug(заголовок колонки), не номер колонки
- [ ] **E6.** `filterable: false` для редко используемых attributes в админке

**Рекомендация:** не удалять все 41 attribute сразу — они несут данные товаров. Сначала UX (labels + cap), потом семантическая миграция с клиентом.


## 5. Что НЕ делаем

- ❌ Полное удаление каталога и re-import с нуля
- ❌ Удаление `product_variants` у активных товаров (это техническая модель сайта)
- ❌ Запрос артикулов у клиента для **40 черновиков** без SKU
- ❌ Импорт листа `Sheet1`
- ❌ Повторный запуск `backfill-product-brands.ts` в текущем виде

---

## 6. Ключевые скрипты и файлы

| Компонент | Путь |
|---|---|
| Основной импорт | `scripts/import-marco-csv-products.cjs` |
| Сверка / fix базы | `scripts/marco-import-reconcile.cjs` |
| Manifest для сверки | `scripts/build-marco-reconcile-manifest.py` |
| Конвертер Excel → CSV | `scripts/convert_marco_xlsx_for_import.py` |
| Backfill брендов (проблемный) | `src/scripts/backfill-product-brands.ts` |
| Sync логотипов | `scripts/sync-brand-logos-macro.cjs` |
| Runbook (старый Sheet1) | `docs/import/MARCO_SHEET1_RUNBOOK_HY.md` |
| Excel source | `Products for import/Marco - Redy for import.xlsx` |

**Команда импорта (после исправлений):**

```bash
python scripts/convert_marco_xlsx_for_import.py \
  --xlsx "Products for import/Marco - Redy for import.xlsx" \
  --csv "/tmp/marco-worksheet.csv" \
  --sheet Worksheet

IMPORT_UPDATE_EXISTING=1 IMPORT_CONCURRENCY=1 \
  node scripts/import-marco-csv-products.cjs "/tmp/marco-worksheet.csv"
```

---

## 7. Комментарии и дополнения команды

<!-- Добавляйте сюда новые пункты, уточнения, исключения -->

---

## 8. Чеклист готовности (Definition of Done)

- [x] Все `Черновик` из Excel — `published: false` в базе
- [x] Нет опубликованных товаров с синтетическим `MARCO-*` SKU
- [x] Артикулы с листа `no articule` — MARCO-дубликаты удалены, канонические товары с артикулами на месте
- [x] Мусорные бренды удалены/скрыты, товары без бренда в Excel — `brandId` очищен
- [x] Pacific и DISAKULP с логотипами
- [x] Read-model перестроен
- [x] Импортный скрипт исправлен под новые правила
- [ ] PLP и фильтры проверены вручную на витрине
