import { z } from "zod";
import { BILLING_DOCUMENT_TYPES } from "./document-types";

const itemSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(180),
  description: z.string().trim().max(600),
  quantity: z.number().positive().max(1_000_000),
  rate: z.number().min(0).max(1_000_000_000_000),
  discountRate: z.number().min(0).max(100),
  taxRate: z.number().min(0).max(100),
});

export const billingInputSchema = z.object({
  type: z.enum(BILLING_DOCUMENT_TYPES),
  customTypeLabel: z.string().trim().max(120).optional(),
  clientId: z.string().uuid().optional(),
  clientName: z.string().trim().min(2).max(160).optional(),
  projectId: z.string().uuid().optional(),
  projectName: z.string().trim().min(2).max(180).optional(),
  issueDate: z.iso.date(),
  dueDate: z.iso.date(),
  currency: z.enum(["NGN", "USD", "GBP", "EUR"]),
  items: z.array(itemSchema).min(1).max(50),
  notes: z.string().trim().max(1200),
  terms: z.string().trim().max(1200),
  paymentInstructions: z.string().trim().max(2000),
  purchaseOrder: z.string().trim().max(120),
  valueLabel: z.string().trim().max(120).optional(),
  recurrence: z.object({
    frequency: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
    startDate: z.iso.date(),
    endDate: z.iso.date().optional(),
    nextRunDate: z.iso.date(),
    autoIssue: z.boolean(),
    state: z.enum(["draft", "active", "paused", "ended", "failed"]),
  }).optional(),
}).superRefine((value, context) => {
  if (!value.clientId && !value.clientName) context.addIssue({ code: "custom", message: "Choose a client or enter a new client name.", path: ["clientId"] });
  if (value.clientId && value.clientName) context.addIssue({ code: "custom", message: "Choose an existing client or enter a new one, not both.", path: ["clientId"] });
  if (value.projectId && value.projectName) context.addIssue({ code: "custom", message: "Choose an existing project or enter a new one, not both.", path: ["projectId"] });
  if (value.type === "other" && !value.customTypeLabel?.trim()) context.addIssue({ code: "custom", message: "Enter the custom invoice type.", path: ["customTypeLabel"] });
  if (value.type === "recurring" && !value.recurrence) context.addIssue({ code: "custom", message: "Choose a recurring schedule.", path: ["recurrence"] });
  if (value.type !== "recurring" && value.recurrence) context.addIssue({ code: "custom", message: "Only recurring templates can include a schedule.", path: ["recurrence"] });
  if (value.dueDate < value.issueDate) context.addIssue({ code: "custom", message: "Due date cannot be before issue date.", path: ["dueDate"] });
});
