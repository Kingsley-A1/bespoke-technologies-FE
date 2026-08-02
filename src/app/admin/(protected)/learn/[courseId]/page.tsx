import { notFound } from "next/navigation";
import { requireAdminPermission } from "@/features/admin/access";
import { getAdminLearnCourse } from "@/features/learn/admin-authoring.server";
import { AdminCourseEditor } from "@/features/learn/components/admin-course-editor";
import { addLearnAuthorAction, addLearnBlockAction, addLearnLessonAction, addLearnModuleAction, archiveLearnCourseAction, duplicateLearnBlockAction, forkLearnCourseVersionAction, grantLearnAccessAction, moveLearnDraftItemAction, publishLearnCourseAction, removeLearnBlockAction, revokeLearnAccessAction, updateLearnBlockAction, updateLearnCourseAction, validateLearnCourseAction } from "../actions";

export default async function AdminLearnCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  await requireAdminPermission("learn.manage");
  const { courseId } = await params;
  const course = await getAdminLearnCourse(courseId);
  if (!course) notFound();
  return <AdminCourseEditor course={course} addModuleAction={addLearnModuleAction} addLessonAction={addLearnLessonAction} addBlockAction={addLearnBlockAction} updateBlockAction={updateLearnBlockAction} duplicateBlockAction={duplicateLearnBlockAction} removeBlockAction={removeLearnBlockAction} moveItemAction={moveLearnDraftItemAction} addAuthorAction={addLearnAuthorAction} updateCourseAction={updateLearnCourseAction} validateAction={validateLearnCourseAction} publishAction={publishLearnCourseAction} forkVersionAction={forkLearnCourseVersionAction} archiveAction={archiveLearnCourseAction} grantAccessAction={grantLearnAccessAction} revokeAccessAction={revokeLearnAccessAction} />;
}
