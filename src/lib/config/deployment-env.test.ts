import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCorsAllowedOrigin,
  getCorsAllowedOrigins,
  getDeploymentTier,
  getPublicAppUrl,
  normalizePublicAppUrl,
} from "./deployment-env";

describe("deployment-env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getDeploymentTier", () => {
    it("uses APP_ENV when set", () => {
      vi.stubEnv("APP_ENV", "staging");
      vi.stubEnv("VERCEL_ENV", "production");
      vi.stubEnv("NODE_ENV", "production");
      expect(getDeploymentTier()).toBe("staging");
    });

    it("maps VERCEL_ENV preview to staging", () => {
      vi.stubEnv("APP_ENV", "");
      vi.stubEnv("VERCEL_ENV", "preview");
      vi.stubEnv("NODE_ENV", "production");
      expect(getDeploymentTier()).toBe("staging");
    });

    it("maps VERCEL_ENV production to production", () => {
      vi.stubEnv("VERCEL_ENV", "production");
      vi.stubEnv("NODE_ENV", "production");
      expect(getDeploymentTier()).toBe("production");
    });

    it("falls back to NODE_ENV when no APP_ENV or VERCEL_ENV", () => {
      vi.stubEnv("APP_ENV", "");
      vi.stubEnv("VERCEL_ENV", "");
      vi.stubEnv("NODE_ENV", "development");
      expect(getDeploymentTier()).toBe("development");
    });
  });

  describe("normalizePublicAppUrl", () => {
    it("accepts absolute https URLs and strips trailing slash", () => {
      expect(normalizePublicAppUrl("https://shop.example/")).toBe(
        "https://shop.example",
      );
    });

    it("prefixes https for bare hostnames", () => {
      expect(normalizePublicAppUrl("marco.am")).toBe("https://marco.am");
      expect(normalizePublicAppUrl("marco-am-2.vercel.app")).toBe(
        "https://marco-am-2.vercel.app",
      );
    });

    it("rejects empty and non-http schemes", () => {
      expect(normalizePublicAppUrl("")).toBeNull();
      expect(normalizePublicAppUrl("/")).toBeNull();
      expect(normalizePublicAppUrl("ftp://shop.example")).toBeNull();
    });
  });

  describe("getPublicAppUrl", () => {
    it("prefers NEXT_PUBLIC_APP_URL", () => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shop.example/");
      vi.stubEnv("APP_URL", "https://ignored/");
      expect(getPublicAppUrl()).toBe("https://shop.example");
    });

    it("normalizes host-only APP_URL", () => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
      vi.stubEnv("APP_URL", "marco-am-2.vercel.app");
      expect(getPublicAppUrl()).toBe("https://marco-am-2.vercel.app");
    });

    it("skips invalid NEXT_PUBLIC_APP_URL and falls through", () => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "/");
      vi.stubEnv("APP_URL", "");
      vi.stubEnv("VERCEL_URL", "my-app.vercel.app");
      expect(getPublicAppUrl()).toBe("https://my-app.vercel.app");
    });

    it("uses VERCEL_URL when public URL not set", () => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
      vi.stubEnv("APP_URL", "");
      vi.stubEnv("VERCEL_URL", "my-app.vercel.app");
      expect(getPublicAppUrl()).toBe("https://my-app.vercel.app");
    });
  });

  describe("getCorsAllowedOrigin", () => {
    it("prefers CORS_ORIGIN", () => {
      vi.stubEnv("CORS_ORIGIN", "https://api.example/");
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://web.example");
      expect(getCorsAllowedOrigin()).toBe("https://api.example");
    });

    it("supports comma-separated CORS origins", () => {
      vi.stubEnv("CORS_ORIGIN", "https://shop.example/, https://admin.example/");
      expect(getCorsAllowedOrigins()).toEqual([
        "https://shop.example",
        "https://admin.example",
      ]);
    });

    it("uses localhost in development when no explicit origin", () => {
      vi.stubEnv("CORS_ORIGIN", "");
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("VERCEL_URL", "");
      expect(getCorsAllowedOrigin()).toBe("http://localhost:3000");
    });
  });
});
