"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPermission } from "@/features/admin/access";
import {
  addDigitalAuditNote,
  convertDigitalAuditToLead,
  manageDigitalAudit,
  regenerateDigitalAuditShare,
  revokeDigitalAuditShare,
} from "@/features/digital-audits/repository";
import {
  addDigitalAuditNoteSchema,
  manageDigitalAuditSchema,
} from "@/features/digital-audits/schema";
import { createDigitalAuditToken } from "@/features/digital-audits/security";

export async function manageDigitalAuditAction(formData: FormData) {
  const session = await requireAdminPermission("digital_audits.manage");
  const input = manageDigitalAuditSchema.parse(Object.fromEntries(formData));
  await manageDigitalAudit(
    input.id,
    input.managementState,
    input.ownerUserId || undefined,
    session,
  );
  revalidatePath("/admin/digital-audits");
  revalidatePath(`/admin/digital-audits/${input.id}`);
}

export async function addDigitalAuditNoteAction(formData: FormData) {
  const session = await requireAdminPermission("digital_audits.manage");
  const input = addDigitalAuditNoteSchema.parse(Object.fromEntries(formData));
  await addDigitalAuditNote(input.id, input.body, session);
  revalidatePath(`/admin/digital-audits/${input.id}`);
}

export async function convertDigitalAuditAction(formData: FormData) {
  const session = await requireAdminPermission("digital_audits.manage");
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid digital audit.");
  await convertDigitalAuditToLead(id, session);
  revalidatePath("/admin");
  revalidatePath("/admin/digital-audits");
  revalidatePath(`/admin/digital-audits/${id}`);
  revalidatePath("/admin/sales");
}

export async function revokeDigitalAuditShareAction(formData: FormData) {
  const session = await requireAdminPermission("digital_audits.manage");
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid digital audit.");
  await revokeDigitalAuditShare(id, session);
  revalidatePath(`/admin/digital-audits/${id}`);
}

export async function regenerateDigitalAuditShareAction(formData: FormData) {
  const session = await requireAdminPermission("digital_audits.manage");
  const id = String(formData.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid digital audit.");
  await regenerateDigitalAuditShare(id, createDigitalAuditToken(24), session);
  revalidatePath(`/admin/digital-audits/${id}`);
}
