export type DigitalAuditQuestionId =
  | "presence"
  | "acquisition"
  | "operations"
  | "data"
  | "ai"
  | "security";

export type DigitalAuditMaturity = 0 | 1 | 2 | 3;
export type DigitalAuditStatus = "started" | "in_progress" | "completed" | "archived";
export type DigitalAuditManagementState =
  | "new"
  | "reviewed"
  | "contacted"
  | "converted"
  | "closed";
export type DigitalAuditTier =
  | "Foundational"
  | "Emerging"
  | "Operational"
  | "Advanced"
  | "Leading";

export type DigitalAuditAnswers = Partial<
  Record<DigitalAuditQuestionId, DigitalAuditMaturity>
>;

export interface DigitalAuditDimensionResult {
  id: DigitalAuditQuestionId;
  label: string;
  short: string;
  maturity: DigitalAuditMaturity;
  score: number;
}

export interface DigitalAuditResult {
  overall: number;
  tier: DigitalAuditTier;
  interpretation: string;
  dimensions: DigitalAuditDimensionResult[];
  weakest: DigitalAuditDimensionResult[];
  strongest: DigitalAuditDimensionResult | null;
}

export interface DigitalAuditRecord {
  id: string;
  businessName: string;
  industry: string;
  teamSize: string;
  email?: string;
  phone?: string;
  contactConsent: boolean;
  shareBusinessName: boolean;
  status: DigitalAuditStatus;
  managementState: DigitalAuditManagementState;
  progressCount: number;
  definitionVersion: string;
  scoringVersion: string;
  overallScore?: number;
  tier?: DigitalAuditTier;
  result?: DigitalAuditResult;
  shareToken?: string;
  leadId?: string;
  ownerUserId?: string;
  source: string;
  attribution?: Record<string, string>;
  startedAt: string;
  lastActivityAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  answers: DigitalAuditAnswers;
}

export interface DigitalAuditNote {
  id: string;
  auditId: string;
  actorUserId: string;
  actorLabel: string;
  body: string;
  createdAt: string;
}

export interface DigitalAuditSummary {
  id: string;
  businessName: string;
  industry: string;
  teamSize: string;
  email?: string;
  phone?: string;
  contactConsent: boolean;
  status: DigitalAuditStatus;
  managementState: DigitalAuditManagementState;
  progressCount: number;
  overallScore?: number;
  tier?: DigitalAuditTier;
  leadId?: string;
  ownerUserId?: string;
  lastActivityAt: string;
  completedAt?: string;
  createdAt: string;
}
