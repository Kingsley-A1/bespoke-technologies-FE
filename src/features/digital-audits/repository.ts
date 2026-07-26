import "server-only";

import { randomUUID } from "node:crypto";
import type { PoolClient, QueryResultRow } from "pg";
import { adminQuery, withAdminTransaction } from "@/features/admin/db";
import type { AdminSession } from "@/features/admin/types";
import {
  DIGITAL_AUDIT_DEFINITION_VERSION,
  DIGITAL_AUDIT_QUESTIONS,
  DIGITAL_AUDIT_SCORING_VERSION,
} from "./definition";
import { computeDigitalAuditResult } from "./scoring";
import type {
  DigitalAuditAnswers,
  DigitalAuditManagementState,
  DigitalAuditNote,
  DigitalAuditRecord,
  DigitalAuditResult,
  DigitalAuditStatus,
  DigitalAuditSummary,
  DigitalAuditTier,
} from "./types";

type Row = QueryResultRow & Record<string, unknown>;

function value(row: Row, key: string) {
  return row[key];
}

function text(row: Row, key: string) {
  const item = value(row, key);
  return item === null || item === undefined ? "" : String(item);
}

function optionalText(row: Row, key: string) {
  const item = text(row, key);
  return item || undefined;
}

function number(row: Row, key: string) {
  return Number(value(row, key) ?? 0);
}

function bool(row: Row, key: string) {
  return Boolean(value(row, key));
}

function iso(row: Row, key: string) {
  const item = value(row, key);
  if (!item) return undefined;
  return new Date(item as string | number | Date).toISOString();
}

function json<T>(row: Row, key: string, fallback: T): T {
  const item = value(row, key);
  if (item === null || item === undefined) return fallback;
  if (typeof item === "string") {
    try {
      return JSON.parse(item) as T;
    } catch {
      return fallback;
    }
  }
  return item as T;
}

function mapSummary(row: Row): DigitalAuditSummary {
  return {
    id: text(row, "id"),
    businessName: text(row, "business_name"),
    industry: text(row, "industry"),
    teamSize: text(row, "team_size"),
    email: optionalText(row, "email"),
    phone: optionalText(row, "phone"),
    contactConsent: bool(row, "contact_consent"),
    status: text(row, "status") as DigitalAuditStatus,
    managementState: text(row, "management_state") as DigitalAuditManagementState,
    progressCount: number(row, "progress_count"),
    overallScore:
      value(row, "overall_score") === null ? undefined : number(row, "overall_score"),
    tier: optionalText(row, "tier") as DigitalAuditTier | undefined,
    shareToken: optionalText(row, "share_token"),
    leadId: optionalText(row, "lead_id"),
    ownerUserId: optionalText(row, "owner_user_id"),
    lastActivityAt: iso(row, "last_activity_at") ?? new Date().toISOString(),
    completedAt: iso(row, "completed_at"),
    createdAt: iso(row, "created_at") ?? new Date().toISOString(),
  };
}

function mapRecord(row: Row, answers: DigitalAuditAnswers): DigitalAuditRecord {
  return {
    ...mapSummary(row),
    shareBusinessName: bool(row, "share_business_name"),
    definitionVersion: text(row, "definition_version"),
    scoringVersion: text(row, "scoring_version"),
    result: json<DigitalAuditResult | undefined>(row, "result_snapshot", undefined),
    shareToken: optionalText(row, "share_token"),
    source: text(row, "source"),
    attribution: json<Record<string, string> | undefined>(row, "attribution", undefined),
    startedAt: iso(row, "started_at") ?? new Date().toISOString(),
    updatedAt: iso(row, "updated_at") ?? new Date().toISOString(),
    answers,
  };
}

async function answersForAudit(auditId: string) {
  const result = await adminQuery<Row>(
    "SELECT question_id, maturity FROM digital_audit_answers WHERE audit_id=$1",
    [auditId],
  );
  return Object.fromEntries(
    result.rows.map((row) => [text(row, "question_id"), number(row, "maturity")]),
  ) as DigitalAuditAnswers;
}

