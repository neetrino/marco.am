/**
 * Downloads remote rasters and writes WebP under `public/`.
 * Run from repo root: `node scripts/fetch-external-rasters-to-webp.cjs`
 */
const fs = require("fs");
const https = require("https");
const http = require("http");
const path = require("path");
const sharp = require("sharp");

const publicDir = path.join(__dirname, "..", "public");
const WEBP_QUALITY = 88;

/** @type {{ url: string; outRel: string }[]} */
const JOBS = [
  // Home promo + about + site defaults
  {
    url: "https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg?auto=compress&cs=tinysrgb&w=800",
    outRel: "assets/stock/pexels-1350789-armchair.webp",
  },
  {
    url: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600",
    outRel: "assets/stock/pexels-1571460-interior.webp",
  },
  {
    url: "https://images.pexels.com/photos/3184357/pexels-photo-3184357.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    outRel: "assets/stock/pexels-3184357-about-hero.webp",
  },
  // Team carousel
  {
    url: "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2",
    outRel: "assets/stock/pexels-2182970-team.webp",
  },
  {
    url: "https://images.pexels.com/photos/3184405/pexels-photo-3184405.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2",
    outRel: "assets/stock/pexels-3184405-team.webp",
  },
  {
    url: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2",
    outRel: "assets/stock/pexels-2379004-team.webp",
  },
  {
    url: "https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2",
    outRel: "assets/stock/pexels-3184398-team.webp",
  },
  {
    url: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=2",
    outRel: "assets/stock/pexels-1043471-team.webp",
  },
  // Features (third card was gstatic)
  {
    url: "https://img.freepik.com/premium-vector/vector-fast-delivery-icon-illustration_723554-1032.jpg",
    outRel: "assets/home/features/feature-fast-delivery.webp",
  },
  {
    url: "https://www.shutterstock.com/image-vector/best-quality-stamp-sticker-icon-600w-1922730422.jpg",
    outRel: "assets/home/features/feature-best-quality.webp",
  },
  {
    url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSgoxSEhKJM1oLGZSKnh1mVW4wTQcQl_DV1Q&s",
    outRel: "assets/home/features/feature-free-return.webp",
  },
  // Language switcher
  {
    url: "https://flagcdn.com/w160/gb.png",
    outRel: "assets/flags/lang-en.webp",
  },
  {
    url: "https://janarmenia.com/uploads/0000/83/2022/04/28/anthem-armenia.jpg",
    outRel: "assets/flags/lang-hy.webp",
  },
  {
    url: "https://flagfactoryshop.com/image/cache/catalog/products/flags/national/mockups/russia_coa-600x400.jpg",
    outRel: "assets/flags/lang-ru.webp",
  },
];

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https:") ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          "User-Agent": "WhiteShop-asset-fetch/1.0 (internal; sharp webp pipeline)",
          Accept: "image/*,*/*;q=0.8",
        },
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchBuffer(new URL(res.headers.location, url).href).then(resolve).catch(reject);
          res.resume();
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          res.resume();
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      },
    );
    req.on("error", reject);
  });
}

async function main() {
  for (const { url, outRel } of JOBS) {
    const outAbs = path.join(publicDir, outRel);
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    try {
      const buf = await fetchBuffer(url);
      await sharp(buf).webp({ quality: WEBP_QUALITY }).toFile(outAbs);
      process.stdout.write(`OK ${outRel}\n`);
    } catch (e) {
      process.stderr.write(`SKIP ${outRel}: ${e.message}\n`);
    }
  }
}

main().catch((err) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});
