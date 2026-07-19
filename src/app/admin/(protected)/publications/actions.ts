"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminPermission } from "@/features/admin/access";
import { deletePublication, setPublicationStatus } from "@/features/admin/publications/repository";
import { deleteR2Object, isR2Configured } from "@/lib/storage/r2";

function revalidatePublications() {
  revalidatePath("/admin/publications");
  revalidatePath("/library");
  revalidatePath("/");
}

export async function setPublicationStatusAction(formData: FormData) {
  const session = await requireAdminPermission("publications.manage");
  const { id, status } = z
    .object({
      id: z.string().uuid(),
      status: z.enum(["draft", "published", "archived"]),
    })
    .parse(Object.fromEntries(formData));
  await setPublicationStatus(id, status, session);
  revalidatePublications();
}

export async function deletePublicationAction(formData: FormData) {
  const session = await requireAdminPermission("publications.manage");
  const { id } = z.object({ id: z.string().uuid() }).parse(Object.fromEntries(formData));
  const { coverKey, documentKey } = await deletePublication(id, session);
  if (isR2Configured()) {
    if (coverKey) await deleteR2Object(coverKey).catch(() => undefined);
    if (documentKey) await deleteR2Object(documentKey).catch(() => undefined);
  }
  revalidatePublications();
}
