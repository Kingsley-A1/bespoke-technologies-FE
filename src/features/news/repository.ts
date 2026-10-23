import "server-only";

import { randomUUID } from "node:crypto";
import type { PoolClient, QueryResultRow } from "pg";
import { adminQuery, withAdminTransaction } from "@/features/admin/db";
import { appendAudit } from "@/features/admin/repository";
import type { AdminSession } from "@/features/admin/types";
import { isNewsCategory, type NewsCategory } from "./categories";
import {
  collectNewsImageIds,
  NewsContentError,
  newsDocumentText,
  newsReadingMinutes,
  normalizeNewsDocument,
  readStoredNewsDocument,
} from "./content";
import { RESERVED_NEWS_SLUGS, slugifyNewsTitle, type NewsPostInput } from "./editor-input";
import {
  deriveNewsState,
  newsPublishBlockers,
  NewsTransitionError,
  planNewsTransition,
  wasEverPublic,
  type NewsState,
  type NewsStatusCommand,
  type NewsStoredStatus,
} from "./status";
import type { NewsAsset, NewsPost, NewsPostSummary } from "./types";

export class NewsConflictError extends Error {
  constructor(message = "This post was changed somewhere else. Reload to see the latest version before saving.") {
    super(message);
    this.name = "NewsConflictError";
  }
}

export class NewsNotFoundError extends Error {
  constructor() {
    super("Post not found.");
    this.name = "NewsNotFoundError";
  }
}

export class NewsSlugTakenError extends Error {
  constructor() {
    super("Another post already uses that URL. Choose a different one.");
    this.name = "NewsSlugTakenError";
  }
}

interface Row extends QueryResultRow {
  [key: string]: unknown;
}

/** SQL predicate for posts the public may see. */
const PUBLIC_PREDICATE = "status = 'published' AND published_at <= now()";
const SUMMARY_COLUMNS = `id, slug, title, dek, category, body_text, reading_minutes, cover_asset_id, cover_alt,
  share_asset_id, seo_title, seo_description, author_name, is_featured, status, published_at, first_published_at,
  version, created_at, updated_at`;

function str(row: Row, key: string) {
  const value = row[key];
  return value === null || value === undefined || value === "" ? undefined : String(value);
}

function iso(row: Row, key: string) {
  const value = row[key];
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function mapSummary(row: Row): NewsPostSummary {
  const category = String(row.category);
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    dek: str(row, "dek"),
    category: (isNewsCategory(category) ? category : "announcements") as NewsCategory,
    bodyText: String(row.body_text ?? ""),
    readingMinutes: Number(row.reading_minutes ?? 1),
    coverAssetId: str(row, "cover_asset_id"),
    coverAlt: str(row, "cover_alt"),
    shareAssetId: str(row, "share_asset_id"),
    seoTitle: str(row, "seo_title"),
    seoDescription: str(row, "seo_description"),
    authorName: String(row.author_name),
    isFeatured: row.is_featured === true || row.is_featured === "true",
    status: String(row.status) as NewsStoredStatus,
    publishedAt: iso(row, "published_at"),
    firstPublishedAt: iso(row, "first_published_at"),
    version: Number(row.version ?? 1),
    createdAt: iso(row, "created_at") ?? new Date(0).toISOString(),
    updatedAt: iso(row, "updated_at") ?? new Date(0).toISOString(),
  };
}

function mapPost(row: Row): NewsPost {
  return { ...mapSummary(row), body: readStoredNewsDocument(row.body) };
}

function mapAsset(row: Row): NewsAsset {
  return {
    id: String(row.id),
    postId: String(row.post_id),
    purpose: String(row.purpose) as NewsAsset["purpose"],
    r2Key: String(row.r2_key),
    mime: String(row.mime),
    width: Number(row.width),
    height: Number(row.height),
    byteSize: Number(row.byte_size),
  };
}

type Queryable = Pick<PoolClient, "query">;

