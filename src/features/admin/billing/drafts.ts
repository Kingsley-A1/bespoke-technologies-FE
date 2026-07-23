import "server-only";

import { randomUUID } from "node:crypto";
import { adminQuery } from "../db";
import type { AdminSession, InvoiceDraft } from "../types";

type Row = Record<string, unknown>;

function mapDraft(row: Row): InvoiceDraft {
  return {
    id: String(row.id),
    ownerUserId: String(row.owner_user_id),
    title: String(row.title || "Untitled invoice"),
    payload: typeof row.payload === "object" && row.payload ? row.payload as Record<string, unknown> : {},
    createdAt: new Date(row.created_at as string | Date).toISOString(),
    updatedAt: new Date(row.updated_at as string | Date).toISOString(),
  };
}

export async function listInvoiceDrafts(session: AdminSession) {
  const result = await adminQuery<Row>(
    `SELECT * FROM invoice_drafts WHERE owner_user_id = $1 ORDER BY updated_at DESC`,
    [session.userId],
  );
  return result.rows.map(mapDraft);
}

export async function getInvoiceDraft(id: string, session: AdminSession) {
  const result = await adminQuery<Row>(
    `SELECT * FROM invoice_drafts WHERE id = $1 AND owner_user_id = $2 LIMIT 1`,
    [id, session.userId],
  );
  return result.rows[0] ? mapDraft(result.rows[0]) : null;
}

export async function saveInvoiceDraft(input: { id?: string; title?: string; payload: Record<string, unknown> }, session: AdminSession) {
  const id = input.id ?? randomUUID();
  const result = await adminQuery<Row>(
    `INSERT INTO invoice_drafts (id, owner_user_id, title, payload)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (id) DO UPDATE SET title = excluded.title, payload = excluded.payload, updated_at = now()
     WHERE invoice_drafts.owner_user_id = $2
     RETURNING *`,
    [id, session.userId, input.title?.trim() || "Untitled invoice", JSON.stringify(input.payload)],
  );
  if (!result.rows[0]) throw new Error("Invoice draft not found.");
  return mapDraft(result.rows[0]);
}

export async function deleteInvoiceDraft(id: string, session: AdminSession) {
  await adminQuery(`DELETE FROM invoice_drafts WHERE id = $1 AND owner_user_id = $2`, [id, session.userId]);
}
