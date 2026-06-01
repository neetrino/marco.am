import { describe, expect, it } from "vitest";
import {
  assertWebhookPaymentAmountMatches,
  computeWebhookSignature,
  verifyWebhookSignature,
} from "./payment-psp.service";

describe("payment-psp.service signature helpers", () => {
  it("computes deterministic sha256 signature", () => {
    const body = JSON.stringify({
      eventId: "evt_1",
      type: "payment.succeeded",
      data: { sessionId: "psp_session_1" },
    });
    const secret = "test_secret_123";

    const first = computeWebhookSignature(body, secret);
    const second = computeWebhookSignature(body, secret);

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
  });

  it("verifies matching signatures", () => {
    const body = JSON.stringify({ ok: true, id: "evt_2" });
    const secret = "another_secret";
    const signature = computeWebhookSignature(body, secret);

    expect(verifyWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("rejects invalid signatures", () => {
    const body = JSON.stringify({ ok: true, id: "evt_3" });
    const secret = "secret";
    const signature = computeWebhookSignature(body, secret);

    expect(verifyWebhookSignature(body, signature.replace(/^./, "0"), secret)).toBe(false);
  });
});

describe("assertWebhookPaymentAmountMatches", () => {
  const baseEvent = {
    eventId: "evt_1",
    type: "payment.succeeded" as const,
    data: {
      sessionId: "psp_1",
      amount: 1000,
      currency: "AMD",
    },
  };

  it("accepts matching amount and currency", () => {
    expect(() =>
      assertWebhookPaymentAmountMatches(baseEvent, {
        amount: 1000,
        currency: "AMD",
      })
    ).not.toThrow();
  });

  it("rejects succeeded webhook without amount", () => {
    expect(() =>
      assertWebhookPaymentAmountMatches(
        {
          ...baseEvent,
          data: { sessionId: "psp_1", currency: "AMD" },
        },
        { amount: 1000, currency: "AMD" }
      )
    ).toThrow();
  });

  it("rejects amount mismatch", () => {
    expect(() =>
      assertWebhookPaymentAmountMatches(baseEvent, {
        amount: 999,
        currency: "AMD",
      })
    ).toThrow();
  });

  it("ignores non-success event types", () => {
    expect(() =>
      assertWebhookPaymentAmountMatches(
        {
          ...baseEvent,
          type: "payment.failed",
          data: { sessionId: "psp_1" },
        },
        { amount: 1, currency: "AMD" }
      )
    ).not.toThrow();
  });
});

