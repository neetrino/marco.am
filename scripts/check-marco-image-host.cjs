const path = require("path");
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

async function main() {
  const prisma = new PrismaClient();
  try {
    const variants = await prisma.productVariant.findMany({
      where: { sku: { not: null } },
      select: { sku: true, imageUrl: true },
    });

    const marcoVariants = variants.filter((v) => /^\d+$/.test(String(v.sku || "")));
    const r2 = marcoVariants.filter((v) => {
      const url = String(v.imageUrl || "");
      return url.includes("r2") || url.includes("cloudflare");
    }).length;
    const external = marcoVariants.filter((v) => {
      const url = String(v.imageUrl || "").trim();
      if (!(url.startsWith("http://") || url.startsWith("https://"))) return false;
      return !url.includes("r2") && !url.includes("cloudflare");
    }).length;
    const empty = marcoVariants.filter((v) => !String(v.imageUrl || "").trim()).length;

    console.log(JSON.stringify({ marcoVariants: marcoVariants.length, r2, external, empty }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