export async function createDigitalAudit(input: {
  businessName: string;
  industry: string;
  teamSize: string;
  email?: string;
  phone?: string;
  contactConsent: boolean;
  shareBusinessName: boolean;
  source: string;
  attribution: Record<string, string>;
  resumeTokenHash: string;
}) {
  const result = await adminQuery<Row>(
    `INSERT INTO digital_audits (
      business_name, industry, team_size, email, phone, contact_consent,
      share_business_name, definition_version, scoring_version, source,
      attribution, resume_token_hash
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *`,
    [
      input.businessName,
      input.industry,
      input.teamSize,
      input.email || null,
      input.phone || null,
      input.contactConsent,
      input.shareBusinessName,
      DIGITAL_AUDIT_DEFINITION_VERSION,
      DIGITAL_AUDIT_SCORING_VERSION,
      input.source,
      JSON.stringify(input.attribution),
      input.resumeTokenHash,
    ],
  );
  const row = result.rows[0];
  await adminQuery(
    "INSERT INTO digital_audit_events (audit_id,event_type) VALUES ($1,'started')",
    [text(row, "id")],
  );
  return mapRecord(row, {});
}

export async function getDigitalAuditForResume(id: string, resumeTokenHash: string) {
  const result = await adminQuery<Row>(
    "SELECT * FROM digital_audits WHERE id=$1 AND resume_token_hash=$2 LIMIT 1",
    [id, resumeTokenHash],
  );
  const row = result.rows[0];
  if (!row) return null;
  return mapRecord(row, await answersForAudit(id));
}

export async function saveDigitalAuditAnswer(
  id: string,
  resumeTokenHash: string,
  questionId: string,
  optionIndex: number,
) {
  const question = DIGITAL_AUDIT_QUESTIONS.find((item) => item.id === questionId);
  const option = question?.options[optionIndex];
  if (!question || !option) throw new Error("Invalid audit answer.");

  await withAdminTransaction(async (db) => {
    const audit = await db.query<Row>(
      "SELECT status FROM digital_audits WHERE id=$1 AND resume_token_hash=$2 FOR UPDATE",
      [id, resumeTokenHash],
    );
    const status = text(audit.rows[0] ?? {}, "status");
    if (!status) throw new Error("Audit session not found.");
    if (status === "completed" || status === "archived") {
      throw new Error("Completed audits are read-only.");
    }
    await db.query(
      `INSERT INTO digital_audit_answers (
        audit_id, question_id, option_index, maturity, answer_snapshot
      ) VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (audit_id, question_id) DO UPDATE SET
        option_index=excluded.option_index,
        maturity=excluded.maturity,
        answer_snapshot=excluded.answer_snapshot,
        answered_at=now(),
        updated_at=now()`,
      [id, question.id, optionIndex, option.maturity, JSON.stringify(option)],
    );
    const countResult = await db.query<{ count: string }>(
      "SELECT count(*)::STRING AS count FROM digital_audit_answers WHERE audit_id=$1",
      [id],
    );
    const count = Number(countResult.rows[0]?.count ?? 0);
    await db.query(
      `UPDATE digital_audits SET progress_count=$2,
       status=CASE WHEN $2 > 0 THEN 'in_progress' ELSE 'started' END,
       last_activity_at=now(), updated_at=now()
       WHERE id=$1`,
      [id, count],
    );
  });
  return getDigitalAuditForResume(id, resumeTokenHash);
}

export async function completeDigitalAudit(
  id: string,
  resumeTokenHash: string,
  shareToken: string,
) {
  return withAdminTransaction(async (db) => {
    const auditResult = await db.query<Row>(
      "SELECT * FROM digital_audits WHERE id=$1 AND resume_token_hash=$2 FOR UPDATE",
      [id, resumeTokenHash],
    );
    const audit = auditResult.rows[0];
    if (!audit) throw new Error("Audit session not found.");
    if (text(audit, "status") === "archived") throw new Error("This audit is archived.");
    if (text(audit, "status") === "completed") {
      const answers = await answersForAudit(id);
      return mapRecord(audit, answers);
    }
    const answerResult = await db.query<Row>(
      "SELECT question_id, maturity FROM digital_audit_answers WHERE audit_id=$1",
      [id],
    );
    const answers = Object.fromEntries(
      answerResult.rows.map((row) => [text(row, "question_id"), number(row, "maturity")]),
    ) as DigitalAuditAnswers;
    const result = computeDigitalAuditResult(answers);
    const updated = await db.query<Row>(
      `UPDATE digital_audits SET status='completed', progress_count=6,
       overall_score=$2, tier=$3, result_snapshot=$4,
       share_token=COALESCE(share_token,$5), completed_at=COALESCE(completed_at,now()),
       last_activity_at=now(), updated_at=now()
       WHERE id=$1 RETURNING *`,
      [id, result.overall, result.tier, JSON.stringify(result), shareToken],
    );
    await db.query(
      "INSERT INTO digital_audit_events (audit_id,event_type,metadata) VALUES ($1,'completed',$2)",
      [id, JSON.stringify({ overall: result.overall, tier: result.tier })],
    );
    return mapRecord(updated.rows[0], answers);
  });
}

