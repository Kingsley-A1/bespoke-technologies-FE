import { describe, expect, it } from "vitest";
import {
  DIGITAL_AUDIT_DEFINITION_VERSION,
  DIGITAL_AUDIT_QUESTIONS,
  DIGITAL_AUDIT_SCORING_VERSION,
} from "./definition";
import {
  computeDigitalAuditResult,
  digitalAuditTierFor,
  isCompleteDigitalAuditAnswers,
} from "./scoring";
import type { DigitalAuditAnswers } from "./types";

function answers(value: 0 | 1 | 2 | 3): DigitalAuditAnswers {
  return Object.fromEntries(
    DIGITAL_AUDIT_QUESTIONS.map((question) => [question.id, value]),
  ) as DigitalAuditAnswers;
}

describe("digital audit definition", () => {
  it("keeps exactly six unique questions with ordered maturity choices", () => {
    expect(DIGITAL_AUDIT_QUESTIONS).toHaveLength(6);
    expect(new Set(DIGITAL_AUDIT_QUESTIONS.map((question) => question.id)).size).toBe(6);
    for (const question of DIGITAL_AUDIT_QUESTIONS) {
      expect(question.options).toHaveLength(4);
      expect(question.options.map((option) => option.maturity)).toEqual([0, 1, 2, 3]);
    }
  });

  it("uses explicit definition and scoring versions", () => {
    expect(DIGITAL_AUDIT_DEFINITION_VERSION).toMatch(/^digital-readiness-/);
    expect(DIGITAL_AUDIT_SCORING_VERSION).toBe("equal-maturity-v1");
  });
});

describe("digital audit scoring", () => {
  it("scores the minimum and maximum deterministically", () => {
    expect(computeDigitalAuditResult(answers(0))).toMatchObject({
      overall: 0,
      tier: "Foundational",
      strongest: null,
    });
    expect(computeDigitalAuditResult(answers(3))).toMatchObject({
      overall: 100,
      tier: "Leading",
    });
  });

  it("uses equal dimension weights and deterministic tie ordering", () => {
    const result = computeDigitalAuditResult({
      presence: 3,
      acquisition: 2,
      operations: 1,
      data: 0,
      ai: 2,
      security: 1,
    });
    expect(result.overall).toBe(50);
    expect(result.tier).toBe("Operational");
    expect(result.weakest.map((dimension) => dimension.id)).toEqual([
      "data",
      "operations",
      "security",
    ]);
  });

  it("rejects incomplete assessments", () => {
    const incomplete: DigitalAuditAnswers = { presence: 2 };
    expect(isCompleteDigitalAuditAnswers(incomplete)).toBe(false);
    expect(() => computeDigitalAuditResult(incomplete)).toThrow(/six audit questions/i);
  });

  it.each([
    [0, "Foundational"],
    [24, "Foundational"],
    [25, "Emerging"],
    [49, "Emerging"],
    [50, "Operational"],
    [74, "Operational"],
    [75, "Advanced"],
    [89, "Advanced"],
    [90, "Leading"],
  ])("maps score %s to %s", (score, tier) => {
    expect(digitalAuditTierFor(score)).toBe(tier);
  });
});
