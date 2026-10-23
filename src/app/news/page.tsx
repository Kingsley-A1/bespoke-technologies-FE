import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsIndex, parseNewsPage } from "@/features/news/components/news-index";
import { NEWS_SECTION_DESCRIPTION, NEWS_SECTION_NAME } from "@/features/news/seo";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ page?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = parseNewsPage((await searchParams).page) ?? 1;
  return {
    title: page > 1 ? `${NEWS_SECTION_NAME} — Page ${page}` : NEWS_SECTION_NAME,
    description: NEWS_SECTION_DESCRIPTION,
    alternates: {
      canonical: page > 1 ? `/news?page=${page}` : "/news",
      types: { "application/rss+xml": [{ url: "/news/feed.xml", title: NEWS_SECTION_NAME }] },
    },
    openGraph: { title: NEWS_SECTION_NAME, description: NEWS_SECTION_DESCRIPTION, url: "/news", type: "website" },
  };
}

export default async function NewsPage({ searchParams }: Props) {
  const page = parseNewsPage((await searchParams).page);
  if (!page) notFound();
  return <NewsIndex page={page} />;
}
