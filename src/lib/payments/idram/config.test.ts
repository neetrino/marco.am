import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import {
  computeIdramChecksum,
  formatIdramAmount,
  verifyIdramChecksum,
} from "./config";
import { toArcaAmountMinor } from "../arca/config";

describe("idram checksum", () => {
  it("matches MD5 colon-joined formula", () => {
    const parts = {
      recAccount: "100052433",
      amount: "1500.00",
      secretKey: "secret",
      billNo: "ORD-1",
      payerAccount: "payer",
      transId: "tx-1",
      transDate: "2026-07-22",
    };
    const expected = createHash("md5")
      .update(
        "100052433:1500.00:secret:ORD-1:payer:tx-1:2026-07-22",
        "utf8",
      )
      .digest("hex");
    expect(computeIdramChecksum(parts)).toBe(expected);
    expect(verifyIdramChecksum(expected.toUpperCase(), parts)).toBe(true);
  });

  it("formats amounts with two decimals", () => {
    expect(formatIdramAmount(10)).toBe("10.00");
    expect(formatIdramAmount(10.5)).toBe("10.50");
  });
});

describe("arca amount", () => {
  it("converts AMD to minor units", () => {
    expect(toArcaAmountMinor(10)).toBe(1000);
    expect(toArcaAmountMinor(10.55)).toBe(1055);
  });
});