async function slugInUse(db: Queryable, slug: string, exceptPostId?: string) {
  const result = await db.query<{ owner: string }>(
    `SELECT id::STRING AS owner FROM news_posts WHERE slug = $1
     UNION ALL
     SELECT post_id::STRING AS owner FROM news_slug_redirects WHERE old_slug = $1`,
    [slug],
  );
  return result.rows.some((row) => row.owner !== exceptPostId);
}

async function allocateSlug(db: Queryable, title: string, exceptPostId?: string) {
  let base = slugifyNewsTitle(title) || "post";
  if (RESERVED_NEWS_SLUGS.has(base)) base = `${base}-post`;
  let candidate = base;
  for (let attempt = 2; attempt < 50; attempt += 1) {
    if (!(await slugInUse(db, candidate, exceptPostId))) return candidate;
    candidate = `${base.slice(0, 74)}-${attempt}`;
  }
  return `${base.slice(0, 70)}-${randomUUID().slice(0, 8)}`;
}

function prepareBody(rawBody: unknown) {
  const body = normalizeNewsDocument(rawBody ?? { type: "doc", content: [] });
  const bodyText = newsDocumentText(body);
  return { body, bodyText, readingMinutes: newsReadingMinutes(bodyText), imageIds: collectNewsImageIds(body) };
}

async function assertInlineImagesBelongToPost(db: Queryable, postId: string, imageIds: string[]) {
  if (!imageIds.length) return;
  const unique = [...new Set(imageIds)];
  const result = await db.query<{ id: string }>(
    "SELECT id::STRING AS id FROM news_assets WHERE post_id = $1 AND id = ANY($2::UUID[])",
    [postId, unique],
  );
  if (result.rows.length !== unique.length) {
    throw new NewsContentError("The article references an image from another post. Upload it again with Insert image.");
  }
}

// ── Admin reads ────────────────────────────────────────────────────────────

export async function getNewsPostById(id: string) {
  const result = await adminQuery<Row>("SELECT * FROM news_posts WHERE id = $1 LIMIT 1", [id]);
  return result.rows[0] ? mapPost(result.rows[0]) : null;
}

