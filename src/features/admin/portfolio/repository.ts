import "server-only";

import type { QueryResultRow } from "pg";
import { PROJECTS } from "@/lib/constants";
import type { PortfolioProject, ProjectType } from "@/types/portfolio";
import { adminQuery } from "../db";
import { appendAudit } from "../repository";
import type { AdminSession } from "../types";

interface PortfolioRow extends QueryResultRow {
  id: string;
  name: string;
  project_type: string;
  category: string;
  description: string;
  image_url: string;
  image_key: string | null;
  image_mime: string | null;
  live_url: string | null;
  tags: unknown;
  year: string;
  coming_soon: boolean;
  featured: boolean;
  published: boolean;
  sort_order: number;
  created_at: Date | string;
  updated_at: Date | string;
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapProject(row: PortfolioRow): PortfolioProject {
  const imageKey = row.image_key || undefined;
  return {
    id: row.id,
    name: row.name,
    type: row.project_type as ProjectType,
    category: row.category,
    description: row.description,
    image: imageKey ? `/api/portfolio-projects/${encodeURIComponent(row.id)}/image` : row.image_url,
    imageUrl: row.image_url,
    imageKey,
    imageMime: row.image_mime || undefined,
    liveUrl: row.live_url || undefined,
    tags: parseTags(row.tags),
    year: row.year,
    comingSoon: Boolean(row.coming_soon),
    featured: Boolean(row.featured),
    published: Boolean(row.published),
    sortOrder: Number(row.sort_order),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function listPortfolioProjects(includeUnpublished = true) {
  const result = await adminQuery<PortfolioRow>(
    `SELECT * FROM portfolio_projects
     ${includeUnpublished ? "" : "WHERE published = true"}
     ORDER BY sort_order ASC, created_at ASC`,
  );
  return result.rows.map(mapProject);
}

export async function listPublishedPortfolioProjectsSafe() {
  try {
    return await listPortfolioProjects(false);
  } catch {
    // Marketing pages remain deployable before the database is configured.
    return PROJECTS.map((project, index) => ({ ...project, published: true, sortOrder: index + 1 }));
  }
}

export async function getPortfolioProject(id: string) {
  const result = await adminQuery<PortfolioRow>(
    "SELECT * FROM portfolio_projects WHERE id = $1 LIMIT 1",
    [id],
  );
  return result.rows[0] ? mapProject(result.rows[0]) : null;
}

export type PortfolioProjectInput = Omit<
  PortfolioProject,
  "image" | "imageUrl" | "imageKey" | "imageMime" | "createdAt" | "updatedAt"
> & {
  imageUrl: string;
  imageKey?: string;
  imageMime?: string;
};

export async function createPortfolioProject(input: PortfolioProjectInput, session: AdminSession) {
  const orderResult = await adminQuery<{ next_order: number }>(
    "SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM portfolio_projects",
  );
  const sortOrder = input.sortOrder ?? Number(orderResult.rows[0]?.next_order ?? 1);
  await adminQuery(
    `INSERT INTO portfolio_projects
      (id, name, project_type, category, description, image_url, image_key, image_mime,
       live_url, tags, year, coming_soon, featured, published, sort_order, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::JSONB,$11,$12,$13,$14,$15,$16)`,
    [
      input.id,
      input.name,
      input.type,
      input.category,
      input.description,
      input.imageUrl,
      input.imageKey ?? null,
      input.imageMime ?? null,
      input.liveUrl || null,
      JSON.stringify(input.tags),
      input.year,
      input.comingSoon,
      input.featured,
      input.published ?? true,
      sortOrder,
      session.userId,
    ],
  );
  await appendAudit(session, "portfolio_project.created", "portfolio_project", input.id);
  return (await getPortfolioProject(input.id))!;
}

export async function updatePortfolioProject(
  id: string,
  input: PortfolioProjectInput,
  session: AdminSession,
) {
  const existing = await getPortfolioProject(id);
  if (!existing) throw new Error("Portfolio project not found.");
  await adminQuery(
    `UPDATE portfolio_projects SET
       name=$2, project_type=$3, category=$4, description=$5, image_url=$6,
       image_key=$7, image_mime=$8, live_url=$9, tags=$10::JSONB, year=$11,
       coming_soon=$12, featured=$13, published=$14, sort_order=$15, updated_at=now()
     WHERE id=$1`,
    [
      id,
      input.name,
      input.type,
      input.category,
      input.description,
      input.imageUrl,
      input.imageKey ?? null,
      input.imageMime ?? null,
      input.liveUrl || null,
      JSON.stringify(input.tags),
      input.year,
      input.comingSoon,
      input.featured,
      input.published ?? true,
      input.sortOrder ?? existing.sortOrder ?? 0,
    ],
  );
  await appendAudit(session, "portfolio_project.updated", "portfolio_project", id);
  return { project: (await getPortfolioProject(id))!, previousImageKey: existing.imageKey };
}

export async function deletePortfolioProject(id: string, session: AdminSession) {
  const existing = await getPortfolioProject(id);
  if (!existing) return { imageKey: undefined };
  await adminQuery("DELETE FROM portfolio_projects WHERE id = $1", [id]);
  await appendAudit(session, "portfolio_project.deleted", "portfolio_project", id);
  return { imageKey: existing.imageKey };
}
