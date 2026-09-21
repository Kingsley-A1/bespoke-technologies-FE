import { describe, expect, it } from "vitest";
import {
  createIdeaGateSchema,
  saveIdeaGateAnswerSchema,
  saveIdeaGateContactSchema,
} from "./schema";

const validIdea = {
  ideaTitle: "Clinic Scheduler",
  ideaSummary: "A shared booking screen for small private clinics in Calabar.",
  ideaStage: "Just an idea",
  ownerRole: "Founder",
};

describe("idea gate schemas", () => {
  it("accepts a well-formed idea without any contact details", () => {
    const parsed = createIdeaGateSchema.safeParse(validIdea);
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.source).toBe("website");
  });

  it("rejects a summary that is too thin to interpret", () => {
    expect(createIdeaGateSchema.safeParse({ ...validIdea, ideaSummary: "an app" }).success).toBe(
      false,
    );
  });

  it("rejects an unknown stage or role", () => {
    expect(createIdeaGateSchema.safeParse({ ...validIdea, ideaStage: "Shipped" }).success).toBe(
      false,
    );
    expect(createIdeaGateSchema.safeParse({ ...validIdea, ownerRole: "Hacker" }).success).toBe(
      false,
    );
  });

  it("only accepts the three framework option indexes", () => {
    for (const optionIndex of [0, 1, 2]) {
      expect(
        saveIdeaGateAnswerSchema.safeParse({ gateId: "problem", optionIndex }).success,
      ).toBe(true);
    }
    expect(saveIdeaGateAnswerSchema.safeParse({ gateId: "problem", optionIndex: 3 }).success).toBe(
      false,
    );
    expect(saveIdeaGateAnswerSchema.safeParse({ gateId: "nope", optionIndex: 1 }).success).toBe(
      false,
    );
  });

  it("treats contact details as optional and consent as opt-in", () => {
    const parsed = saveIdeaGateContactSchema.safeParse({});
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.contactConsent).toBe(false);
    expect(parsed.success && parsed.data.email).toBe("");
    expect(saveIdeaGateContactSchema.safeParse({ email: "not-an-email" }).success).toBe(false);
  });
});
