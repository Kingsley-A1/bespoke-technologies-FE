import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui";
import { ShareButton } from "@/components/ui/share-button";
import { Container } from "@/components/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { ReviewCard } from "@/components/marketing/review-card";
import { Reveal } from "@/components/marketing/motion-reveal";
import { listPublishedReviewsSafe } from "@/features/admin/reviews/repository";
import { SITE_NAME } from "@/lib/constants";
import { absoluteUrl, SITE_ORIGIN } from "@/lib/seo";
import { ReviewForm } from "./review-form";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reviews",
  description: `Client reviews for ${SITE_NAME}. We publish verified feedback from real projects as clients share it.`,
  alternates: {
    canonical: "/reviews",
  },
};

export default async function ReviewsPage() {
  const reviews = await listPublishedReviewsSafe();
  const hasReviews = reviews.length > 0;
  const averageRating = hasReviews
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : 0;

  const aggregateJsonLd = hasReviews
    ? {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_ORIGIN,
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: Number(averageRating.toFixed(1)),
          reviewCount: reviews.length,
          bestRating: 5,
          worstRating: 1,
        },
        review: reviews.slice(0, 10).map((review) => ({
          "@type": "Review",
          author: { "@type": "Person", name: review.reviewerName },
          reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5 },
          reviewBody: review.body,
          url: absoluteUrl(`/reviews/${review.id}`),
        })),
      }
    : null;

  return (
    <>
      {aggregateJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateJsonLd) }}
        />
      )}

      <PageHero
        label="Client reviews"
        title="Proof shaped by the work and the relationship."
        description="Read how clients describe the product quality, technical depth, communication, and long-term value behind our delivery."
        variant="reviews"
        primaryAction={{ label: "Share Your Review", href: "#share-your-review" }}
        secondaryAction={{ label: "See Our Work", href: "/projects" }}
      />

      {/* ── Reviews ──────────────────────────────────────────── */}
      <section id="client-reviews" className="scroll-mt-20 bg-ktf-surface py-20 sm:py-24">
        <Container size="lg">
          {hasReviews ? (
            <>
              <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-overline font-bold uppercase tracking-[0.2em] text-ktf-blue-deep">
                    Verified feedback
                  </p>
                  <h2 className="mt-3 text-h3 font-bold tracking-tight text-ktf-navy">
                    {averageRating.toFixed(1)} / 5 across {reviews.length}{" "}
                    {reviews.length === 1 ? "review" : "reviews"}
                  </h2>
                </div>
                <p className="max-w-md text-body-sm leading-body text-ktf-gray-600">
                  Every review is submitted by the client and verified against a
                  real engagement before publishing.
                </p>
              </Reveal>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-xl rounded-lg border border-ktf-gray-200 bg-white p-10 text-center shadow-card sm:p-14">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-ktf-blue/10 text-ktf-blue-deep">
                <MessageSquarePlus className="h-7 w-7" aria-hidden="true" />
              </span>
              <h2 className="mt-6 text-h4 font-bold tracking-tight text-ktf-navy">
                Verified client reviews are on the way.
              </h2>
              <p className="mt-4 text-body leading-body text-ktf-gray-600">
                We only publish feedback from real, completed engagements. If we
                built with you, share your experience below — it will appear here
                once verified.
              </p>
            </div>
          )}
        </Container>
      </section>

      {/* ── Submit a review ──────────────────────────────────── */}
      <section id="share-your-review" className="scroll-mt-20 bg-white py-20 sm:py-24">
        <Container size="md">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-overline font-bold uppercase tracking-[0.2em] text-ktf-blue-deep">
                  Worked with us?
                </p>
                <h2 className="mt-3 text-h3 font-bold tracking-tight text-ktf-navy">
                  Share your experience.
                </h2>
              </div>
              <ShareButton
                title={`Review ${SITE_NAME}`}
                text="Share your experience working with Bespoke Technologies."
                url="/reviews#share-your-review"
              >
                Invite someone to review
              </ShareButton>
            </div>
            <div className="mt-8 rounded-lg border border-ktf-gray-200 bg-white p-6 shadow-card sm:p-8">
              <ReviewForm />
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-ktf-navy py-24">
        <Container size="md" className="text-center">
          <h2 className="text-h2 font-bold leading-heading text-ktf-white mb-4">
            Ready to Add Your Story?
          </h2>
          <p className="text-body-lg text-ktf-gray-400 leading-body max-w-lg mx-auto mb-10">
            Join our growing list of satisfied clients. Let&apos;s build
            something you&apos;ll be proud to talk about.
          </p>
          <Button size="lg" href="/contact">
            Start Your Project
          </Button>
        </Container>
      </section>
    </>
  );
}
