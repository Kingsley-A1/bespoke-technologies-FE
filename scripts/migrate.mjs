import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to apply migrations.");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
  max: 1,
});

const client = await pool.connect();
try {
  await client.query(`CREATE TABLE IF NOT EXISTS app_migrations (
    filename STRING PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  const directory = path.join(process.cwd(), "migrations");
  const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
  for (const filename of files) {
    const applied = await client.query("SELECT 1 FROM app_migrations WHERE filename = $1", [filename]);
    if (applied.rowCount) {
      process.stdout.write(`skip ${filename}\n`);
      continue;
    }
    const sql = await readFile(path.join(directory, filename), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO app_migrations (filename) VALUES ($1)", [filename]);
      await client.query("COMMIT");
      process.stdout.write(`applied ${filename}\n`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  client.release();
  await pool.end();
}

