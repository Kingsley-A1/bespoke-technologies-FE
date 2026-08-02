import { redirect } from "next/navigation";
import { LearnerDashboard } from "@/features/learn/components/learner-dashboard";
import { loadLearnerDashboardCourses } from "@/features/learn/course-delivery.server";
import { getLearnerSession } from "@/features/learn/learner-auth.server";

export const metadata = { title: "Your learning", robots: { index: false, follow: false } };

export default async function LearnDashboardPage() {
  const session = await getLearnerSession();
  if (!session) redirect("/sign-in");
  const courses = await loadLearnerDashboardCourses(session.learnerId);
  return <LearnerDashboard learnerEmail={session.email} courses={courses} />;
}