export async function listAdminNews(filter: { state?: NewsState; category?: NewsCategory; query?: string } = {}) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  if (filter.state === "scheduled") conditions.push("status = 'published' AND published_at > now()");
  else if (filter.state === "published") conditions.push(PUBLIC_PREDICATE);
  else if (filter.state) {
    values.push(filter.state);
    conditions.push(`status = $${values.length}`);
  }
  if (filter.category) {
    values.push(filter.category);
    conditions.push(`category = $${values.length}`);
  }
  if (filter.query?.trim()) {
    values.push(`%${filter.query.trim().replace(/[\\%_]/g, (match) => `\\${match}`)}%`);
    conditions.push(`(title ILIKE $${values.length} OR slug ILIKE $${values.length})`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await adminQuery<Row>(
    `SELECT ${SUMMARY_COLUMNS} FROM news_posts ${where} ORDER BY updated_at DESC LIMIT 500`,
    values,
  );
  return result.rows.map(mapSummary);
}

export async function countAdminNewsByState() {
  const result = await adminQuery<Row>(
    `SELECT
       count(*) FILTER (WHERE status = 'draft') AS draft,
       count(*) FILTER (WHERE status = 'published' AND published_at > now()) AS scheduled,
       count(*) FILTER (WHERE ${PUBLIC_PREDICATE}) AS published,
       count(*) FILTER (WHERE status = 'archived') AS archived
     FROM news_posts`,
  );
  const row = result.rows[0] ?? {};
  return {
    draft: Number(row.draft ?? 0),
    scheduled: Number(row.scheduled ?? 0),
    published: Number(row.published ?? 0),
    archived: Number(row.archived ?? 0),
  } satisfies Record<NewsState, number>;
}

// ── Admin writes ───────────────────────────────────────────────────────────

export async function createNewsPost(input: NewsPostInput, session: AdminSession) {
  const prepared = prepareBody(input.body);
  if (prepared.imageIds.length) throw new NewsContentError("Save the post before inserting images.");
  const id = randomUUID();
  const slug = await withAdminTransaction(async (client) => {
    const chosen = input.slug ?? (await allocateSlug(client, input.title));
    if (await slugInUse(client, chosen)) throw new NewsSlugTakenError();
    await client.query(
      `INSERT INTO news_posts (
        id, slug, title, dek, category, body, body_text, reading_minutes, seo_title, seo_description,
        author_name, is_featured, cover_alt, created_by, updated_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)`,
      [
        id,
        chosen,
        input.title,
        input.dek ?? null,
        input.category,
        JSON.stringify(prepared.body),
        prepared.bodyText,
        prepared.readingMinutes,
        input.seoTitle ?? null,
        input.seoDescription ?? null,
        input.authorName,
        input.isFeatured,
        input.coverAlt ?? null,
        session.userId,
      ],
    );
    return chosen;
  });
  await appendAudit(session, "news.created", "news_post", id, undefined, { slug, category: input.category });
  return (await getNewsPostById(id))!;
}

export async function updateNewsPost(id: string, input: NewsPostInput, expectedVersion: number, session: AdminSession) {
  const prepared = prepareBody(input.body);
  const slugChange = await withAdminTransaction(async (client) => {
    const current = await client.query<Row>("SELECT * FROM news_posts WHERE id = $1 FOR UPDATE", [id]);
    if (!current.rows[0]) throw new NewsNotFoundError();
    const post = mapSummary(current.rows[0]);
    if (post.version !== expectedVersion) throw new NewsConflictError();
    await assertInlineImagesBelongToPost(client, id, prepared.imageIds);

    const nextSlug =
      input.slug ?? (input.autoSlug && !wasEverPublic(post) ? await allocateSlug(client, input.title, id) : post.slug);
    let change: { from: string; to: string } | undefined;
    if (nextSlug !== post.slug) {
      if (await slugInUse(client, nextSlug, id)) throw new NewsSlugTakenError();
      // Returning to an earlier slug removes its redirect; leaving a once-public slug creates one.
      await client.query("DELETE FROM news_slug_redirects WHERE old_slug = $1 AND post_id = $2", [nextSlug, id]);
      if (wasEverPublic(post)) {
        await client.query(
          `INSERT INTO news_slug_redirects (old_slug, post_id) VALUES ($1, $2)
           ON CONFLICT (old_slug) DO UPDATE SET post_id = excluded.post_id`,
          [post.slug, id],
        );
      }
      change = { from: post.slug, to: nextSlug };
    }

    await client.query(
      `UPDATE news_posts SET
        slug = $2, title = $3, dek = $4, category = $5, body = $6, body_text = $7, reading_minutes = $8,
        seo_title = $9, seo_description = $10, author_name = $11, is_featured = $12, cover_alt = $13,
        updated_by = $14, version = version + 1, updated_at = now()
       WHERE id = $1`,
      [
        id,
        nextSlug,
        input.title,
        input.dek ?? null,
        input.category,
        JSON.stringify(prepared.body),
        prepared.bodyText,
        prepared.readingMinutes,
        input.seoTitle ?? null,
        input.seoDescription ?? null,
        input.authorName,
        input.isFeatured,
        input.coverAlt ?? null,
        session.userId,
      ],
    );
    return change;
  });
  await appendAudit(session, "news.updated", "news_post", id, undefined, slugChange ? { slugChange } : undefined);
  return (await getNewsPostById(id))!;
}

export async function changeNewsStatus(id: string, command: NewsStatusCommand, expectedVersion: number, session: AdminSession) {
  const plan = await withAdminTransaction(async (client) => {
    const current = await client.query<Row>("SELECT * FROM news_posts WHERE id = $1 FOR UPDATE", [id]);
    if (!current.rows[0]) throw new NewsNotFoundError();
    const post = mapPost(current.rows[0]);
    if (post.version !== expectedVersion) throw new NewsConflictError();
    if (command.action === "publish" || command.action === "schedule") {
      const blockers = newsPublishBlockers({
        title: post.title,
        bodyText: post.bodyText,
        hasImages: collectNewsImageIds(post.body).length > 0,
        coverAssetId: post.coverAssetId,
        shareAssetId: post.shareAssetId,
        coverAlt: post.coverAlt,
      });
      if (blockers.length) throw new NewsTransitionError(blockers.join(" "));
    }
    const next = planNewsTransition(post, command);
    const publishing = command.action === "publish" || command.action === "schedule";
    await client.query(
      `UPDATE news_posts SET status = $2, published_at = $3, first_published_at = $4,
         published_by = CASE WHEN $5 THEN $6::UUID ELSE published_by END,
         updated_by = $6, version = version + 1, updated_at = now()
       WHERE id = $1`,
      [id, next.status, next.publishedAt, next.firstPublishedAt, publishing, session.userId],
    );
    return next;
  });
  await appendAudit(session, `news.${command.action}`, "news_post", id, undefined, {
    status: plan.status,
    publishedAt: plan.publishedAt,
  });
  return (await getNewsPostById(id))!;
}

export async function insertNewsAsset(asset: Omit<NewsAsset, "id"> & { id?: string }, session: AdminSession): Promise<NewsAsset> {
  const id = asset.id ?? randomUUID();
  await adminQuery(
    `INSERT INTO news_assets (id, post_id, purpose, r2_key, mime, width, height, byte_size, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, asset.postId, asset.purpose, asset.r2Key, asset.mime, asset.width, asset.height, asset.byteSize, session.userId],
  );
  return { ...asset, id };
}

/**
 * Points the post at a new cover and share image. Returns the R2 keys of the
 * replaced assets so the caller can remove them after the database commits.
 */
export async function replaceNewsCover(
  id: string,
  cover: NewsAsset,
  share: NewsAsset,
  coverAlt: string | undefined,
  session: AdminSession,
) {
  const replacedKeys = await withAdminTransaction(async (client) => {
    const current = await client.query<Row>("SELECT cover_asset_id, share_asset_id FROM news_posts WHERE id = $1 FOR UPDATE", [
      id,
    ]);
    if (!current.rows[0]) throw new NewsNotFoundError();
    const previous = [str(current.rows[0], "cover_asset_id"), str(current.rows[0], "share_asset_id")].filter(
      (value): value is string => Boolean(value),
    );
    await client.query(
      `UPDATE news_posts SET cover_asset_id = $2, share_asset_id = $3, cover_alt = COALESCE($4, cover_alt),
         updated_by = $5, version = version + 1, updated_at = now()
       WHERE id = $1`,
      [id, cover.id, share.id, coverAlt ?? null, session.userId],
    );
    if (!previous.length) return [];
    const removed = await client.query<{ r2_key: string }>(
      "DELETE FROM news_assets WHERE post_id = $1 AND id = ANY($2::UUID[]) RETURNING r2_key",
      [id, previous],
    );
    return removed.rows.map((row) => row.r2_key);
  });
  await appendAudit(session, "news.cover.replaced", "news_post", id);
  return { post: (await getNewsPostById(id))!, replacedKeys };
}

export async function getNewsAsset(id: string) {
  const result = await adminQuery<Row>("SELECT * FROM news_assets WHERE id = $1 LIMIT 1", [id]);
  return result.rows[0] ? mapAsset(result.rows[0]) : null;
}

/** Deletes a post that is not public and returns every R2 key it owned. */
export async function deleteNewsPost(id: string, expectedVersion: number, session: AdminSession) {
  const keys = await withAdminTransaction(async (client) => {
    const current = await client.query<Row>("SELECT * FROM news_posts WHERE id = $1 FOR UPDATE", [id]);
    if (!current.rows[0]) throw new NewsNotFoundError();
    const post = mapSummary(current.rows[0]);
    if (post.version !== expectedVersion) throw new NewsConflictError();
    const state = deriveNewsState(post);
    if (state === "published" || state === "scheduled") {
      throw new NewsTransitionError("Unpublish or archive this post before deleting it.");
    }
    const assets = await client.query<{ r2_key: string }>("SELECT r2_key FROM news_assets WHERE post_id = $1", [id]);
    await client.query("DELETE FROM news_posts WHERE id = $1", [id]);
    return assets.rows.map((row) => row.r2_key);
  });
  await appendAudit(session, "news.deleted", "news_post", id);
  return keys;
}

// ── Public reads ───────────────────────────────────────────────────────────

export async function listPublicNews(options: { category?: NewsCategory; limit: number; offset?: number }) {
  const values: unknown[] = [];
  let where = PUBLIC_PREDICATE;
  if (options.category) {
    values.push(options.category);
    where += ` AND category = $${values.length}`;
  }
  const filterValues = [...values];
  values.push(options.limit, options.offset ?? 0);
  const [rows, total] = await Promise.all([
    adminQuery<Row>(
      `SELECT ${SUMMARY_COLUMNS} FROM news_posts WHERE ${where}
       ORDER BY published_at DESC, id DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    ),
    adminQuery<{ total: string }>(`SELECT count(*) AS total FROM news_posts WHERE ${where}`, filterValues),
  ]);
  return { posts: rows.rows.map(mapSummary), total: Number(total.rows[0]?.total ?? 0) };
}

