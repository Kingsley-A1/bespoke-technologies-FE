export type AdminRole = "founder_admin" | "admin_manager";
export type AdminUserState = "invited" | "active" | "suspended";
export type CurrencyCode = "NGN" | "USD" | "GBP" | "EUR";
export type LeadStage = "new" | "qualified" | "discovery" | "proposal" | "negotiation" | "won" | "lost" | "archived";
export type ProjectStatus = "planned" | "active" | "blocked" | "review" | "completed" | "on_hold" | "cancelled";
export type ProjectHealth = "on_track" | "at_risk" | "off_track";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";
export type BillingDocumentType = "standard" | "proforma" | "recurring";
export type BillingStatus = "draft" | "pending_approval" | "approved" | "sent" | "viewed" | "partially_paid" | "paid" | "overdue" | "voided" | "accepted" | "expired";
export type RecurrenceFrequency = "weekly" | "monthly" | "quarterly" | "yearly";
export type ApprovalState = "pending" | "approved" | "rejected";

export type AdminPermission =
  | "dashboard.view"
  | "crm.manage"
  | "projects.manage"
  | "billing.manage"
  | "billing.issue"
  | "payments.record"
  | "payments.reverse"
  | "billing.void"
  | "reports.view"
  | "audit.view"
  | "users.manage"
  | "settings.manage"
  | "exports.all"
  | "approvals.resolve"
  | "publications.manage"
  | "reviews.manage";

export type PublicationKind = "handover" | "book" | "research";
export type PublicationStatus = "draft" | "published" | "archived";
export type PublicationCardVariant = "standard" | "field-guide" | "playbook" | "deep-dive";

export interface Publication {
  id: string;
  kind: PublicationKind;
  title: string;
  slug: string;
  summary?: string;
  coverKey?: string;
  coverUrl?: string;
  documentKey?: string;
  documentMime: string;
  pageCount?: number;
  clientLabel?: string;
  projectLabel?: string;
  authorLabel?: string;
  priceAmount?: number;
  priceCurrency: CurrencyCode;
  isFree: boolean;
  cardVariant: PublicationCardVariant;
  status: PublicationStatus;
  isDownloadable: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReviewStatus = "pending" | "published" | "archived";

export interface Review {
  id: string;
  reviewerName: string;
  projectName: string;
  projectUrl?: string;
  body: string;
  rating: number;
  logoKey?: string;
  logoMime?: string;
  status: ReviewStatus;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: AdminRole;
  state: AdminUserState;
  lastLoginAt?: string;
  enrolledAt?: string;
}

export interface AdminSession {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: AdminRole;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt?: string;
}

export interface ClientContact {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  isBilling: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  currency: CurrencyCode;
  paymentTermsDays: number;
  state: "active" | "archived";
  contacts: ClientContact[];
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  service: string;
  source: string;
  stage: LeadStage;
  estimatedValue: number;
  currency: CurrencyCode;
  ownerUserId?: string;
  nextAction: string;
  nextActionAt?: string;
  lostReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  actorUserId?: string;
  type: string;
  body: string;
  createdAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  dueDate?: string;
  state: "pending" | "in_progress" | "completed" | "blocked";
  ownerUserId?: string;
}

export interface Project {
  id: string;
  clientId: string;
  leadId?: string;
  name: string;
  service: string;
  summary: string;
  ownerUserId?: string;
  status: ProjectStatus;
  health: ProjectHealth;
  priority: Priority;
  commercialValue: number;
  currency: CurrencyCode;
  startDate?: string;
  dueDate?: string;
  milestones: ProjectMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminTask {
  id: string;
  projectId?: string;
  title: string;
  assigneeUserId?: string;
  priority: Priority;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  discountRate: number;
  taxRate: number;
}

export interface ClientSnapshot {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
}

export interface CompanySnapshot {
  name: string;
  website: string;
  phone: string;
  email: string;
  registrationNumber: string;
  motto: string;
  address: string;
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate?: string;
  nextRunDate: string;
  autoIssue: boolean;
  state: "draft" | "active" | "paused" | "ended" | "failed";
  lastRunAt?: string;
  lastError?: string;
}

export interface BillingDocument {
  id: string;
  documentNumber: string;
  type: BillingDocumentType;
  status: BillingStatus;
  clientId: string;
  projectId?: string;
  parentDocumentId?: string;
  client: ClientSnapshot;
  company: CompanySnapshot;
  issueDate: string;
  dueDate: string;
  currency: CurrencyCode;
  items: BillingItem[];
  notes: string;
  terms: string;
  paymentInstructions: string;
  purchaseOrder: string;
  recurrence?: RecurrenceRule;
  parentRecurringId?: string;
  revision: number;
  issuedAt?: string;
  voidedAt?: string;
  voidReason?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingEvent {
  id: string;
  documentId: string;
  actorUserId?: string;
  type: string;
  fromStatus?: BillingStatus;
  toStatus?: BillingStatus;
  detail?: Record<string, unknown>;
  createdAt: string;
}

export interface RecurringRun {
  id: string;
  scheduleId: string;
  templateDocumentId: string;
  generatedDocumentId?: string;
  dueDate: string;
  state: "started" | "completed" | "failed";
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Payment {
  id: string;
  clientId: string;
  documentId: string;
  amount: number;
  currency: CurrencyCode;
  paidAt: string;
  method: string;
  reference: string;
  note: string;
  state: "recorded" | "reversed";
  recordedBy?: string;
  reversedAt?: string;
  reversalReason?: string;
}

export interface ApprovalRequest {
  id: string;
  requestedBy: string;
  action: string;
  entityType: string;
  entityId: string;
  reason: string;
  state: ApprovalState;
  resolvedBy?: string;
  resolutionNote?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  actorUserId?: string;
  actorLabel: string;
  action: string;
  entityType: string;
  entityId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  message: string;
  state: "new" | "triaged" | "converted" | "archived";
  submittedAt: string;
}

export interface CompanySettings extends CompanySnapshot {
  defaultCurrency: CurrencyCode;
  defaultPaymentTermsDays: number;
  paymentInstructions: string;
  invoiceApprovalThreshold: number;
  updatedAt: string;
}

export interface AdminSnapshot {
  users: AdminUser[];
  clients: Client[];
  leads: Lead[];
  leadActivities: LeadActivity[];
  projects: Project[];
  tasks: AdminTask[];
  documents: BillingDocument[];
  billingEvents: BillingEvent[];
  recurringRuns: RecurringRun[];
  payments: Payment[];
  approvals: ApprovalRequest[];
  audits: AuditEvent[];
  submissions: ContactSubmission[];
  settings: CompanySettings;
}

export interface InvoiceTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
}
