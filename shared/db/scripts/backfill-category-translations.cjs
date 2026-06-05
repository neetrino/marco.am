/**
 * Backfills category translations for hy/en/ru using a fixed source title map.
 * Run: node shared/db/scripts/backfill-category-translations.cjs
 */
const fs = require('fs');
const path = require('path');

const IMPORT_SUFFIX = ' (import)';
const ARMENIAN_REGEX = /[\u0531-\u058F]/;

const ROOT_ENV_PATH = path.resolve(__dirname, '../../../.env');
const TITLE_MAP_PATH = path.resolve(__dirname, './category-title-translations.json');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex < 1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!Object.prototype.hasOwnProperty.call(process.env, key)) {
      process.env[key] = value;
    }
  }
}

function normalizeTitle(rawTitle) {
  if (typeof rawTitle !== 'string') {
    return '';
  }

  const trimmed = rawTitle.trim();
  if (trimmed.endsWith(IMPORT_SUFFIX)) {
    return trimmed.slice(0, -IMPORT_SUFFIX.length).trim();
  }

  return trimmed;
}

function isArmenianText(value) {
  return typeof value === 'string' && ARMENIAN_REGEX.test(value);
}

function safeJsonRead(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

loadEnv(ROOT_ENV_PATH);

const { PrismaClient } = require(path.resolve(__dirname, '../generated/prisma-client'));
const prisma = new PrismaClient();
const TITLE_MAP = safeJsonRead(TITLE_MAP_PATH);

async function upsertTranslation(categoryId, locale, titleValue, referenceRow) {
  const existing = await prisma.categoryTranslation.findUnique({
    where: {
      categoryId_locale: {
        categoryId,
        locale,
      },
    },
    select: {
      id: true,
      slug: true,
      fullPath: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
    },
  });

  if (!existing) {
    return prisma.categoryTranslation.create({
      data: {
        categoryId,
        locale,
        title: titleValue,
        slug: referenceRow?.slug ?? '',
        fullPath: referenceRow?.fullPath ?? '',
        description: referenceRow?.description ?? null,
        seoTitle: referenceRow?.seoTitle ?? null,
        seoDescription: referenceRow?.seoDescription ?? null,
      },
    });
  }

  return prisma.categoryTranslation.update({
    where: {
      id: existing.id,
    },
    data: {
      title: titleValue,
      ...(existing.slug.trim().length === 0 && referenceRow?.slug
        ? { slug: referenceRow.slug, fullPath: referenceRow.fullPath ?? '' }
        : {}),
    },
  });
}

async function runBackfill() {
  const rows = await prisma.categoryTranslation.findMany({
    select: {
      id: true,
      categoryId: true,
      locale: true,
      title: true,
    },
    orderBy: {
      categoryId: 'asc',
    },
  });

  const groupedByCategory = new Map();
  for (const row of rows) {
    if (!groupedByCategory.has(row.categoryId)) {
      groupedByCategory.set(row.categoryId, []);
    }
    groupedByCategory.get(row.categoryId).push(row);
  }

  let categoriesMatched = 0;
  let titlesUpdated = 0;
  let ruCreated = 0;
  let categoriesSkipped = 0;

  for (const [categoryId, translations] of groupedByCategory.entries()) {
    const hyRow = translations.find((item) => item.locale === 'hy');
    const enRow = translations.find((item) => item.locale === 'en');
    const ruRow = translations.find((item) => item.locale === 'ru');

    const hyCandidate = hyRow?.title ?? '';
    const enCandidate = enRow?.title ?? '';

    let sourceTitle = '';
    if (hyCandidate) {
      sourceTitle = hyCandidate;
    } else if (isArmenianText(enCandidate)) {
      sourceTitle = enCandidate;
    }

    const normalizedSource = normalizeTitle(sourceTitle);
    if (!normalizedSource) {
      categoriesSkipped += 1;
      continue;
    }

    const localized = TITLE_MAP[normalizedSource];
    if (!localized) {
      categoriesSkipped += 1;
      continue;
    }

    categoriesMatched += 1;

    const referenceRow =
      hyRow ??
      translations.find((item) => item.locale === 'en') ??
      translations[0] ??
      null;

    if (!hyRow || hyRow.title !== localized.hy) {
      await upsertTranslation(categoryId, 'hy', localized.hy, referenceRow);
      titlesUpdated += 1;
    }

    if (!enRow || enRow.title !== localized.en) {
      await upsertTranslation(categoryId, 'en', localized.en, referenceRow);
      titlesUpdated += 1;
    }

    if (!ruRow) {
      await upsertTranslation(categoryId, 'ru', localized.ru, referenceRow);
      ruCreated += 1;
      titlesUpdated += 1;
    } else if (ruRow.title !== localized.ru) {
      await upsertTranslation(categoryId, 'ru', localized.ru, referenceRow);
      titlesUpdated += 1;
    }
  }

  console.info(
    `[backfill-category-translations] categoriesMatched=${categoriesMatched} titlesUpdated=${titlesUpdated} ruCreated=${ruCreated} categoriesSkipped=${categoriesSkipped}`,
  );
}

runBackfill()
  .catch((error) => {
    console.error('[backfill-category-translations] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
