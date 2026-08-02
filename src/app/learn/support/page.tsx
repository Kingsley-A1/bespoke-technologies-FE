import type { Metadata } from "next";
import { learnCanonicalUrl } from "@/features/learn/metadata";

export const metadata: Metadata = {
  title: "Support",
  alternates: { canonical: learnCanonicalUrl("/support") },
};

export default function LearnSupportPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ktf-blue">Bespoke Learn support</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-ktf-navy sm:text-4xl">Help with learning access</h1>
      <div className="mt-10 space-y-5">
        <article className="border-b border-ktf-gray-200 pb-5"><h2 className="text-lg font-semibold text-ktf-navy">How do I access a course?</h2><p className="mt-2 leading-7 text-ktf-gray-600">Sign in with your verified email. Course access is determined by the course policy and any access grant associated with your learner account.</p></article>
        <article className="border-b border-ktf-gray-200 pb-5"><h2 className="text-lg font-semibold text-ktf-navy">Why is the catalogue empty?</h2><p className="mt-2 leading-7 text-ktf-gray-600">Courses appear only after their content has completed review and has been published by Bespoke Technologies.</p></article>
        <article className="border-b border-ktf-gray-200 pb-5"><h2 className="text-lg font-semibold text-ktf-navy">Need help with your sign-in email?</h2><p className="mt-2 leading-7 text-ktf-gray-600">Request a new verification code from the sign-in page. Each new request replaces the earlier code.</p></article>
      </div>
    </section>
  );
}
