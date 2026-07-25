import { z } from "zod";
import {
  DIGITAL_AUDIT_INDUSTRIES,
  DIGITAL_AUDIT_QUESTIONS,
  DIGITAL_AUDIT_TEAM_SIZES,
} from "./definition";

const optionalEmail = z.union([z.email().max(240), z.literal("")]).default("");
const optionalPhone = z.string().trim().max(40).default("");

export const createDigitalAuditSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  industry: z.enum(DIGITAL_AUDIT_INDUSTRIES),
  teamSize: z.enum(DIGITAL_AUDIT_TEAM_SIZES),
  email: optionalEmail,
  phone: optionalPhone,
  contactConsent: z.boolean().default(false),
  shareBusinessName: z.boolean().default(true),
  website: z.string().max(0).optional().default(""),
  turnstileToken: z.string().max(4000).optional().default(""),
  source: z.string().trim().max(80).optional().default("website"),
  attribution: z
    .record(z.string(), z.string().trim().max(240))
    .optional()
    .default({}),
});

export const saveDigitalAuditAnswerSchema = z.object({
  questionId: z.enum(
    DIGITAL_AUDIT_QUESTIONS.map((question) => question.id) as [
      (typeof DIGITAL_AUDIT_QUESTIONS)[number]["id"],
      ...(typeof DIGITAL_AUDIT_QUESTIONS)[number]["id"][],
    ],
  ),
  optionIndex: z.number().int().min(0).max(3),
});

export const manageDigitalAuditSchema = z.object({
  id: z.string().uuid(),
  managementState: z.enum(["new", "reviewed", "contacted", "converted", "closed"]),
  ownerUserId: z.union([z.string().uuid(), z.literal("")]).optional(),
});

export const addDigitalAuditNoteSchema = z.object({
  id: z.string().uuid(),
  body: z.string().trim().min(2).max(1500),
});
