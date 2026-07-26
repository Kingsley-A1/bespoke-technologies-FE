import "server-only";

import type { QueryResultRow } from "pg";
import { adminQuery } from "../db";
import { appendAudit } from "../repository";
import type {
  AdminSession,
  TeamCardVariant,
  TeamGroup,
  TeamMember,
  TeamMemberStatus,
} from "../types";

interface Row extends QueryResultRow {
  [key: string]: unknown;
}

function optional(value: unknown) {
  return value === null || value === undefined || value === "" ? undefined : String(value);
}

function iso(value: unknown) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function json<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function mapTeamMember(row: Row): TeamMember {
  return {
    id: String(row.id),
    slug: String(row.slug),
    fullName: String(row.full_name),
    roleTitle: String(row.role_title),
    teamGroup: String(row.team_group) as TeamGroup,
    shortBio: String(row.short_bio),
    specialties: json<string[]>(row.specialties, []).map(String),
    location: optional(row.location),
    links: json<TeamMember["links"]>(row.links, {}),
    portraitKey: optional(row.portrait_key),
    portraitMime: optional(row.portrait_mime),
    portraitAlt: String(row.portrait_alt ?? ""),
    cardVariant: String(row.card_variant) as TeamCardVariant,
    displayOrder: Number(row.display_order) || 0,
    status: String(row.status) as TeamMemberStatus,
    publishedAt: iso(row.published_at),
    createdAt: iso(row.created_at) ?? new Date().toISOString(),
    updatedAt: iso(row.updated_at) ?? new Date().toISOString(),
  };
}

export interface TeamMemberInput {
  slug: string;
  fullName: string;
  roleTitle: string;
  teamGroup: TeamGroup;
  shortBio: string;
  specialties: string[];
  location?: string;
  links: TeamMember["links"];
  portraitAlt: string;
  cardVariant: TeamCardVariant;
  displayOrder: number;
  status: TeamMemberStatus;
  portraitKey?: string;
  portraitMime?: string;
}

export async function listTeamMembers(includeUnpublished = true) {
  const result = await adminQuery<Row>(
    `SELECT * FROM team_members
     ${includeUnpublished ? "" : "WHERE status='published'"}
     ORDER BY
       CASE team_group WHEN 'leadership' THEN 0 WHEN 'product' THEN 1 WHEN 'engineering' THEN 2
         WHEN 'design' THEN 3 WHEN 'operations' THEN 4 ELSE 5 END,
       display_order, created_at`,
  );
  return result.rows.map(mapTeamMember);
}

export async function listPublishedTeamMembersSafe() {
  try {
    return await listTeamMembers(false);
  } catch {
    return [] as TeamMember[];
  }
}

export async function getTeamMember(id: string) {
  const result = await adminQuery<Row>("SELECT * FROM team_members WHERE id=$1 LIMIT 1", [id]);
  return result.rows[0] ? mapTeamMember(result.rows[0]) : null;
}

export async function createTeamMember(input: TeamMemberInput, session: AdminSession) {
  const result = await adminQuery<Row>(
    `INSERT INTO team_members
      (slug, full_name, role_title, team_group, short_bio, specialties, location, links,
       portrait_key, portrait_mime, portrait_alt, card_variant, display_order, status, published_at, created_by)
     VALUES ($1,$2,$3,$4,$5,$6::JSONB,$7,$8::JSONB,$9,$10,$11,$12,$13,$14,
       CASE WHEN $14='published' THEN now() ELSE NULL END,$15)
     RETURNING *`,
    [
      input.slug,
      input.fullName,
      input.roleTitle,
      input.teamGroup,
      input.shortBio,
      JSON.stringify(input.specialties),
      input.location || null,
      JSON.stringify(input.links),
      input.portraitKey || null,
      input.portraitMime || null,
      input.portraitAlt,
      input.cardVariant,
      input.displayOrder,
      input.status,
      session.userId,
    ],
  );
  const member = mapTeamMember(result.rows[0]);
  await appendAudit(session, "team_member.created", "team_member", member.id, undefined, { status: member.status });
  return member;
}

export async function updateTeamMember(id: string, input: TeamMemberInput, session: AdminSession) {
  const existing = await getTeamMember(id);
  if (!existing) throw new Error("Team member not found.");
  const result = await adminQuery<Row>(
    `UPDATE team_members SET
       slug=$2, full_name=$3, role_title=$4, team_group=$5, short_bio=$6,
       specialties=$7::JSONB, location=$8, links=$9::JSONB, portrait_key=$10,
       portrait_mime=$11, portrait_alt=$12, card_variant=$13, display_order=$14,
       status=$15, published_at=CASE WHEN $15='published' THEN COALESCE(published_at,now()) ELSE published_at END,
       updated_at=now()
     WHERE id=$1 RETURNING *`,
    [
      id,
      input.slug,
      input.fullName,
      input.roleTitle,
      input.teamGroup,
      input.shortBio,
      JSON.stringify(input.specialties),
      input.location || null,
      JSON.stringify(input.links),
      input.portraitKey || null,
      input.portraitMime || null,
      input.portraitAlt,
      input.cardVariant,
      input.displayOrder,
      input.status,
    ],
  );
  await appendAudit(session, "team_member.updated", "team_member", id, undefined, { status: input.status });
  return { member: mapTeamMember(result.rows[0]), previousPortraitKey: existing.portraitKey };
}

export async function archiveTeamMember(id: string, session: AdminSession) {
  const result = await adminQuery<Row>(
    "UPDATE team_members SET status='archived',updated_at=now() WHERE id=$1 RETURNING *",
    [id],
  );
  if (!result.rows[0]) return null;
  await appendAudit(session, "team_member.archived", "team_member", id);
  return mapTeamMember(result.rows[0]);
}

