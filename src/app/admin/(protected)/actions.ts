"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminPermission, requireRecentAdminPermission } from "@/features/admin/access";
import { provisionEmployeeIdentity, revokeAdminSession } from "@/features/admin/auth";
import { sendEmail } from "@/lib/email/client";
import { EMAIL_ADDRESSES } from "@/lib/email/addresses";
import { employeeInvitationEmail, taskAssignmentEmail } from "@/lib/email/templates/transactional";
import { createLearningGoal, updateLearningProgress } from "@/features/admin/learning/repository";
import {
  createClientRecord,
  updateClientState,
  createLeadRecord,
  addLeadActivity,
  createProjectRecord,
  createMilestoneRecord,
  updateMilestoneState,
  updateProjectState,
  createTaskRecord,
  getAdminSnapshot,
  convertSubmissionToLead,
  convertProformaToInvoice,
  createBillingRevision,
  convertLeadToDelivery,
  recordPayment,
  reconcileOverdueDocuments,
  requestBillingApproval,
  resolveApprovalRequest,
  reversePayment,
  runRecurringSchedules,
  setAdminUserState,
  transitionBillingDocument,
  updateCompanySettings,
  updateLeadStage,
  updateRecurringScheduleState,
  updateTaskState,
  updateAssignedTaskState,
} from "@/features/admin/repository";
import type { BillingStatus, LeadStage, ProjectHealth, ProjectStatus, TaskStatus } from "@/features/admin/types";

const currencySchema = z.enum(["NGN", "USD", "GBP", "EUR"]);

export async function createClientAction(formData: FormData) {
  const session = await requireAdminPermission("crm.manage");
  const input = z.object({
    name: z.string().trim().min(2).max(160),
    contactName: z.string().trim().max(160).default(""),
    email: z.union([z.email(), z.literal("")]),
    phone: z.string().trim().max(40),
    address: z.string().trim().max(500),
    currency: currencySchema,
    paymentTermsDays: z.coerce.number().int().min(0).max(365),
  }).parse(Object.fromEntries(formData));
  await createClientRecord(input, session);
  revalidatePath("/admin");
  revalidatePath("/admin/clients");
}

export async function createLeadAction(formData: FormData) {
  const session = await requireAdminPermission("crm.manage");
  const input = z.object({
    companyName: z.string().trim().min(2).max(160),
    contactName: z.string().trim().min(2).max(160),
    email: z.union([z.email(), z.literal("")]),
    phone: z.string().trim().max(40),
    service: z.string().trim().min(2).max(180),
    source: z.string().trim().min(2).max(80),
    stage: z.enum(["new", "qualified", "discovery", "proposal", "negotiation", "won", "lost", "archived"]),
    estimatedValue: z.coerce.number().min(0).max(1_000_000_000_000),
    currency: currencySchema,
    nextAction: z.string().trim().max(240),
    nextActionAt: z.string().optional(),
  }).parse(Object.fromEntries(formData));
  await createLeadRecord(input, session);
  revalidatePath("/admin");
  revalidatePath("/admin/sales");
}

export async function updateLeadStageAction(formData: FormData) {
  const session = await requireAdminPermission("crm.manage");
  const input = z.object({ id: z.string().uuid(), stage: z.enum(["new", "qualified", "discovery", "proposal", "negotiation", "won", "lost", "archived"]), lostReason: z.string().trim().max(500).optional() }).parse(Object.fromEntries(formData));
  await updateLeadStage(input.id, input.stage as LeadStage, session, input.lostReason);
  revalidatePath("/admin/sales");
  revalidatePath("/admin");
}

export async function addLeadActivityAction(formData: FormData) {
  const session = await requireAdminPermission("crm.manage");
  const input = z.object({ id: z.string().uuid(), body: z.string().trim().min(2).max(1000) }).parse(Object.fromEntries(formData));
  await addLeadActivity(input.id, input.body, session);
  revalidatePath("/admin/sales");
}

export async function updateClientStateAction(formData: FormData) {
  const session = await requireAdminPermission("crm.manage");
  const input = z.object({ id: z.string().uuid(), state: z.enum(["active", "archived"]), reason: z.string().trim().min(5).max(500) }).parse(Object.fromEntries(formData));
  await updateClientState(input.id, input.state, session, input.reason);
  revalidatePath("/admin/clients");
}

