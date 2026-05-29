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
  const execute = process.argv.includes("--execute");
  if (!csvPath || !fs.existsSync(csvPath)) {
    throw new Error("Pass csv file path as first argument");
  }

  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const importable = rows.filter((r) => String(r.ID || "").trim() && String(r.Name || "").trim());
  const skus = importable.map(rowSku);

  const prisma = new PrismaClient();
  try {
    const importedVariants = await prisma.productVariant.findMany({
      where: { sku: { in: skus } },
      select: { productId: true },
    });
    const importedProductIds = Array.from(new Set(importedVariants.map((x) => x.productId)));

    const toDelete = await prisma.product.findMany({
      where: {
        deletedAt: null,
        id: { notIn: importedProductIds },
      },
      select: { id: true },
    });
    const toDeleteIds = toDelete.map((p) => p.id);

    if (!execute) {
      console.log(
        JSON.stringify(
          {
            mode: "dry-run",
            importedProducts: importedProductIds.length,
            productsToDelete: toDeleteIds.length,
            deleteSample: toDeleteIds.slice(0, 20),
          },
          null,
          2
        )
      );
      return;
    }

    const result = await prisma.product.deleteMany({
      where: { id: { in: toDeleteIds } },
    });

    const finalCount = await prisma.product.count({ where: { deletedAt: null } });
    console.log(
      JSON.stringify(
        {
          mode: "execute",
          importedProducts: importedProductIds.length,
          deletedCount: result.count,
          finalActiveProducts: finalCount,
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
