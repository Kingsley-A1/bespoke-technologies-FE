import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { absoluteUrl } from "@/lib/seo";
import { newsCategoryLabel } from "../categories";
import { newsMediaPath } from "../content";
import { formatNewsDate, newsCategoryPath, newsPostPath, newsUpdatedLabel } from "../seo";
import type { NewsPost, NewsPostSummary } from "../types";
import { NewsArticleBody, newsOutline } from "./news-article-body";
import { NewsCard } from "./news-cards";
import { NewsShareBar } from "./news-share-bar";

/** The article layout shared by the public page and the Admin preview, so a preview is exactly what readers get. */
export function NewsArticleView({
  post,
  related = [],
  preview = false,
}: {
  post: NewsPost;
  related?: NewsPostSummary[];
  preview?: boolean;
}) {
  const url = absoluteUrl(newsPostPath(post.slug));
  const outline = newsOutline(post.body);
  const showOutline = outline.length >= 3;
  const updated = newsUpdatedLabel(post);
  const categoryLabel = newsCategoryLabel(post.category);

  return (
    <>
      <article className="bg-white pb-16 pt-8 sm:pb-20 sm:pt-12">
        <Container size="md">
          <nav aria-label="Breadcrumb" className="mx-auto max-w-3xl">
            <ol className="flex flex-wrap items-center gap-1 text-caption font-medium text-ktf-gray-600">
              <li>
                <Link href="/news" className="hover:text-ktf-navy">
                  News
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-3.5 w-3.5 text-ktf-gray-400" />
              </li>
              <li>
                <Link href={newsCategoryPath(post.category)} className="hover:text-ktf-navy">
                  {categoryLabel}
                </Link>
              </li>
            </ol>
          </nav>

          <header className="mx-auto mt-6 max-w-3xl">
            <h1 className="text-[2.15rem] font-bold leading-[1.1] tracking-[-0.035em] text-ktf-navy sm:text-[2.85rem]">
              {post.title}
            </h1>
            {post.dek && <p className="mt-5 text-body-lg leading-body text-ktf-gray-600 sm:text-[1.25rem]">{post.dek}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ktf-gray-200 pt-5 text-body-sm text-ktf-gray-600">
              <span className="font-semibold text-ktf-navy">{post.authorName}</span>
              <span aria-hidden="true" className="text-ktf-gray-300">
                •
              </span>
              {post.publishedAt ? (
                <time dateTime={post.publishedAt}>{formatNewsDate(post.publishedAt)}</time>
              ) : (
                <span>Not yet published</span>
              )}
              <span aria-hidden="true" className="text-ktf-gray-300">
                •
              </span>
              <span>{post.readingMinutes} min read</span>
              {updated && (
                <>
                  <span aria-hidden="true" className="text-ktf-gray-300">
                    •
                  </span>
                  <span>
                    Updated <time dateTime={post.updatedAt}>{updated}</time>
                  </span>
                </>
              )}
            </div>
            {!preview && <NewsShareBar title={post.title} url={url} className="mt-5" />}
          </header>

          {post.coverAssetId && (
            <figure className="mt-8 sm:mt-10">
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-ktf-gray-200 bg-ktf-gray-100">
                <Image
                  src={newsMediaPath(post.coverAssetId)}
                  alt={post.coverAlt ?? ""}
                  fill
                  priority
                  sizes="(min-width: 1024px) 976px, 100vw"
                  className="object-cover"
                />
              </div>
            </figure>
          )}

          <div className={showOutline ? "mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]" : "mx-auto mt-10 max-w-3xl"}>
            <div className={showOutline ? "min-w-0 max-w-3xl" : undefined}>
              {post.body.content.length ? (
                <NewsArticleBody doc={post.body} />
              ) : (
                <p className="text-body text-ktf-gray-500">This article has no body yet.</p>
              )}
            </div>
            {showOutline && (
              <aside className="hidden lg:block">
                <nav aria-label="On this page" className="sticky top-28">
                  <p className="text-overline font-bold uppercase tracking-[0.18em] text-ktf-gray-500">On this page</p>
                  <ul className="mt-3 space-y-2 border-l border-ktf-gray-200">
                    {outline.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className="-ml-px block border-l border-transparent pl-3 text-body-sm leading-snug text-ktf-gray-600 hover:border-ktf-navy hover:text-ktf-navy"
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
            )}
          </div>

          <footer className="mx-auto mt-12 max-w-3xl border-t border-ktf-gray-200 pt-6">
            {!preview && (
              <>
                <p className="text-body-sm font-semibold text-ktf-navy">Share this article</p>
                <NewsShareBar title={post.title} url={url} className="mt-3" />
              </>
            )}
            <div className="mt-8 flex flex-col gap-4 rounded-xl bg-ktf-surface p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-body font-semibold text-ktf-navy">Building something that has to work?</p>
                <p className="mt-1 text-body-sm text-ktf-gray-600">Talk to the Bespoke Technologies team about your project.</p>
              </div>
              <Link
                href="/contact"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-ktf-blue px-5 text-body-sm font-semibold text-white transition-colors hover:bg-ktf-blue-deep"
              >
                Start a conversation <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <Link
              href="/news"
              className="mt-8 inline-flex items-center gap-1.5 text-body-sm font-semibold text-ktf-gray-600 hover:text-ktf-navy"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All news
            </Link>
          </footer>
        </Container>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-news" className="border-t border-ktf-gray-200 bg-ktf-surface py-14 sm:py-16">
          <Container size="lg">
            <h2 id="related-news" className="text-h4 font-bold tracking-tight text-ktf-navy">
              More from What&apos;s New
            </h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <NewsCard post={item} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}
