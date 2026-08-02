import "server-only";

import { adminQuery, isAdminDatabaseConfigured } from "@/features/admin/db";
import { createLearnRepository } from "./repository";

const repository = createLearnRepository({ query: adminQuery });

export async function listReviewedCourseCatalogue(search?: string) {
  // A local build has no course database. A deployed Learn runtime must run
  // the reviewed migration before it receives traffic; query errors must not
  // be reinterpreted as an empty catalogue.
  if (!isAdminDatabaseConfigured()) return [];
  return repository.listPublishedCourses(search);
}
