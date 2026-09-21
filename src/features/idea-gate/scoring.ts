import {
  IDEA_GATE_CRITICAL_IDS,
  IDEA_GATE_DECISIONS,
  IDEA_GATE_QUESTIONS,
  IDEA_GATE_SCORING_VERSION,
} from "./definition";
import type {
  IdeaGateAnalysis,
  IdeaGateAnswers,
  IdeaGateBreakdownEntry,
  IdeaGateDecision,
  IdeaGateId,
  IdeaGateResult,
  IdeaGateScore,
} from "./types";

export const IDEA_GATE_MAX_SCORE = IDEA_GATE_QUESTIONS.length * 2;

export function isCompleteIdeaGateAnswers(answers: IdeaGateAnswers) {
  return IDEA_GATE_QUESTIONS.every((gate) => {
    const value = answers[gate.id]?.score;
    return value === 0 || value === 1 || value === 2;
  });
}

/**
 * The single scoring authority. Totals, pass counts and the Green/Amber/Red
 * decision are derived only from the recorded 0/1/2 gate answers and the
 * framework's own decision rule — never from free text and never from AI.
 */
export function computeIdeaGateResult(answers: IdeaGateAnswers): IdeaGateResult {
  if (!isCompleteIdeaGateAnswers(answers)) {
    throw new Error("All ten execution gates must be answered before completion.");
  }

  const breakdown: IdeaGateBreakdownEntry[] = IDEA_GATE_QUESTIONS.map((gate) => {
    const answer = answers[gate.id];
    const score = (answer?.score ?? 0) as IdeaGateScore;
    return {
      id: gate.id,
      number: gate.number,
      label: gate.label,
      question: gate.question,
      score,
      optionLabel: gate.options[answer?.optionIndex ?? 0]?.label ?? "",
      verdict: score === 2 ? "pass" : score === 1 ? "refine" : "missing",
      evidence: answer?.evidence?.trim() ?? "",
    };
  });

  const totalScore = breakdown.reduce((total, entry) => total + entry.score, 0);
  const gatesPassed = breakdown.filter((entry) => entry.score === 2).length;
  const criticalGaps = breakdown.filter(
    (entry) => entry.score === 0 && IDEA_GATE_CRITICAL_IDS.includes(entry.id),
  );
  const decision = ideaGateDecisionFor(gatesPassed, criticalGaps.length);
  const copy = IDEA_GATE_DECISIONS[decision];

  return {
    totalScore,
    maxScore: IDEA_GATE_MAX_SCORE,
    gatesPassed,
    decision,
    headline: copy.headline,
    condition: copy.condition,
    action: copy.action,
    breakdown,
    strengths: breakdown.filter((entry) => entry.score === 2),
    gaps: breakdown.filter((entry) => entry.score < 2),
    criticalGaps,
  };
}

/** The framework's decision rule, isolated so it can be tested directly. */
export function ideaGateDecisionFor(
  gatesPassed: number,
  criticalGapCount: number,
): IdeaGateDecision {
  if (criticalGapCount > 0) return "red";
  if (gatesPassed >= 8) return "green";
  if (gatesPassed >= 5) return "amber";
  return "red";
}

function gateFocus(id: IdeaGateId) {
  return IDEA_GATE_QUESTIONS.find((gate) => gate.id === id)?.focus;
}

/**
 * The narrative every report falls back to. It is derived entirely from the
 * framework, so a report is always complete and useful even when the AI
 * interpretation layer is unavailable.
 */
export function buildIdeaGateBaseline(
  result: IdeaGateResult,
  input: { ideaTitle: string },
): IdeaGateAnalysis {
  const weakest = [...result.gaps].sort((a, b) => a.score - b.score || a.number - b.number);
  const mvpGate = result.breakdown.find((entry) => entry.id === "mvp");
  const firstBuildGate = result.breakdown.find((entry) => entry.id === "firstBuild");

  const summary =
    result.decision === "green"
      ? `${input.ideaTitle} scores ${result.totalScore}/${result.maxScore} with ${result.gatesPassed} of ${IDEA_GATE_QUESTIONS.length} gates passing on evidence. The strategy is defined enough to become a build brief.`
      : result.decision === "amber"
        ? `${input.ideaTitle} scores ${result.totalScore}/${result.maxScore} with ${result.gatesPassed} of ${IDEA_GATE_QUESTIONS.length} gates passing on evidence. The direction holds; the evidence behind ${weakest.length} ${weakest.length === 1 ? "gate" : "gates"} needs to catch up before engineering time is committed.`
        : `${input.ideaTitle} scores ${result.totalScore}/${result.maxScore} with ${result.gatesPassed} of ${IDEA_GATE_QUESTIONS.length} gates passing on evidence. The work now is on the foundations — problem, user, value, reach and lasting advantage — not on the build.`;

  const strengths = result.strengths.map(
    (entry) => `${entry.label}: ${entry.optionLabel}`,
  );

  const gaps = weakest.map((entry) => {
    const focus = gateFocus(entry.id);
    return `${entry.label}: ${focus?.move ?? entry.question}`;
  });

  const risks = weakest.slice(0, 4).map((entry) => {
    const focus = gateFocus(entry.id);
    return `${entry.label}: ${focus?.risk ?? "This gate is not yet supported by evidence."}`;
  });

  const mvp =
    mvpGate?.score === 2 && mvpGate.evidence
      ? `Build the version you described: ${mvpGate.evidence}`
      : mvpGate?.score === 2
        ? "Build the smallest version that proves the core value, and defer every other feature by name."
        : "Reduce the first version to the single workflow that proves the core value. Write down what it excludes, so scope stays decided rather than debated.";

  const firstBuild =
    firstBuildGate?.score === 2 && firstBuildGate.evidence
      ? `Start with: ${firstBuildGate.evidence}`
      : firstBuildGate?.score === 2
        ? "Start with the one user flow you identified, finished end to end."
        : "Choose one user flow, define what finished looks like for it, and make that the only build target for the first cycle.";

  const nextActions: string[] = [];
  if (result.criticalGaps.length) {
    nextActions.push(
      `Close the critical gaps first: ${result.criticalGaps.map((entry) => entry.label.toLowerCase()).join(", ")}.`,
    );
  }
  for (const entry of weakest.slice(0, 4)) {
    const focus = gateFocus(entry.id);
    if (focus) nextActions.push(focus.move);
  }
  if (result.decision === "green") {
    nextActions.push(
      "Write the build brief: problem, first user, first market, MVP scope, first build target, risks and the success metric for the first cycle.",
    );
  } else {
    nextActions.push("Re-run the Idea Execution Gate once the evidence above is in place.");
  }

  return {
    source: "framework",
    summary,
    strengths: strengths.length
      ? strengths
      : ["Taking the idea through a structured gate before building is itself the right first move."],
    gaps: gaps.length ? gaps : ["No gate is currently short of evidence."],
    risks: risks.length ? risks : ["No material execution risk was flagged by the gates."],
    mvp,
    firstBuild,
    nextActions: nextActions.slice(0, 6),
  };
}

export { IDEA_GATE_SCORING_VERSION };