export async function convertLeadToDeliveryAction(formData: FormData) {
  const session = await requireAdminPermission("projects.manage");
  const input = z.object({ id: z.string().uuid() }).parse(Object.fromEntries(formData));
  const { billing } = await convertLeadToDelivery(input.id, session);
  revalidatePath("/admin");
  revalidatePath("/admin/sales");
  revalidatePath("/admin/clients");
  revalidatePath("/admin/projects");
  redirect(`/admin/billing/${billing.id}`);
}

export async function updateProjectStateAction(formData: FormData) {
  const session = await requireAdminPermission("projects.manage");
  const input = z.object({ id: z.string().uuid(), status: z.enum(["planned", "active", "blocked", "review", "completed", "on_hold", "cancelled"]), health: z.enum(["on_track", "at_risk", "off_track"]) }).parse(Object.fromEntries(formData));
  await updateProjectState(input.id, input.status, input.health, session);
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
}

export async function createMilestoneAction(formData: FormData) {
  const session = await requireAdminPermission("projects.manage");
  const input = z.object({ projectId: z.string().uuid(), title: z.string().trim().min(2).max(240), ownerUserId: z.union([z.string().uuid(), z.literal("")]).optional(), dueDate: z.string().optional() }).parse(Object.fromEntries(formData));
  await createMilestoneRecord({ ...input, ownerUserId: input.ownerUserId || undefined }, session);
  revalidatePath("/admin/projects");
}

export async function updateMilestoneStateAction(formData: FormData) {
  const session = await requireAdminPermission("projects.manage");
  const input = z.object({ id: z.string().uuid(), state: z.enum(["pending", "in_progress", "completed", "blocked"]) }).parse(Object.fromEntries(formData));
  await updateMilestoneState(input.id, input.state, session);
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
}

export async function createProjectAction(formData: FormData) {
  const session = await requireAdminPermission("projects.manage");
  const input = z.object({
    clientId: z.string().uuid(),
    name: z.string().trim().min(2).max(180),
    service: z.string().trim().min(2).max(180),
    summary: z.string().trim().max(1000),
    status: z.enum(["planned", "active", "blocked", "review", "completed", "on_hold", "cancelled"]),
    health: z.enum(["on_track", "at_risk", "off_track"]),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    commercialValue: z.coerce.number().min(0).max(1_000_000_000_000),
    currency: currencySchema,
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
  }).parse(Object.fromEntries(formData));
  await createProjectRecord({ ...input, status: input.status as ProjectStatus, health: input.health as ProjectHealth }, session);
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
}

