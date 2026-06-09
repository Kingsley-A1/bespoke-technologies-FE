import "server-only";

import { Pool } from "pg";
import type { UIMessage } from "ai";

let pool: Pool | undefined;
const DB_TIMEOUT_MS = 1500;

export function isCockroachConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!process.env.DATABASE_URL) return undefined;

  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("sslmode=disable")
      ? false
      : { rejectUnauthorized: false },
    max: 3,
  });

  return pool;
}

export async function ensureAIConversation(conversationId?: string) {
  const db = getPool();
  if (!db) return conversationId;

  try {
    if (conversationId) {
      await withTimeout(
        db.query(
          "INSERT INTO ai_conversations (id, updated_at) VALUES ($1, now()) ON CONFLICT (id) DO UPDATE SET updated_at = now()",
          [conversationId],
        ),
      );
      return conversationId;
    }

    const result = await withTimeout(
      db.query<{ id: string }>("INSERT INTO ai_conversations DEFAULT VALUES RETURNING id"),
    );
    return result.rows[0]?.id;
  } catch (error) {
    console.error("Bespoke AI conversation persistence failed", error);
    return conversationId;
  }
}

export async function persistAIMessage({
  conversationId,
  role,
  content,
}: {
  conversationId?: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
}) {
  const db = getPool();
  if (!db || !conversationId || !content.trim()) return;

  try {
    await withTimeout(
      db.query(
        "INSERT INTO ai_messages (conversation_id, role, content) VALUES ($1, $2, $3)",
        [conversationId, role, content.slice(0, 12000)],
      ),
    );
  } catch (error) {
    console.error("Bespoke AI message persistence failed", error);
  }
}

export async function persistAIEvent({
  conversationId,
  eventName,
  payload,
}: {
  conversationId?: string;
  eventName: string;
  payload?: unknown;
}) {
  const db = getPool();
  if (!db) return;

  try {
    await withTimeout(
      db.query(
        "INSERT INTO ai_events (conversation_id, event_name, event_payload) VALUES ($1, $2, $3)",
        [
          conversationId ?? null,
          eventName,
          payload ? JSON.stringify(payload) : null,
        ],
      ),
    );
  } catch (error) {
    console.error("Bespoke AI event persistence failed", error);
  }
}

async function withTimeout<T>(promise: Promise<T>) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(
      () => reject(new Error("CockroachDB operation timed out.")),
      DB_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export function getLastUserMessageText(messages: UIMessage[]) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
  if (!lastUserMessage) return "";

  return lastUserMessage.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("\n")
    .trim();
}
