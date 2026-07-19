import "server-only";

import { randomUUID } from "node:crypto";
import type { QueryResultRow } from "pg";
import { adminQuery, withAdminTransaction } from "./db";
import { COMPANY_SETTINGS } from "./config";
import { addDays, calculateDocumentTotals, calculateLine, toIsoDate } from "./billing/money";
import type {
  AdminSession,
  AdminSnapshot,
  AdminTask,
  AdminUser,
  ApprovalRequest,
  AuditEvent,
  BillingDocument,
  BillingEvent,
  BillingDocumentType,
  BillingItem,
  BillingStatus,
  Client,
  CompanySettings,
  ContactSubmission,
  CurrencyCode,
  Lead,
  LeadActivity,
  LeadStage,
  Payment,
  Priority,
  Project,
  ProjectHealth,
  ProjectStatus,
  RecurrenceRule,
  RecurringRun,
  TaskStatus,
} from "./types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

interface Row extends QueryResultRow {
  [key: string]: unknown;
}

function string(row: Row, key: string, fallback = "") {
  const value = row[key];
  return value === null || value === undefined ? fallback : String(value);
}

function optionalString(row: Row, key: string) {
  const value = row[key];
  return value === null || value === undefined ? undefined : String(value);
}

function number(row: Row, key: string, fallback = 0) {
  const value = Number(row[key]);
  return Number.isFinite(value) ? value : fallback;
}

function bool(row: Row, key: string) {
  return row[key] === true || row[key] === "true";
}

function iso(row: Row, key: string, dateOnly = false) {
  const value = row[key];
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return dateOnly ? date.toISOString().slice(0, 10) : date.toISOString();
}

