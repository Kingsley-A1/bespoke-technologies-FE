import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";
import { Container } from "@/components/layout";
import { ReviewCard } from "@/components/marketing/review-card";
import { getPublishedReviewByIdSafe } from "@/features/admin/reviews/repository";
import { SITE_NAME } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ReviewPageProps): Promise<Metadata> {
  const { id } = await params;
  const review = await getPublishedReviewByIdSafe(id);
  if (!review) return { title: "Review" };

  const title = `${review.reviewerName} on ${review.projectName}`;
  const description =
    review.body.length > 160 ? `${review.body.slice(0, 157).trimEnd()}…` : review.body;
  const ogImage = absoluteUrl(`/api/reviews/${review.id}/og`);

  return {
    title,
    description,
    alternates: { canonical: `/reviews/${review.id}` },
    openGraph: {
      type: "article",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
  };
}

export default async function ReviewPermalinkPage({ params }: ReviewPageProps) {
  const { id } = await params;
  const review = await getPublishedReviewByIdSafe(id);
  if (!review) notFound();

  return (
    <section className="bg-ktf-surface py-8 sm:py-10 lg:py-12">
      <Container size="md">
        <Link
          href="/reviews"
          className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-ktf-gray-500 transition-colors hover:text-ktf-blue-deep"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All client reviews
        </Link>

        <div className="mt-6">
          <ReviewCard review={review} className="p-8 sm:p-10" />
        </div>

        <div className="mt-10 rounded-lg border border-ktf-gray-200 bg-white p-8 text-center shadow-card sm:p-10">
          <h2 className="text-h4 font-bold tracking-tight text-ktf-navy">
            Want an experience like this?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-body leading-body text-ktf-gray-600">
            We design, engineer, and hand over production software you fully own.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/contact">Contact Us</Button>
            <Button href="/projects" variant="outline">
              See Delivered Work
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
