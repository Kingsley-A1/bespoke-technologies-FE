/**
 * The Gemini model every Bespoke surface talks to — public Bespoke AI, the
 * Admin Coworker and the Idea Execution Gate analysis.
 *
 * Google retires generation endpoints without warning: `gemini-2.5-flash`
 * began returning a hard 404 ("no longer available to new users") in
 * September 2026, which took out all three surfaces at once. Keeping the id in
 * one place makes the next migration a single edit.
 *
 * `GEMINI_MODEL_ID` overrides it at runtime, so a future retirement can be
 * mitigated by an environment change before a deploy.
 */
export const GEMINI_MODEL_ID = process.env.GEMINI_MODEL_ID?.trim() || "gemini-3.6-flash";
