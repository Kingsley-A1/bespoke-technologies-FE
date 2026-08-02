import { requireAdminPermission } from "@/features/admin/access";
import { AdminLearnWorkspace } from "@/features/learn/components/admin-learn-workspace";
import { listAdminLearnCourses } from "@/features/learn/admin-authoring.server";
import { createLearnCourseAction } from "./actions";

export default async function AdminLearnPage() {
  await requireAdminPermission("learn.manage");
  const courses = await listAdminLearnCourses();
  return <AdminLearnWorkspace courses={courses} createAction={createLearnCourseAction} />;
}
