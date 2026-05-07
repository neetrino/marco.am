import { AppError } from "@/lib/types/errors";
import {
  type I18nTranslationEntry,
  type I18nTranslationScope,
} from "@/lib/schemas/admin-i18n.schema";
import { homeHeroBannerService } from "@/lib/services/home-hero-banner.service";
import { whyChooseUsService } from "@/lib/services/why-choose-us.service";
import { homeBrandPartnersService } from "@/lib/services/home-brand-partners.service";
import { siteFooterService } from "@/lib/services/site-footer.service";
import { bannerManagementService } from "@/lib/services/banner-management.service";
import { reelsManagementService } from "@/lib/services/reels-management.service";
import { siteContentService } from "@/lib/services/site-content.service";
import { siteLegalPagesService } from "@/lib/services/site-legal-pages.service";

type LocalizedMap = {
  hy: string;
  ru: string;
  en: string;
};

type ScopeConfig<TStorage> = {
  scope: I18nTranslationScope;
  getStorage: () => Promise<TStorage>;
  updateStorage: (payload: TStorage) => Promise<unknown>;
};

type ScopeInfo = {
  scope: I18nTranslationScope;
  entriesCount: number;
};

const scopeConfigs: Record<I18nTranslationScope, ScopeConfig<unknown>> = {
  "home-hero": {
    scope: "home-hero",
    getStorage: () => homeHeroBannerService.getAdminStorage(),
    updateStorage: (payload) =>
      homeHeroBannerService.updateAdminStorage(
        payload as Parameters<typeof homeHeroBannerService.updateAdminStorage>[0],
      ),
  },
  "home-why-choose-us": {
    scope: "home-why-choose-us",
    getStorage: () => whyChooseUsService.getAdminStorage(),
    updateStorage: (payload) =>
      whyChooseUsService.updateAdminStorage(
        payload as Parameters<typeof whyChooseUsService.updateAdminStorage>[0],
      ),
  },
  "home-brand-partners": {
    scope: "home-brand-partners",
    getStorage: () => homeBrandPartnersService.getAdminStorage(),
    updateStorage: (payload) =>
      homeBrandPartnersService.updateAdminStorage(
        payload as Parameters<typeof homeBrandPartnersService.updateAdminStorage>[0],
      ),
  },
  "home-footer": {
    scope: "home-footer",
    getStorage: () => siteFooterService.getAdminStorage(),
    updateStorage: (payload) =>
      siteFooterService.updateAdminStorage(
        payload as Parameters<typeof siteFooterService.updateAdminStorage>[0],
      ),
  },
  banners: {
    scope: "banners",
    getStorage: () => bannerManagementService.getAdminStorage(),
    updateStorage: (payload) =>
      bannerManagementService.updateAdminStorage(
        payload as Parameters<typeof bannerManagementService.updateAdminStorage>[0],
      ),
  },
  reels: {
    scope: "reels",
    getStorage: () => reelsManagementService.getAdminStorage(),
    updateStorage: (payload) =>
      reelsManagementService.updateAdminStorage(
        payload as Parameters<typeof reelsManagementService.updateAdminStorage>[0],
      ),
  },
  "site-content": {
    scope: "site-content",
    getStorage: () => siteContentService.getAdminStorage(),
    updateStorage: (payload) =>
      siteContentService.updateAdminStorage(
        payload as Parameters<typeof siteContentService.updateAdminStorage>[0],
      ),
  },
  "site-legal-pages": {
    scope: "site-legal-pages",
    getStorage: () => siteLegalPagesService.getAdminStorage(),
    updateStorage: (payload) =>
      siteLegalPagesService.updateAdminStorage(
        payload as Parameters<typeof siteLegalPagesService.updateAdminStorage>[0],
      ),
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLocalizedMap(value: unknown): value is LocalizedMap {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.hy === "string" &&
    typeof value.ru === "string" &&
    typeof value.en === "string"
  );
}

function buildChildPath(parent: string, child: string): string {
  if (parent.length === 0) {
    return child;
  }
  return `${parent}.${child}`;
}

function flattenLocalizedEntries(
  node: unknown,
  path = "",
  output: I18nTranslationEntry[] = [],
): I18nTranslationEntry[] {
  if (isLocalizedMap(node)) {
    output.push({
      key: path,
      hy: node.hy,
      ru: node.ru,
      en: node.en,
    });
    return output;
  }

  if (Array.isArray(node)) {
    node.forEach((value, index) => {
      flattenLocalizedEntries(value, buildChildPath(path, String(index)), output);
    });
    return output;
  }

  if (!isRecord(node)) {
    return output;
  }

  Object.entries(node).forEach(([key, value]) => {
    flattenLocalizedEntries(value, buildChildPath(path, key), output);
  });
  return output;
}

function parsePath(path: string): readonly string[] {
  return path
    .split(".")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function getValueByPath(root: unknown, path: readonly string[]): unknown {
  let current: unknown = root;
  for (const segment of path) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
      continue;
    }
    if (!isRecord(current) || !(segment in current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function setLocalizedMapByPath(
  root: unknown,
  path: readonly string[],
  translation: Omit<I18nTranslationEntry, "key">,
): boolean {
  const target = getValueByPath(root, path);
  if (!isLocalizedMap(target)) {
    return false;
  }
  target.hy = translation.hy;
  target.ru = translation.ru;
  target.en = translation.en;
  return true;
}

function getScopeConfig(scope: I18nTranslationScope): ScopeConfig<unknown> {
  const config = scopeConfigs[scope];
  if (!config) {
    throw new AppError(
      "Unknown i18n translation scope",
      400,
      "https://api.shop.am/problems/validation-error",
      "Validation Error",
      `Unsupported translation scope: ${scope}`,
    );
  }
  return config;
}

async function loadScopeStorage(scope: I18nTranslationScope): Promise<unknown> {
  const config = getScopeConfig(scope);
  return config.getStorage();
}

function cloneStorage(storage: unknown): unknown {
  return JSON.parse(JSON.stringify(storage)) as unknown;
}

function applyTranslationEntries(args: {
  storage: unknown;
  entries: readonly I18nTranslationEntry[];
  strict: boolean;
}): { updated: number; missingKeys: string[] } {
  const cloned = args.storage;
  const missingKeys: string[] = [];
  let updated = 0;

  args.entries.forEach((entry) => {
    const path = parsePath(entry.key);
    const replaced = setLocalizedMapByPath(cloned, path, {
      hy: entry.hy,
      ru: entry.ru,
      en: entry.en,
    });
    if (!replaced) {
      missingKeys.push(entry.key);
      return;
    }
    updated += 1;
  });

  if (args.strict && missingKeys.length > 0) {
    const preview = missingKeys.slice(0, 5).join(", ");
    throw new AppError(
      "Some translation keys were not found",
      400,
      "https://api.shop.am/problems/validation-error",
      "Validation Error",
      `Missing translation keys (${missingKeys.length}): ${preview}`,
    );
  }

  return { updated, missingKeys };
}

export const adminI18nService = {
  async listScopes(): Promise<ScopeInfo[]> {
    const scopes = Object.keys(scopeConfigs) as I18nTranslationScope[];
    const items = await Promise.all(
      scopes.map(async (scope) => {
        const storage = await loadScopeStorage(scope);
        const entries = flattenLocalizedEntries(storage);
        return {
          scope,
          entriesCount: entries.length,
        };
      }),
    );
    return items;
  },

  async exportScope(scope: I18nTranslationScope): Promise<{
    scope: I18nTranslationScope;
    entries: I18nTranslationEntry[];
    entriesCount: number;
  }> {
    const storage = await loadScopeStorage(scope);
    const entries = flattenLocalizedEntries(storage).sort((a, b) =>
      a.key.localeCompare(b.key),
    );
    return {
      scope,
      entries,
      entriesCount: entries.length,
    };
  },

  async importScope(args: {
    scope: I18nTranslationScope;
    entries: readonly I18nTranslationEntry[];
    strict: boolean;
  }): Promise<{
    scope: I18nTranslationScope;
    updated: number;
    missingKeys: string[];
    totalEntries: number;
  }> {
    const config = getScopeConfig(args.scope);
    const storage = await config.getStorage();
    const cloned = cloneStorage(storage);
    const result = applyTranslationEntries({
      storage: cloned,
      entries: args.entries,
      strict: args.strict,
    });
    await config.updateStorage(cloned);
    return {
      scope: args.scope,
      updated: result.updated,
      missingKeys: result.missingKeys,
      totalEntries: args.entries.length,
    };
  },
};
