import { describe, expect, it } from "vitest";
import { safeParseContactForm } from "./contact-form.schema";

describe("safeParseContactForm", () => {
  it("accepts a valid payload", () => {
    const result = safeParseContactForm({
      name: "Anna",
      email: "anna@example.com",
      subject: "Hello",
      message: "Test message body",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = safeParseContactForm({
      name: "Anna",
      email: "not-an-email",
      subject: "Hello",
      message: "Body",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty message", () => {
    const result = safeParseContactForm({
      name: "Anna",
      email: "a@b.co",
      subject: "Hello",
      message: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("allows optional honeypot and turnstile fields", () => {
    const result = safeParseContactForm({
      name: "Anna",
      email: "anna@example.com",
      subject: "Hello",
      message: "Body",
      website: "",
      turnstileToken: "token",
    });
    expect(result.success).toBe(true);
  });
});
