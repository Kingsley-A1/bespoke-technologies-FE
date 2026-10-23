import Link from "next/link";
import { notFound } from "next/navigation";
import { Rss } from "lucide-react";
import { Container } from "@/components/layout/container";
import { getNewsCategory, type NewsCategory } from "../categories";
import { getLeadNewsPost, listPublicNews } from "../repository";
import { NEWS_PAGE_SIZE, NEWS_SECTION_DESCRIPTION, NEWS_SECTION_NAME, newsCategoryPath } from "../seo";
import { NewsCard, NewsCategoryNav, NewsEmptyState, NewsLeadStory, NewsPagination } from "./news-cards";

export function parseNewsPage(value: string | string[] | undefined) {
  if (value === undefined) return 1;
  const page = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(page) && page >= 1 && page <= 10_000 ? page : null;
}

/** The public listing for /news and /news/category/[category]. */
export async function NewsIndex({ category, page }: { category?: NewsCategory; page: number }) {
  // The lead story only heads the unfiltered first page; everywhere else it is a normal card.
  const showLead = !category && page === 1;
  const lead = showLead ? await getLeadNewsPost() : null;
  const { posts, total } = await listPublicNews({
    category,
    limit: NEWS_PAGE_SIZE,
    offset: (page - 1) * NEWS_PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE));
  if (page > totalPages) notFound();
  const gridPosts = lead ? posts.filter((post) => post.id !== lead.id) : posts;
  const meta = category ? getNewsCategory(category) : undefined;

  return (
    <>
      <section className="border-b border-ktf-gray-200 bg-white pb-8 pt-10 sm:pb-10 sm:pt-14">
        <Container size="lg">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-overline font-bold uppercase tracking-[0.2em] text-ktf-blue-deep">
                {meta ? NEWS_SECTION_NAME : "Official channel"}
              </p>
              <h1 className="mt-4 text-[2.3rem] font-bold leading-[1.08] tracking-[-0.04em] text-ktf-navy sm:text-h1">
                {meta ? meta.label : NEWS_SECTION_NAME}
              </h1>
              <p className="mt-4 max-w-2xl text-body-lg leading-body text-ktf-gray-600">
                {meta ? meta.description : NEWS_SECTION_DESCRIPTION}
              </p>
            </div>
            <Link
              href="/news/feed.xml"
              className="inline-flex items-center gap-1.5 self-start text-body-sm font-semibold text-ktf-gray-600 hover:text-ktf-navy lg:self-auto"
            >
              <Rss className="h-4 w-4" aria-hidden="true" /> RSS feed
            </Link>
          </div>
          <div className="mt-8">
            <NewsCategoryNav active={category} />
          </div>
        </Container>
      </section>

      <section className="bg-ktf-surface py-10 sm:py-14">
        <Container size="lg">
          {!lead && gridPosts.length === 0 ? (
            <NewsEmptyState category={category} />
          ) : (
            <>
              {lead && <NewsLeadStory post={lead} />}
              {gridPosts.length > 0 && (
                <div className={lead ? "mt-10" : undefined}>
                  {lead && <h2 className="mb-5 text-h5 font-bold text-ktf-navy">More from Bespoke</h2>}
                  <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {gridPosts.map((post) => (
                      <li key={post.id}>
                        <NewsCard post={post} headingLevel={lead ? "h3" : "h2"} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <NewsPagination basePath={category ? newsCategoryPath(category) : "/news"} page={page} totalPages={totalPages} />
            </>
          )}
        </Container>
      </section>
    </>
  );
}
