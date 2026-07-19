import { ArrowUpRight } from "lucide-react";
import { ShareButton } from "@/components/ui/share-button";
import type { Review } from "@/features/admin/types";
import { cn } from "@/lib/utils";

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ReviewStars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn("flex gap-0.5", className)} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={cn("text-body", star <= rating ? "text-ktf-warning" : "text-ktf-gray-300")}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
  className?: string;
}

/**
 * A published client review. Server component — the only interactive piece is
 * the share affordance, which shares the review's public permalink (whose OG
 * card carries the project logo).
 */
export function ReviewCard({ review, className }: ReviewCardProps) {
  const publishedDate = review.publishedAt
    ? new Date(review.publishedAt).toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      })
    : undefined;

  return (
    <figure
      className={cn(
        "flex h-full flex-col rounded-lg border border-ktf-gray-200 bg-white p-6 shadow-xs transition duration-150 hover:-translate-y-0.5 hover:shadow-card-hover sm:p-7",
        className,
      )}
    >
      <figcaption className="flex items-center gap-3.5">
        {review.logoKey ? (
          // eslint-disable-next-line @next/next/no-img-element -- streamed same-origin logo route
          <img
            src={`/api/reviews/${review.id}/logo`}
            alt={`${review.projectName} logo`}
            className="h-11 w-11 shrink-0 rounded-md border border-ktf-gray-200 object-cover"
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-ktf-blue text-body-sm font-bold text-white">
            {initialsFor(review.reviewerName)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-body font-semibold text-ktf-navy">{review.reviewerName}</p>
          {review.projectUrl ? (
            <a
              href={review.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-body-sm text-ktf-gray-500 transition-colors hover:text-ktf-blue-deep"
            >
              <span className="truncate">{review.projectName}</span>
              <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden="true" />
            </a>
          ) : (
            <p className="truncate text-body-sm text-ktf-gray-500">{review.projectName}</p>
          )}
        </div>
      </figcaption>

      <ReviewStars rating={review.rating} className="mt-5" />

      <blockquote className="mt-4 flex-1">
        <p className="text-body leading-body text-ktf-gray-700">&ldquo;{review.body}&rdquo;</p>
      </blockquote>

      <div className="mt-6 flex items-center justify-between border-t border-ktf-gray-100 pt-4">
        <span className="text-caption text-ktf-gray-400">{publishedDate ?? "Verified review"}</span>
        <ShareButton
          title={`${review.reviewerName} on ${review.projectName} — Bespoke Technologies`}
          text={`"${review.body.slice(0, 120)}${review.body.length > 120 ? "…" : ""}"`}
          url={`/reviews/${review.id}`}
        />
      </div>
    </figure>
  );
}
