import "server-only";

import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  var __bespokeAdminPool: Pool | undefined;
}

export function isAdminDatabaseConfigured() {
  // The admin system is database-backed in every environment. A configured
  // DATABASE_URL is mandatory; without it the admin runtime fails closed.
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!process.env.DATABASE_URL) return undefined;
  globalThis.__bespokeAdminPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  return globalThis.__bespokeAdminPool;
}

export async function adminQuery<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  const pool = getPool();
  if (!pool) throw new Error("Admin database is not configured.");
  return pool.query<T>(text, values);
}

export async function withAdminTransaction<T>(work: (client: PoolClient) => Promise<T>, attempts = 3): Promise<T> {
  const pool = getPool();
  if (!pool) throw new Error("Admin database is not configured.");
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      lastError = error;
      await client.query("ROLLBACK").catch(() => undefined);
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code !== "40001" || attempt === attempts) throw error;
    } finally {
      client.release();
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Admin database transaction failed.");
}

export function requireAdminRuntimeConfiguration() {
  // Next evaluates layouts while producing a build. Enforce the production
  // contract when the deployed process handles a request, not while compiling.
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && process.env.ADMIN_ENABLED !== "true") {
    throw new Error("The admin system is disabled in production.");
  }
  if (isProduction) {
    const required = [
      "DATABASE_URL",
      "ADMIN_SESSION_SECRET",
      "ADMIN_CODE_PEPPER",
      "ADMIN_FOUNDER_EMAIL",
      "ADMIN_FOUNDER_TOTP_SECRET",
      "ADMIN_MANAGER_EMAIL",
      "ADMIN_MANAGER_TOTP_SECRET",
      "ADMIN_CRON_SECRET",
    ] as const;
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) throw new Error(`Missing required admin configuration: ${missing.join(", ")}`);
    const weakSecrets = ["ADMIN_SESSION_SECRET", "ADMIN_CODE_PEPPER", "ADMIN_CRON_SECRET"].filter((key) => (process.env[key]?.length ?? 0) < 32);
    if (weakSecrets.length > 0) throw new Error(`Admin secrets must be at least 32 characters: ${weakSecrets.join(", ")}`);
    const invalidTotp = ["ADMIN_FOUNDER_TOTP_SECRET", "ADMIN_MANAGER_TOTP_SECRET"].filter((key) => !/^[A-Z2-7]{16,}$/i.test(process.env[key] ?? ""));
    if (invalidTotp.length > 0) throw new Error(`Invalid base32 TOTP configuration: ${invalidTotp.join(", ")}`);
    if (process.env.ADMIN_FOUNDER_EMAIL?.trim().toLowerCase() === process.env.ADMIN_MANAGER_EMAIL?.trim().toLowerCase()) throw new Error("Founder and Manager identities must be distinct.");
    if (process.env.ADMIN_ALLOW_BOOTSTRAP === "true") throw new Error("ADMIN_ALLOW_BOOTSTRAP must be false in production after enrollment.");
    if (!/^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL ?? "")) throw new Error("DATABASE_URL must be a PostgreSQL-compatible CockroachDB URL.");
  }
}
