import { notFound, redirect } from "next/navigation";
import { CourseHome } from "@/features/learn/components/course-home";
import { LessonPlayer } from "@/features/learn/components/lesson-player";
import { loadLearnerBlockPositions, loadPublishedCourseForRequest, loadPublishedLessonForRequest } from "@/features/learn/course-delivery.server";
import { getLearnerSession } from "@/features/learn/learner-auth.server";

export const metadata = { title: "Lesson", robots: { index: false, follow: false } };

export default async function LearnLessonPage({ params }: { params: Promise<{ courseSlug: string; lessonSlug: string }> }) {
  const { courseSlug, lessonSlug } = await params;
  const learner = await getLearnerSession();
  const [courseResult, lesson] = await Promise.all([
    loadPublishedCourseForRequest({ slug: courseSlug, learnerId: learner?.learnerId }),
    loadPublishedLessonForRequest({ courseSlug, lessonSlug }),
  ]);
  if (!courseResult || !lesson) notFound();
  if (!courseResult.access.allowed) {
    if (courseResult.access.reason === "sign_in_required") redirect("/sign-in");
    return <CourseHome course={courseResult.course} progress={[]} deniedReason={courseResult.access.reason} />;
  }
  const positions = learner && courseResult.access.mode === "full"
    ? await loadLearnerBlockPositions({ learnerId: learner.learnerId, versionId: lesson.course.versionId, lessonId: lesson.lesson.id })
    : [];
  const allLessons = courseResult.course.modules.flatMap((module) => module.lessons);
  const index = allLessons.findIndex((item) => item.id === lesson.lesson.id);
  const previous = index > 0 ? allLessons[index - 1] : undefined;
  const next = index >= 0 ? allLessons[index + 1] : undefined;
  return <LessonPlayer lesson={{ ...lesson, navigation: { previous: previous ? { slug: previous.slug, title: previous.title } : undefined, next: next ? { slug: next.slug, title: next.title } : undefined } }} progressEnabled={Boolean(learner && courseResult.access.mode === "full")} resumePositions={Object.fromEntries(positions.map((entry) => [entry.stableBlockId, entry.position]))} />;
}
