import { describe, expect, it } from "vitest";
import { buildNewsArticleJsonLd, buildNewsPostMetadata, newsDescription, newsUpdatedLabel, serializeJsonLd } from "./seo";
import type { NewsPostSummary } from "./types";

const post: NewsPostSummary = {
  id: "7d0c3c1a-1f0e-4c55-9b0b-0f1a2b3c4d5e",
  slug: "bespoke-learn-is-open",
  title: "Bespoke Learn is open",
  dek: "Our multi-course learning product is now available.",
  category: "product-updates",
  bodyText: "Body text of the article.",
  readingMinutes: 3,
  coverAssetId: "11111111-1111-4111-8111-111111111111",
  shareAssetId: "22222222-2222-4222-8222-222222222222",
  coverAlt: "Learner using Bespoke Learn on a laptop",
  authorName: "Kingsley Maduabuchi",
  isFeatured: false,
  status: "published",
  publishedAt: "2026-10-20T09:00:00.000Z",
  firstPublishedAt: "2026-10-20T09:00:00.000Z",
  version: 4,
  createdAt: "2026-10-19T09:00:00.000Z",
  updatedAt: "2026-10-22T12:00:00.000Z",
};

describe("article metadata", () => {
  it("uses the 1200×630 share image as og:image with explicit dimensions", () => {
    const metadata = buildNewsPostMetadata(post);
    expect(metadata.alternates?.canonical).toBe("/news/bespoke-learn-is-open");
    expect(metadata.openGraph).toMatchObject({
      type: "article",
      url: "https://www.bespoketech.com.ng/news/bespoke-learn-is-open",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      images: [
        {
          url: "https://www.bespoketech.com.ng/news/media/22222222-2222-4222-8222-222222222222",
          width: 1200,
          height: 630,
          type: "image/jpeg",
          alt: post.coverAlt,
        },
      ],
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("falls back to the site share image when a post has no cover", () => {
    const metadata = buildNewsPostMetadata({ ...post, shareAssetId: undefined, coverAssetId: undefined });
    expect(metadata.openGraph?.images).toEqual([expect.objectContaining({ url: "https://www.bespoketech.com.ng/icons/og.png" })]);
  });

  it("prefers explicit search fields, then the summary, then the body", () => {
    expect(newsDescription({ ...post, seoDescription: "Custom" })).toBe("Custom");
    expect(newsDescription(post)).toBe(post.dek);
    expect(newsDescription({ ...post, dek: undefined })).toBe("Body text of the article.");
    expect(buildNewsPostMetadata({ ...post, seoTitle: "Search title" }).title).toBe("Search title");
  });
});

describe("article structured data", () => {
  it("describes a NewsArticle with publisher, dates and breadcrumbs", () => {
    const jsonLd = buildNewsArticleJsonLd(post);
    const [article, breadcrumbs] = jsonLd["@graph"];
    expect(article).toMatchObject({
      "@type": "NewsArticle",
      headline: post.title,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: [{ "@type": "Person", name: "Kingsley Maduabuchi" }],
      publisher: { "@type": "Organization", name: "Bespoke Technologies" },
    });
    expect(breadcrumbs).toMatchObject({ "@type": "BreadcrumbList" });
  });

  it("serializes safely inside a script tag", () => {
    expect(serializeJsonLd({ headline: "</script><script>alert(1)</script>" })).not.toContain("</script>");
  });

  it("shows an updated date only for edits more than a day after publication", () => {
    expect(newsUpdatedLabel(post)).toBeTruthy();
    expect(newsUpdatedLabel({ ...post, updatedAt: "2026-10-20T10:00:00.000Z" })).toBeUndefined();
  });
});
