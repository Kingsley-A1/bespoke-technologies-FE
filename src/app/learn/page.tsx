import type { Metadata } from "next";
import { LearnHome } from "@/features/learn/components/learn-home";
import { learnCanonicalUrl } from "@/features/learn/metadata";
import { listReviewedCourseCatalogue } from "@/features/learn/public-courses.server";

export const metadata: Metadata = {
  title: "Bespoke Learn",
  alternates: { canonical: learnCanonicalUrl("/") },
};

export default async function LearnPage() {
  const courses = await listReviewedCourseCatalogue();
  return <LearnHome publishedCourseCount={courses.length} />;
}
