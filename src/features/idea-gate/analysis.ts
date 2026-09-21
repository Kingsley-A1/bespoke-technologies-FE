import "server-only";

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { GEMINI_MODEL_ID } from "@/lib/ai/model";
import { IDEA_GATE_QUESTIONS, IDEA_GATE_DECISIONS } from "./definition";
import { buildIdeaGateBaseline } from "./scoring";
import type { IdeaGateAnalysis, IdeaGateResult } from "./types";

const GENERATION_TIMEOUT_MS = 20_000;
const MAX_EVIDENCE_CHARS = 600;

/**
 * The shape the model must return. It deliberately contains no score, no gate
 * count and no decision: the framework owns those, and the model is never
 * given a way to change them.
 */
const analysisSchema = z.object({
  summary: z.string().min(40).max(700),
  strengths: z.array(z.string().min(8).max(260)).min(1).max(5),
  gaps: z.array(z.string().min(8).max(260)).min(1).max(5),
  risks: z.array(z.string().min(8).max(260)).min(1).max(5),
  mvp: z.string().min(20).max(600),
  firstBuild: z.string().min(20).max(600),
  nextActions: z.array(z.string().min(8).max(260)).min(2).max(6),
});

function clip(value: string, limit = MAX_EVIDENCE_CHARS) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed.length > limit ? `${trimmed.slice(0, limit)}…` : trimmed;
}

function buildPrompt(
  result: IdeaGateResult,
  input: { ideaTitle: string; ideaSummary: string; ideaStage: string },
) {
  const decision = IDEA_GATE_DECISIONS[result.decision];
  const gateLines = result.breakdown
    .map((entry) => {
      const gate = IDEA_GATE_QUESTIONS.find((question) => question.id === entry.id);
      const evidence = entry.evidence ? clip(entry.evidence) : "(no notes written)";
      return [
        `Gate ${entry.number} — ${entry.label} (${entry.score}/2)`,
        `  Question: ${entry.question}`,
        `  Selected: ${entry.optionLabel}`,
        `  Their notes: ${evidence}`,
        `  Framework guidance if weak: ${gate?.focus.move ?? ""}`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    `Idea title: ${clip(input.ideaTitle, 160)}`,
    `Stage: ${input.ideaStage}`,
    `Idea in their words: ${clip(input.ideaSummary, 1200)}`,
    "",
    `Fixed result (already decided, do not recalculate): ${result.totalScore}/${result.maxScore}, ${result.gatesPassed} of 10 gates passed, decision ${decision.label.toUpperCase()}.`,
    `Decision meaning: ${decision.condition}`,
    `Framework's recommended action: ${decision.action}`,
    "",
    "Gate-by-gate record:",
    gateLines,
  ].join("\n");
}

const SYSTEM_PROMPT = ` Present yourself as the analysis writer for the Bespoke Idea Execution Gate, a strategic assessment by Bespoke Technologies.

Your only job is to interpret what the person wrote and turn it into clear, specific, practical language. You do not score anything.

Hard rules:
- The score, the gate count and the Green/Amber/Red decision are already final. Never recalculate, dispute, re-derive or contradict them. You may refer to them, but only exactly as given.
- Never discourage the person or suggest abandoning the idea. A weak result means the evidence is not ready yet, never that the idea is bad. Write as a serious advisor who wants them to succeed.
- Use only what they wrote and the framework guidance supplied. Never invent users, numbers, competitors, market data, funding, timelines, prices or facts about Bespoke Technologies.
- Where their notes are vague or contradict each other, say so plainly and name the specific thing that needs to be pinned down. That is useful, not discouraging.
- Write in British English, plain and direct. No hype, no filler, no emoji, no markdown formatting or bullet characters. Each list item is one complete sentence.
- Address the reader as "you". Refer to the idea by its title where it reads naturally.

Content guide:
- summary: two or three sentences on where the idea actually stands and what the result means in practice.
- strengths: what their evidence genuinely supports, named specifically.
- gaps: what is missing or still assumed, one gap per item, tied to a gate.
- risks: execution risks that follow from those gaps — technical, adoption, commercial, operational or timing.
- mvp: the smallest serious version that would prove the core value, based on what they described.
- firstBuild: the single first technical slice to build, concrete enough to hand to an engineering team.
- nextActions: sequenced, doable steps, starting with whatever unblocks the weakest critical gate.`;

/**
 * Interprets the completed gates into report language. The deterministic
 * framework narrative is always computed first and returned unchanged whenever
 * the model is unconfigured, slow, fails or returns something invalid — so the
 * report is never empty and the score is never at risk.
 */
export async function buildIdeaGateAnalysis(
  result: IdeaGateResult,
  input: { ideaTitle: string; ideaSummary: string; ideaStage: string },
): Promise<IdeaGateAnalysis> {
  const baseline = buildIdeaGateBaseline(result, { ideaTitle: input.ideaTitle });
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim()) return baseline;

  try {
    const { object } = await generateObject({
      model: google(GEMINI_MODEL_ID),
      schema: analysisSchema,
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(result, input),
      temperature: 0.3,
      abortSignal: AbortSignal.timeout(GENERATION_TIMEOUT_MS),
    });

    return {
      source: "assisted",
      summary: object.summary.trim(),
      strengths: object.strengths.map((item) => item.trim()).filter(Boolean),
      gaps: object.gaps.map((item) => item.trim()).filter(Boolean),
      risks: object.risks.map((item) => item.trim()).filter(Boolean),
      mvp: object.mvp.trim(),
      firstBuild: object.firstBuild.trim(),
      nextActions: object.nextActions.map((item) => item.trim()).filter(Boolean),
    };
  } catch (error) {
    // A provider failure must never block or degrade the report.
    console.error("[idea-gate] analysis generation failed, using framework baseline:", error);
    return baseline;
  }
}
