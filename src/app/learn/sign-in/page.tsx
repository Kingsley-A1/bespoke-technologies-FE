import type { Metadata } from "next";
import { LearnerSignInForm } from "@/features/learn/components/learner-sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LearnSignInPage() {
  return <LearnerSignInForm />;
}
