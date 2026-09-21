"use server";

import { requireAdminPermission } from "@/features/admin/access";
import {
  addIdeaGateNote,
  convertIdeaGateToLead,
  manageIdeaGate,
  regenerateIdeaGateShare,
  revokeIdeaGateShare,
} from "@/features/idea-gate/repository";
import { addIdeaGateNoteSchema, manageIdeaGateSchema } from "@/features/idea-gate/schema";
import { createIdeaGateToken } from "@/features/idea-gate/security";
import { revalidatePath } from "next/cache";

function assessmentId(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid assessment.");
  return id;
}

export async function manageIdeaGateAction(formData: FormData) {
  const session = await requireAdminPermission("idea_gates.manage");
  const input = manageIdeaGateSchema.parse(Object.fromEntries(formData));
  await manageIdeaGate(
    input.id,
    input.managementState,
    input.ownerUserId || undefined,
    session,
  );
  revalidatePath("/admin/idea-gates");
  revalidatePath(`/admin/idea-gates/${input.id}`);
}

export async function addIdeaGateNoteAction(formData: FormData) {
  const session = await requireAdminPermission("idea_gates.manage");
  const input = addIdeaGateNoteSchema.parse(Object.fromEntries(formData));
  await addIdeaGateNote(input.id, input.body, session);
  revalidatePath(`/admin/idea-gates/${input.id}`);
}

export async function convertIdeaGateAction(formData: FormData) {
  const session = await requireAdminPermission("idea_gates.manage");
  const id = assessmentId(formData);
  await convertIdeaGateToLead(id, session);
  revalidatePath("/admin");
  revalidatePath("/admin/idea-gates");
  revalidatePath(`/admin/idea-gates/${id}`);
  revalidatePath("/admin/sales");
}

export async function revokeIdeaGateShareAction(formData: FormData) {
  const session = await requireAdminPermission("idea_gates.manage");
  const id = assessmentId(formData);
  await revokeIdeaGateShare(id, session);
  revalidatePath(`/admin/idea-gates/${id}`);
}

export async function regenerateIdeaGateShareAction(formData: FormData) {
  const session = await requireAdminPermission("idea_gates.manage");
  const id = assessmentId(formData);
  await regenerateIdeaGateShare(id, createIdeaGateToken(24), session);
  revalidatePath(`/admin/idea-gates/${id}`);
}
