import "server-only";

import { adminQuery } from "../db";
import { appendAudit, getAdminSnapshot } from "../repository";
import type { AdminSession, CommercialMode, Project } from "../types";

export interface ProjectCompletionInput {
  projectType: string;
  description: string;
  startDate: string;
  completedAt: string;
  portfolioProjectId?: string;
  finalInvoiceId?: string;
  commercialMode: CommercialMode;
  showValuePublicly: boolean;
  valueLabel?: string;
  valueNote?: string;
  projectLogoKey?: string;
  projectLogoMime?: string;
}

export async function updateProjectCompletion(id: string, input: ProjectCompletionInput, session: AdminSession) {
  const snapshot = await getAdminSnapshot();
  const project = snapshot.projects.find((candidate) => candidate.id === id);
  if (!project) throw new Error("Project not found.");
  if (project.startDate && input.completedAt < project.startDate) throw new Error("Completion date cannot be before the project start date.");
  const invoice = input.finalInvoiceId ? snapshot.documents.find((candidate) => candidate.id === input.finalInvoiceId) : undefined;
  if (input.finalInvoiceId && (!invoice || invoice.projectId !== id || !["standard", "final"].includes(invoice.type) || invoice.status === "voided")) {
    throw new Error("Choose a valid standard or final invoice linked to this project.");
  }
  if (input.commercialMode === "paid" && (!invoice || invoice.status !== "paid")) {
    throw new Error("Paid ownership certificates require a paid final standard invoice.");
  }
  if (input.portfolioProjectId) {
    const linked = snapshot.projects.find((candidate) => candidate.id !== id && candidate.portfolioProjectId === input.portfolioProjectId);
    if (linked) throw new Error("That public portfolio entry is already linked to another delivery project.");
  }
  const result = await adminQuery<{ id: string }>(
    `UPDATE projects SET
       status='completed', health='on_track', project_type=$2, summary=$3, start_date=$4, completed_at=$5,
       portfolio_project_id=$6, final_invoice_id=$7, commercial_mode=$8,
       show_value_publicly=$9, value_note=$10, project_logo_key=$11,
       project_logo_mime=$12, value_label=$13, updated_at=now()
     WHERE id=$1 RETURNING id`,
    [
      id,
      input.projectType,
      input.description,
      input.startDate,
      input.completedAt,
      input.portfolioProjectId || null,
      input.finalInvoiceId || null,
      input.commercialMode,
      input.showValuePublicly,
      input.valueNote || null,
      input.projectLogoKey || project.projectLogoKey || null,
      input.projectLogoMime || project.projectLogoMime || null,
      input.valueLabel || null,
    ],
  );
  if (!result.rows[0]) throw new Error("Project not found.");
  await appendAudit(session, "project.completion_recorded", "project", id, undefined, {
    completedAt: input.completedAt,
    commercialMode: input.commercialMode,
    finalInvoiceId: input.finalInvoiceId,
  });
  return (await getAdminSnapshot()).projects.find((candidate) => candidate.id === id) as Project;
}
