# Marco Sheet1 CSV — ներմուծում (Neon + R2)

Ֆայլի օրինակ՝ `Marco - Sheet1.csv` (WooCommerce export). Սքրիպտը կարդում է **Filter1…Filter23** սյուները, ստեղծում է Prisma **attribute** key-եր `marco_filter_{N}` ձևով, արժեքները՝ `attribute_values`, և կապում է **վարիանտի** `options` + `attributes` JSON-ի հետ, որ ֆիլտրերը աշխատեն PDP/shop-ում։

## Նախապայմաններ

- `D:\marco` մեջ `.env`՝ `DATABASE_URL`, R2 փոփոխականները (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`)՝ նկարները ներբեռնելու և R2 տեղափոխելու համար։
- CSV-ում **Images** սյունը՝ `https://...` հղումներ (կոմայով բազմակի)։

## Մեկ հրաման (առաջին և կրկնակի ներմուծում)

PowerShell (`D:\marco`):

```powershell
$env:IMPORT_UPDATE_EXISTING = "1"
$env:IMPORT_CONCURRENCY = "1"
node scripts/import-marco-csv-products.cjs "C:\Users\ROG\Downloads\Telegram Desktop\Marco - Sheet1.csv"
```

- **`IMPORT_UPDATE_EXISTING=1`** — եթե SKU-ն արդեն կա (`MARCO-{CSV ID}`), տողը **թարմացնում է** (նկարներ, ֆիլտրեր, նկարագրություն, կատեգորիա)։
- **`IMPORT_CONCURRENCY=1`** — Neon-ում հաճախ `connection_limit=1` է լինում; ավելի բարձր արժեքը կարող է **pool timeout** տալ։

Լռելյայն CSV ուղի, եթե արգումենտ չտաս՝ նույն Telegram Desktop `Marco - Sheet1.csv` (տե՛ս սկրիպտի `CSV_PATH` fallback)։

## Ինչ է անում սկրիպտը

| CSV | DB / R2 |
|-----|---------|
| `ID` | `MARCO-{ID}` variant SKU, barcode |
| `Name`, `Description`, … | `product_translations` (hy/en/ru) |
| `Category` (`A > B > C`) | կատեգորիայի ծառ `hy` fullPath-ով |
| `Brand` | brand + թարգմանություններ |
| `Color` | `color` attribute |
| `FilterN - …` սյուներ | `marco_filter_N` + արժեքներ + variant options |
| `Images` | ներբեռնում → `products/imported/marco/...` R2 |

## Տողերի քանակ

Ներկա `Marco - Sheet1.csv`-ում տվյալների **35** տող է (ոչ 40) — սա նորմալ է, եթե արտահանումը կարճ է։

## Սխալների արագ ախտորոշում

- **Timed out … connection pool** — միացրու `IMPORT_CONCURRENCY=1`։
- **Failed to fetch image** — URL-ը 404/բլոկված է կամ TLS; ստուգիր `Images` բջիջը բրաուզերով։

## Կապված սկրիպտ

- `scripts/import-marco-csv-products.cjs` — մեկ աղբյուր ճշտության համար։
