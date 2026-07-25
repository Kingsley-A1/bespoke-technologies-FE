import { describe, expect, it } from "vitest";
import {
  createDigitalAuditSchema,
  saveDigitalAuditAnswerSchema,
} from "./schema";

describe("digital audit public schemas", () => {
  it("accepts optional contact details without creating another diagnostic question", () => {
    const result = createDigitalAuditSchema.parse({
      businessName: "Northstar Services",
      industry: "Professional Services",
      teamSize: "6–20",
      email: "",
      phone: "",
      contactConsent: false,
      shareBusinessName: true,
    });
    expect(result.email).toBe("");
    expect(result.contactConsent).toBe(false);
  });

  it("rejects unknown industries and honeypot content", () => {
    expect(
      createDigitalAuditSchema.safeParse({
        businessName: "Northstar Services",
        industry: "Unknown",
        teamSize: "6–20",
      }).success,
    ).toBe(false);
    expect(
      createDigitalAuditSchema.safeParse({
        businessName: "Northstar Services",
        industry: "Professional Services",
        teamSize: "6–20",
        website: "spam.example",
      }).success,
    ).toBe(false);
  });

  it("accepts only the six stable question identifiers and four options", () => {
    expect(
      saveDigitalAuditAnswerSchema.parse({ questionId: "presence", optionIndex: 3 }),
    ).toEqual({ questionId: "presence", optionIndex: 3 });
    expect(
      saveDigitalAuditAnswerSchema.safeParse({ questionId: "seventh", optionIndex: 0 })
        .success,
    ).toBe(false);
    expect(
      saveDigitalAuditAnswerSchema.safeParse({ questionId: "presence", optionIndex: 4 })
        .success,
    ).toBe(false);
  });
});
