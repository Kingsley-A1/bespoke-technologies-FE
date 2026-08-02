import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = resolve(root, "Learn");
const outputDirectory = resolve(root, "public", "learn", "brand");
const compactSource = resolve(sourceDirectory, "Bepsoke-Learn-Logo.png");
const lockupSource = resolve(sourceDirectory, "Bespoke-learn-logo-with-name.png");
const compactOutput = resolve(outputDirectory, "bespoke-learn-mark.png");
const lockupOutput = resolve(outputDirectory, "bespoke-learn-lockup.png");

if (!existsSync(compactSource) || !existsSync(lockupSource)) {
  throw new Error("Approved Bespoke Learn source PNG files are required.");
}

mkdirSync(outputDirectory, { recursive: true });
cpSync(compactSource, compactOutput);

const crop = "crop=1070:680:95:270";
const result = spawnSync("ffmpeg", ["-y", "-i", lockupSource, "-vf", crop, "-frames:v", "1", "-update", "1", lockupOutput], {
  cwd: root,
  stdio: "inherit",
});
if (result.status !== 0) throw new Error("The deterministic Bespoke Learn lockup crop did not complete.");
