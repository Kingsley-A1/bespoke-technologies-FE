import "server-only";

import { randomUUID } from "node:crypto";
import type { QueryResultRow } from "pg";
import { adminQuery } from "../db";
import { appendAudit } from "../repository";
import type {
  AdminSession,
  CurrencyCode,
  Publication,
  PublicationCardVariant,
  PublicationKind,
  PublicationStatus,
} from "../types";

interface Row extends QueryResultRow {
  [key: string]: unknown;
}

function str(row: Row, key: string) {
  const value = row[key];
  return value === null || value === undefined ? undefined : String(value);
}

function iso(row: Row, key: string) {
  const value = row[key];
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function mapPublication(row: Row): Publication {
  const priceRaw = row.price_amount;
  const priceAmount = priceRaw === null || priceRaw === undefined ? undefined : Number(priceRaw);
  return {
    id: String(row.id),
    kind: String(row.kind) as PublicationKind,
    title: String(row.title),
    slug: String(row.slug),
    summary: str(row, "summary"),
    coverKey: str(row, "cover_key"),
    coverUrl: str(row, "cover_url"),
    documentKey: str(row, "document_key"),
    documentMime: String(row.document_mime ?? "application/pdf"),
    pageCount: row.page_count === null || row.page_count === undefined ? undefined : Number(row.page_count),
    clientLabel: str(row, "client_label"),
    projectLabel: str(row, "project_label"),
    authorLabel: str(row, "author_label"),
    priceAmount,
    priceCurrency: String(row.price_currency ?? "NGN") as CurrencyCode,
    isFree: row.is_free === true || row.is_free === "true",
    cardVariant: String(row.card_variant ?? "standard") as PublicationCardVariant,
    status: String(row.status) as PublicationStatus,
    isDownloadable: row.is_downloadable === true || row.is_downloadable === "true",
    publishedAt: iso(row, "published_at"),
    createdAt: iso(row, "created_at") ?? new Date().toISOString(),
    updatedAt: iso(row, "updated_at") ?? new Date().toISOString(),
  };
}

/** Books and research are readable/downloadable by the public; handovers never are. */
export function isKindDownloadable(kind: PublicationKind) {
  return kind !== "handover";
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function listPublications(filter: { kind?: PublicationKind; status?: PublicationStatus } = {}) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filter.kind) {
    values.push(filter.kind);
    conditions.push(`kind = $${values.length}`);
  }
  if (filter.status) {
    values.push(filter.status);
    conditions.push(`status = $${values.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await adminQuery<Row>(
    `SELECT * FROM publications ${where} ORDER BY created_at DESC`,
    values,
  );
  return result.rows.map(mapPublication);
}

export async function getPublicationById(id: string) {
  const result = await adminQuery<Row>("SELECT * FROM publications WHERE id = $1 LIMIT 1", [id]);
  return result.rows[0] ? mapPublication(result.rows[0]) : null;
}

export async function getPublicationBySlug(slug: string) {
  const result = await adminQuery<Row>("SELECT * FROM publications WHERE slug = $1 LIMIT 1", [slug]);
  return result.rows[0] ? mapPublication(result.rows[0]) : null;
}

/** Public read: published rows only, optionally filtered by kind. */
export async function listPublishedPublications(kind?: PublicationKind) {
  return listPublications({ kind, status: "published" });
}

/**
 * Public read that never throws — returns an empty list when the database is
 * unavailable (e.g. at build time without DATABASE_URL). Public pages degrade
 * to an empty state rather than failing to render.
 */
export async function listPublishedPublicationsSafe(kind?: PublicationKind) {
  try {
    return await listPublishedPublications(kind);
  } catch {
    return [];
  }
}

export async function getPublishedPublicationBySlugSafe(slug: string) {
  try {
    const publication = await getPublicationBySlug(slug);
    return publication && publication.status === "published" ? publication : null;
  } catch {
    return null;
  }
}

export interface CreatePublicationInput {
  kind: PublicationKind;
  title: string;
  summary?: string;
  coverKey?: string;
  coverUrl?: string;
  documentKey?: string;
  documentMime?: string;
  pageCount?: number;
  clientLabel?: string;
  projectLabel?: string;
  authorLabel?: string;
  priceAmount?: number;
  priceCurrency?: CurrencyCode;
  isFree?: boolean;
  cardVariant?: PublicationCardVariant;
  status?: PublicationStatus;
}

async function allocateSlug(title: string) {
  const base = slugify(title) || "publication";
  let candidate = base;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const existing = await adminQuery<{ id: string }>("SELECT id FROM publications WHERE slug = $1 LIMIT 1", [candidate]);
    if (existing.rowCount === 0) return candidate;
    candidate = `${base}-${attempt + 2}`;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}

export async function createPublication(input: CreatePublicationInput, session: AdminSession) {
  const id = randomUUID();
  const slug = await allocateSlug(input.title);
  const isDownloadable = isKindDownloadable(input.kind);
  const status = input.status ?? "draft";
  const isFree = input.kind === "book" ? input.isFree ?? true : true;
  const priceAmount = input.kind === "book" && !isFree ? input.priceAmount ?? null : null;

  await adminQuery(
    `INSERT INTO publications (
      id, kind, title, slug, summary, cover_key, cover_url, document_key, document_mime, page_count,
      client_label, project_label, author_label, price_amount, price_currency, is_free, card_variant,
      status, is_downloadable, published_at, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [
      id,
      input.kind,
      input.title.trim(),
      slug,
      input.summary?.trim() || null,
      input.coverKey || null,
      input.coverUrl || null,
      input.documentKey || null,
      input.documentMime || "application/pdf",
      input.pageCount ?? null,
      input.clientLabel?.trim() || null,
      input.projectLabel?.trim() || null,
      input.authorLabel?.trim() || null,
      priceAmount,
      input.priceCurrency || "NGN",
      isFree,
      input.cardVariant || "standard",
      status,
      isDownloadable,
      status === "published" ? new Date().toISOString() : null,
      session.userId,
    ],
  );
  await appendAudit(session, "publication.created", "publication", id, undefined, { kind: input.kind, slug });
  return (await getPublicationById(id))!;
}

export async function setPublicationStatus(id: string, status: PublicationStatus, session: AdminSession) {
  await adminQuery(
    `UPDATE publications SET status = $2,
       published_at = CASE WHEN $2 = 'published' AND published_at IS NULL THEN now() ELSE published_at END,
       updated_at = now()
     WHERE id = $1`,
    [id, status],
  );
  await appendAudit(session, "publication.status.changed", "publication", id, undefined, { status });
  return (await getPublicationById(id))!;
}

/** Deletes the row and returns the R2 object keys the caller should clean up. */
export async function deletePublication(id: string, session: AdminSession) {
  const existing = await getPublicationById(id);
  if (!existing) return { coverKey: undefined, documentKey: undefined };
  await adminQuery("DELETE FROM publications WHERE id = $1", [id]);
  await appendAudit(session, "publication.deleted", "publication", id, undefined, { slug: existing.slug });
  return { coverKey: existing.coverKey, documentKey: existing.documentKey };
}
