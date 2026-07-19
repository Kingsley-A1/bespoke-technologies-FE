const production = process.env.NODE_ENV === "production";
const enabled = process.env.ADMIN_ENABLED === "true";
const required = [
  "DATABASE_URL",
  "ADMIN_SESSION_SECRET",
  "ADMIN_CODE_PEPPER",
  "ADMIN_FOUNDER_EMAIL",
  "ADMIN_FOUNDER_TOTP_SECRET",
  "ADMIN_MANAGER_EMAIL",
  "ADMIN_MANAGER_TOTP_SECRET",
  "ADMIN_CRON_SECRET",
];

if (!enabled) {
  process.stdout.write("Admin is disabled. Set ADMIN_ENABLED=true to verify its production contract.\n");
  process.exit(0);
}

const missing = required.filter((key) => !process.env[key]);
if (production && process.env.ADMIN_ALLOW_BOOTSTRAP === "true") missing.push("ADMIN_ALLOW_BOOTSTRAP must be false in production");
if (missing.length > 0) {
  process.stderr.write(`Admin configuration is incomplete: ${missing.join(", ")}\n`);
  process.exit(1);
}
const weakSecrets = ["ADMIN_SESSION_SECRET", "ADMIN_CODE_PEPPER", "ADMIN_CRON_SECRET"].filter((key) => process.env[key].length < 32);
if (weakSecrets.length > 0) {
  process.stderr.write(`Admin secrets must be at least 32 characters: ${weakSecrets.join(", ")}\n`);
  process.exit(1);
}
const invalidTotp = ["ADMIN_FOUNDER_TOTP_SECRET", "ADMIN_MANAGER_TOTP_SECRET"].filter((key) => !/^[A-Z2-7]{16,}$/i.test(process.env[key]));
if (invalidTotp.length > 0) {
  process.stderr.write(`Invalid base32 TOTP configuration: ${invalidTotp.join(", ")}\n`);
  process.exit(1);
}
if (process.env.ADMIN_FOUNDER_EMAIL.trim().toLowerCase() === process.env.ADMIN_MANAGER_EMAIL.trim().toLowerCase()) {
  process.stderr.write("Founder and Manager identities must be distinct.\n");
  process.exit(1);
}
if (!/^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL)) {
  process.stderr.write("DATABASE_URL must be a PostgreSQL-compatible CockroachDB URL.\n");
  process.exit(1);
}
process.stdout.write("Admin production configuration contract is satisfied.\n");
