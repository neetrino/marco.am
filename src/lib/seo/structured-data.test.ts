import { describe, expect, it, vi } from "vitest";

import {
  buildAboutPageSeoMetadata,
  buildBrandPageSeoMetadata,
  buildContactPageSeoMetadata,
  buildLegalPageSeoMetadata,
} from "@/lib/seo/structured-data";

describe("structured-data SEO builders", () => {
  it("builds about page canonical metadata and JSON-LD", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shop.example");
    const seo = buildAboutPageSeoMetadata({
      locale: "hy",
      title: "Մեր մասին",
      subtitle: "ԷԼԵԳԱՆՏ ԴԻԶԱՅՆ",
      paragraph: "Սա մեր թիմի և աշխատանքի մասին նկարագրությունն է։",
    });
    expect(seo.canonicalPath).toBe("/about");
    expect(seo.canonicalUrl).toBe("https://shop.example/about");
    expect(seo.structuredData["@type"]).toBe("AboutPage");
    expect(seo.structuredData.inLanguage).toBe("hy-AM");
  });

  it("builds contact page structured contactPoint data", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shop.example");
    const seo = buildContactPageSeoMetadata({
      locale: "en",
      title: "Contact us",
      description: "Call us any time.",
      phoneTel: "+37400000000",
      email: "marcofurniture@mail.ru",
    });
    if (seo.structuredData["@type"] !== "ContactPage") {
      throw new Error("Contact page structured data expected");
    }
    expect(seo.structuredData.contactPoint.telephone).toBe("+37400000000");
    expect(seo.structuredData.contactPoint.email).toBe("marcofurniture@mail.ru");
    expect(seo.canonicalUrl).toBe("https://shop.example/contact");
  });

  it("builds brand page collection metadata", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shop.example");
    const seo = buildBrandPageSeoMetadata({
      locale: "ru",
      brandSlug: "apple",
      brandName: "Apple",
      brandDescription: "Официальные товары Apple.",
    });
    expect(seo.canonicalPath).toBe("/brands/apple");
    expect(seo.structuredData["@type"]).toBe("CollectionPage");
  });

  it("maps legal page keys to storefront canonical routes", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shop.example");
    const refundSeo = buildLegalPageSeoMetadata({
      locale: "en",
      page: "refund",
      title: "Refund policy",
      summary: "Refund details",
      lastUpdatedIso: "2026-04-18T00:00:00.000Z",
    });
    expect(refundSeo.canonicalPath).toBe("/refund-policy");
    expect(refundSeo.structuredData["@type"]).toBe("WebPage");
  });
});
