# Marco Excel attribute reconciliation

This one-time repair restores canonical `ProductAttributeValue` links from the
`Worksheet` sheet in `Marco.xlsx`. It does not import or update prices, images,
categories, brands, product text, variants, or publication state.

## 1. Build the deterministic manifest

The generator reads Excel cell values directly with `openpyxl`. It preserves a
leading-zero SKU when the cell is text or uses a zero-padding number format such
as `00000`. A styled/formatted cell with no value remains blank.

```bash
python3 scripts/build-marco-attribute-manifest.py \
  --xlsx "/absolute/path/to/Marco.xlsx" \
  --out "/tmp/marco-attribute-manifest.json"
```

The manifest contains `Color` plus every non-empty technical Worksheet cell.
Its source SHA-256 makes the reviewed Excel version explicit. There is no
generation timestamp, so the same workbook produces identical JSON.

## 2. Review a database dry-run

Dry-run is the default; `--dry-run` is accepted but not required.

```bash
node scripts/reconcile-marco-product-attributes.cjs \
  --manifest "/tmp/marco-attribute-manifest.json" \
  --report "/tmp/marco-attribute-reconcile-dry-run.json"
```

Review the summary and every per-SKU status:

- `product_not_found`: no active product variant has the manifest SKU.
- `attribute_unresolved`: the source header/value cannot be mapped uniquely.
- `value_create`: the attribute exists but the Excel value must be created.
- `link_create`: a `ProductAttribute` or `ProductAttributeValue` link is missing.
- `stale_remove`: an existing canonical value for an Excel-managed attribute
  differs from the Excel source (including a source cell that is now blank).
- `noop`: canonical links already match the Excel source.

Attributes are resolved in this order: the exact `color` key for Color,
translation label, current semantic import key, then legacy
`marco_filter_N`. Unrelated manually managed attributes and values are not
removed. Ambiguous attributes or values are reported and not changed.

## 3. Apply only after review

No database write occurs without the explicit `--execute` flag. The apply path
uses bounded serializable transactions, retries serialization conflicts, and is
idempotent.

```bash
node scripts/reconcile-marco-product-attributes.cjs \
  --manifest "/tmp/marco-attribute-manifest.json" \
  --execute \
  --report "/tmp/marco-attribute-reconcile-apply.json"
```

The command creates missing `AttributeValue` rows where resolution is safe,
creates missing `ProductAttribute`/`ProductAttributeValue` links, and removes
only stale `ProductAttributeValue` links for source-managed attributes. It never
executes a read-model rebuild.

After reviewing a successful apply report, rebuild both projections explicitly:

```bash
pnpm run rebuild:plp-read-model
pnpm run rebuild:pdp-read-model
```

Run the dry-run again afterward. A fully repaired catalog should contain only
`noop`, expected `product_not_found`, and any deliberately unresolved rows.
