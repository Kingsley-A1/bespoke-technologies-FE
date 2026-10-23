import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNewsCategory, isNewsCategory } from "@/features/news/categories";
import { NewsIndex, parseNewsPage } from "@/features/news/components/news-index";
import { NEWS_SECTION_NAME, newsCategoryPath } from "@/features/news/seo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { category } = await params;
  const meta = getNewsCategory(category);
  if (!meta) return { title: NEWS_SECTION_NAME };
  const page = parseNewsPage((await searchParams).page) ?? 1;
  const path = newsCategoryPath(meta.slug);
  return {
    title: `${meta.label}${page > 1 ? ` — Page ${page}` : ""} | ${NEWS_SECTION_NAME}`,
    description: meta.description,
    alternates: { canonical: page > 1 ? `${path}?page=${page}` : path },
    openGraph: { title: `${meta.label} | ${NEWS_SECTION_NAME}`, description: meta.description, url: path, type: "website" },
  };
}

export default async function NewsCategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const page = parseNewsPage((await searchParams).page);
  if (!isNewsCategory(category) || !page) notFound();
  return <NewsIndex category={category} page={page} />;
}
