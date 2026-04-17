import { describe, expect, it } from "vitest";
import { computeWebhookSignature, verifyWebhookSignature } from "./payment-psp.service";

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

