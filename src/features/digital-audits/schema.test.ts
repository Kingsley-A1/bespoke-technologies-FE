import { describe, expect, it } from "vitest";
import { DIGITAL_AUDIT_TEAM_SIZES } from "./definition";
import {
  createDigitalAuditSchema,
  saveDigitalAuditAnswerSchema,
} from "./schema";

describe("digital audit public schemas", () => {
  it("accepts optional contact details without creating another diagnostic question", () => {
    const result = createDigitalAuditSchema.parse({
      businessName: "Northstar Services",
      industry: "Professional Services",
      teamSize: DIGITAL_AUDIT_TEAM_SIZES[1],
      email: "",
      phone: "",
      contactConsent: false,
      shareBusinessName: true,
    });
    expect(result.email).toBe("");
    expect(result.contactConsent).toBe(false);
  });

  it("accepts catalogue and custom industries while rejecting honeypot content", () => {
    expect(
      createDigitalAuditSchema.safeParse({
        businessName: "Northstar Services",
        industry: "Forex & Foreign Exchange",
        teamSize: DIGITAL_AUDIT_TEAM_SIZES[1],
      }).success,
    ).toBe(true);
    expect(
      createDigitalAuditSchema.safeParse({
        businessName: "Northstar Services",
        industry: "Specialist Marine Surveying",
        teamSize: DIGITAL_AUDIT_TEAM_SIZES[1],
      }).success,
    ).toBe(true);
    expect(
      createDigitalAuditSchema.safeParse({
        businessName: "Northstar Services",
        industry: "Professional Services",
        teamSize: DIGITAL_AUDIT_TEAM_SIZES[1],
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
