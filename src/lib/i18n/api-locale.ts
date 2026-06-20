export const SUPPORTED_API_LOCALES = ["hy", "ru", "en"] as const;

export type ApiLocale = (typeof SUPPORTED_API_LOCALES)[number];

type ApiLocaleSource =
  | "query"
  | "preferred"
  | "accept-language"
  | "default";

type ApiLocaleResolution = {
  requestedLocale: string | null;
  resolvedLocale: ApiLocale;
  fallbackUsed: boolean;
  source: ApiLocaleSource;
};

const API_PRIMARY_LOCALE: ApiLocale = "hy";
const LOCALE_ALIASES: Record<string, ApiLocale> = {
  am: "hy",
  en: "en",
  hy: "hy",
  ru: "ru",
};

function normalizeLocaleToken(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed.split(/[-_]/u)[0] ?? null;
}

export function normalizeApiLocale(raw: string | null | undefined): ApiLocale | null {
  const token = normalizeLocaleToken(raw);
  if (!token) {
    return null;
  }
  return LOCALE_ALIASES[token] ?? null;
}

function parseAcceptLanguageLocale(
  acceptLanguageRaw: string | null | undefined,
): ApiLocale | null {
  if (!acceptLanguageRaw) {
    return null;
  }

  const weighted = acceptLanguageRaw
    .split(",")
    .map((segment, index) => {
      const [langPart, ...params] = segment.trim().split(";");
      const locale = normalizeApiLocale(langPart);
      if (!locale) {
        return null;
      }

      let quality = 1;
      for (const param of params) {
        const [key, rawValue] = param.trim().split("=");
        if (key !== "q") {
          continue;
        }
        const parsed = Number(rawValue);
        if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
          quality = parsed;
        }
      }

      return { locale, quality, index };
    })
    .filter((item): item is { locale: ApiLocale; quality: number; index: number } => item !== null)
    .sort((left, right) => {
      if (right.quality !== left.quality) {
        return right.quality - left.quality;
      }
      return left.index - right.index;
    });

  return weighted[0]?.locale ?? null;
}

export function buildApiLocaleFallbackOrder(locale: ApiLocale): readonly ApiLocale[] {
  if (locale === "hy") {
    return ["hy", "ru", "en"];
  }
  if (locale === "ru") {
    return ["ru", "hy", "en"];
  }
  return ["en", "hy", "ru"];
}

export function pickLocalizedByApiLocale<T extends { locale: string }>(
  items: readonly T[],
  locale: ApiLocale,
): T | null {
  const order = buildApiLocaleFallbackOrder(locale);
  for (const candidate of order) {
    const match = items.find((item) => item.locale === candidate);
    if (match) {
      return match;
    }
  }
  return items[0] ?? null;
}

export function resolveApiLocale(args: {
  localeRaw?: string | null;
  langRaw?: string | null;
  preferredLocaleRaw?: string | null;
  acceptLanguageRaw?: string | null;
  fallbackLocale?: ApiLocale;
}): ApiLocaleResolution {
  const requestedLocale = args.localeRaw?.trim() || args.langRaw?.trim() || null;
  const queryLocale = normalizeApiLocale(requestedLocale);

  if (queryLocale) {
    return {
      requestedLocale,
      resolvedLocale: queryLocale,
      fallbackUsed: false,
      source: "query",
    };
  }

  const preferredLocale = normalizeApiLocale(args.preferredLocaleRaw);
  if (preferredLocale) {
    return {
      requestedLocale,
      resolvedLocale: preferredLocale,
      fallbackUsed: requestedLocale !== null,
      source: "preferred",
    };
  }

  const headerLocale = parseAcceptLanguageLocale(args.acceptLanguageRaw);
  if (headerLocale) {
    return {
      requestedLocale,
      resolvedLocale: headerLocale,
      fallbackUsed: requestedLocale !== null,
      source: "accept-language",
    };
  }

  return {
    requestedLocale,
    resolvedLocale: args.fallbackLocale ?? API_PRIMARY_LOCALE,
    fallbackUsed: requestedLocale !== null,
    source: "default",
  };
}
