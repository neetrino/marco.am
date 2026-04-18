import type { SiteLocale } from "@/lib/constants/site-content";
import type { SiteContentStorage } from "@/lib/schemas/site-content.schema";

export type LocaleResolution = {
  readonly requestedLocale: string | null;
  readonly resolvedLocale: SiteLocale;
  readonly fallbackUsed: boolean;
};

export type SiteAboutPublicPayload = {
  readonly locale: SiteLocale;
  readonly i18n: LocaleResolution & { readonly availableLocales: readonly SiteLocale[] };
  readonly heroImageUrl: string;
  readonly subtitle: string;
  readonly title: string;
  readonly paragraphs: readonly [string, string, string];
  readonly team: {
    readonly subtitle: string;
    readonly title: string;
    readonly description: string;
  };
};

export type SiteContactPublicPayload = {
  readonly locale: SiteLocale;
  readonly i18n: LocaleResolution & { readonly availableLocales: readonly SiteLocale[] };
  readonly phoneDisplay: string;
  readonly phoneTel: string;
  readonly email: string;
  readonly address: string;
  readonly workingHours: {
    readonly weekdays: string;
    readonly saturday: string;
  };
  readonly callToUs: {
    readonly title: string;
    readonly description: string;
  };
  readonly writeToUs: {
    readonly title: string;
    readonly description: string;
    readonly emailLabel: string;
  };
  readonly headquarterTitle: string;
  readonly socialLinks: SiteContentStorage["contact"]["socialLinks"];
  readonly mapEmbed: {
    readonly enabled: boolean;
    readonly iframeSrc: string | null;
  };
};

export type SiteBrandPagePublicPayload = {
  readonly locale: SiteLocale;
  readonly i18n: LocaleResolution & { readonly availableLocales: readonly SiteLocale[] };
  readonly brand: {
    readonly id: string;
    readonly slug: string;
    readonly name: string;
    readonly description: string;
    readonly logoUrl: string | null;
  };
  readonly content: {
    readonly sectionTitle: string;
    readonly descriptionSource: "brand_translation" | "fallback_template";
    readonly ctaLabel: string;
    readonly href: string;
  };
};
