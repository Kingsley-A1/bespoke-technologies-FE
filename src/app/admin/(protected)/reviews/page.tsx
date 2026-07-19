import Link from "next/link";
import { ExternalLink, MessageSquareText } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { formatAdminDate } from "@/features/admin/billing/money";
import { EmptyPanel, Panel, PanelHeader, StatusPill } from "@/features/admin/components/admin-ui";
import { listReviews } from "@/features/admin/reviews/repository";
import { isR2Configured } from "@/lib/storage/r2";
import type { ReviewStatus } from "@/features/admin/types";
import { deleteReviewAction, setReviewStatusAction } from "./actions";
import { ReviewLogoUploader } from "./review-logo-uploader";

const FILTERS: { label: string; value: ReviewStatus | "all" }[] = [
  { label: "Pending", value: "pending" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
  { label: "All", value: "all" },
];

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdminPermission("reviews.manage");
  const { status } = await searchParams;
  const activeFilter: ReviewStatus | "all" =
    status === "published" || status === "archived" || status === "all" ? status : "pending";
  const reviews = await listReviews(activeFilter === "all" ? undefined : activeFilter);
  const storageReady = isR2Configured();

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title="Client reviews"
          description="Public submissions land here as pending. Only published reviews appear on the site."
          action={<MessageSquareText className="h-4 w-4 text-blue-700" />}
        />
        <div className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-3">
          {FILTERS.map((filter) => (
            <Link
              key={filter.value}
              href={filter.value === "pending" ? "/admin/reviews" : `/admin/reviews?status=${filter.value}`}
              className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition ${
                activeFilter === filter.value
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </div>

        {reviews.length === 0 ? (
          <EmptyPanel
            title={`No ${activeFilter === "all" ? "" : `${activeFilter} `}reviews yet`}
            body="Public submissions from the reviews page will appear here for verification."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((review) => (
              <article key={review.id} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{review.reviewerName}</p>
                      <span aria-label={`${review.rating} out of 5 stars`} className="text-xs text-amber-500">
                        {"★".repeat(review.rating)}
                        <span className="text-slate-200">{"★".repeat(5 - review.rating)}</span>
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      {review.projectName}
                      {review.projectUrl && (
                        <a
                          href={review.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-blue-700 hover:underline"
                        >
                          Link <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill value={review.status} />
                    <span className="text-[11px] text-slate-400">{formatAdminDate(review.createdAt)}</span>
                  </div>
                </div>

                <blockquote className="mt-3 max-w-3xl text-xs leading-5 text-slate-600">
                  &ldquo;{review.body}&rdquo;
                </blockquote>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {review.status !== "published" && (
                    <form action={setReviewStatusAction}>
                      <input type="hidden" name="id" value={review.id} />
                      <input type="hidden" name="status" value="published" />
                      <button className="h-8 rounded-lg bg-slate-950 px-3 text-[11px] font-semibold text-white">
                        Publish
                      </button>
                    </form>
                  )}
                  {review.status === "published" && (
                    <form action={setReviewStatusAction}>
                      <input type="hidden" name="id" value={review.id} />
                      <input type="hidden" name="status" value="archived" />
                      <button className="h-8 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-600">
                        Archive
                      </button>
                    </form>
                  )}
                  {review.status === "archived" && (
                    <form action={setReviewStatusAction}>
                      <input type="hidden" name="id" value={review.id} />
                      <input type="hidden" name="status" value="pending" />
                      <button className="h-8 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-600">
                        Move to pending
                      </button>
                    </form>
                  )}
                  <ReviewLogoUploader
                    reviewId={review.id}
                    hasLogo={Boolean(review.logoKey)}
                    disabled={!storageReady}
                  />
                  {review.status === "published" && (
                    <Link
                      href={`/reviews/${review.id}`}
                      target="_blank"
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300"
                    >
                      View public page <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                  <details className="ml-auto">
                    <summary className="cursor-pointer text-[11px] font-semibold text-rose-700">
                      Delete
                    </summary>
                    <form action={deleteReviewAction} className="mt-2">
                      <input type="hidden" name="id" value={review.id} />
                      <button className="h-8 rounded-lg border border-rose-200 px-3 text-[11px] font-semibold text-rose-700">
                        Confirm permanent delete
                      </button>
                    </form>
                  </details>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