export async function createTaskAction(formData: FormData) {
  const session = await requireAdminPermission("projects.manage");
  const input = z.object({
    projectId: z.union([z.string().uuid(), z.literal("")]).optional(),
    title: z.string().trim().min(2).max(240),
    assigneeUserId: z.union([z.string().uuid(), z.literal("")]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    status: z.enum(["todo", "in_progress", "blocked", "done"]),
    dueDate: z.string().optional(),
  }).parse(Object.fromEntries(formData));
  const task = await createTaskRecord({ ...input, projectId: input.projectId || undefined, assigneeUserId: input.assigneeUserId || undefined }, session);
  const snapshot = await getAdminSnapshot();
  const assignee = snapshot.users.find((user) => user.id === task.assigneeUserId && user.state === "active");
  if (assignee) {
    const project = snapshot.projects.find((item) => item.id === task.projectId);
    const rendered = taskAssignmentEmail({ assigneeName: assignee.displayName, taskTitle: task.title, projectName: project?.name, dueDate: task.dueDate, assignedBy: session.displayName });
    await sendEmail({
      from: { address: EMAIL_ADDRESSES.noReply, name: "Bespoke Technologies" },
      to: assignee.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      replyTo: EMAIL_ADDRESSES.support,
    });
  }
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
}

export async function updateTaskStatusAction(formData: FormData) {
  const session = await requireAdminPermission("projects.manage");
  const input = z.object({ id: z.string().uuid(), status: z.enum(["todo", "in_progress", "blocked", "done"]) }).parse(Object.fromEntries(formData));
  await updateTaskState(input.id, input.status as TaskStatus, session);
  revalidatePath("/admin");
  revalidatePath("/admin/projects");
}

export async function updateMyTaskStatusAction(formData: FormData) {
  const session = await requireAdminPermission("work.view");
  const input = z.object({ id: z.string().uuid(), status: z.enum(["todo", "in_progress", "blocked", "done"]) }).parse(Object.fromEntries(formData));
  await updateAssignedTaskState(input.id, input.status, session);
  revalidatePath("/admin");
}

export async function transitionBillingAction(formData: FormData) {
  const status = String(formData.get("status"));
  const session = status === "voided" ? await requireRecentAdminPermission("billing.void") : await requireAdminPermission("billing.issue");
  const input = z.object({
    id: z.string().uuid(),
    status: z.enum(["draft", "pending_approval", "approved", "sent", "viewed", "partially_paid", "paid", "overdue", "voided", "accepted", "expired"]),
    reason: z.string().trim().max(500).default(""),
    confirmed: z.string().optional(),
  }).parse(Object.fromEntries(formData));
  if (input.status === "voided" && !input.reason) throw new Error("A void reason is required.");
  if (input.status === "sent" && input.confirmed !== "yes") throw new Error("Confirm that the invoice was actually delivered before marking it sent.");
  await transitionBillingDocument(input.id, input.status as BillingStatus, session, input.reason || undefined);
  revalidatePath("/admin");
  revalidatePath("/admin/billing");
  revalidatePath(`/admin/billing/${input.id}`);
}

export async function requestBillingApprovalAction(formData: FormData) {
  const session = await requireAdminPermission("billing.manage");
  const input = z.object({ id: z.string().uuid(), reason: z.string().trim().min(5).max(500) }).parse(Object.fromEntries(formData));
  await requestBillingApproval(input.id, input.reason, session);
  revalidatePath("/admin");
  revalidatePath(`/admin/billing/${input.id}`);
}

export async function resolveApprovalAction(formData: FormData) {
  const session = await requireRecentAdminPermission("approvals.resolve");
  const input = z.object({ id: z.string().uuid(), resolution: z.enum(["approved", "rejected"]), note: z.string().trim().min(2).max(500) }).parse(Object.fromEntries(formData));
  await resolveApprovalRequest(input.id, input.resolution, input.note, session);
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/billing");
}

export async function recordPaymentAction(formData: FormData) {
  const session = await requireAdminPermission("payments.record");
  const input = z.object({
    documentId: z.string().uuid(),
    amount: z.coerce.number().positive(),
    paidAt: z.string().min(10),
    method: z.string().trim().min(2).max(80),
    reference: z.string().trim().min(2).max(160),
    note: z.string().trim().max(500),
  }).parse(Object.fromEntries(formData));
  await recordPayment(input, session);
  revalidatePath("/admin");
  revalidatePath("/admin/billing");
  revalidatePath(`/admin/billing/${input.documentId}`);
}

export async function reversePaymentAction(formData: FormData) {
  const session = await requireRecentAdminPermission("payments.reverse");
  const input = z.object({ id: z.string().uuid(), reason: z.string().trim().min(5).max(500), documentId: z.string().uuid() }).parse(Object.fromEntries(formData));
  await reversePayment(input.id, input.reason, session);
  revalidatePath("/admin");
  revalidatePath("/admin/billing");
  revalidatePath(`/admin/billing/${input.documentId}`);
}

export async function runRecurringAction() {
  const session = await requireAdminPermission("billing.manage");
  await reconcileOverdueDocuments(session);
  await runRecurringSchedules(session);
  revalidatePath("/admin");
  revalidatePath("/admin/billing");
}

export async function updateSettingsAction(formData: FormData) {
  const session = await requireRecentAdminPermission("settings.manage");
  const input = z.object({
    name: z.string().trim().min(2).max(160),
    website: z.string().trim().min(3).max(240),
    phone: z.string().trim().min(3).max(40),
    email: z.email(),
    registrationNumber: z.string().trim().min(1).max(80),
    motto: z.string().trim().min(3).max(240),
    address: z.string().trim().max(500),
    defaultCurrency: currencySchema,
    defaultPaymentTermsDays: z.coerce.number().int().min(0).max(365),
    paymentInstructions: z.string().trim().max(1000),
    invoiceApprovalThreshold: z.coerce.number().min(0).max(1_000_000_000_000),
    reason: z.string().trim().min(5).max(500),
  }).parse(Object.fromEntries(formData));
  const { reason, ...settings } = input;
  await updateCompanySettings(settings, session, reason);
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
}

export async function setUserStateAction(formData: FormData) {
  const session = await requireRecentAdminPermission("users.manage");
  const input = z.object({ id: z.string().uuid(), state: z.enum(["invited", "active", "suspended"]), reason: z.string().trim().min(5).max(500) }).parse(Object.fromEntries(formData));
  await setAdminUserState(input.id, input.state, session, input.reason);
  revalidatePath("/admin/settings");
}

export async function createEmployeeAction(formData: FormData) {
  const session = await requireRecentAdminPermission("users.manage");
  const input = z.object({
    displayName: z.string().trim().min(2).max(120),
    emailName: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, "Use letters, numbers, dots, hyphens, or underscores."),
  }).parse(Object.fromEntries(formData));
  const invite = await provisionEmployeeIdentity(input.displayName, `${input.emailName}@bespoketech.com.ng`, session);
  const rendered = employeeInvitationEmail({ ...invite, name: invite.displayName });
  const delivery = await sendEmail({
    from: { address: EMAIL_ADDRESSES.noReply, name: "Bespoke Technologies" },
    to: invite.email,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    replyTo: EMAIL_ADDRESSES.support,
  });
  if (!delivery.ok) throw new Error(delivery.skipped
    ? "Employee identity created, but email delivery is not configured. Configure RESEND_API_KEY, then invite this employee again."
    : `Employee created, but invitation delivery failed: ${delivery.error}`);
  revalidatePath("/admin/settings");
}

