# Product Card Figma — Validation (node 101-3473)

**Источник:** `get_design_context` (file `7PlNcJ5BjWztGqYNYfsH2D`, node `101:3473`).

## Проверено

| Проверка | Результат |
|----------|-----------|
| Шрифт | `font-montserrat-arm` (Montserrat, как в Figma) |
| Бренд | 12px, Black, uppercase, tracking 0.6px → `text-xs font-black tracking-[0.6px] text-primary-500` |
| Название | 14px Bold, leading 20px, 2 строки → `text-sm font-bold leading-5`, блок `top-6 h-10` |
| Рейтинг | 5 звёзд 9.5px + (N) 10px → `h-[9.5px]`, `text-[10px] text-neutral-400` |
| Цена | 20px Black, leading 28px → `text-xl font-black leading-7 text-neutral-900`, блок `top-24 pt-2` |
| Контейнер | 320×486px, radius 32px → `w-[320px] h-[486px] rounded-card bg-surface-default` |
| Картинка | 248px высота, отступы 6.03%, внутри 200px @ 9.68%, top 24px |
| Гарантия | 81×43px, radius 16px, жёлтый/белый текст |
| Правая колонка | wishlist `top-[17px]`, compare `top-[72px]`, скидка `top-[129px] h-[23px]` (как в Figma) |
| Корзина | 62×62, `left-[257px] top-[424px]`, PNG из MCP + `shadow-product-cta` |

## Токены

**Созданы/используются:** `primary-500`, `neutral-900`, `neutral-400`, `surface-default`, `accent-yellow`, `product-card-overlay`, `surface-elevated`, `secondary`, `rounded-card`, `rounded-product-image`, `rounded-product-badge-warranty`, `rounded-badge`, `shadow-product-cta`.

**Старые price:** `product-card-brand` / `product-card-text` можно заменить на `primary-500` / `neutral-900` в остальном UI при желании.

## Скриншот

Сравнение с Figma: `/demo/product-card` (полная карточка) и главная (превью).