function json<T>(row: Row, key: string, fallback: T): T {
  const value = row[key];
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

async function databaseSnapshot(): Promise<AdminSnapshot> {
  const [
    usersResult,
    clientsResult,
    contactsResult,
    leadsResult,
    leadActivitiesResult,
    projectsResult,
    milestonesResult,
    tasksResult,
    documentsResult,
    billingEventsResult,
    itemsResult,
    schedulesResult,
    recurringRunsResult,
    paymentsResult,
    allocationsResult,
    approvalsResult,
    auditsResult,
    submissionsResult,
    settingsResult,
  ] = await Promise.all([
    adminQuery<Row>("SELECT * FROM admin_users ORDER BY created_at"),
    adminQuery<Row>("SELECT * FROM clients ORDER BY updated_at DESC"),
    adminQuery<Row>("SELECT * FROM client_contacts ORDER BY created_at"),
    adminQuery<Row>("SELECT * FROM leads ORDER BY updated_at DESC"),
    adminQuery<Row>("SELECT * FROM lead_activities ORDER BY created_at DESC"),
    adminQuery<Row>("SELECT * FROM projects ORDER BY updated_at DESC"),
    adminQuery<Row>("SELECT * FROM project_milestones ORDER BY due_date NULLS LAST"),
    adminQuery<Row>("SELECT * FROM admin_tasks ORDER BY due_date NULLS LAST"),
    adminQuery<Row>("SELECT * FROM billing_documents ORDER BY created_at DESC"),
    adminQuery<Row>("SELECT * FROM billing_document_events ORDER BY created_at DESC"),
    adminQuery<Row>("SELECT * FROM billing_document_items ORDER BY sort_order"),
    adminQuery<Row>("SELECT * FROM recurring_schedules ORDER BY next_run_date"),
    adminQuery<Row>("SELECT rr.*, rs.template_document_id FROM recurring_runs rr JOIN recurring_schedules rs ON rs.id = rr.schedule_id ORDER BY rr.created_at DESC LIMIT 200"),
    adminQuery<Row>("SELECT * FROM payments ORDER BY paid_at DESC"),
    adminQuery<Row>("SELECT * FROM payment_allocations"),
    adminQuery<Row>("SELECT * FROM approval_requests ORDER BY created_at DESC"),
    adminQuery<Row>("SELECT * FROM admin_audit_events ORDER BY created_at DESC LIMIT 500"),
    adminQuery<Row>("SELECT * FROM contact_submissions ORDER BY submitted_at DESC"),
    adminQuery<Row>("SELECT * FROM company_settings WHERE id = 'primary' LIMIT 1"),
  ]);

  const users: AdminUser[] = usersResult.rows.map((row) => ({
    id: string(row, "id"),
    email: string(row, "email"),
    displayName: string(row, "display_name"),
    role: string(row, "role") as AdminUser["role"],
    state: string(row, "state") as AdminUser["state"],
    enrolledAt: iso(row, "enrolled_at"),
    lastLoginAt: iso(row, "last_login_at"),
  }));

  const clients: Client[] = clientsResult.rows.map((row) => ({
    id: string(row, "id"),
    name: string(row, "name"),
    email: string(row, "email"),
    phone: string(row, "phone"),
    address: string(row, "address"),
    currency: string(row, "currency", "NGN") as CurrencyCode,
    paymentTermsDays: number(row, "payment_terms_days", 14),
    state: string(row, "state", "active") as Client["state"],
    contacts: contactsResult.rows
      .filter((contact) => string(contact, "client_id") === string(row, "id"))
      .map((contact) => ({
        id: string(contact, "id"),
        name: string(contact, "name"),
        email: string(contact, "email"),
        phone: string(contact, "phone"),
        jobTitle: string(contact, "job_title"),
        isBilling: bool(contact, "is_billing"),
      })),
    createdAt: iso(row, "created_at") ?? new Date().toISOString(),
    updatedAt: iso(row, "updated_at") ?? new Date().toISOString(),
  }));

  const leads: Lead[] = leadsResult.rows.map((row) => ({
    id: string(row, "id"),
    companyName: string(row, "company_name"),
    contactName: string(row, "contact_name"),
    email: string(row, "email"),
    phone: string(row, "phone"),
    service: string(row, "service"),
    source: string(row, "source"),
    stage: string(row, "stage") as LeadStage,
    estimatedValue: number(row, "estimated_value"),
    currency: string(row, "currency", "NGN") as CurrencyCode,
    ownerUserId: optionalString(row, "owner_user_id"),
    nextAction: string(row, "next_action"),
    nextActionAt: iso(row, "next_action_at"),
    lostReason: optionalString(row, "lost_reason"),
    createdAt: iso(row, "created_at") ?? new Date().toISOString(),
    updatedAt: iso(row, "updated_at") ?? new Date().toISOString(),
  }));

  const leadActivities: LeadActivity[] = leadActivitiesResult.rows.map((row) => ({
    id: string(row, "id"),
    leadId: string(row, "lead_id"),
    actorUserId: optionalString(row, "actor_user_id"),
    type: string(row, "activity_type"),
    body: string(row, "body"),
    createdAt: iso(row, "created_at") ?? new Date().toISOString(),
  }));

  const projects: Project[] = projectsResult.rows.map((row) => ({
    id: string(row, "id"),
    clientId: string(row, "client_id"),
    leadId: optionalString(row, "lead_id"),
    name: string(row, "name"),
    service: string(row, "service"),
    summary: string(row, "summary"),
    ownerUserId: optionalString(row, "owner_user_id"),
    status: string(row, "status") as ProjectStatus,
    health: string(row, "health") as ProjectHealth,
    priority: string(row, "priority") as Priority,
    commercialValue: number(row, "commercial_value"),
    currency: string(row, "currency", "NGN") as CurrencyCode,
    startDate: iso(row, "start_date", true),
    dueDate: iso(row, "due_date", true),
    milestones: milestonesResult.rows
      .filter((milestone) => string(milestone, "project_id") === string(row, "id"))
      .map((milestone) => ({
        id: string(milestone, "id"),
        projectId: string(milestone, "project_id"),
        title: string(milestone, "title"),
        ownerUserId: optionalString(milestone, "owner_user_id"),
        dueDate: iso(milestone, "due_date", true),
        state: string(milestone, "state") as Project["milestones"][number]["state"],
      })),
    createdAt: iso(row, "created_at") ?? new Date().toISOString(),
    updatedAt: iso(row, "updated_at") ?? new Date().toISOString(),
  }));

  const tasks: AdminTask[] = tasksResult.rows.map((row) => ({
    id: string(row, "id"),
    projectId: optionalString(row, "project_id"),
    title: string(row, "title"),
    assigneeUserId: optionalString(row, "assignee_user_id"),
    priority: string(row, "priority") as Priority,
    status: string(row, "status") as TaskStatus,
    dueDate: iso(row, "due_date", true),
    createdAt: iso(row, "created_at") ?? new Date().toISOString(),
    updatedAt: iso(row, "updated_at") ?? new Date().toISOString(),
  }));

  const documents: BillingDocument[] = documentsResult.rows.map((row) => {
    const schedule = schedulesResult.rows.find((candidate) => string(candidate, "template_document_id") === string(row, "id"));
    const recurrence: RecurrenceRule | undefined = schedule
      ? {
          frequency: string(schedule, "frequency") as RecurrenceRule["frequency"],
          state: string(schedule, "state") as RecurrenceRule["state"],
          startDate: iso(schedule, "start_date", true) ?? "",
          endDate: iso(schedule, "end_date", true),
          nextRunDate: iso(schedule, "next_run_date", true) ?? "",
          autoIssue: bool(schedule, "auto_issue"),
          lastRunAt: iso(schedule, "last_run_at"),
          lastError: optionalString(schedule, "last_error"),
        }
      : undefined;
    return {
      id: string(row, "id"),
      documentNumber: string(row, "document_number"),
      type: string(row, "document_type") as BillingDocumentType,
      status: string(row, "status") as BillingStatus,
      clientId: string(row, "client_id"),
      projectId: optionalString(row, "project_id"),
      parentDocumentId: optionalString(row, "parent_document_id"),
      client: json(row, "client_snapshot", { name: "", contactName: "", email: "", phone: "", address: "" }),
      company: json(row, "company_snapshot", { name: "Bespoke Technologies", website: "", phone: "", email: "", registrationNumber: "", motto: "", address: "" }),
      issueDate: iso(row, "issue_date", true) ?? "",
      dueDate: iso(row, "due_date", true) ?? "",
      currency: string(row, "currency", "NGN") as CurrencyCode,
      items: itemsResult.rows
        .filter((item) => string(item, "document_id") === string(row, "id"))
        .map((item) => ({
          id: string(item, "id"),
          name: string(item, "name"),
          description: string(item, "description"),
          quantity: number(item, "quantity"),
          rate: number(item, "unit_rate"),
          discountRate: number(item, "discount_rate"),
          taxRate: number(item, "tax_rate"),
        })),
      notes: string(row, "notes"),
      terms: string(row, "terms"),
      paymentInstructions: string(row, "payment_instructions"),
      purchaseOrder: string(row, "purchase_order"),
      recurrence,
      revision: number(row, "revision", 1),
      issuedAt: iso(row, "issued_at"),
      voidedAt: iso(row, "voided_at"),
      voidReason: optionalString(row, "void_reason"),
      createdBy: optionalString(row, "created_by"),
      createdAt: iso(row, "created_at") ?? new Date().toISOString(),
      updatedAt: iso(row, "updated_at") ?? new Date().toISOString(),
    };
  });

  const billingEvents: BillingEvent[] = billingEventsResult.rows.map((row) => ({
    id: string(row, "id"),
    documentId: string(row, "document_id"),
    actorUserId: optionalString(row, "actor_user_id"),
    type: string(row, "event_type"),
    fromStatus: optionalString(row, "from_status") as BillingStatus | undefined,
    toStatus: optionalString(row, "to_status") as BillingStatus | undefined,
    detail: json<Record<string, unknown> | undefined>(row, "detail", undefined),
    createdAt: iso(row, "created_at") ?? new Date().toISOString(),
  }));

  const recurringRuns: RecurringRun[] = recurringRunsResult.rows.map((row) => ({
    id: string(row, "id"),
    scheduleId: string(row, "schedule_id"),
    templateDocumentId: string(row, "template_document_id"),
    generatedDocumentId: optionalString(row, "generated_document_id"),
    dueDate: iso(row, "due_date", true) ?? "",
    state: string(row, "state") as RecurringRun["state"],
    error: optionalString(row, "error"),
    createdAt: iso(row, "created_at") ?? new Date().toISOString(),
    completedAt: iso(row, "completed_at"),
  }));

  const payments: Payment[] = paymentsResult.rows.flatMap((row) =>
    allocationsResult.rows
      .filter((allocation) => string(allocation, "payment_id") === string(row, "id"))
      .map((allocation) => ({
        id: string(row, "id"),
        clientId: string(row, "client_id"),
        documentId: string(allocation, "document_id"),
        amount: number(allocation, "amount"),
        currency: string(row, "currency", "NGN") as CurrencyCode,
        paidAt: iso(row, "paid_at") ?? new Date().toISOString(),
        method: string(row, "method"),
        reference: string(row, "reference"),
        note: string(row, "note"),
        state: string(row, "state") as Payment["state"],
        recordedBy: optionalString(row, "recorded_by"),
        reversedAt: iso(row, "reversed_at"),
        reversalReason: optionalString(row, "reversal_reason"),
      })),
  );

  const approvals: ApprovalRequest[] = approvalsResult.rows.map((row) => ({
    id: string(row, "id"),
    requestedBy: string(row, "requested_by"),
    action: string(row, "action"),
    entityType: string(row, "entity_type"),
    entityId: string(row, "entity_id"),
    reason: string(row, "reason"),
    state: string(row, "state") as ApprovalRequest["state"],
    resolvedBy: optionalString(row, "resolved_by"),
    resolutionNote: optionalString(row, "resolution_note"),
    resolvedAt: iso(row, "resolved_at"),
    createdAt: iso(row, "created_at") ?? new Date().toISOString(),
  }));

  const audits: AuditEvent[] = auditsResult.rows.map((row) => ({
    id: string(row, "id"),
    actorUserId: optionalString(row, "actor_user_id"),
    actorLabel: string(row, "actor_label"),
    action: string(row, "action"),
    entityType: string(row, "entity_type"),
    entityId: optionalString(row, "entity_id"),
    reason: optionalString(row, "reason"),
    metadata: json<Record<string, unknown> | undefined>(row, "metadata", undefined),
    createdAt: iso(row, "created_at") ?? new Date().toISOString(),
  }));

  const submissions: ContactSubmission[] = submissionsResult.rows.map((row) => ({
    id: string(row, "id"),
    name: string(row, "name"),
    email: string(row, "email"),
    phone: string(row, "phone"),
    company: string(row, "company"),
    service: string(row, "service"),
    message: string(row, "message"),
    state: string(row, "state") as ContactSubmission["state"],
    submittedAt: iso(row, "submitted_at") ?? new Date().toISOString(),
  }));

  const settingsRow = settingsResult.rows[0];
  const settings: CompanySettings = settingsRow
    ? {
        name: string(settingsRow, "company_name"),
        website: string(settingsRow, "website"),
        phone: string(settingsRow, "phone"),
        email: string(settingsRow, "email"),
        registrationNumber: string(settingsRow, "registration_number"),
        motto: string(settingsRow, "motto"),
        address: string(settingsRow, "address"),
        defaultCurrency: string(settingsRow, "default_currency", "NGN") as CurrencyCode,
        defaultPaymentTermsDays: number(settingsRow, "default_payment_terms_days", 14),
        paymentInstructions: string(settingsRow, "payment_instructions"),
        invoiceApprovalThreshold: number(settingsRow, "invoice_approval_threshold", 1_000_000),
        updatedAt: iso(settingsRow, "updated_at") ?? new Date().toISOString(),
      }
    : COMPANY_SETTINGS;

  return { users, clients, leads, leadActivities, projects, tasks, documents, billingEvents, recurringRuns, payments, approvals, audits, submissions, settings };
}

export async function getAdminSnapshot() {
  return clone(await databaseSnapshot());
}

export async function getBillingDocument(id: string) {
  return (await getAdminSnapshot()).documents.find((document) => document.id === id) ?? null;
}

export async function appendAudit(
  session: AdminSession,
  action: string,
  entityType: string,
  entityId?: string,
  reason?: string,
  metadata?: Record<string, unknown>,
) {
  const event: AuditEvent = {
    id: randomUUID(),
    actorUserId: session.userId,
    actorLabel: session.displayName,
    action,
    entityType,
    entityId,
    reason,
    metadata,
    createdAt: new Date().toISOString(),
  };
  await adminQuery(
    `INSERT INTO admin_audit_events (id, actor_user_id, actor_label, action, entity_type, entity_id, reason, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [event.id, event.actorUserId, event.actorLabel, action, entityType, entityId ?? null, reason ?? null, metadata ? JSON.stringify(metadata) : null],
  );
  return event;
}

export async function createClientRecord(
  input: Pick<Client, "name" | "email" | "phone" | "address" | "currency" | "paymentTermsDays"> & { contactName?: string },
  session: AdminSession,
) {
  const normalizedName = input.name.trim().toLowerCase().replace(/\s+/g, " ");
  const duplicate = (await getAdminSnapshot()).clients.find(
    (client) => client.name.trim().toLowerCase().replace(/\s+/g, " ") === normalizedName,
  );
  if (duplicate) throw new Error("A client with this name already exists.");
  const now = new Date().toISOString();
  const client: Client = {
    id: randomUUID(),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    currency: input.currency,
    paymentTermsDays: input.paymentTermsDays,
    state: "active",
    contacts: input.contactName
      ? [{ id: randomUUID(), name: input.contactName.trim(), email: input.email.trim(), phone: input.phone.trim(), jobTitle: "", isBilling: true }]
      : [],
    createdAt: now,
    updatedAt: now,
  };
  await withAdminTransaction(async (db) => {
    await db.query(
      `INSERT INTO clients (id, name, normalized_name, email, phone, address, currency, payment_terms_days, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [client.id, client.name, normalizedName, client.email || null, client.phone || null, client.address || null, client.currency, client.paymentTermsDays, session.userId],
    );
    for (const contact of client.contacts) {
      await db.query(
        `INSERT INTO client_contacts (id, client_id, name, email, phone, job_title, is_billing)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [contact.id, client.id, contact.name, contact.email || null, contact.phone || null, contact.jobTitle || null, contact.isBilling],
      );
    }
    await db.query(
      `INSERT INTO admin_audit_events (actor_user_id, actor_label, action, entity_type, entity_id)
       VALUES ($1, $2, 'client.created', 'client', $3)`,
      [session.userId, session.displayName, client.id],
    );
  });
  return client;
}

export async function updateClientState(id: string, state: Client["state"], session: AdminSession, reason: string) {
  await adminQuery("UPDATE clients SET state=$2, updated_at=now() WHERE id=$1", [id, state]);
  await appendAudit(session, "client.state.changed", "client", id, reason, { state });
  return (await getAdminSnapshot()).clients.find((client) => client.id === id)!;
}

export async function createLeadRecord(
  input: Pick<Lead, "companyName" | "contactName" | "email" | "phone" | "service" | "source" | "stage" | "estimatedValue" | "currency" | "nextAction"> & { nextActionAt?: string },
  session: AdminSession,
) {
  const now = new Date().toISOString();
  const lead: Lead = { id: randomUUID(), ...input, ownerUserId: session.userId, createdAt: now, updatedAt: now };
  await adminQuery(
    `INSERT INTO leads (id, company_name, contact_name, email, phone, service, source, stage, estimated_value, currency, owner_user_id, next_action, next_action_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [lead.id, lead.companyName, lead.contactName, lead.email || null, lead.phone || null, lead.service, lead.source, lead.stage, lead.estimatedValue, lead.currency, session.userId, lead.nextAction || null, lead.nextActionAt || null],
  );
  await appendAudit(session, "lead.created", "lead", lead.id);
  return lead;
}

export async function updateLeadStage(id: string, stage: LeadStage, session: AdminSession, lostReason?: string) {
  if (stage === "lost" && !lostReason?.trim()) throw new Error("A lost reason is required.");
  await adminQuery("UPDATE leads SET stage = $2, lost_reason = CASE WHEN $2='lost' THEN $3 ELSE NULL END, updated_at = now() WHERE id = $1", [id, stage, lostReason?.trim() || null]);
  await appendAudit(session, "lead.stage.changed", "lead", id, lostReason, { to: stage });
  return (await getAdminSnapshot()).leads.find((lead) => lead.id === id) ?? null;
}

export async function addLeadActivity(leadId: string, body: string, session: AdminSession) {
  const activity: LeadActivity = { id: randomUUID(), leadId, actorUserId: session.userId, type: "note", body: body.trim(), createdAt: new Date().toISOString() };
  if (!activity.body) throw new Error("A note is required.");
  await adminQuery(
    "INSERT INTO lead_activities (id, lead_id, actor_user_id, activity_type, body) VALUES ($1,$2,$3,'note',$4)",
    [activity.id, leadId, session.userId, activity.body],
  );
  await appendAudit(session, "lead.note.added", "lead", leadId);
  return clone(activity);
}

export async function convertLeadToDelivery(id: string, session: AdminSession) {
  const snapshot = await getAdminSnapshot();
  const lead = snapshot.leads.find((candidate) => candidate.id === id);
  if (!lead) throw new Error("Opportunity not found.");
  const existingProject = snapshot.projects.find((project) => project.leadId === id);
  if (existingProject) {
    const client = snapshot.clients.find((candidate) => candidate.id === existingProject.clientId);
    if (!client) throw new Error("The converted delivery project no longer has a client.");
    const existingBilling = snapshot.documents.find((document) => document.projectId === existingProject.id);
    const billing = existingBilling ?? await createBillingRecord(
      {
        type: "standard",
        clientId: client.id,
        projectId: existingProject.id,
        issueDate: toIsoDate(),
        dueDate: addDays(toIsoDate(), client.paymentTermsDays),
        currency: lead.currency,
        items: [{ id: randomUUID(), name: lead.service, description: `Commercial draft created from opportunity ${lead.id}.`, quantity: 1, rate: lead.estimatedValue, discountRate: 0, taxRate: 0 }],
        notes: "Draft created from a won opportunity. Review scope and commercial terms before approval.",
        terms: "Payment is due on or before the stated due date.",
        paymentInstructions: snapshot.settings.paymentInstructions,
        purchaseOrder: "",
      },
      session,
    );
    if (lead.stage !== "won") await updateLeadStage(lead.id, "won", session);
    return { client, project: existingProject, billing };
  }
  if (lead.stage === "won") {
    throw new Error("This opportunity has already been converted into delivery.");
  }
  if (lead.stage === "lost" || lead.stage === "archived") {
    throw new Error("A closed opportunity cannot be converted into delivery.");
  }
  const normalizedName = lead.companyName.trim().toLowerCase().replace(/\s+/g, " ");
  const existingClient = snapshot.clients.find(
    (client) => client.name.trim().toLowerCase().replace(/\s+/g, " ") === normalizedName,
  );
  const client = existingClient ?? await createClientRecord(
    {
      name: lead.companyName,
      contactName: lead.contactName,
      email: lead.email,
      phone: lead.phone,
      address: "",
      currency: lead.currency,
      paymentTermsDays: snapshot.settings.defaultPaymentTermsDays,
    },
    session,
  );
  const project = await createProjectRecord(
    {
      clientId: client.id,
      leadId: lead.id,
      name: `${lead.companyName} - ${lead.service}`,
      service: lead.service,
      summary: `Created from ${lead.source} opportunity ${lead.id}.`,
      status: "planned",
      health: "on_track",
      priority: "medium",
      commercialValue: lead.estimatedValue,
      currency: lead.currency,
    },
    session,
  );
  const billing = await createBillingRecord(
    {
      type: "standard",
      clientId: client.id,
      projectId: project.id,
      issueDate: toIsoDate(),
      dueDate: addDays(toIsoDate(), client.paymentTermsDays),
      currency: lead.currency,
      items: [{ id: randomUUID(), name: lead.service, description: `Commercial draft created from opportunity ${lead.id}.`, quantity: 1, rate: lead.estimatedValue, discountRate: 0, taxRate: 0 }],
      notes: "Draft created from a won opportunity. Review scope and commercial terms before approval.",
      terms: "Payment is due on or before the stated due date.",
      paymentInstructions: snapshot.settings.paymentInstructions,
      purchaseOrder: "",
    },
    session,
  );
  await updateLeadStage(lead.id, "won", session);
  await appendAudit(session, "lead.converted_to_delivery", "lead", lead.id, undefined, {
    clientId: client.id,
    projectId: project.id,
    billingDocumentId: billing.id,
  });
  return { client, project, billing };
}

export async function createProjectRecord(
  input: Pick<Project, "clientId" | "name" | "service" | "summary" | "status" | "health" | "priority" | "commercialValue" | "currency"> & { leadId?: string; startDate?: string; dueDate?: string },
  session: AdminSession,
) {
  const client = (await getAdminSnapshot()).clients.find((candidate) => candidate.id === input.clientId);
  if (!client || client.state !== "active") throw new Error("An active client is required for a new project.");
  const now = new Date().toISOString();
  const project: Project = { id: randomUUID(), ...input, ownerUserId: session.userId, milestones: [], createdAt: now, updatedAt: now };
  await adminQuery(
      `INSERT INTO projects (id, client_id, lead_id, name, service, summary, owner_user_id, status, health, priority, commercial_value, currency, start_date, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [project.id, project.clientId, project.leadId || null, project.name, project.service, project.summary || null, session.userId, project.status, project.health, project.priority, project.commercialValue, project.currency, project.startDate || null, project.dueDate || null],
  );
  await appendAudit(session, "project.created", "project", project.id);
  return project;
}

export async function updateProjectState(id: string, status: ProjectStatus, health: ProjectHealth, session: AdminSession) {
  await adminQuery("UPDATE projects SET status=$2, health=$3, updated_at=now() WHERE id=$1", [id, status, health]);
  await appendAudit(session, "project.state.changed", "project", id, undefined, { status, health });
  return (await getAdminSnapshot()).projects.find((project) => project.id === id)!;
}

export async function createMilestoneRecord(
  input: { projectId: string; title: string; ownerUserId?: string; dueDate?: string },
  session: AdminSession,
) {
  const milestone: Project["milestones"][number] = { id: randomUUID(), projectId: input.projectId, title: input.title.trim(), ownerUserId: input.ownerUserId || session.userId, dueDate: input.dueDate, state: "pending" };
  await adminQuery(
    "INSERT INTO project_milestones (id, project_id, title, owner_user_id, due_date) VALUES ($1,$2,$3,$4,$5)",
    [milestone.id, milestone.projectId, milestone.title, milestone.ownerUserId || null, milestone.dueDate || null],
  );
  await appendAudit(session, "project.milestone.created", "project", input.projectId, undefined, { milestoneId: milestone.id });
  return clone(milestone);
}

export async function updateMilestoneState(id: string, state: Project["milestones"][number]["state"], session: AdminSession) {
  await adminQuery("UPDATE project_milestones SET state=$2 WHERE id=$1", [id, state]);
  await appendAudit(session, "project.milestone.state_changed", "project_milestone", id, undefined, { state });
}

export async function createTaskRecord(
  input: Pick<AdminTask, "title" | "priority" | "status"> & { projectId?: string; assigneeUserId?: string; dueDate?: string },
  session: AdminSession,
) {
  const now = new Date().toISOString();
  const task: AdminTask = { id: randomUUID(), ...input, assigneeUserId: input.assigneeUserId || session.userId, createdAt: now, updatedAt: now };
  await adminQuery(
    `INSERT INTO admin_tasks (id, project_id, title, assignee_user_id, priority, status, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [task.id, task.projectId || null, task.title, task.assigneeUserId || null, task.priority, task.status, task.dueDate || null],
  );
  await appendAudit(session, "task.created", "task", task.id);
  return task;
}

export async function updateTaskState(id: string, status: TaskStatus, session: AdminSession) {
  await adminQuery("UPDATE admin_tasks SET status = $2, updated_at = now() WHERE id = $1", [id, status]);
  await appendAudit(session, "task.status.changed", "task", id, undefined, { to: status });
  return (await getAdminSnapshot()).tasks.find((task) => task.id === id) ?? null;
}

async function allocateDocumentNumber(type: BillingDocumentType) {
  const prefix = type === "standard" ? "BT-INV" : type === "proforma" ? "BT-PRO" : "BT-REC";
  const year = new Date().getFullYear();
  return withAdminTransaction(async (db) => {
    const result = await db.query<{ allocated: string }>(
      `INSERT INTO document_sequences (prefix, sequence_year, next_value)
       VALUES ($1, $2, 2)
       ON CONFLICT (prefix, sequence_year)
       DO UPDATE SET next_value = document_sequences.next_value + 1
       RETURNING (next_value - 1)::STRING AS allocated`,
      [prefix, year],
    );
    return `${prefix}-${year}-${String(result.rows[0]?.allocated ?? "1").padStart(4, "0")}`;
  });
}

export interface CreateBillingInput {
  type: BillingDocumentType;
  clientId: string;
  projectId?: string;
  parentDocumentId?: string;
  issueDate: string;
  dueDate: string;
  currency: CurrencyCode;
  items: BillingItem[];
  notes: string;
  terms: string;
  paymentInstructions: string;
  purchaseOrder: string;
  recurrence?: RecurrenceRule;
}

export async function createBillingRecord(input: CreateBillingInput, session: AdminSession) {
  const snapshot = await getAdminSnapshot();
  const client = snapshot.clients.find((candidate) => candidate.id === input.clientId);
  if (!client) throw new Error("Client not found.");
  if (client.state !== "active") throw new Error("Archived clients cannot receive new billing documents.");
  if (input.projectId && !snapshot.projects.some((project) => project.id === input.projectId && project.clientId === input.clientId)) {
    throw new Error("The linked project must belong to the selected client.");
  }
  const now = new Date().toISOString();
  const billingContact = client.contacts.find((contact) => contact.isBilling) ?? client.contacts[0];
  const document: BillingDocument = {
    id: randomUUID(),
    documentNumber: await allocateDocumentNumber(input.type),
    type: input.type,
    status: "draft",
    clientId: client.id,
    projectId: input.projectId,
    parentDocumentId: input.parentDocumentId,
    client: {
      name: client.name,
      contactName: billingContact?.name ?? "",
      email: billingContact?.email || client.email,
      phone: billingContact?.phone || client.phone,
      address: client.address,
    },
    company: snapshot.settings,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    currency: input.currency,
    items: input.items.map((item) => ({ ...item, id: randomUUID() })),
    notes: input.notes,
    terms: input.terms,
    paymentInstructions: input.paymentInstructions,
    purchaseOrder: input.purchaseOrder,
    recurrence: input.type === "recurring" ? input.recurrence : undefined,
    revision: 1,
    createdBy: session.userId,
    createdAt: now,
    updatedAt: now,
  };
  const totals = calculateDocumentTotals(document);
  await withAdminTransaction(async (db) => {
    await db.query(
      `INSERT INTO billing_documents (
        id, document_number, document_type, status, client_id, project_id, parent_document_id, client_snapshot, company_snapshot, issue_date, due_date,
        currency, subtotal, discount_total, tax_total, total, balance, notes, terms, payment_instructions, purchase_order, created_by
      ) VALUES ($1,$2,$3,'draft',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
      [document.id, document.documentNumber, document.type, document.clientId, document.projectId || null, document.parentDocumentId || null, JSON.stringify(document.client), JSON.stringify(document.company), document.issueDate, document.dueDate, document.currency, totals.subtotal, totals.discount, totals.tax, totals.total, totals.balance, document.notes || null, document.terms || null, document.paymentInstructions || null, document.purchaseOrder || null, session.userId],
    );
    for (const [index, item] of document.items.entries()) {
      const line = calculateLine(item);
      await db.query(
        `INSERT INTO billing_document_items (id, document_id, name, description, quantity, unit_rate, discount_rate, tax_rate, line_total, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [item.id, document.id, item.name, item.description || null, item.quantity, item.rate, item.discountRate, item.taxRate, line.total, index],
      );
    }
    if (document.recurrence) {
      await db.query(
        `INSERT INTO recurring_schedules (template_document_id, frequency, state, start_date, end_date, next_run_date, auto_issue)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [document.id, document.recurrence.frequency, document.recurrence.state, document.recurrence.startDate, document.recurrence.endDate || null, document.recurrence.nextRunDate, document.recurrence.autoIssue],
      );
    }
    await db.query(
      `INSERT INTO billing_document_events (document_id, actor_user_id, event_type, to_status)
       VALUES ($1,$2,'created','draft')`,
      [document.id, session.userId],
    );
    await db.query(
      `INSERT INTO admin_audit_events (actor_user_id, actor_label, action, entity_type, entity_id, metadata)
       VALUES ($1,$2,'billing.document.created','billing_document',$3,$4)`,
      [session.userId, session.displayName, document.id, JSON.stringify({ documentNumber: document.documentNumber })],
    );
  });
  return document;
}

export async function updateBillingDraft(id: string, input: CreateBillingInput, session: AdminSession) {
  const snapshot = await getAdminSnapshot();
  const current = snapshot.documents.find((document) => document.id === id);
  if (!current) throw new Error("Billing document not found.");
  if (current.status !== "draft") throw new Error("Only draft documents can be edited.");
  if (current.type !== input.type) throw new Error("The document type cannot change after its number is allocated.");
  const client = snapshot.clients.find((candidate) => candidate.id === input.clientId);
  if (!client || client.state !== "active") throw new Error("Choose an active client.");
  if (input.projectId && !snapshot.projects.some((project) => project.id === input.projectId && project.clientId === input.clientId)) {
    throw new Error("The linked project must belong to the selected client.");
  }
  const billingContact = client.contacts.find((contact) => contact.isBilling) ?? client.contacts[0];
  const updated: BillingDocument = {
    ...current,
    clientId: client.id,
    projectId: input.projectId,
    client: {
      name: client.name,
      contactName: billingContact?.name ?? "",
      email: billingContact?.email || client.email,
      phone: billingContact?.phone || client.phone,
      address: client.address,
    },
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    currency: input.currency,
    items: input.items.map((item) => ({ ...item, id: randomUUID() })),
    notes: input.notes,
    terms: input.terms,
    paymentInstructions: input.paymentInstructions,
    purchaseOrder: input.purchaseOrder,
    recurrence: current.type === "recurring" ? input.recurrence : undefined,
    updatedAt: new Date().toISOString(),
  };
  const totals = calculateDocumentTotals(updated);
  await withAdminTransaction(async (db) => {
    const updateResult = await db.query<{ id: string }>(
      `UPDATE billing_documents SET client_id=$2, project_id=$3, client_snapshot=$4, issue_date=$5, due_date=$6,
       currency=$7, subtotal=$8, discount_total=$9, tax_total=$10, total=$11, balance=$11,
       notes=$12, terms=$13, payment_instructions=$14, purchase_order=$15, updated_at=now()
       WHERE id=$1 AND status='draft' RETURNING id`,
      [id, updated.clientId, updated.projectId || null, JSON.stringify(updated.client), updated.issueDate, updated.dueDate, updated.currency, totals.subtotal, totals.discount, totals.tax, totals.total, updated.notes || null, updated.terms || null, updated.paymentInstructions || null, updated.purchaseOrder || null],
    );
    if (!updateResult.rows[0]) throw new Error("The document is no longer an editable draft.");
    await db.query("DELETE FROM billing_document_items WHERE document_id=$1", [id]);
    for (const [index, item] of updated.items.entries()) {
      await db.query(
        `INSERT INTO billing_document_items (id, document_id, name, description, quantity, unit_rate, discount_rate, tax_rate, line_total, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [item.id, id, item.name, item.description || null, item.quantity, item.rate, item.discountRate, item.taxRate, calculateLine(item).total, index],
      );
    }
    if (updated.recurrence) {
      await db.query(
        `INSERT INTO recurring_schedules (template_document_id, frequency, state, start_date, end_date, next_run_date, auto_issue)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (template_document_id) DO UPDATE SET frequency=$2, state=$3, start_date=$4, end_date=$5, next_run_date=$6, auto_issue=$7, updated_at=now()`,
        [id, updated.recurrence.frequency, updated.recurrence.state, updated.recurrence.startDate, updated.recurrence.endDate || null, updated.recurrence.nextRunDate, updated.recurrence.autoIssue],
      );
    }
    await db.query(
      `INSERT INTO billing_document_events (document_id, actor_user_id, event_type, from_status, to_status)
       VALUES ($1,$2,'draft_updated','draft','draft')`,
      [id, session.userId],
    );
    await db.query(
      `INSERT INTO admin_audit_events (actor_user_id, actor_label, action, entity_type, entity_id, metadata)
       VALUES ($1,$2,'billing.document.draft_updated','billing_document',$3,$4)`,
      [session.userId, session.displayName, id, JSON.stringify({ documentNumber: current.documentNumber })],
    );
  });
  return (await getBillingDocument(id))!;
}

const ALLOWED_TRANSITIONS: Record<BillingStatus, BillingStatus[]> = {
  draft: ["pending_approval", "approved", "voided"],
  pending_approval: ["approved", "draft", "voided"],
  approved: ["sent", "accepted", "voided"],
  sent: ["viewed", "overdue", "voided", "accepted", "expired"],
  viewed: ["overdue", "voided", "accepted", "expired"],
  partially_paid: ["overdue", "voided"],
  overdue: ["voided"],
  paid: [],
  accepted: ["voided"],
  expired: ["voided"],
  voided: [],
};

const TYPE_FORBIDDEN_STATUSES: Record<BillingDocumentType, ReadonlySet<BillingStatus>> = {
  standard: new Set(["accepted", "expired"]),
  proforma: new Set(["partially_paid", "paid", "overdue"]),
  recurring: new Set(["sent", "viewed", "partially_paid", "paid", "overdue", "accepted", "expired"]),
};

export async function transitionBillingDocument(
  id: string,
  status: BillingStatus,
  session: AdminSession,
  reason?: string,
) {
  const document = await getBillingDocument(id);
  if (!document) throw new Error("Billing document not found.");
  const snapshot = await getAdminSnapshot();
  if (session.role === "admin_manager" && ["approved", "sent"].includes(status)) {
    const total = calculateDocumentTotals(document, snapshot.payments).total;
    const approvedException = snapshot.approvals.some(
      (approval) => approval.entityId === id && approval.action === "billing.issue" && approval.state === "approved",
    );
    if (total > snapshot.settings.invoiceApprovalThreshold && !approvedException && document.status !== "approved") {
      throw new Error("Founder approval is required before this document can be issued.");
    }
  }
  if (!ALLOWED_TRANSITIONS[document.status].includes(status)) {
    throw new Error(`Cannot move ${document.status} to ${status}.`);
  }
  if (TYPE_FORBIDDEN_STATUSES[document.type].has(status)) {
    throw new Error(`${document.type} documents cannot move to ${status}.`);
  }
  await withAdminTransaction(async (db) => {
    const updateResult = await db.query<{ id: string }>(
      `UPDATE billing_documents SET status = $2, updated_at = now(),
       issued_at = CASE WHEN $2 IN ('approved','sent') AND issued_at IS NULL THEN now() ELSE issued_at END,
       issued_by = CASE WHEN $2 IN ('approved','sent') AND issued_by IS NULL THEN $3 ELSE issued_by END,
       voided_at = CASE WHEN $2 = 'voided' THEN now() ELSE voided_at END,
       voided_by = CASE WHEN $2 = 'voided' THEN $3 ELSE voided_by END,
       void_reason = CASE WHEN $2 = 'voided' THEN $4 ELSE void_reason END
       WHERE id = $1 AND status = $5 RETURNING id`,
      [id, status, session.userId, reason ?? null, document.status],
    );
    if (!updateResult.rows[0]) throw new Error("The document changed before this transition could be applied.");
    if (status === "sent") {
      await db.query(
        `INSERT INTO delivery_outbox (document_id, channel, destination, state, attempts, updated_at)
         VALUES ($1, 'manual', $2, 'sent', 1, now())`,
        [id, document.client.email || document.client.name],
      );
    }
    await db.query(
      `INSERT INTO billing_document_events (document_id, actor_user_id, event_type, from_status, to_status, detail)
       VALUES ($1,$2,'status_changed',$3,$4,$5)`,
      [id, session.userId, document.status, status, reason ? JSON.stringify({ reason }) : null],
    );
    await db.query(
      `INSERT INTO admin_audit_events (actor_user_id, actor_label, action, entity_type, entity_id, reason, metadata)
       VALUES ($1,$2,$3,'billing_document',$4,$5,$6)`,
      [session.userId, session.displayName, `billing.document.${status}`, id, reason ?? null, JSON.stringify({ from: document.status, to: status })],
    );
  });
  return (await getBillingDocument(id))!;
}

export async function createBillingRevision(id: string, session: AdminSession) {
  const source = await getBillingDocument(id);
  if (!source || source.type === "recurring") throw new Error("A client-facing billing document is required.");
  if (source.status === "draft") throw new Error("Edit the existing draft instead of creating a revision.");
  const existingRevision = (await getAdminSnapshot()).documents.find((document) => document.parentDocumentId === source.id && document.type === source.type);
  if (existingRevision) throw new Error(`Revision ${existingRevision.documentNumber} already exists for this document.`);
  const revised = await createBillingRecord(
    {
      type: source.type,
      clientId: source.clientId,
      projectId: source.projectId,
      parentDocumentId: source.id,
      issueDate: toIsoDate(),
      dueDate: source.dueDate < toIsoDate() ? addDays(toIsoDate(), 14) : source.dueDate,
      currency: source.currency,
      items: source.items.map((item) => ({ ...item, id: randomUUID() })),
      notes: source.notes,
      terms: source.terms,
      paymentInstructions: source.paymentInstructions,
      purchaseOrder: source.documentNumber,
    },
    session,
  );
  revised.revision = source.revision + 1;
  await adminQuery("UPDATE billing_documents SET revision=$2 WHERE id=$1", [revised.id, revised.revision]);
  await appendAudit(session, "billing.document.revised", "billing_document", revised.id, undefined, { sourceId: source.id, revision: revised.revision });
  return revised;
}

export async function convertProformaToInvoice(id: string, session: AdminSession) {
  const snapshot = await getAdminSnapshot();
  const source = snapshot.documents.find((document) => document.id === id && document.type === "proforma");
  if (!source) throw new Error("Proforma document not found.");
  const existing = snapshot.documents.find((document) => document.type === "standard" && document.parentDocumentId === source.id);
  if (existing) {
    if (source.status !== "accepted") await transitionBillingDocument(source.id, "accepted", session, "Converted into a standard invoice.");
    return existing;
  }
  if (!["sent", "viewed", "accepted", "approved"].includes(source.status)) throw new Error("Only an approved or accepted proforma can be converted.");
  const converted = await createBillingRecord(
    {
      type: "standard",
      clientId: source.clientId,
      projectId: source.projectId,
      parentDocumentId: source.id,
      issueDate: toIsoDate(),
      dueDate: addDays(toIsoDate(), snapshot.clients.find((client) => client.id === source.clientId)?.paymentTermsDays ?? 14),
      currency: source.currency,
      items: source.items,
      notes: source.notes,
      terms: source.terms,
      paymentInstructions: source.paymentInstructions,
      purchaseOrder: source.documentNumber,
    },
    session,
  );
  if (source.status !== "accepted") await transitionBillingDocument(source.id, "accepted", session, "Converted into a standard invoice.");
  await appendAudit(session, "billing.proforma.converted", "billing_document", source.id, undefined, { invoiceId: converted.id, invoiceNumber: converted.documentNumber });
  return converted;
}

export async function requestBillingApproval(entityId: string, reason: string, session: AdminSession) {
  const document = await getBillingDocument(entityId);
  if (!document || document.status !== "draft") throw new Error("An editable billing draft is required.");
  const approval: ApprovalRequest = {
    id: randomUUID(),
    requestedBy: session.userId,
    action: "billing.issue",
    entityType: "billing_document",
    entityId,
    reason,
    state: "pending",
    createdAt: new Date().toISOString(),
  };
  await withAdminTransaction(async (db) => {
    const updated = await db.query<{ id: string }>(
      "UPDATE billing_documents SET status='pending_approval', updated_at=now() WHERE id=$1 AND status='draft' RETURNING id",
      [entityId],
    );
    if (!updated.rows[0]) throw new Error("The document changed before approval could be requested.");
    await db.query(
      `INSERT INTO approval_requests (id, requested_by, action, entity_type, entity_id, reason)
       VALUES ($1,$2,'billing.issue','billing_document',$3,$4)`,
      [approval.id, session.userId, entityId, reason],
    );
    await db.query(
      `INSERT INTO billing_document_events (document_id, actor_user_id, event_type, from_status, to_status, detail)
       VALUES ($1,$2,'approval_requested','draft','pending_approval',$3)`,
      [entityId, session.userId, JSON.stringify({ requestId: approval.id, reason })],
    );
    await db.query(
      `INSERT INTO admin_audit_events (actor_user_id, actor_label, action, entity_type, entity_id, reason, metadata)
       VALUES ($1,$2,'approval.requested','billing_document',$3,$4,$5)`,
      [session.userId, session.displayName, entityId, reason, JSON.stringify({ action: approval.action, requestId: approval.id })],
    );
  });
  return approval;
}

export async function resolveApprovalRequest(
  id: string,
  resolution: "approved" | "rejected",
  note: string,
  session: AdminSession,
) {
  const snapshot = await getAdminSnapshot();
  const approval = snapshot.approvals.find((candidate) => candidate.id === id);
  if (!approval || approval.state !== "pending") throw new Error("Pending approval not found.");
  await withAdminTransaction(async (db) => {
    const resolved = await db.query<{ id: string }>(
      `UPDATE approval_requests SET state = $2, resolved_by = $3, resolution_note = $4, resolved_at = now()
       WHERE id = $1 AND state = 'pending' RETURNING id`,
      [id, resolution, session.userId, note || null],
    );
    if (!resolved.rows[0]) throw new Error("Pending approval not found.");
    if (approval.action === "billing.issue") {
      const nextStatus: BillingStatus = resolution === "approved" ? "approved" : "draft";
      const documentUpdate = await db.query<{ id: string }>(
        `UPDATE billing_documents SET status = $3,
         issued_at = CASE WHEN $3 = 'approved' THEN now() ELSE issued_at END,
         issued_by = CASE WHEN $3 = 'approved' THEN $2 ELSE issued_by END,
         updated_at = now()
         WHERE id = $1 AND status = 'pending_approval' RETURNING id`,
        [approval.entityId, session.userId, nextStatus],
      );
      if (!documentUpdate.rows[0]) throw new Error("The approval target is no longer pending.");
      await db.query(
        `INSERT INTO billing_document_events (document_id, actor_user_id, event_type, from_status, to_status, detail)
         VALUES ($1,$2,$3,'pending_approval',$4,$5)`,
        [approval.entityId, session.userId, `approval_${resolution}`, nextStatus, JSON.stringify({ requestId: id, note })],
      );
    }
    await db.query(
      `INSERT INTO admin_audit_events (actor_user_id, actor_label, action, entity_type, entity_id, reason, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [session.userId, session.displayName, `approval.${resolution}`, approval.entityType, approval.entityId, note || null, JSON.stringify({ requestId: id, action: approval.action })],
    );
  });
  return (await getAdminSnapshot()).approvals.find((candidate) => candidate.id === id)!;
}

export async function recordPayment(
  input: Pick<Payment, "documentId" | "amount" | "paidAt" | "method" | "reference" | "note">,
  session: AdminSession,
) {
  const document = await getBillingDocument(input.documentId);
  if (!document) throw new Error("Billing document not found.");
  if (document.type !== "standard" || !["sent", "viewed", "partially_paid", "overdue"].includes(document.status)) {
    throw new Error("Payments can only be recorded against a delivered standard invoice.");
  }
  const snapshot = await getAdminSnapshot();
  if (snapshot.payments.some((payment) => payment.clientId === document.clientId && payment.reference.trim().toLowerCase() === input.reference.trim().toLowerCase())) {
    throw new Error("This payment reference has already been recorded for the client.");
  }
  if (Date.parse(input.paidAt) > Date.now() + 5 * 60_000) throw new Error("Payment time cannot be in the future.");
  const totalsBefore = calculateDocumentTotals(document, snapshot.payments);
  if (input.amount <= 0 || input.amount > totalsBefore.balance) throw new Error("Payment must be greater than zero and no more than the outstanding balance.");
  const payment: Payment = {
    id: randomUUID(),
    clientId: document.clientId,
    documentId: document.id,
    amount: input.amount,
    currency: document.currency,
    paidAt: input.paidAt,
    method: input.method,
    reference: input.reference.trim().toUpperCase(),
    note: input.note,
    state: "recorded",
    recordedBy: session.userId,
  };
  await withAdminTransaction(async (db) => {
    const locked = await db.query<{ balance: string; status: BillingStatus }>(
      `SELECT balance::STRING AS balance, status FROM billing_documents
       WHERE id=$1 AND document_type='standard' AND status IN ('sent','viewed','partially_paid','overdue')
       FOR UPDATE`,
      [document.id],
    );
    const lockedDocument = locked.rows[0];
    if (!lockedDocument) throw new Error("Payments can only be recorded against a delivered standard invoice.");
    const lockedBalance = Number(lockedDocument.balance);
    if (payment.amount > lockedBalance) throw new Error("Payment must be no more than the outstanding balance.");
    const committedBalance = Math.max(0, lockedBalance - payment.amount);
    const committedStatus: BillingStatus = committedBalance === 0 ? "paid" : "partially_paid";
    await db.query(
      `INSERT INTO payments (id, client_id, amount, currency, paid_at, method, reference, note, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [payment.id, payment.clientId, payment.amount, payment.currency, payment.paidAt, payment.method, payment.reference, payment.note || null, session.userId],
    );
    await db.query(
      "INSERT INTO payment_allocations (payment_id, document_id, amount) VALUES ($1,$2,$3)",
      [payment.id, payment.documentId, payment.amount],
    );
    await db.query("UPDATE billing_documents SET balance = $2, status = $3, updated_at = now() WHERE id = $1", [document.id, committedBalance, committedStatus]);
    await db.query(
      `INSERT INTO billing_document_events (document_id, actor_user_id, event_type, from_status, to_status, detail)
       VALUES ($1,$2,'payment_recorded',$3,$4,$5)`,
      [document.id, session.userId, lockedDocument.status, committedStatus, JSON.stringify({ paymentId: payment.id, amount: payment.amount })],
    );
    await db.query(
      `INSERT INTO admin_audit_events (actor_user_id, actor_label, action, entity_type, entity_id, metadata)
       VALUES ($1,$2,'payment.recorded','payment',$3,$4)`,
      [session.userId, session.displayName, payment.id, JSON.stringify({ documentId: document.id, amount: payment.amount, currency: payment.currency })],
    );
  });
  return payment;
}

export async function reversePayment(id: string, reason: string, session: AdminSession) {
  const snapshot = await getAdminSnapshot();
  const payment = snapshot.payments.find((candidate) => candidate.id === id && candidate.state === "recorded");
  if (!payment) throw new Error("Recorded payment not found.");
  const document = snapshot.documents.find((candidate) => candidate.id === payment.documentId);
  if (!document) throw new Error("Billing document not found.");
  if (!reason.trim()) throw new Error("A reversal reason is required.");
  await withAdminTransaction(async (db) => {
    const reversed = await db.query<{ amount: string }>(
      `UPDATE payments SET state = 'reversed', reversed_at = now(), reversed_by = $2, reversal_reason = $3
       WHERE id = $1 AND state = 'recorded'
       RETURNING amount::STRING AS amount`,
      [id, session.userId, reason],
    );
    if (!reversed.rows[0]) throw new Error("Recorded payment not found.");
    const locked = await db.query<{ total: string; status: BillingStatus; due_date: string }>(
      "SELECT total::STRING AS total, status, due_date::STRING AS due_date FROM billing_documents WHERE id=$1 FOR UPDATE",
      [document.id],
    );
    const lockedDocument = locked.rows[0];
    if (!lockedDocument) throw new Error("Billing document not found.");
    const allocated = await db.query<{ paid: string }>(
      `SELECT COALESCE(sum(a.amount), 0)::STRING AS paid
       FROM payment_allocations a JOIN payments p ON p.id=a.payment_id
       WHERE a.document_id=$1 AND p.state='recorded'`,
      [document.id],
    );
    const paid = Number(allocated.rows[0]?.paid ?? 0);
    const committedBalance = Math.max(0, Number(lockedDocument.total) - paid);
    const committedStatus: BillingStatus = paid === 0 ? (lockedDocument.due_date < toIsoDate() ? "overdue" : "sent") : (lockedDocument.due_date < toIsoDate() ? "overdue" : "partially_paid");
    await db.query("UPDATE billing_documents SET balance = $2, status = $3, updated_at = now() WHERE id = $1", [document.id, committedBalance, committedStatus]);
    await db.query(
      `INSERT INTO billing_document_events (document_id, actor_user_id, event_type, from_status, to_status, detail)
       VALUES ($1,$2,'payment_reversed',$3,$4,$5)`,
      [document.id, session.userId, lockedDocument.status, committedStatus, JSON.stringify({ paymentId: id, amount: payment.amount, reason })],
    );
    await db.query(
      `INSERT INTO admin_audit_events (actor_user_id, actor_label, action, entity_type, entity_id, reason, metadata)
       VALUES ($1,$2,'payment.reversed','payment',$3,$4,$5)`,
      [session.userId, session.displayName, id, reason, JSON.stringify({ documentId: document.id, amount: payment.amount })],
    );
  });
  return (await getAdminSnapshot()).payments.find((candidate) => candidate.id === id)!;
}

export async function reconcileOverdueDocuments(session: AdminSession, runDate = toIsoDate()) {
  const snapshot = await getAdminSnapshot();
  const candidates = snapshot.documents.filter((document) =>
    document.type === "standard"
    && ["sent", "viewed", "partially_paid"].includes(document.status)
    && document.dueDate < runDate
    && calculateDocumentTotals(document, snapshot.payments).balance > 0,
  );
  let changed = 0;
  for (const document of candidates) {
    const didChange = await withAdminTransaction(async (db) => {
      const updated = await db.query<{ id: string }>("UPDATE billing_documents SET status='overdue', updated_at=now() WHERE id=$1 AND status IN ('sent','viewed','partially_paid') RETURNING id", [document.id]);
      if (!updated.rows[0]) return false;
      await db.query("INSERT INTO billing_document_events (document_id, actor_user_id, event_type, from_status, to_status, detail) VALUES ($1,$2,'status_changed',$3,'overdue',$4)", [document.id, session.userId, document.status, JSON.stringify({ runDate })]);
      await db.query(
        `INSERT INTO admin_audit_events (actor_user_id, actor_label, action, entity_type, entity_id, metadata)
         VALUES ($1,$2,'billing.document.overdue','billing_document',$3,$4)`,
        [session.userId, session.displayName, document.id, JSON.stringify({ runDate })],
      );
      return true;
    });
    if (didChange) changed += 1;
  }
  return changed;
}

function advanceRecurrence(rule: RecurrenceRule) {
  const date = new Date(`${rule.nextRunDate}T00:00:00Z`);
  if (rule.frequency === "weekly") date.setUTCDate(date.getUTCDate() + 7);
  if (rule.frequency === "monthly") date.setUTCMonth(date.getUTCMonth() + 1);
  if (rule.frequency === "quarterly") date.setUTCMonth(date.getUTCMonth() + 3);
  if (rule.frequency === "yearly") date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

export async function runRecurringSchedules(session: AdminSession, runDate = toIsoDate()) {
  const snapshot = await getAdminSnapshot();
  const due = snapshot.documents.filter(
    (document) =>
      document.type === "recurring" &&
      document.recurrence?.state === "active" &&
      document.recurrence.nextRunDate <= runDate &&
      (!document.recurrence.endDate || document.recurrence.nextRunDate <= document.recurrence.endDate),
  );
  const generated: BillingDocument[] = [];
  for (const template of due) {
    const dueDate = template.recurrence!.nextRunDate;
    const autoApproved = template.recurrence!.autoIssue && template.status === "approved";
    const scheduleResult = await adminQuery<Row>("SELECT * FROM recurring_schedules WHERE template_document_id = $1 LIMIT 1", [template.id]);
    const schedule = scheduleResult.rows[0];
    if (!schedule) continue;
    const scheduleId = string(schedule, "id");
    let generatedId: string | undefined;
    const runId = randomUUID();
    try {
      await withAdminTransaction(async (db) => {
        await db.query(
          `INSERT INTO recurring_runs (id, schedule_id, due_date, state) VALUES ($1,$2,$3,'started')`,
          [runId, scheduleId, dueDate],
        );
        const generatedNumber = await allocateDocumentNumber("standard");
        generatedId = randomUUID();
        const totals = calculateDocumentTotals(template);
        await db.query(
          `INSERT INTO billing_documents (
            id, document_number, document_type, status, client_id, project_id, parent_document_id, client_snapshot, company_snapshot, issue_date, due_date,
            currency, subtotal, discount_total, tax_total, total, balance, notes, terms, payment_instructions, purchase_order, created_by, issued_at, issued_by
          ) VALUES ($1,$2,'standard',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
          [generatedId, generatedNumber, autoApproved ? "approved" : "draft", template.clientId, template.projectId || null, template.id, JSON.stringify(template.client), JSON.stringify(template.company), dueDate, addDays(dueDate, 14), template.currency, totals.subtotal, totals.discount, totals.tax, totals.total, totals.balance, template.notes, template.terms, template.paymentInstructions, template.purchaseOrder, session.userId, autoApproved ? new Date().toISOString() : null, autoApproved ? session.userId : null],
        );
        for (const [index, item] of template.items.entries()) {
          await db.query(
            `INSERT INTO billing_document_items (id, document_id, name, description, quantity, unit_rate, discount_rate, tax_rate, line_total, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [randomUUID(), generatedId, item.name, item.description, item.quantity, item.rate, item.discountRate, item.taxRate, calculateLine(item).total, index],
          );
        }
        await db.query(
          `INSERT INTO billing_document_events (document_id, actor_user_id, event_type, to_status, detail)
           VALUES ($1,$2,'recurring_generated',$3,$4)`,
          [generatedId, session.userId, autoApproved ? "approved" : "draft", JSON.stringify({ templateId: template.id, dueDate })],
        );
        await db.query(
          `UPDATE recurring_schedules SET next_run_date = $2, last_run_at = now(), last_error = NULL, updated_at = now() WHERE id = $1`,
          [scheduleId, advanceRecurrence(template.recurrence!)],
        );
        await db.query(
          `UPDATE recurring_runs SET generated_document_id = $2, state = 'completed', completed_at = now() WHERE id = $1`,
          [runId, generatedId],
        );
      });
      if (generatedId) {
        const generatedDocument = await getBillingDocument(generatedId);
        if (generatedDocument) generated.push(generatedDocument);
      }
    } catch (error) {
      const duplicate = typeof error === "object" && error && "code" in error && String(error.code) === "23505";
      if (!duplicate) {
        const message = error instanceof Error ? error.message.slice(0, 500) : "Recurring generation failed";
        await adminQuery("UPDATE recurring_schedules SET state = 'failed', last_error = $2, updated_at = now() WHERE id = $1", [scheduleId, message]);
        await adminQuery(
          `INSERT INTO recurring_runs (id, schedule_id, due_date, state, error, completed_at)
           VALUES ($1,$2,$3,'failed',$4,now())
           ON CONFLICT (schedule_id, due_date) DO UPDATE SET state='failed', error=excluded.error, completed_at=now()`,
          [runId, scheduleId, dueDate, message],
        );
      }
    }
  }
  if (generated.length > 0 || due.length > 0) {
    await appendAudit(session, "recurring.run.completed", "recurring_schedule", undefined, undefined, { due: due.length, generated: generated.length, runDate });
  }
  return { due: due.length, generated };
}

export async function updateRecurringScheduleState(
  templateId: string,
  state: "active" | "paused" | "ended",
  session: AdminSession,
  reason: string,
) {
  await adminQuery(
    "UPDATE recurring_schedules SET state=$2, last_error=CASE WHEN $2='active' THEN NULL ELSE last_error END, updated_at=now() WHERE template_document_id=$1",
    [templateId, state],
  );
  await appendAudit(session, "recurring.schedule.state_changed", "billing_document", templateId, reason, { state });
}

export async function updateCompanySettings(
  input: Omit<CompanySettings, "updatedAt">,
  session: AdminSession,
  reason: string,
) {
  const settings: CompanySettings = { ...input, updatedAt: new Date().toISOString() };
  await adminQuery(
    `UPDATE company_settings SET company_name=$1, website=$2, phone=$3, email=$4, registration_number=$5,
     motto=$6, address=$7, default_currency=$8, default_payment_terms_days=$9, payment_instructions=$10,
     invoice_approval_threshold=$11, updated_by=$12, updated_at=now() WHERE id='primary'`,
    [settings.name, settings.website, settings.phone, settings.email, settings.registrationNumber, settings.motto, settings.address || null, settings.defaultCurrency, settings.defaultPaymentTermsDays, settings.paymentInstructions || null, settings.invoiceApprovalThreshold, session.userId],
  );
  await appendAudit(session, "company.settings.updated", "company_settings", "primary", reason);
  return settings;
}

export async function setAdminUserState(id: string, state: AdminUser["state"], session: AdminSession, reason: string) {
  if (id === session.userId && state === "suspended") throw new Error("You cannot suspend your own active account.");
  await adminQuery("UPDATE admin_users SET state=$2, updated_at=now() WHERE id=$1", [id, state]);
  if (state === "suspended") await adminQuery("UPDATE admin_sessions SET revoked_at=COALESCE(revoked_at, now()) WHERE user_id=$1", [id]);
  await appendAudit(session, "admin.user.state_changed", "admin_user", id, reason, { state });
  return (await getAdminSnapshot()).users.find((user) => user.id === id)!;
}

export async function createContactSubmission(
  input: Pick<ContactSubmission, "name" | "email" | "phone" | "company" | "service" | "message">,
) {
  const submission: ContactSubmission = {
    id: randomUUID(),
    ...input,
    state: "new",
    submittedAt: new Date().toISOString(),
  };
  await adminQuery(
    `INSERT INTO contact_submissions (id, name, email, phone, company, service, message)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [submission.id, submission.name, submission.email, submission.phone || null, submission.company || null, submission.service || null, submission.message],
  );
  return submission;
}

export async function convertSubmissionToLead(id: string, session: AdminSession) {
  const snapshot = await getAdminSnapshot();
  const submission = snapshot.submissions.find((candidate) => candidate.id === id);
  if (!submission || submission.state === "converted") throw new Error("New submission not found.");
  const lead = await createLeadRecord(
    {
      companyName: submission.company || submission.name,
      contactName: submission.name,
      email: submission.email,
      phone: submission.phone,
      service: submission.service || "Project enquiry",
      source: "Website enquiry",
      stage: "new",
      estimatedValue: 0,
      currency: "NGN",
      nextAction: "Qualify scope, budget, and launch date",
    },
    session,
  );
  await adminQuery("UPDATE contact_submissions SET state='converted', lead_id=$2 WHERE id=$1", [id, lead.id]);
  await appendAudit(session, "contact_submission.converted", "contact_submission", id, undefined, { leadId: lead.id });
  return lead;
}

export function adminExportCsv(snapshot: AdminSnapshot) {
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lines = [
    ["entity", "id", "name_or_number", "status", "currency", "value"],
    ...snapshot.clients.map((client) => ["client", client.id, client.name, client.state, client.currency, ""]),
    ...snapshot.leads.map((lead) => ["lead", lead.id, lead.companyName, lead.stage, lead.currency, lead.estimatedValue]),
    ...snapshot.projects.map((project) => ["project", project.id, project.name, project.status, project.currency, project.commercialValue]),
    ...snapshot.documents.map((document) => ["billing_document", document.id, document.documentNumber, document.status, document.currency, calculateDocumentTotals(document, snapshot.payments).total]),
  ];
  return lines.map((line) => line.map(escape).join(",")).join("\n");
}
