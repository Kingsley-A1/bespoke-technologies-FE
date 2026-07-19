import { createHmac, randomInt } from "node:crypto";

const pepper = process.env.ADMIN_CODE_PEPPER;
if (!pepper) throw new Error("Set ADMIN_CODE_PEPPER before generating recovery codes.");

const codes = new Set();
while (codes.size < 8) codes.add(String(randomInt(0, 1_000_000)).padStart(6, "0"));
const values = [...codes];
const hashes = values.map((code) => createHmac("sha256", pepper).update(code).digest("base64url"));

process.stdout.write("Store these single-use six-digit codes offline. They will not be shown again.\n");
process.stdout.write(`${values.join(" ")}\n\n`);
process.stdout.write("Set the matching role environment variable to this comma-separated hash list:\n");
process.stdout.write(`${hashes.join(",")}\n`);
