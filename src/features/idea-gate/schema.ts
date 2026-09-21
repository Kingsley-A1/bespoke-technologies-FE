import { z } from "zod";
import {
  IDEA_GATE_OWNER_ROLES,
  IDEA_GATE_QUESTIONS,
  IDEA_GATE_STAGES,
} from "./definition";

const gateIds = IDEA_GATE_QUESTIONS.map((gate) => gate.id) as [
  (typeof IDEA_GATE_QUESTIONS)[number]["id"],
  ...(typeof IDEA_GATE_QUESTIONS)[number]["id"][],
];

const optionalEmail = z.union([z.email().max(240), z.literal("")]).default("");
const optionalPhone = z.string().trim().max(40).default("");

export const createIdeaGateSchema = z.object({
  ideaTitle: z.string().trim().min(3).max(160),
  ideaSummary: z.string().trim().min(20).max(2000),
  ideaStage: z.enum(IDEA_GATE_STAGES),
  ownerRole: z.enum(IDEA_GATE_OWNER_ROLES),
  // Honeypot: a real person never fills this.
  website: z.string().max(0).optional().default(""),
  source: z.string().trim().max(80).optional().default("website"),
  attribution: z.record(z.string(), z.string().trim().max(240)).optional().default({}),
});

export const saveIdeaGateAnswerSchema = z.object({
  gateId: z.enum(gateIds),
  optionIndex: z.number().int().min(0).max(2),
  evidence: z.string().trim().max(1200).optional().default(""),
});

export const saveIdeaGateContactSchema = z.object({
  contactName: z.string().trim().max(160).optional().default(""),
  email: optionalEmail,
  phone: optionalPhone,
  contactConsent: z.boolean().default(false),
  shareIdeaTitle: z.boolean().default(true),
  sendReport: z.boolean().default(false),
});

export const manageIdeaGateSchema = z.object({
  id: z.string().uuid(),
  managementState: z.enum(["new", "reviewed", "contacted", "converted", "closed"]),
  ownerUserId: z.union([z.string().uuid(), z.literal("")]).optional(),
});

export const addIdeaGateNoteSchema = z.object({
  id: z.string().uuid(),
  body: z.string().trim().min(2).max(1500),
});
