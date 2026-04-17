import { describe, expect, it } from "vitest";
import {
  decodeProductCursor,
  encodeProductCursor,
} from "./products-pagination-cursor";

describe("products-pagination-cursor", () => {
  it("encodes and decodes offset", () => {
    const cursor = encodeProductCursor(24);
    expect(decodeProductCursor(cursor)).toBe(24);
  });

  it("returns 0 for invalid cursor payload", () => {
    expect(decodeProductCursor("bad-cursor")).toBe(0);
  });

  it("normalizes negative offset to zero", () => {
    const cursor = encodeProductCursor(-5);
    expect(decodeProductCursor(cursor)).toBe(0);
  });
});

