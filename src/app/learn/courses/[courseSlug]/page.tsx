import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CourseDetail } from "@/features/learn/components/course-detail";
import { loadPublishedCourseForRequest } from "@/features/learn/course-delivery.server";
import { getLearnerSession } from "@/features/learn/learner-auth.server";
import { learnCanonicalUrl } from "@/features/learn/metadata";

export async function generateMetadata({ params }: { params: Promise<{ courseSlug: string }> }): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = await loadPublishedCourseForRequest({ slug: courseSlug });
  if (!course) return { title: "Course not found", robots: { index: false, follow: false } };
  return { title: course.course.title, description: course.course.summary, alternates: { canonical: learnCanonicalUrl(`/courses/${courseSlug}`) } };
}

export default async function LearnCourseDetailPage({ params }: { params: Promise<{ courseSlug: string }> }) {
  const { courseSlug } = await params;
  const learner = await getLearnerSession();
  const result = await loadPublishedCourseForRequest({ slug: courseSlug, learnerId: learner?.learnerId });
  if (!result) notFound();
  return <CourseDetail course={result.course} access={result.access} />;
}
