import {
  DIGITAL_AUDIT_QUESTIONS,
  DIGITAL_AUDIT_SCORING_VERSION,
} from "./definition";
import type {
  DigitalAuditAnswers,
  DigitalAuditMaturity,
  DigitalAuditQuestionId,
  DigitalAuditResult,
  DigitalAuditTier,
} from "./types";

const INTERPRETATIONS: Record<DigitalAuditTier, string> = {
  Foundational:
    "Core digital capabilities depend heavily on manual effort. The next gains should come from reliable foundations.",
  Emerging:
    "Useful digital practices exist, but they are inconsistent. Standardising the essentials will unlock measurable progress.",
  Operational:
    "Core work is digitally supported. The next step is to connect systems, improve reporting and remove repeated effort.",
  Advanced:
    "The business operates with mature digital practices. Focus on resilience, automation and compounding data advantages.",
  Leading:
    "The self-assessment indicates a highly mature digital operation. Protect that advantage through continuous review and disciplined governance.",
};

export function digitalAuditTierFor(score: number): DigitalAuditTier {
  if (score >= 90) return "Leading";
  if (score >= 75) return "Advanced";
  if (score >= 50) return "Operational";
  if (score >= 25) return "Emerging";
  return "Foundational";
}

export function isCompleteDigitalAuditAnswers(
  answers: DigitalAuditAnswers,
): answers is Record<DigitalAuditQuestionId, DigitalAuditMaturity> {
  return DIGITAL_AUDIT_QUESTIONS.every((question) => {
    const value = answers[question.id];
    return value === 0 || value === 1 || value === 2 || value === 3;
  });
}

export function computeDigitalAuditResult(answers: DigitalAuditAnswers): DigitalAuditResult {
  if (!isCompleteDigitalAuditAnswers(answers)) {
    throw new Error("All six audit questions must be answered before completion.");
  }

  const dimensions = DIGITAL_AUDIT_QUESTIONS.map((question) => {
    const maturity = answers[question.id];
    return {
      id: question.id,
      label: question.label,
      short: question.short,
      maturity,
      score: Math.round((maturity / 3) * 100),
    };
  });
  const maturityTotal = dimensions.reduce((total, dimension) => total + dimension.maturity, 0);
  const overall = Math.round((maturityTotal / (DIGITAL_AUDIT_QUESTIONS.length * 3)) * 100);
  const tier = digitalAuditTierFor(overall);
  const weakest = [...dimensions]
    .sort(
      (a, b) =>
        a.score - b.score ||
        DIGITAL_AUDIT_QUESTIONS.findIndex((question) => question.id === a.id) -
          DIGITAL_AUDIT_QUESTIONS.findIndex((question) => question.id === b.id),
    )
    .slice(0, 3);
  const strongest =
    [...dimensions].sort(
      (a, b) =>
        b.score - a.score ||
        DIGITAL_AUDIT_QUESTIONS.findIndex((question) => question.id === a.id) -
          DIGITAL_AUDIT_QUESTIONS.findIndex((question) => question.id === b.id),
    )[0] ?? null;

  return {
    overall,
    tier,
    interpretation: INTERPRETATIONS[tier],
    dimensions,
    weakest,
    strongest: strongest?.maturity ? strongest : null,
  };
}

export { DIGITAL_AUDIT_SCORING_VERSION };
