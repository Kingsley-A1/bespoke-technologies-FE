import type { Metadata } from "next";
import { BRAND_ICON_SRC, SITE_NAME } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";
import { newsCategoryLabel } from "./categories";
import { excerpt, newsMediaPath } from "./content";
import type { NewsPostSummary } from "./types";

export const NEWS_SECTION_NAME = "What's New at Bespoke";
export const NEWS_SECTION_DESCRIPTION =
  "Official announcements, product updates, project documentation and engineering notes from Bespoke Technologies.";
export const NEWS_PAGE_SIZE = 12;

export function newsPostPath(slug: string) {
  return `/news/${slug}`;
}

export function newsCategoryPath(category: string) {
  return `/news/category/${category}`;
}

export function newsDescription(post: Pick<NewsPostSummary, "seoDescription" | "dek" | "bodyText">) {
  return post.seoDescription ?? (post.dek ? excerpt(post.dek, 200) : excerpt(post.bodyText, 160));
}

export function newsShareImage(post: Pick<NewsPostSummary, "shareAssetId" | "coverAlt" | "title">) {
  if (!post.shareAssetId) return undefined;
  return {
    url: absoluteUrl(newsMediaPath(post.shareAssetId)),
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: post.coverAlt ?? post.title,
  };
}

export function buildNewsPostMetadata(post: NewsPostSummary): Metadata {
  const title = post.seoTitle ?? post.title;
  const description = newsDescription(post);
  const image = newsShareImage(post);
  const images = image ? [image] : [{ url: absoluteUrl("/icons/og.png"), width: 1200, height: 630, alt: SITE_NAME }];
  return {
    title,
    description,
    alternates: { canonical: newsPostPath(post.slug) },
    authors: [{ name: post.authorName }],
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      locale: "en_US",
      url: absoluteUrl(newsPostPath(post.slug)),
      title,
      description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      section: newsCategoryLabel(post.category),
      authors: [post.authorName],
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((item) => item.url),
    },
  };
}

function authorEntity(name: string) {
  return name === SITE_NAME ? { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") } : { "@type": "Person", name };
}

/** Article structured data Google uses for article rich results. */
export function buildNewsArticleJsonLd(post: NewsPostSummary) {
  const url = absoluteUrl(newsPostPath(post.slug));
  const images = [
    post.shareAssetId ? absoluteUrl(newsMediaPath(post.shareAssetId)) : undefined,
    post.coverAssetId ? absoluteUrl(newsMediaPath(post.coverAssetId)) : undefined,
  ].filter(Boolean);
  const modified = [post.publishedAt, post.updatedAt].filter(Boolean).sort().at(-1);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        "@id": `${url}#article`,
        headline: post.title.slice(0, 110),
        description: newsDescription(post),
        url,
        mainEntityOfPage: url,
        image: images,
        datePublished: post.publishedAt,
        dateModified: modified,
        articleSection: newsCategoryLabel(post.category),
        inLanguage: "en",
        wordCount: post.bodyText.split(/\s+/).filter(Boolean).length,
        author: [authorEntity(post.authorName)],
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: absoluteUrl("/"),
          logo: { "@type": "ImageObject", url: absoluteUrl(BRAND_ICON_SRC) },
        },
        isPartOf: { "@type": "WebPage", "@id": absoluteUrl("/news"), name: NEWS_SECTION_NAME },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: "News", item: absoluteUrl("/news") },
          {
            "@type": "ListItem",
            position: 3,
            name: newsCategoryLabel(post.category),
            item: absoluteUrl(newsCategoryPath(post.category)),
          },
          { "@type": "ListItem", position: 4, name: post.title, item: url },
        ],
      },
    ],
  };
}

/** Serializes JSON-LD for a <script> tag without allowing `</script>` breakouts. */
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function formatNewsDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" }).format(
    new Date(value),
  );
}

/** Shows "Updated" only for substantive later edits, not the publish action itself. */
export function newsUpdatedLabel(post: Pick<NewsPostSummary, "publishedAt" | "updatedAt">) {
  if (!post.publishedAt) return undefined;
  const gap = new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime();
  return gap > 24 * 60 * 60 * 1000 ? formatNewsDate(post.updatedAt) : undefined;
}