export async function getSharedDigitalAudit(shareToken: string) {
  const result = await adminQuery<Row>(
    "SELECT * FROM digital_audits WHERE share_token=$1 AND status='completed' LIMIT 1",
    [shareToken],
  );
  const row = result.rows[0];
  if (!row) return null;
  return mapRecord(row, await answersForAudit(text(row, "id")));
}

export async function recordDigitalAuditShareView(id: string) {
  await adminQuery(
    "INSERT INTO digital_audit_events (audit_id,event_type) VALUES ($1,'report.viewed')",
    [id],
  );
}

export async function listDigitalAudits(input: {
  status?: string;
  managementState?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 25));
  const values: unknown[] = [];
  const where: string[] = [];
  if (input.status === "incomplete") {
    where.push("status IN ('started','in_progress')");
  } else if (
    input.status &&
    ["started", "in_progress", "completed", "archived"].includes(input.status)
  ) {
    values.push(input.status);
    where.push(`status=$${values.length}`);
  }
  if (
    input.managementState &&
    ["new", "reviewed", "contacted", "converted", "closed"].includes(input.managementState)
  ) {
    values.push(input.managementState);
    where.push(`management_state=$${values.length}`);
  }
  if (input.query?.trim()) {
    values.push(`%${input.query.trim()}%`);
    where.push(
      `(business_name ILIKE $${values.length} OR email ILIKE $${values.length} OR phone ILIKE $${values.length})`,
    );
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const countResult = await adminQuery<{ count: string }>(
    `SELECT count(*)::STRING AS count FROM digital_audits ${clause}`,
    values,
  );
  values.push(pageSize, (page - 1) * pageSize);
  const result = await adminQuery<Row>(
    `SELECT * FROM digital_audits ${clause}
     ORDER BY last_activity_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  );
  return {
    items: result.rows.map(mapSummary),
    total: Number(countResult.rows[0]?.count ?? 0),
    page,
    pageSize,
  };
}

export async function getDigitalAuditMetrics() {
  const result = await adminQuery<Row>(
    `SELECT
      count(*)::STRING AS total,
      count(*) FILTER (WHERE status IN ('started','in_progress'))::STRING AS incomplete,
      count(*) FILTER (WHERE status='completed')::STRING AS completed,
      count(*) FILTER (WHERE status IN ('started','in_progress') AND last_activity_at < now() - INTERVAL '72 hours')::STRING AS stale,
      count(*) FILTER (WHERE management_state='converted')::STRING AS converted
     FROM digital_audits`,
  );
  const row = result.rows[0] ?? {};
  const total = number(row, "total");
  const completed = number(row, "completed");
  return {
    total,
    incomplete: number(row, "incomplete"),
    completed,
    stale: number(row, "stale"),
    converted: number(row, "converted"),
    completionRate: total ? Math.round((completed / total) * 100) : 0,
  };
}

export async function listDigitalAuditOwners() {
  const result = await adminQuery<Row>(
    "SELECT id,display_name FROM admin_users WHERE state='active' ORDER BY display_name",
  );
  return result.rows.map((row) => ({
    id: text(row, "id"),
    displayName: text(row, "display_name"),
  }));
}

function csvCell(input: unknown) {
  const raw = String(input ?? "");
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function exportDigitalAuditsCsv() {
  const result = await adminQuery<Row>(
    `SELECT id,business_name,industry,team_size,email,phone,contact_consent,
      status,management_state,progress_count,overall_score,tier,source,
      started_at,last_activity_at,completed_at,lead_id
     FROM digital_audits ORDER BY created_at DESC LIMIT 5000`,
  );
  const headers = [
    "ID",
    "Business",
    "Industry",
    "Team size",
    "Email",
    "Phone",
    "Contact consent",
    "Audit status",
    "Management state",
    "Progress",
    "Score",
    "Tier",
    "Source",
    "Started",
    "Last activity",
    "Completed",
    "Lead ID",
  ];
  const rows = result.rows.map((row) => [
    text(row, "id"),
    text(row, "business_name"),
    text(row, "industry"),
    text(row, "team_size"),
    text(row, "email"),
    text(row, "phone"),
    bool(row, "contact_consent"),
    text(row, "status"),
    text(row, "management_state"),
    `${number(row, "progress_count")}/6`,
    value(row, "overall_score") ?? "",
    text(row, "tier"),
    text(row, "source"),
    iso(row, "started_at"),
    iso(row, "last_activity_at"),
    iso(row, "completed_at"),
    text(row, "lead_id"),
  ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export async function getDigitalAuditAdminDetail(id: string) {
  const result = await adminQuery<Row>("SELECT * FROM digital_audits WHERE id=$1 LIMIT 1", [id]);
  const row = result.rows[0];
  if (!row) return null;
  const [answers, notesResult, eventsResult] = await Promise.all([
    answersForAudit(id),
    adminQuery<Row>(
      `SELECT n.*,u.display_name AS actor_label FROM digital_audit_notes n
       JOIN admin_users u ON u.id=n.actor_user_id
       WHERE n.audit_id=$1 ORDER BY n.created_at DESC`,
      [id],
    ),
    adminQuery<Row>(
      "SELECT * FROM digital_audit_events WHERE audit_id=$1 ORDER BY created_at DESC LIMIT 200",
      [id],
    ),
  ]);
  const notes: DigitalAuditNote[] = notesResult.rows.map((note) => ({
    id: text(note, "id"),
    auditId: text(note, "audit_id"),
    actorUserId: text(note, "actor_user_id"),
    actorLabel: text(note, "actor_label"),
    body: text(note, "body"),
    createdAt: iso(note, "created_at") ?? new Date().toISOString(),
  }));
  return {
    audit: mapRecord(row, answers),
    notes,
    events: eventsResult.rows.map((event) => ({
      id: text(event, "id"),
      type: text(event, "event_type"),
      metadata: json<Record<string, unknown>>(event, "metadata", {}),
      createdAt: iso(event, "created_at") ?? new Date().toISOString(),
    })),
  };
}

async function appendAdminAudit(
  db: PoolClient,
  session: AdminSession,
  action: string,
  entityId: string,
  metadata?: Record<string, unknown>,
) {
  await db.query(
    `INSERT INTO admin_audit_events (
      actor_user_id,actor_label,action,entity_type,entity_id,metadata
    ) VALUES ($1,$2,$3,'digital_audit',$4,$5)`,
    [session.userId, session.displayName, action, entityId, metadata ? JSON.stringify(metadata) : null],
  );
}

export async function manageDigitalAudit(
  id: string,
  managementState: DigitalAuditManagementState,
  ownerUserId: string | undefined,
  session: AdminSession,
) {
  await withAdminTransaction(async (db) => {
    const result = await db.query<Row>(
      `UPDATE digital_audits SET management_state=$2,owner_user_id=$3,updated_at=now()
       WHERE id=$1 AND ($2 <> 'converted' OR lead_id IS NOT NULL)
       RETURNING id`,
      [id, managementState, ownerUserId || null],
    );
    if (!result.rowCount) {
      throw new Error("An audit can only be marked converted through CRM conversion.");
    }
    await appendAdminAudit(db, session, "digital_audit.management.updated", id, {
      managementState,
      ownerUserId: ownerUserId || null,
    });
  });
}

export async function addDigitalAuditNote(
  id: string,
  body: string,
  session: AdminSession,
) {
  await withAdminTransaction(async (db) => {
    await db.query(
      "INSERT INTO digital_audit_notes (audit_id,actor_user_id,body) VALUES ($1,$2,$3)",
      [id, session.userId, body],
    );
    await appendAdminAudit(db, session, "digital_audit.note.added", id);
  });
}

export async function convertDigitalAuditToLead(id: string, session: AdminSession) {
  return withAdminTransaction(async (db) => {
    const result = await db.query<Row>(
      "SELECT * FROM digital_audits WHERE id=$1 FOR UPDATE",
      [id],
    );
    const audit = result.rows[0];
    if (!audit) throw new Error("Digital audit not found.");
    const existingLeadId = optionalText(audit, "lead_id");
    if (existingLeadId) return existingLeadId;
    const email = optionalText(audit, "email");
    const phone = optionalText(audit, "phone");
    if (!email && !phone) throw new Error("Contact details are required before conversion.");
    if (!bool(audit, "contact_consent")) {
      throw new Error("Follow-up consent is required before CRM conversion.");
    }

    const leadId = randomUUID();
    const score = value(audit, "overall_score");
    const tier = optionalText(audit, "tier");
    const resultSnapshot = json<DigitalAuditResult | undefined>(
      audit,
      "result_snapshot",
      undefined,
    );
    await db.query(
      `INSERT INTO leads (
        id,company_name,contact_name,email,phone,service,source,stage,
        estimated_value,currency,owner_user_id,next_action
      ) VALUES ($1,$2,$3,$4,$5,'Digital readiness roadmap','Digital Readiness Audit',
        'new',0,'NGN',$6,'Review the audit and arrange a roadmap conversation')`,
      [
        leadId,
        text(audit, "business_name"),
        text(audit, "business_name"),
        email || null,
        phone || null,
        session.userId,
      ],
    );
    const opportunitySummary = resultSnapshot
      ? resultSnapshot.weakest.map((item) => item.short).join(", ")
      : "Audit not completed";
    await db.query(
      `INSERT INTO lead_activities (
        lead_id,actor_user_id,activity_type,body
      ) VALUES ($1,$2,'digital_audit',$3)`,
      [
        leadId,
        session.userId,
        `Digital readiness audit: ${score ?? "incomplete"}/100${tier ? ` (${tier})` : ""}. Priority areas: ${opportunitySummary}. Audit ID: ${id}.`,
      ],
    );
    await db.query(
      `UPDATE digital_audits SET lead_id=$2,management_state='converted',
       owner_user_id=COALESCE(owner_user_id,$3),updated_at=now() WHERE id=$1`,
      [id, leadId, session.userId],
    );
    await appendAdminAudit(db, session, "digital_audit.converted", id, { leadId });
    return leadId;
  });
}

export async function revokeDigitalAuditShare(id: string, session: AdminSession) {
  await withAdminTransaction(async (db) => {
    await db.query("UPDATE digital_audits SET share_token=NULL,updated_at=now() WHERE id=$1", [
      id,
    ]);
    await appendAdminAudit(db, session, "digital_audit.share.revoked", id);
  });
}

export async function regenerateDigitalAuditShare(
  id: string,
  shareToken: string,
  session: AdminSession,
) {
  await withAdminTransaction(async (db) => {
    await db.query(
      "UPDATE digital_audits SET share_token=$2,updated_at=now() WHERE id=$1 AND status='completed'",
      [id, shareToken],
    );
    await appendAdminAudit(db, session, "digital_audit.share.regenerated", id);
  });
}

export async function applyDigitalAuditRetention() {
  await adminQuery(
    `DELETE FROM digital_audits
     WHERE status IN ('started','in_progress')
       AND last_activity_at < now() - INTERVAL '90 days'
       AND lead_id IS NULL`,
  );
  await adminQuery(
    `UPDATE digital_audits SET
       business_name='Deleted audit participant',
       email=NULL,phone=NULL,contact_consent=false,
       resume_token_hash=concat('retained-',id::STRING),
       share_token=NULL,attribution=NULL,updated_at=now()
     WHERE status IN ('completed','archived')
       AND completed_at < now() - INTERVAL '24 months'
       AND lead_id IS NULL
       AND business_name != 'Deleted audit participant'`,
  );
  await adminQuery(
    "DELETE FROM digital_audit_submission_attempts WHERE attempted_at < now() - INTERVAL '7 days'",
  );
}
