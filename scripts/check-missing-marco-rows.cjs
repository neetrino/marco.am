const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const { PrismaClient } = require(path.join(
  __dirname,
  "..",
  "shared",
  "db",
  "generated",
  "prisma-client"
));

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const ch = content[i];
    const next = content[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }
    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((v) => v.trim() !== "")) rows.push(row);
  }

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((values) => {
    const out = {};
    headers.forEach((header, idx) => {
      out[header] = (values[idx] || "").trim();
    });
    return out;
  });
}

function hashText(value, length = 8) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, length).toUpperCase();
}

function rowSku(row) {
  const id = String(row.ID || "").trim();
  const title = String(row.Name || "").trim();
  const fromSheet = String(row.SKU || row["Артикул"] || row["Արտիկուլ"] || "").trim();
  if (fromSheet) return fromSheet;
  return `MARCO-${id}-${hashText(`${id}-${title}`)}`;
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath || !fs.existsSync(csvPath)) {
    throw new Error("Pass csv file path");
  }
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const importable = rows.filter((r) => String(r.ID || "").trim() && String(r.Name || "").trim());
  const skus = importable.map(rowSku);

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.productVariant.findMany({
      where: { sku: { in: skus } },
      select: { sku: true, productId: true },
    });
    const existingSet = new Set(existing.map((x) => x.sku).filter(Boolean));
    const importedProductIds = Array.from(new Set(existing.map((x) => x.productId)));
    const missing = importable
      .map((r) => ({ id: r.ID, name: r.Name, sku: rowSku(r) }))
      .filter((x) => !existingSet.has(x.sku));

    const [totalProductsAll, totalProductsActive, totalProductsPublishedActive, totalVariants] =
      await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { deletedAt: null } }),
        prisma.product.count({ where: { deletedAt: null, published: true } }),
        prisma.productVariant.count(),
      ]);

    console.log(
      JSON.stringify(
        {
          rowsTotal: rows.length,
          importableRows: importable.length,
          importRowsWithSourceSku: importable.filter((r) => String(r.SKU || "").trim() !== "").length,
          importRowsWithFallbackSku: importable.filter((r) => String(r.SKU || "").trim() === "").length,
          existingBySku: existingSet.size,
          missingCount: missing.length,
          missingSample: missing.slice(0, 20),
          db: {
            productsAll: totalProductsAll,
            productsActive: totalProductsActive,
            productsPublishedActive: totalProductsPublishedActive,
            variantsAll: totalVariants,
            importedProductsBySku: importedProductIds.length,
            nonImportedProductsActiveEstimate: Math.max(0, totalProductsActive - importedProductIds.length),
          },
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
