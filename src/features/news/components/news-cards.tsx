import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Newspaper } from "lucide-react";
// clsx, not cn: tailwind-merge treats the custom text-caption/text-body-sm sizes as colours and drops them.
import { clsx } from "clsx";
import { NEWS_CATEGORIES, newsCategoryLabel, type NewsCategory } from "../categories";
import { newsMediaPath } from "../content";
import { formatNewsDate, newsCategoryPath, newsDescription, newsPostPath } from "../seo";
import type { NewsPostSummary } from "../types";

function CoverImage({ post, sizes, priority }: { post: NewsPostSummary; sizes: string; priority?: boolean }) {
  if (!post.coverAssetId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-ktf-navy text-white/35">
        <Newspaper className="h-10 w-10" aria-hidden="true" />
      </div>
    );
  }
  return (
    <Image
      src={newsMediaPath(post.coverAssetId)}
      alt={post.coverAlt ?? ""}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
    />
  );
}

function PostMeta({ post, className }: { post: NewsPostSummary; className?: string }) {
  return (
    <p className={clsx("flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-ktf-gray-600", className)}>
      <span className="font-semibold uppercase tracking-[0.12em] text-ktf-blue-deep">{newsCategoryLabel(post.category)}</span>
      <span aria-hidden="true" className="text-ktf-gray-300">
        •
      </span>
      <time dateTime={post.publishedAt}>{formatNewsDate(post.publishedAt)}</time>
      <span aria-hidden="true" className="text-ktf-gray-300">
        •
      </span>
      <span>{post.readingMinutes} min read</span>
    </p>
  );
}

export function NewsCard({ post, headingLevel = "h3" }: { post: NewsPostSummary; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-ktf-gray-200 bg-white shadow-card transition-shadow hover:shadow-card-hover">
      <div className="relative aspect-[16/9] overflow-hidden bg-ktf-gray-100">
        <CoverImage post={post} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw" />
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <PostMeta post={post} />
        <Heading className="mt-3 text-h5 font-bold leading-snug tracking-[-0.015em] text-ktf-navy">
          <Link href={newsPostPath(post.slug)} className="after:absolute after:inset-0 focus-visible:outline-none">
            {post.title}
          </Link>
        </Heading>
        <p className="mt-2 line-clamp-3 text-body-sm leading-body text-ktf-gray-600">{newsDescription(post)}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-body-sm font-semibold text-ktf-blue-deep">
          Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
      <span
        className="pointer-events-none absolute inset-0 rounded-xl ring-ktf-blue group-has-[a:focus-visible]:ring-2"
        aria-hidden="true"
      />
    </article>
  );
}

export function NewsLeadStory({ post }: { post: NewsPostSummary }) {
  return (
    <article className="group relative grid overflow-hidden rounded-2xl border border-ktf-gray-200 bg-white shadow-card lg:grid-cols-[1.25fr_1fr]">
      <div className="relative aspect-[16/9] overflow-hidden bg-ktf-gray-100 lg:aspect-auto lg:min-h-[400px]">
        <CoverImage post={post} sizes="(min-width: 1024px) 680px, 100vw" priority />
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
        <p className="text-overline font-bold uppercase tracking-[0.2em] text-ktf-gray-500">
          {post.isFeatured ? "Featured" : "Latest"}
        </p>
        <PostMeta post={post} className="mt-3" />
        <h2 className="mt-3 text-[1.75rem] font-bold leading-[1.15] tracking-[-0.03em] text-ktf-navy sm:text-h3">
          <Link href={newsPostPath(post.slug)} className="after:absolute after:inset-0 focus-visible:outline-none">
            {post.title}
          </Link>
        </h2>
        <p className="mt-4 line-clamp-4 text-body leading-body text-ktf-gray-600">{newsDescription(post)}</p>
        <span className="mt-6 inline-flex items-center gap-1.5 text-body-sm font-semibold text-ktf-blue-deep">
          Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>
      <span
        className="pointer-events-none absolute inset-0 rounded-2xl ring-ktf-blue group-has-[a:focus-visible]:ring-2"
        aria-hidden="true"
      />
    </article>
  );
}

export function NewsCategoryNav({ active }: { active?: NewsCategory }) {
  const items = [{ href: "/news", label: "All", isActive: !active }].concat(
    NEWS_CATEGORIES.map((category) => ({
      href: newsCategoryPath(category.slug),
      label: category.label,
      isActive: active === category.slug,
    })),
  );
  return (
    <nav aria-label="News categories" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.isActive ? "page" : undefined}
              className={clsx(
                "inline-flex h-9 items-center whitespace-nowrap rounded-full border px-4 text-body-sm font-medium transition-colors",
                item.isActive
                  ? "border-ktf-navy bg-ktf-navy text-white"
                  : "border-ktf-gray-200 bg-white text-ktf-gray-700 hover:border-ktf-gray-300 hover:text-ktf-navy",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function NewsPagination({ basePath, page, totalPages }: { basePath: string; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const href = (target: number) => (target <= 1 ? basePath : `${basePath}?page=${target}`);
  const link =
    "inline-flex h-10 items-center gap-2 rounded-lg border border-ktf-gray-200 bg-white px-4 text-body-sm font-semibold text-ktf-navy transition-colors hover:border-ktf-gray-300";
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={link}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Newer
        </Link>
      ) : (
        <span />
      )}
      <p className="text-body-sm text-ktf-gray-600">
        Page {page} of {totalPages}
      </p>
      {page < totalPages ? (
        <Link href={href(page + 1)} rel="next" className={link}>
          Older <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function NewsEmptyState({ category }: { category?: NewsCategory }) {
  return (
    <div className="rounded-2xl border border-dashed border-ktf-gray-300 bg-white px-6 py-16 text-center">
      <Newspaper className="mx-auto h-8 w-8 text-ktf-gray-400" aria-hidden="true" />
      <p className="mt-4 text-body font-semibold text-ktf-navy">
        {category ? `No ${newsCategoryLabel(category).toLowerCase()} yet` : "No posts yet"}
      </p>
      <p className="mx-auto mt-2 max-w-md text-body-sm leading-body text-ktf-gray-600">
        Official updates from Bespoke Technologies will appear here as they are published.
      </p>
      {category && (
        <Link href="/news" className="mt-6 inline-flex text-body-sm font-semibold text-ktf-blue-deep hover:underline">
          See all news
        </Link>
      )}
    </div>
  );
}
