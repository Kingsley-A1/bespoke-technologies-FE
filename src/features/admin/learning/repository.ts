import "server-only";

import { randomUUID } from "node:crypto";
import { adminQuery, withAdminTransaction } from "../db";
import { hasPermission } from "../permissions";
import type { AdminSession, LearningGoal, LearningPlanStep } from "../types";

type Row = Record<string, unknown>;
const iso = (value: unknown, dateOnly = false) => value ? new Date(value as string | Date).toISOString().slice(0, dateOnly ? 10 : undefined) : undefined;

function buildPlan(startDate?: string, dueDate?: string): LearningPlanStep[] {
  const start = startDate ? new Date(startDate) : new Date();
  const due = dueDate ? new Date(dueDate) : new Date(start.getTime() + 28 * 86400000);
  const midpoint = new Date(start.getTime() + Math.max(86400000, (due.getTime() - start.getTime()) / 2));
  return [
    { title: "Orient: review outcomes and course structure", targetDate: start.toISOString().slice(0, 10), completed: false },
    { title: "Practice: apply the learning to a small work example", targetDate: midpoint.toISOString().slice(0, 10), completed: false },
    { title: "Complete: finish, reflect, and prepare certification", targetDate: due.toISOString().slice(0, 10), completed: false },
  ];
}

export async function listLearningGoals(session: AdminSession): Promise<LearningGoal[]> {
  const [goalsResult, assignmentsResult] = await Promise.all([
    adminQuery<Row>(`SELECT * FROM learning_goals ${session.role === "employee" ? "WHERE id IN (SELECT goal_id FROM learning_assignments WHERE user_id = $1)" : ""} ORDER BY updated_at DESC`, session.role === "employee" ? [session.userId] : []),
    adminQuery<Row>(`SELECT * FROM learning_assignments ${session.role === "employee" ? "WHERE user_id = $1" : ""} ORDER BY updated_at DESC`, session.role === "employee" ? [session.userId] : []),
  ]);
  return goalsResult.rows.map((row) => ({
    id: String(row.id), title: String(row.title), description: String(row.description || ""), provider: String(row.provider || ""),
    courseUrl: row.course_url ? String(row.course_url) : undefined, startDate: iso(row.start_date, true), dueDate: iso(row.due_date, true),
    state: String(row.state) as LearningGoal["state"], createdBy: String(row.created_by),
    assignments: assignmentsResult.rows.filter((item) => String(item.goal_id) === String(row.id)).map((item) => ({
      id: String(item.id), goalId: String(item.goal_id), userId: String(item.user_id), status: String(item.status) as LearningGoal["assignments"][number]["status"],
      progress: Number(item.progress), plan: Array.isArray(item.plan) ? item.plan as LearningPlanStep[] : [], certificationKey: item.certification_key ? String(item.certification_key) : undefined,
      certificationMime: item.certification_mime ? String(item.certification_mime) : undefined, certificationUploadedAt: iso(item.certification_uploaded_at),
      createdAt: iso(item.created_at)!, updatedAt: iso(item.updated_at)!,
    })),
    createdAt: iso(row.created_at)!, updatedAt: iso(row.updated_at)!,
  }));
}

export async function createLearningGoal(input: { title: string; description: string; provider: string; courseUrl?: string; startDate?: string; dueDate?: string; assigneeIds: string[] }, session: AdminSession) {
  if (!hasPermission(session.role, "learning.manage")) throw new Error("Learning management permission is required.");
  const id = randomUUID();
  const plan = buildPlan(input.startDate, input.dueDate);
  await withAdminTransaction(async (db) => {
    await db.query(`INSERT INTO learning_goals (id,title,description,provider,course_url,start_date,due_date,state,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8)`, [id, input.title, input.description || null, input.provider || null, input.courseUrl || null, input.startDate || null, input.dueDate || null, session.userId]);
    for (const userId of [...new Set(input.assigneeIds)]) await db.query(`INSERT INTO learning_assignments (goal_id,user_id,plan) VALUES ($1,$2,$3) ON CONFLICT (goal_id,user_id) DO NOTHING`, [id, userId, JSON.stringify(plan)]);
    await db.query(`INSERT INTO admin_audit_events (actor_user_id,actor_label,action,entity_type,entity_id,metadata) VALUES ($1,$2,'learning.goal.created','learning_goal',$3,$4)`, [session.userId, session.displayName, id, JSON.stringify({ assigneeCount: input.assigneeIds.length })]);
  });
  return id;
}

export async function updateLearningProgress(input: { assignmentId: string; progress: number }, session: AdminSession) {
  const canManage = hasPermission(session.role, "learning.manage");
  const status = input.progress >= 100 ? "completed" : input.progress > 0 ? "in_progress" : "not_started";
  const result = await adminQuery<{ id: string }>(`UPDATE learning_assignments SET progress=$2,status=$3,updated_at=now() WHERE id=$1 AND ($4 OR user_id=$5) RETURNING id`, [input.assignmentId, input.progress, status, canManage, session.userId]);
  if (!result.rows[0]) throw new Error("Learning assignment not found.");
}

export async function attachLearningCertification(input: { assignmentId: string; key: string; mime: string }, session: AdminSession) {
  const canManage = hasPermission(session.role, "learning.manage");
  const result = await adminQuery<{ id: string }>(`UPDATE learning_assignments SET certification_key=$2,certification_mime=$3,certification_uploaded_at=now(),progress=100,status='completed',updated_at=now() WHERE id=$1 AND ($4 OR user_id=$5) RETURNING id`, [input.assignmentId, input.key, input.mime, canManage, session.userId]);
  if (!result.rows[0]) throw new Error("Learning assignment not found.");
}