export async function createLearningGoalAction(formData: FormData) {
  const session = await requireAdminPermission("learning.manage");
  const input = z.object({
    title: z.string().trim().min(3).max(180), description: z.string().trim().max(1200), provider: z.string().trim().max(180),
    courseUrl: z.union([z.url(), z.literal("")]).optional(), startDate: z.string().optional(), dueDate: z.string().optional(),
  }).parse(Object.fromEntries(formData));
  const assigneeIds = z.array(z.string().uuid()).min(1, "Choose at least one team member.").parse(formData.getAll("assigneeIds"));
  await createLearningGoal({ ...input, courseUrl: input.courseUrl || undefined, assigneeIds }, session);
  revalidatePath("/admin/learning");
}

export async function updateLearningProgressAction(formData: FormData) {
  const session = await requireAdminPermission("learning.view");
  const input = z.object({ assignmentId: z.string().uuid(), progress: z.coerce.number().int().min(0).max(100) }).parse(Object.fromEntries(formData));
  await updateLearningProgress(input, session);
  revalidatePath("/admin/learning");
  revalidatePath("/admin");
}

export async function createBillingRedirectAction() {
  await requireAdminPermission("billing.manage");
  redirect("/admin/billing/new");
}

export async function convertSubmissionAction(formData: FormData) {
  const session = await requireAdminPermission("crm.manage");
  const input = z.object({ id: z.string().uuid() }).parse(Object.fromEntries(formData));
  await convertSubmissionToLead(input.id, session);
  revalidatePath("/admin/inbox");
  revalidatePath("/admin/sales");
  revalidatePath("/admin");
}

export async function revokeSessionAction(formData: FormData) {
  const session = await requireRecentAdminPermission("users.manage");
  const input = z.object({ id: z.string().uuid(), reason: z.string().trim().min(5).max(500) }).parse(Object.fromEntries(formData));
  await revokeAdminSession(input.id, session, input.reason);
  revalidatePath("/admin/settings");
}

export async function convertProformaAction(formData: FormData) {
  const session = await requireAdminPermission("billing.manage");
  const input = z.object({ id: z.string().uuid() }).parse(Object.fromEntries(formData));
  const document = await convertProformaToInvoice(input.id, session);
  revalidatePath("/admin");
  revalidatePath("/admin/billing");
  redirect(`/admin/billing/${document.id}`);
}

export async function createBillingRevisionAction(formData: FormData) {
  const session = await requireAdminPermission("billing.manage");
  const input = z.object({ id: z.string().uuid() }).parse(Object.fromEntries(formData));
  const document = await createBillingRevision(input.id, session);
  revalidatePath("/admin/billing");
  redirect(`/admin/billing/${document.id}`);
}

export async function updateRecurringStateAction(formData: FormData) {
  const session = await requireAdminPermission("billing.manage");
  const input = z.object({ id: z.string().uuid(), state: z.enum(["active", "paused", "ended"]), reason: z.string().trim().min(5).max(500) }).parse(Object.fromEntries(formData));
  await updateRecurringScheduleState(input.id, input.state, session, input.reason);
  revalidatePath("/admin");
  revalidatePath("/admin/billing");
  revalidatePath(`/admin/billing/${input.id}`);
}
