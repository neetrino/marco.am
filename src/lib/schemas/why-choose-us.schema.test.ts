import { describe, expect, it } from "vitest";
import { whyChooseUsStorageSchema } from "./why-choose-us.schema";

describe("whyChooseUsStorageSchema", () => {
  it("accepts minimal valid document", () => {
    const parsed = whyChooseUsStorageSchema.safeParse({
      version: 1,
      sectionTitle: { en: "Why", hy: "Ինչու", ru: "Почему" },
      items: [
        {
          id: "a",
          title: { en: "T", hy: "T", ru: "T" },
          body: { en: "", hy: "", ru: "" },
          iconKey: "warranty",
          active: true,
          sortOrder: 0,
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown iconKey", () => {
    const parsed = whyChooseUsStorageSchema.safeParse({
      version: 1,
      sectionTitle: { en: "Why", hy: "Ինչու", ru: "Почему" },
      items: [
        {
          id: "a",
          title: { en: "T", hy: "T", ru: "T" },
          body: { en: "", hy: "", ru: "" },
          iconKey: "unknown",
          active: true,
          sortOrder: 0,
        },
      ],
    });
    expect(parsed.success).toBe(false);
  });
});
