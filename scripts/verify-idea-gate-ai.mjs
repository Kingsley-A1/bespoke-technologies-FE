/**
 * Verifies the Idea Execution Gate's Gemini boundary before release.
 *
 * Loads `.env.local`, confirms the key is present, then runs the live
 * integration test against the real provider. A failure here means the report
 * would silently fall back to the framework narrative in production.
 *
 *   pnpm verify:idea-gate-ai
 */
import { spawnSync } from "node:child_process";
import process from "node:process";

try {
  process.loadEnvFile(".env.local");
} catch {
  console.warn("! No .env.local found — relying on the ambient environment.\n");
}

const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
if (!key) {
  console.error(
    [
      "x GOOGLE_GENERATIVE_AI_API_KEY is not set.",
      "",
      "  Without it the gate report still works, but every analysis falls back to",
      "  the deterministic framework narrative and analysis_source stays 'framework'.",
      "  Set it in .env.local locally and in the Vercel project for production.",
    ].join("\n"),
  );
  process.exit(1);
}

console.info(`> key loaded (${key.slice(0, 6)}…${key.slice(-4)}, ${key.length} chars)`);
console.info("> calling Gemini through the real analysis module…\n");

const result = spawnSync(
  process.platform === "win32" ? "pnpm.cmd" : "pnpm",
  ["exec", "vitest", "run", "src/features/idea-gate/analysis.live.test.ts", "--maxWorkers=1"],
  {
    stdio: "inherit",
    env: { ...process.env, IDEA_GATE_AI_CHECK: "1" },
  },
);

if (result.status !== 0) {
  console.error(
    "\nx The live check failed. The report will fall back to the framework narrative until this is fixed.",
  );
}
process.exit(result.status ?? 1);
