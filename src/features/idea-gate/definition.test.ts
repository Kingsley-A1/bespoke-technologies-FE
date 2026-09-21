import { describe, expect, it } from "vitest";
import {
  IDEA_GATE_CRITICAL_IDS,
  IDEA_GATE_DECISIONS,
  IDEA_GATE_EXECUTION_BENCHMARK,
  IDEA_GATE_QUESTIONS,
  ideaGateById,
} from "./definition";

describe("idea execution gate definition", () => {
  it("keeps the framework's ten gates, numbered in order and uniquely identified", () => {
    expect(IDEA_GATE_QUESTIONS).toHaveLength(10);
    expect(IDEA_GATE_QUESTIONS.map((gate) => gate.number)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(new Set(IDEA_GATE_QUESTIONS.map((gate) => gate.id)).size).toBe(10);
  });

  it("uses the public wording for the two internal questions", () => {
    expect(ideaGateById("firstBuild")?.question).toBe("What should be built first?");
    expect(ideaGateById("advantage")?.question).toBe(
      "Does this create a meaningful long-term advantage?",
    );
    // No public-facing gate should still address an internal role.
    for (const gate of IDEA_GATE_QUESTIONS) {
      expect(gate.question).not.toMatch(/\bCTO\b/);
      expect(gate.context).not.toMatch(/\bCTO\b/);
    }
  });

  it("carries complete guidance for every gate", () => {
    for (const gate of IDEA_GATE_QUESTIONS) {
      expect(gate.options).toHaveLength(3);
      expect(gate.passSignal.length).toBeGreaterThan(10);
      expect(gate.refineSignal.length).toBeGreaterThan(10);
      expect(gate.encouragement.length).toBeGreaterThan(10);
      expect(gate.focus.risk.length).toBeGreaterThan(10);
      expect(gate.focus.move.length).toBeGreaterThan(10);
      expect(gate.focus.outcome.length).toBeGreaterThan(10);
      expect(gate.evidencePlaceholder.length).toBeGreaterThan(10);
    }
  });

  it("keeps the framework's kill switches and execution benchmark", () => {
    expect([...IDEA_GATE_CRITICAL_IDS].sort()).toEqual(
      ["advantage", "commercial", "problem", "reach", "user"].sort(),
    );
    for (const id of IDEA_GATE_CRITICAL_IDS) {
      expect(ideaGateById(id)).toBeDefined();
    }
    expect(IDEA_GATE_EXECUTION_BENCHMARK).toBe(16);
  });

  it("never frames a red verdict as a reason to abandon the idea", () => {
    expect(IDEA_GATE_DECISIONS.red.action).toContain("not closed");
    for (const decision of Object.values(IDEA_GATE_DECISIONS)) {
      expect(decision.headline.length).toBeGreaterThan(10);
      expect(decision.condition.length).toBeGreaterThan(10);
    }
  });
});
