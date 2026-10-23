import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { NewsArticleView } from "@/features/news/components/news-article-view";
import { NEWS_SLUG_PATTERN } from "@/features/news/editor-input";
import { getPublicNewsBySlug, listRelatedNews } from "@/features/news/repository";
import { buildNewsArticleJsonLd, buildNewsPostMetadata, newsPostPath, serializeJsonLd } from "@/features/news/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

// Database failures propagate as a server error (5xx) rather than a 404, so
// a temporary outage never tells crawlers that an article was removed.
const lookup = cache(async (slug: string) => (NEWS_SLUG_PATTERN.test(slug) ? getPublicNewsBySlug(slug) : null));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await lookup((await params).slug);
  if (result?.kind !== "post") return {};
  return buildNewsPostMetadata(result.post);
}

export default async function NewsArticlePage({ params }: Props) {
  const result = await lookup((await params).slug);
  if (!result) notFound();
  if (result.kind === "redirect") permanentRedirect(newsPostPath(result.slug));
  const { post } = result;
  const related = await listRelatedNews(post, 3);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildNewsArticleJsonLd(post)) }} />
      <NewsArticleView post={post} related={related} />
    </>
  );
}
