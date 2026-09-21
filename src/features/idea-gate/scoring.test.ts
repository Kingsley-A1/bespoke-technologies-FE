import { describe, expect, it } from "vitest";
import { IDEA_GATE_CRITICAL_IDS, IDEA_GATE_QUESTIONS } from "./definition";
import {
  buildIdeaGateBaseline,
  computeIdeaGateResult,
  ideaGateDecisionFor,
  IDEA_GATE_MAX_SCORE,
  isCompleteIdeaGateAnswers,
} from "./scoring";
import type { IdeaGateAnswers, IdeaGateId, IdeaGateScore } from "./types";

function answersWith(scores: Partial<Record<IdeaGateId, IdeaGateScore>>, fallback: IdeaGateScore) {
  return Object.fromEntries(
    IDEA_GATE_QUESTIONS.map((gate) => {
      const score = scores[gate.id] ?? fallback;
      return [
        gate.id,
        {
          score,
          optionIndex: gate.options.findIndex((option) => option.score === score),
          evidence: "",
        },
      ];
    }),
  ) as IdeaGateAnswers;
}

describe("idea execution gate scoring", () => {
  it("scores each gate out of two and totals out of twenty", () => {
    expect(IDEA_GATE_QUESTIONS).toHaveLength(10);
    expect(IDEA_GATE_MAX_SCORE).toBe(20);
    for (const gate of IDEA_GATE_QUESTIONS) {
      expect(gate.options.map((option) => option.score)).toEqual([0, 1, 2]);
    }
    expect(computeIdeaGateResult(answersWith({}, 2)).totalScore).toBe(20);
    expect(computeIdeaGateResult(answersWith({}, 1)).totalScore).toBe(10);
    expect(computeIdeaGateResult(answersWith({}, 0)).totalScore).toBe(0);
  });

  it("refuses to score an incomplete assessment", () => {
    const partial: IdeaGateAnswers = { problem: { score: 2, optionIndex: 2, evidence: "" } };
    expect(isCompleteIdeaGateAnswers(partial)).toBe(false);
    expect(() => computeIdeaGateResult(partial)).toThrow(/ten execution gates/i);
  });

  it("applies the framework decision rule to the number of gates passed", () => {
    expect(ideaGateDecisionFor(10, 0)).toBe("green");
    expect(ideaGateDecisionFor(8, 0)).toBe("green");
    expect(ideaGateDecisionFor(7, 0)).toBe("amber");
    expect(ideaGateDecisionFor(5, 0)).toBe("amber");
    expect(ideaGateDecisionFor(4, 0)).toBe("red");
    expect(ideaGateDecisionFor(0, 0)).toBe("red");
  });

  it("returns green when every gate carries strong evidence", () => {
    const result = computeIdeaGateResult(answersWith({}, 2));
    expect(result.decision).toBe("green");
    expect(result.gatesPassed).toBe(10);
    expect(result.strengths).toHaveLength(10);
    expect(result.gaps).toHaveLength(0);
  });

  it("returns amber when the evidence is mixed", () => {
    // Six strong gates, four weak — passes 6, no critical gate at zero.
    const result = computeIdeaGateResult(
      answersWith({ timing: 1, market: 1, feasibility: 1, mvp: 1 }, 2),
    );
    expect(result.gatesPassed).toBe(6);
    expect(result.totalScore).toBe(16);
    expect(result.decision).toBe("amber");
  });

  it("returns red when fewer than five gates pass", () => {
    const result = computeIdeaGateResult(answersWith({ problem: 2, user: 2, timing: 2 }, 1));
    expect(result.gatesPassed).toBe(3);
    expect(result.decision).toBe("red");
    expect(result.criticalGaps).toHaveLength(0);
  });

  it("forces red through the kill switches even when the score is otherwise strong", () => {
    for (const id of IDEA_GATE_CRITICAL_IDS) {
      const result = computeIdeaGateResult(answersWith({ [id]: 0 }, 2));
      expect(result.gatesPassed).toBe(9);
      expect(result.totalScore).toBe(18);
      expect(result.decision).toBe("red");
      expect(result.criticalGaps.map((entry) => entry.id)).toEqual([id]);
    }
  });

  it("does not force red for a non-critical gate with no evidence", () => {
    const result = computeIdeaGateResult(answersWith({ timing: 0 }, 2));
    expect(result.criticalGaps).toHaveLength(0);
    expect(result.decision).toBe("green");
  });

  it("builds a complete framework narrative without any AI", () => {
    const result = computeIdeaGateResult(answersWith({ mvp: 0, firstBuild: 0 }, 2));
    const baseline = buildIdeaGateBaseline(result, { ideaTitle: "Clinic Scheduler" });
    expect(baseline.source).toBe("framework");
    expect(baseline.summary).toContain("Clinic Scheduler");
    expect(baseline.summary).toContain("16/20");
    expect(baseline.strengths.length).toBeGreaterThan(0);
    expect(baseline.gaps.length).toBeGreaterThan(0);
    expect(baseline.risks.length).toBeGreaterThan(0);
    expect(baseline.mvp).toBeTruthy();
    expect(baseline.firstBuild).toBeTruthy();
    expect(baseline.nextActions.length).toBeGreaterThan(0);
    expect(baseline.nextActions.length).toBeLessThanOrEqual(6);
  });

  it("still produces usable guidance when nothing has evidence yet", () => {
    const result = computeIdeaGateResult(answersWith({}, 0));
    const baseline = buildIdeaGateBaseline(result, { ideaTitle: "Untitled idea" });
    expect(result.decision).toBe("red");
    expect(baseline.strengths).toHaveLength(1);
    expect(baseline.nextActions[0]).toContain("critical gaps");
  });
});
