export type IdeaGateId =
  | "problem"
  | "user"
  | "timing"
  | "commercial"
  | "market"
  | "reach"
  | "feasibility"
  | "mvp"
  | "firstBuild"
  | "advantage";

/** Framework scoring: 0 = no evidence, 1 = weak evidence, 2 = strong evidence. */
export type IdeaGateScore = 0 | 1 | 2;

export type IdeaGateDecision = "green" | "amber" | "red";
export type IdeaGateStatus = "started" | "in_progress" | "completed" | "archived";
export type IdeaGateManagementState =
  | "new"
  | "reviewed"
  | "contacted"
  | "converted"
  | "closed";

/** Whether the narrative was written by the framework alone or interpreted with AI help. */
export type IdeaGateAnalysisSource = "framework" | "assisted";

export interface IdeaGateAnswer {
  score: IdeaGateScore;
  optionIndex: number;
  evidence: string;
}

export type IdeaGateAnswers = Partial<Record<IdeaGateId, IdeaGateAnswer>>;

export interface IdeaGateBreakdownEntry {
  id: IdeaGateId;
  number: number;
  label: string;
  question: string;
  score: IdeaGateScore;
  optionLabel: string;
  verdict: "pass" | "refine" | "missing";
  evidence: string;
}

export interface IdeaGateResult {
  totalScore: number;
  maxScore: number;
  gatesPassed: number;
  decision: IdeaGateDecision;
  headline: string;
  condition: string;
  action: string;
  breakdown: IdeaGateBreakdownEntry[];
  strengths: IdeaGateBreakdownEntry[];
  gaps: IdeaGateBreakdownEntry[];
  /** Gates that trigger the framework's mandatory kill switches. */
  criticalGaps: IdeaGateBreakdownEntry[];
}

export interface IdeaGateAnalysis {
  source: IdeaGateAnalysisSource;
  summary: string;
  strengths: string[];
  gaps: string[];
  risks: string[];
  mvp: string;
  firstBuild: string;
  nextActions: string[];
}

export interface IdeaGateRecord {
  id: string;
  ideaTitle: string;
  ideaSummary: string;
  ideaStage: string;
  ownerRole: string;
  contactName?: string;
  email?: string;
  phone?: string;
  contactConsent: boolean;
  shareIdeaTitle: boolean;
  status: IdeaGateStatus;
  managementState: IdeaGateManagementState;
  progressCount: number;
  definitionVersion: string;
  scoringVersion: string;
  totalScore?: number;
  gatesPassed?: number;
  decision?: IdeaGateDecision;
  result?: IdeaGateResult;
  analysis?: IdeaGateAnalysis;
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
  answers: IdeaGateAnswers;
}

export interface IdeaGateSummary {
  id: string;
  ideaTitle: string;
  ideaStage: string;
  ownerRole: string;
  contactName?: string;
  email?: string;
  phone?: string;
  contactConsent: boolean;
  status: IdeaGateStatus;
  managementState: IdeaGateManagementState;
  progressCount: number;
  totalScore?: number;
  gatesPassed?: number;
  decision?: IdeaGateDecision;
  shareToken?: string;
  leadId?: string;
  ownerUserId?: string;
  lastActivityAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface IdeaGateNote {
  id: string;
  gateId: string;
  actorUserId: string;
  actorLabel: string;
  body: string;
  createdAt: string;
}
