// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { buildIdeaGateAnalysis } from "./analysis";
import { IDEA_GATE_QUESTIONS } from "./definition";
import { computeIdeaGateResult } from "./scoring";
import type { IdeaGateAnswers, IdeaGateId, IdeaGateScore } from "./types";

/**
 * Exercises the real Gemini boundary. The live block only runs under
 * `pnpm verify:idea-gate-ai`, which loads `.env.local` and sets the flag, so
 * `pnpm test` never makes a network call or spends provider quota.
 */
const LIVE = process.env.IDEA_GATE_AI_CHECK === "1";

const EVIDENCE: Partial<Record<IdeaGateId, string>> = {
  problem: "Private clinics in Calabar lose about two hours a day reconciling a paper appointment book against phone and WhatsApp bookings, and double-booked patients are turned away.",
  user: "Private clinics with three to ten staff. The practice manager buys it, the front desk uses it every day, and the doctors benefit from a predictable schedule.",
  timing: "Two clinics have already asked for this after a shared scheduling spreadsheet failed during a power cut.",
  commercial: "Saves roughly ten staff hours a month per clinic. Practice managers already pay for accounting software, so the budget line exists.",
  market: "Calabar first, then the rest of Cross River once the workflow holds for three clinics.",
  reach: "Direct visits to twenty clinics I can reach by road, then referrals through the ones that adopt it.",
  feasibility: "Needs offline-tolerant sync because power and network drop. Patient data has to be handled carefully. No exotic integrations needed.",
  mvp: "One clinic, one shared booking screen, manual import of the existing book. No billing, no patient app, no reporting.",
  firstBuild: "The shared booking screen with create, move and cancel, working end to end for a single clinic.",
  advantage: "The scheduling data and the clinic relationships make every later clinic product easier to sell.",
};

/** A realistic mixed-evidence assessment: 16/20, eight gates passed, Amber-adjacent. */
function fixtureResult() {
  const weak = new Set<IdeaGateId>(["timing", "feasibility"]);
  const answers = Object.fromEntries(
    IDEA_GATE_QUESTIONS.map((gate) => {
      const score: IdeaGateScore = weak.has(gate.id) ? 1 : 2;
      return [
        gate.id,
        {
          score,
          optionIndex: gate.options.findIndex((option) => option.score === score),
          evidence: EVIDENCE[gate.id] ?? "",
        },
      ];
    }),
  ) as IdeaGateAnswers;
  return computeIdeaGateResult(answers);
}

const FIXTURE_INPUT = {
  ideaTitle: "Clinic Scheduler",
  ideaSummary:
    "A shared booking screen for small private clinics, replacing the paper appointment book and the WhatsApp messages that currently sit beside it.",
  ideaStage: "Just an idea",
};

describe("idea gate analysis fallback", () => {
  const original = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  afterEach(() => {
    if (original === undefined) delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    else process.env.GOOGLE_GENERATIVE_AI_API_KEY = original;
  });

  it("returns the framework narrative when no API key is configured", async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const result = fixtureResult();
    const analysis = await buildIdeaGateAnalysis(result, FIXTURE_INPUT);

    expect(analysis.source).toBe("framework");
    expect(analysis.summary).toContain(`${result.totalScore}/${result.maxScore}`);
    expect(analysis.nextActions.length).toBeGreaterThan(0);
  });
});

describe.runIf(LIVE)("idea gate analysis — live Gemini call", () => {
  it("returns a schema-valid narrative from the provider", async () => {
    const result = fixtureResult();
    const started = Date.now();
    const analysis = await buildIdeaGateAnalysis(result, FIXTURE_INPUT);
    const elapsedMs = Date.now() - started;

    // A provider failure falls back silently by design, so an "assisted"
    // source is the only proof the call actually reached Gemini.
    expect(
      analysis.source,
      "Fell back to the framework baseline — check the console for the provider error.",
    ).toBe("assisted");

    expect(analysis.summary.length).toBeGreaterThanOrEqual(40);
    expect(analysis.strengths.length).toBeGreaterThan(0);
    expect(analysis.gaps.length).toBeGreaterThan(0);
    expect(analysis.risks.length).toBeGreaterThan(0);
    expect(analysis.mvp.length).toBeGreaterThanOrEqual(20);
    expect(analysis.firstBuild.length).toBeGreaterThanOrEqual(20);
    expect(analysis.nextActions.length).toBeGreaterThanOrEqual(2);

    // The model must never restate a score other than the framework's.
    const quotedScores = [...analysis.summary.matchAll(/(\d+)\s*\/\s*20/g)].map(
      (match) => match[1],
    );
    for (const quoted of quotedScores) {
      expect(Number(quoted)).toBe(result.totalScore);
    }

    console.info(
      [
        "",
        `  model round trip: ${elapsedMs}ms`,
        `  framework score:  ${result.totalScore}/${result.maxScore} (${result.gatesPassed} gates passed, ${result.decision})`,
        `  summary:          ${analysis.summary}`,
        `  mvp:              ${analysis.mvp}`,
        `  firstBuild:       ${analysis.firstBuild}`,
        `  nextActions:      ${analysis.nextActions.length} written`,
        "",
      ].join("\n"),
    );
  }, 40_000);
});
