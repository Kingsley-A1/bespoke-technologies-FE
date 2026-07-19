"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminPermission } from "@/features/admin/access";
import { deleteReview, setReviewStatus } from "@/features/admin/reviews/repository";
import { deleteR2Object, isR2Configured } from "@/lib/storage/r2";

function revalidateReviews() {
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
}

export async function setReviewStatusAction(formData: FormData) {
  const session = await requireAdminPermission("reviews.manage");
  const { id, status } = z
    .object({
      id: z.string().uuid(),
      status: z.enum(["pending", "published", "archived"]),
    })
    .parse(Object.fromEntries(formData));
  await setReviewStatus(id, status, session);
  revalidateReviews();
}

export async function deleteReviewAction(formData: FormData) {
  const session = await requireAdminPermission("reviews.manage");
  const { id } = z.object({ id: z.string().uuid() }).parse(Object.fromEntries(formData));
  const result = await deleteReview(id, session);
  if (result?.logoKey && isR2Configured()) {
    await deleteR2Object(result.logoKey).catch(() => undefined);
  }
  revalidateReviews();
}
