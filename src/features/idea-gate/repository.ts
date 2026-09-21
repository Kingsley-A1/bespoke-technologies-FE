import "server-only";

import { randomUUID } from "node:crypto";
import type { PoolClient, QueryResultRow } from "pg";
import { adminQuery, withAdminTransaction } from "@/features/admin/db";
import type { AdminSession } from "@/features/admin/types";
import {
  IDEA_GATE_DEFINITION_VERSION,
  IDEA_GATE_QUESTIONS,
  IDEA_GATE_SCORING_VERSION,
  ideaGateById,
} from "./definition";
import { buildIdeaGateAnalysis } from "./analysis";
import { computeIdeaGateResult } from "./scoring";
import type {
  IdeaGateAnalysis,
  IdeaGateAnalysisSource,
  IdeaGateAnswers,
  IdeaGateDecision,
  IdeaGateManagementState,
  IdeaGateNote,
  IdeaGateRecord,
  IdeaGateResult,
  IdeaGateScore,
  IdeaGateStatus,
  IdeaGateSummary,
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
  return text(row, key) || undefined;
}

function number(row: Row, key: string) {
  return Number(value(row, key) ?? 0);
}

function optionalNumber(row: Row, key: string) {
  return value(row, key) === null || value(row, key) === undefined
    ? undefined
    : Number(value(row, key));
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

function mapSummary(row: Row): IdeaGateSummary {
  return {
    id: text(row, "id"),
    ideaTitle: text(row, "idea_title"),
    ideaStage: text(row, "idea_stage"),
    ownerRole: text(row, "owner_role"),
    contactName: optionalText(row, "contact_name"),
    email: optionalText(row, "email"),
    phone: optionalText(row, "phone"),
    contactConsent: bool(row, "contact_consent"),
    status: text(row, "status") as IdeaGateStatus,
    managementState: text(row, "management_state") as IdeaGateManagementState,
    progressCount: number(row, "progress_count"),
    totalScore: optionalNumber(row, "total_score"),
    gatesPassed: optionalNumber(row, "gates_passed"),
    decision: optionalText(row, "decision") as IdeaGateDecision | undefined,
    shareToken: optionalText(row, "share_token"),
    leadId: optionalText(row, "lead_id"),
    ownerUserId: optionalText(row, "owner_user_id"),
    lastActivityAt: iso(row, "last_activity_at") ?? new Date().toISOString(),
    completedAt: iso(row, "completed_at"),
    createdAt: iso(row, "created_at") ?? new Date().toISOString(),
  };
}

function mapRecord(row: Row, answers: IdeaGateAnswers): IdeaGateRecord {
  const analysis = json<IdeaGateAnalysis | undefined>(row, "analysis_snapshot", undefined);
  return {
    ...mapSummary(row),
    ideaSummary: text(row, "idea_summary"),
    shareIdeaTitle: bool(row, "share_idea_title"),
    definitionVersion: text(row, "definition_version"),
    scoringVersion: text(row, "scoring_version"),
    result: json<IdeaGateResult | undefined>(row, "result_snapshot", undefined),
    analysis: analysis
      ? { ...analysis, source: text(row, "analysis_source") as IdeaGateAnalysisSource }
      : undefined,
    source: text(row, "source"),
    attribution: json<Record<string, string> | undefined>(row, "attribution", undefined),
    startedAt: iso(row, "started_at") ?? new Date().toISOString(),
    updatedAt: iso(row, "updated_at") ?? new Date().toISOString(),
    answers,
  };
}

function mapAnswerRows(rows: Row[]): IdeaGateAnswers {
  return Object.fromEntries(
    rows.map((row) => [
      text(row, "gate_id"),
      {
        score: number(row, "score") as IdeaGateScore,
        optionIndex: number(row, "option_index"),
        evidence: text(row, "evidence"),
      },
    ]),
  ) as IdeaGateAnswers;
}

async function answersForAssessment(id: string) {
  const result = await adminQuery<Row>(
    "SELECT gate_id, score, option_index, evidence FROM idea_execution_gate_answers WHERE gate_assessment_id=$1",
    [id],
  );
  return mapAnswerRows(result.rows);
}

export async function createIdeaGate(input: {
  ideaTitle: string;
  ideaSummary: string;
  ideaStage: string;
  ownerRole: string;
  source: string;
  attribution: Record<string, string>;
  resumeTokenHash: string;
}) {
  const result = await adminQuery<Row>(
    `INSERT INTO idea_execution_gates (
      idea_title, idea_summary, idea_stage, owner_role,
      definition_version, scoring_version, source, attribution, resume_token_hash
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [
      input.ideaTitle,
      input.ideaSummary,
      input.ideaStage,
      input.ownerRole,
      IDEA_GATE_DEFINITION_VERSION,
      IDEA_GATE_SCORING_VERSION,
      input.source,
      JSON.stringify(input.attribution),
      input.resumeTokenHash,
    ],
  );
  const row = result.rows[0];
  await adminQuery(
    "INSERT INTO idea_execution_gate_events (gate_assessment_id,event_type) VALUES ($1,'started')",
    [text(row, "id")],
  );
  return mapRecord(row, {});
}

export async function getIdeaGateForResume(id: string, resumeTokenHash: string) {
  const result = await adminQuery<Row>(
    "SELECT * FROM idea_execution_gates WHERE id=$1 AND resume_token_hash=$2 LIMIT 1",
    [id, resumeTokenHash],
  );
  const row = result.rows[0];
  if (!row) return null;
  return mapRecord(row, await answersForAssessment(id));
}

export async function saveIdeaGateAnswer(
  id: string,
  resumeTokenHash: string,
  gateId: string,
  optionIndex: number,
  evidence: string,
) {
  const gate = ideaGateById(gateId);
  const option = gate?.options[optionIndex];
  if (!gate || !option) throw new Error("Invalid gate answer.");

  await withAdminTransaction(async (db) => {
    const assessment = await db.query<Row>(
      "SELECT status FROM idea_execution_gates WHERE id=$1 AND resume_token_hash=$2 FOR UPDATE",
      [id, resumeTokenHash],
    );
    const status = text(assessment.rows[0] ?? {}, "status");
    if (!status) throw new Error("Assessment session not found.");
    if (status === "completed" || status === "archived") {
      throw new Error("Completed assessments are read-only.");
    }
    await db.query(
      `INSERT INTO idea_execution_gate_answers (
        gate_assessment_id, gate_id, option_index, score, evidence, answer_snapshot
      ) VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (gate_assessment_id, gate_id) DO UPDATE SET
        option_index=excluded.option_index,
        score=excluded.score,
        evidence=excluded.evidence,
        answer_snapshot=excluded.answer_snapshot,
        answered_at=now(),
        updated_at=now()`,
      [id, gate.id, optionIndex, option.score, evidence, JSON.stringify(option)],
    );
    const countResult = await db.query<{ count: string }>(
      "SELECT count(*)::STRING AS count FROM idea_execution_gate_answers WHERE gate_assessment_id=$1",
      [id],
    );
    const count = Number(countResult.rows[0]?.count ?? 0);
    await db.query(
      `UPDATE idea_execution_gates SET progress_count=$2,
       status=CASE WHEN $2 > 0 THEN 'in_progress' ELSE 'started' END,
       last_activity_at=now(), updated_at=now()
       WHERE id=$1`,
      [id, count],
    );
  });
  return getIdeaGateForResume(id, resumeTokenHash);
}

/**
 * Completion is two explicit phases: the score and decision are computed and
 * stored from the answers alone, then the narrative is generated. If the
 * narrative generation fails the stored result is still correct and complete.
 */
export async function completeIdeaGate(
  id: string,
  resumeTokenHash: string,
  shareToken: string,
) {
  const prepared = await withAdminTransaction(async (db) => {
    const assessmentResult = await db.query<Row>(
      "SELECT * FROM idea_execution_gates WHERE id=$1 AND resume_token_hash=$2 FOR UPDATE",
      [id, resumeTokenHash],
    );
    const assessment = assessmentResult.rows[0];
    if (!assessment) throw new Error("Assessment session not found.");
    if (text(assessment, "status") === "archived") {
      throw new Error("This assessment is archived.");
    }
    const answerResult = await db.query<Row>(
      "SELECT gate_id, score, option_index, evidence FROM idea_execution_gate_answers WHERE gate_assessment_id=$1",
      [id],
    );
    const answers = mapAnswerRows(answerResult.rows);
    if (text(assessment, "status") === "completed") {
      return { row: assessment, answers, alreadyComplete: true };
    }
    const result = computeIdeaGateResult(answers);
    const updated = await db.query<Row>(
      `UPDATE idea_execution_gates SET status='completed', progress_count=$2,
       total_score=$3, gates_passed=$4, decision=$5, result_snapshot=$6,
       share_token=COALESCE(share_token,$7), completed_at=COALESCE(completed_at,now()),
       last_activity_at=now(), updated_at=now()
       WHERE id=$1 RETURNING *`,
      [
        id,
        IDEA_GATE_QUESTIONS.length,
        result.totalScore,
        result.gatesPassed,
        result.decision,
        JSON.stringify(result),
        shareToken,
      ],
    );
    await db.query(
      "INSERT INTO idea_execution_gate_events (gate_assessment_id,event_type,metadata) VALUES ($1,'completed',$2)",
      [
        id,
        JSON.stringify({
          totalScore: result.totalScore,
          gatesPassed: result.gatesPassed,
          decision: result.decision,
        }),
      ],
    );
    return { row: updated.rows[0], answers, alreadyComplete: false };
  });

  if (prepared.alreadyComplete) return mapRecord(prepared.row, prepared.answers);

  const record = mapRecord(prepared.row, prepared.answers);
  if (!record.result) throw new Error("The completed result could not be created.");

  const analysis = await buildIdeaGateAnalysis(record.result, {
    ideaTitle: record.ideaTitle,
    ideaSummary: record.ideaSummary,
    ideaStage: record.ideaStage,
  });
  const stored = await adminQuery<Row>(
    `UPDATE idea_execution_gates SET analysis_snapshot=$2, analysis_source=$3, updated_at=now()
     WHERE id=$1 RETURNING *`,
    [id, JSON.stringify(analysis), analysis.source],
  );
  await adminQuery(
    "INSERT INTO idea_execution_gate_events (gate_assessment_id,event_type,metadata) VALUES ($1,'analysis.generated',$2)",
    [id, JSON.stringify({ source: analysis.source })],
  );
  return mapRecord(stored.rows[0] ?? prepared.row, prepared.answers);
}

export async function saveIdeaGateContact(
  id: string,
  resumeTokenHash: string,
  input: {
    contactName: string;
    email: string;
    phone: string;
    contactConsent: boolean;
    shareIdeaTitle: boolean;
  },
) {
  const result = await adminQuery<Row>(
    `UPDATE idea_execution_gates SET
       contact_name=$3, email=$4, phone=$5, contact_consent=$6, share_idea_title=$7,
       last_activity_at=now(), updated_at=now()
     WHERE id=$1 AND resume_token_hash=$2 RETURNING *`,
    [
      id,
      resumeTokenHash,
      input.contactName || null,
      input.email || null,
      input.phone || null,
      input.contactConsent,
      input.shareIdeaTitle,
    ],
  );
  const row = result.rows[0];
  if (!row) return null;
  await adminQuery(
    "INSERT INTO idea_execution_gate_events (gate_assessment_id,event_type) VALUES ($1,'contact.saved')",
    [id],
  );
  return mapRecord(row, await answersForAssessment(id));
}

export async function getSharedIdeaGate(shareToken: string) {
  const result = await adminQuery<Row>(
    "SELECT * FROM idea_execution_gates WHERE share_token=$1 AND status='completed' LIMIT 1",
    [shareToken],
  );
  const row = result.rows[0];
  if (!row) return null;
  return mapRecord(row, await answersForAssessment(text(row, "id")));
}

export async function recordIdeaGateShareView(id: string) {
  await adminQuery(
    "INSERT INTO idea_execution_gate_events (gate_assessment_id,event_type) VALUES ($1,'report.viewed')",
    [id],
  );
}

export async function listIdeaGates(input: {
  status?: string;
  managementState?: string;
  decision?: string;
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
  if (input.decision && ["green", "amber", "red"].includes(input.decision)) {
    values.push(input.decision);
    where.push(`decision=$${values.length}`);
  }
  if (input.query?.trim()) {
    values.push(`%${input.query.trim()}%`);
    where.push(
      `(idea_title ILIKE $${values.length} OR contact_name ILIKE $${values.length} OR email ILIKE $${values.length} OR phone ILIKE $${values.length})`,
    );
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const countResult = await adminQuery<{ count: string }>(
    `SELECT count(*)::STRING AS count FROM idea_execution_gates ${clause}`,
    values,
  );
  values.push(pageSize, (page - 1) * pageSize);
  const result = await adminQuery<Row>(
    `SELECT * FROM idea_execution_gates ${clause}
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

export async function getIdeaGateMetrics() {
  const result = await adminQuery<Row>(
    `SELECT
      count(*)::STRING AS total,
      count(*) FILTER (WHERE status IN ('started','in_progress'))::STRING AS incomplete,
      count(*) FILTER (WHERE status='completed')::STRING AS completed,
      count(*) FILTER (WHERE decision='green')::STRING AS green,
      count(*) FILTER (WHERE decision='amber')::STRING AS amber,
      count(*) FILTER (WHERE decision='red')::STRING AS red,
      count(*) FILTER (WHERE management_state='converted')::STRING AS converted
     FROM idea_execution_gates`,
  );
  const row = result.rows[0] ?? {};
  const total = number(row, "total");
  const completed = number(row, "completed");
  return {
    total,
    incomplete: number(row, "incomplete"),
    completed,
    green: number(row, "green"),
    amber: number(row, "amber"),
    red: number(row, "red"),
    converted: number(row, "converted"),
    completionRate: total ? Math.round((completed / total) * 100) : 0,
  };
}

function csvCell(input: unknown) {
  const raw = String(input ?? "");
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function exportIdeaGatesCsv() {
  const result = await adminQuery<Row>(
    `SELECT id,idea_title,idea_stage,owner_role,contact_name,email,phone,contact_consent,
      status,management_state,progress_count,total_score,gates_passed,decision,
      analysis_source,source,started_at,last_activity_at,completed_at,lead_id
     FROM idea_execution_gates ORDER BY created_at DESC LIMIT 5000`,
  );
  const headers = [
    "ID",
    "Idea",
    "Stage",
    "Submitted by",
    "Contact name",
    "Email",
    "Phone",
    "Contact consent",
    "Status",
    "Management state",
    "Progress",
    "Score",
    "Gates passed",
    "Decision",
    "Analysis source",
    "Source",
    "Started",
    "Last activity",
    "Completed",
    "Lead ID",
  ];
  const rows = result.rows.map((row) => [
    text(row, "id"),
    text(row, "idea_title"),
    text(row, "idea_stage"),
    text(row, "owner_role"),
    text(row, "contact_name"),
    text(row, "email"),
    text(row, "phone"),
    bool(row, "contact_consent"),
    text(row, "status"),
    text(row, "management_state"),
    `${number(row, "progress_count")}/${IDEA_GATE_QUESTIONS.length}`,
    value(row, "total_score") === null ? "" : `${number(row, "total_score")}/20`,
    value(row, "gates_passed") ?? "",
    text(row, "decision"),
    text(row, "analysis_source"),
    text(row, "source"),
    iso(row, "started_at"),
    iso(row, "last_activity_at"),
    iso(row, "completed_at"),
    text(row, "lead_id"),
  ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export async function getIdeaGateAdminDetail(id: string) {
  const result = await adminQuery<Row>(
    "SELECT * FROM idea_execution_gates WHERE id=$1 LIMIT 1",
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;
  const [answers, notesResult, eventsResult] = await Promise.all([
    answersForAssessment(id),
    adminQuery<Row>(
      `SELECT n.*,u.display_name AS actor_label FROM idea_execution_gate_notes n
       JOIN admin_users u ON u.id=n.actor_user_id
       WHERE n.gate_assessment_id=$1 ORDER BY n.created_at DESC`,
      [id],
    ),
    adminQuery<Row>(
      "SELECT * FROM idea_execution_gate_events WHERE gate_assessment_id=$1 ORDER BY created_at DESC LIMIT 200",
      [id],
    ),
  ]);
  const notes: IdeaGateNote[] = notesResult.rows.map((note) => ({
    id: text(note, "id"),
    gateId: text(note, "gate_assessment_id"),
    actorUserId: text(note, "actor_user_id"),
    actorLabel: text(note, "actor_label"),
    body: text(note, "body"),
    createdAt: iso(note, "created_at") ?? new Date().toISOString(),
  }));
  return {
    assessment: mapRecord(row, answers),
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
    ) VALUES ($1,$2,$3,'idea_execution_gate',$4,$5)`,
    [
      session.userId,
      session.displayName,
      action,
      entityId,
      metadata ? JSON.stringify(metadata) : null,
    ],
  );
}

export async function manageIdeaGate(
  id: string,
  managementState: IdeaGateManagementState,
  ownerUserId: string | undefined,
  session: AdminSession,
) {
  await withAdminTransaction(async (db) => {
    const result = await db.query<Row>(
      `UPDATE idea_execution_gates SET management_state=$2,owner_user_id=$3,updated_at=now()
       WHERE id=$1 AND ($2 <> 'converted' OR lead_id IS NOT NULL)
       RETURNING id`,
      [id, managementState, ownerUserId || null],
    );
    if (!result.rowCount) {
      throw new Error("An assessment can only be marked converted through CRM conversion.");
    }
    await appendAdminAudit(db, session, "idea_execution_gate.management.updated", id, {
      managementState,
      ownerUserId: ownerUserId || null,
    });
  });
}

export async function addIdeaGateNote(id: string, body: string, session: AdminSession) {
  await withAdminTransaction(async (db) => {
    await db.query(
      "INSERT INTO idea_execution_gate_notes (gate_assessment_id,actor_user_id,body) VALUES ($1,$2,$3)",
      [id, session.userId, body],
    );
    await appendAdminAudit(db, session, "idea_execution_gate.note.added", id);
  });
}

export async function convertIdeaGateToLead(id: string, session: AdminSession) {
  return withAdminTransaction(async (db) => {
    const result = await db.query<Row>(
      "SELECT * FROM idea_execution_gates WHERE id=$1 FOR UPDATE",
      [id],
    );
    const assessment = result.rows[0];
    if (!assessment) throw new Error("Idea Execution Gate assessment not found.");
    const existingLeadId = optionalText(assessment, "lead_id");
    if (existingLeadId) return existingLeadId;
    const email = optionalText(assessment, "email");
    const phone = optionalText(assessment, "phone");
    if (!email && !phone) throw new Error("Contact details are required before conversion.");
    if (!bool(assessment, "contact_consent")) {
      throw new Error("Follow-up consent is required before CRM conversion.");
    }

    const leadId = randomUUID();
    const ideaTitle = text(assessment, "idea_title");
    const contactName = optionalText(assessment, "contact_name") ?? ideaTitle;
    const totalScore = value(assessment, "total_score");
    const decision = optionalText(assessment, "decision");
    const snapshot = json<IdeaGateResult | undefined>(assessment, "result_snapshot", undefined);
    await db.query(
      `INSERT INTO leads (
        id,company_name,contact_name,email,phone,service,source,stage,
        estimated_value,currency,owner_user_id,next_action
      ) VALUES ($1,$2,$3,$4,$5,'Idea execution and product delivery','Idea Execution Gate',
        'new',0,'NGN',$6,'Review the gate result and arrange an execution conversation')`,
      [leadId, ideaTitle, contactName, email || null, phone || null, session.userId],
    );
    const gapSummary = snapshot
      ? snapshot.gaps
          .slice(0, 4)
          .map((entry) => entry.label)
          .join(", ") || "None"
      : "Assessment not completed";
    await db.query(
      `INSERT INTO lead_activities (
        lead_id,actor_user_id,activity_type,body
      ) VALUES ($1,$2,'idea_execution_gate',$3)`,
      [
        leadId,
        session.userId,
        `Idea Execution Gate: ${totalScore ?? "incomplete"}/20${decision ? ` (${decision})` : ""}. Weakest gates: ${gapSummary}. Assessment ID: ${id}.`,
      ],
    );
    await db.query(
      `UPDATE idea_execution_gates SET lead_id=$2,management_state='converted',
       owner_user_id=COALESCE(owner_user_id,$3),updated_at=now() WHERE id=$1`,
      [id, leadId, session.userId],
    );
    await appendAdminAudit(db, session, "idea_execution_gate.converted", id, { leadId });
    return leadId;
  });
}

export async function revokeIdeaGateShare(id: string, session: AdminSession) {
  await withAdminTransaction(async (db) => {
    await db.query(
      "UPDATE idea_execution_gates SET share_token=NULL,updated_at=now() WHERE id=$1",
      [id],
    );
    await appendAdminAudit(db, session, "idea_execution_gate.share.revoked", id);
  });
}

export async function regenerateIdeaGateShare(
  id: string,
  shareToken: string,
  session: AdminSession,
) {
  await withAdminTransaction(async (db) => {
    await db.query(
      "UPDATE idea_execution_gates SET share_token=$2,updated_at=now() WHERE id=$1 AND status='completed'",
      [id, shareToken],
    );
    await appendAdminAudit(db, session, "idea_execution_gate.share.regenerated", id);
  });
}

export async function listIdeaGateOwners() {
  const result = await adminQuery<Row>(
    "SELECT id,display_name FROM admin_users WHERE state='active' ORDER BY display_name",
  );
  return result.rows.map((row) => ({
    id: text(row, "id"),
    displayName: text(row, "display_name"),
  }));
}

export async function applyIdeaGateRetention() {
  await adminQuery(
    `DELETE FROM idea_execution_gates
     WHERE status IN ('started','in_progress')
       AND last_activity_at < now() - INTERVAL '90 days'
       AND lead_id IS NULL`,
  );
  await adminQuery(
    `UPDATE idea_execution_gates SET
       contact_name=NULL,email=NULL,phone=NULL,contact_consent=false,
       resume_token_hash=concat('retained-',id::STRING),
       share_token=NULL,attribution=NULL,updated_at=now()
     WHERE status IN ('completed','archived')
       AND completed_at < now() - INTERVAL '24 months'
       AND lead_id IS NULL
       AND email IS NOT NULL`,
  );
  await adminQuery(
    "DELETE FROM idea_execution_gate_submission_attempts WHERE attempted_at < now() - INTERVAL '7 days'",
  );
}
