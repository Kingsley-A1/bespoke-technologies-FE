import type { Metadata } from "next";
import { CourseCatalogue } from "@/features/learn/components/course-catalogue";
import { learnCanonicalUrl } from "@/features/learn/metadata";
import { listReviewedCourseCatalogue } from "@/features/learn/public-courses.server";

export const metadata: Metadata = {
  title: "Courses",
  description: "Reviewed courses from Bespoke Learn.",
  alternates: { canonical: learnCanonicalUrl("/courses") },
};

export default async function LearnCoursesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const courses = await listReviewedCourseCatalogue(q);
  return <CourseCatalogue courses={courses} query={q ?? ""} />;
}
