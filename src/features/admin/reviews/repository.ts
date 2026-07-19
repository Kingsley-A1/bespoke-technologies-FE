import "server-only";

import type { QueryResultRow } from "pg";
import { adminQuery } from "../db";
import { appendAudit } from "../repository";
import type { AdminSession, Review, ReviewStatus } from "../types";

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

function mapReview(row: Row): Review {
  return {
    id: String(row.id),
    reviewerName: String(row.reviewer_name),
    projectName: String(row.project_name),
    projectUrl: str(row, "project_url"),
    body: String(row.body),
    rating: Number(row.rating),
    logoKey: str(row, "logo_key"),
    logoMime: str(row, "logo_mime"),
    status: String(row.status) as ReviewStatus,
    publishedAt: iso(row, "published_at"),
    createdAt: iso(row, "created_at") ?? new Date().toISOString(),
    updatedAt: iso(row, "updated_at") ?? new Date().toISOString(),
  };
}

const SELECT_COLUMNS =
  "id, reviewer_name, project_name, project_url, body, rating, logo_key, logo_mime, status, published_at, created_at, updated_at";

/** Public submission — always lands as 'pending' until an admin publishes it. */
export async function createReviewSubmission(input: {
  reviewerName: string;
  projectName: string;
  projectUrl?: string;
  body: string;
  rating: number;
}) {
  const result = await adminQuery<Row>(
    `INSERT INTO reviews (reviewer_name, project_name, project_url, body, rating, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING ${SELECT_COLUMNS}`,
    [input.reviewerName, input.projectName, input.projectUrl ?? null, input.body, input.rating],
  );
  return mapReview(result.rows[0]);
}

export async function listReviews(status?: ReviewStatus) {
  const result = status
    ? await adminQuery<Row>(
        `SELECT ${SELECT_COLUMNS} FROM reviews WHERE status = $1 ORDER BY created_at DESC LIMIT 200`,
        [status],
      )
    : await adminQuery<Row>(
        `SELECT ${SELECT_COLUMNS} FROM reviews ORDER BY created_at DESC LIMIT 200`,
      );
  return result.rows.map(mapReview);
}

export async function getReviewById(id: string) {
  const result = await adminQuery<Row>(
    `SELECT ${SELECT_COLUMNS} FROM reviews WHERE id = $1`,
    [id],
  );
  return result.rows[0] ? mapReview(result.rows[0]) : null;
}

/** Public-page read; empty list when the table/database is unavailable. */
export async function listPublishedReviewsSafe(): Promise<Review[]> {
  try {
    const result = await adminQuery<Row>(
      `SELECT ${SELECT_COLUMNS} FROM reviews WHERE status = 'published' ORDER BY published_at DESC LIMIT 100`,
    );
    return result.rows.map(mapReview);
  } catch {
    return [];
  }
}

/** Public permalink read; null when unpublished or unavailable. */
export async function getPublishedReviewByIdSafe(id: string): Promise<Review | null> {
  try {
    const result = await adminQuery<Row>(
      `SELECT ${SELECT_COLUMNS} FROM reviews WHERE id = $1 AND status = 'published'`,
      [id],
    );
    return result.rows[0] ? mapReview(result.rows[0]) : null;
  } catch {
    return null;
  }
}

export async function setReviewStatus(id: string, status: ReviewStatus, session: AdminSession) {
  const result = await adminQuery<Row>(
    `UPDATE reviews SET status = $2,
       published_at = CASE WHEN $2 = 'published' THEN COALESCE(published_at, now()) ELSE published_at END,
       updated_at = now()
     WHERE id = $1
     RETURNING ${SELECT_COLUMNS}`,
    [id, status],
  );
  if (!result.rows[0]) return null;
  await appendAudit(session, "review.status.changed", "review", id, undefined, { to: status });
  return mapReview(result.rows[0]);
}

/** Admin-set project logo. Returns the replaced R2 key for cleanup. */
export async function setReviewLogo(
  id: string,
  input: { logoKey: string; logoMime: string },
  session: AdminSession,
): Promise<{ previousLogoKey?: string } | null> {
  const existing = await getReviewById(id);
  if (!existing) return null;
  await adminQuery(
    "UPDATE reviews SET logo_key = $2, logo_mime = $3, updated_at = now() WHERE id = $1",
    [id, input.logoKey, input.logoMime],
  );
  await appendAudit(session, "review.logo.updated", "review", id);
  return { previousLogoKey: existing.logoKey };
}

/** Returns the review's logo key (if any) so the caller can delete the R2 object. */
export async function deleteReview(id: string, session: AdminSession) {
  const existing = await getReviewById(id);
  if (!existing) return null;
  await adminQuery("DELETE FROM reviews WHERE id = $1", [id]);
  await appendAudit(session, "review.deleted", "review", id, undefined, {
    reviewerName: existing.reviewerName,
    projectName: existing.projectName,
  });
  return { logoKey: existing.logoKey };
}
