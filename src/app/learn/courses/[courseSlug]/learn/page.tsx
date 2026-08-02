import { notFound, redirect } from "next/navigation";
import { CourseHome } from "@/features/learn/components/course-home";
import { loadLearnerLessonStates, loadPublishedCourseForRequest } from "@/features/learn/course-delivery.server";
import { getLearnerSession } from "@/features/learn/learner-auth.server";

export const metadata = { title: "Course learning", robots: { index: false, follow: false } };

export default async function LearnCourseHomePage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const learner = await getLearnerSession();
  const result = await loadPublishedCourseForRequest({ slug: courseSlug, learnerId: learner?.learnerId });
  if (!result) notFound();
  if (!result.access.allowed) {
    if (result.access.reason === "sign_in_required") redirect("/sign-in");
    return <CourseHome course={result.course} progress={[]} deniedReason={result.access.reason} />;
  }
  const progress = learner && result.access.mode === "full"
    ? await loadLearnerLessonStates({ learnerId: learner.learnerId, versionId: result.course.versionId })
    : [];
  return <CourseHome course={result.course} progress={progress} />;
}