/** The newest featured post, falling back to the newest post. */
export async function getLeadNewsPost() {
  const result = await adminQuery<Row>(
    `SELECT ${SUMMARY_COLUMNS} FROM news_posts WHERE ${PUBLIC_PREDICATE}
     ORDER BY is_featured DESC, published_at DESC LIMIT 1`,
  );
  return result.rows[0] ? mapSummary(result.rows[0]) : null;
}

export type PublicNewsLookup = { kind: "post"; post: NewsPost } | { kind: "redirect"; slug: string } | null;

export async function getPublicNewsBySlug(slug: string): Promise<PublicNewsLookup> {
  const result = await adminQuery<Row>(`SELECT * FROM news_posts WHERE slug = $1 AND ${PUBLIC_PREDICATE} LIMIT 1`, [slug]);
  if (result.rows[0]) return { kind: "post", post: mapPost(result.rows[0]) };
  const redirect = await adminQuery<{ slug: string }>(
    `SELECT p.slug FROM news_slug_redirects r JOIN news_posts p ON p.id = r.post_id
     WHERE r.old_slug = $1 AND p.status = 'published' AND p.published_at <= now() LIMIT 1`,
    [slug],
  );
  return redirect.rows[0] ? { kind: "redirect", slug: redirect.rows[0].slug } : null;
}

export async function listRelatedNews(post: Pick<NewsPost, "id" | "category">, limit = 3) {
  const result = await adminQuery<Row>(
    `SELECT ${SUMMARY_COLUMNS} FROM news_posts WHERE ${PUBLIC_PREDICATE} AND id <> $1
     ORDER BY (category = $2) DESC, published_at DESC LIMIT $3`,
    [post.id, post.category, limit],
  );
  return result.rows.map(mapSummary);
}

export async function listPublicNewsForFeed(limit = 30) {
  return (await listPublicNews({ limit })).posts;
}

export async function listPublicNewsForSitemap() {
  const result = await adminQuery<Row>(
    `SELECT slug, category, published_at, updated_at FROM news_posts WHERE ${PUBLIC_PREDICATE}
     ORDER BY published_at DESC LIMIT 5000`,
  );
  return result.rows.map((row) => ({
    slug: String(row.slug),
    category: String(row.category),
    publishedAt: iso(row, "published_at")!,
    updatedAt: iso(row, "updated_at")!,
  }));
}

/** Homepage read: a database problem hides the section rather than breaking the home page. */
export async function listLatestNewsSafe(limit = 3) {
  try {
    return (await listPublicNews({ limit })).posts;
  } catch {
    return [];
  }
}
