import { listPublicNewsForFeed } from "@/features/news/repository";
import { newsCategoryLabel } from "@/features/news/categories";
import { NEWS_SECTION_DESCRIPTION, NEWS_SECTION_NAME, newsDescription, newsPostPath } from "@/features/news/seo";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

function xml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** RSS 2.0 feed of the latest What's New posts. */
export async function GET() {
  const posts = await listPublicNewsForFeed(30);
  const items = posts
    .map((post) => {
      const url = absoluteUrl(newsPostPath(post.slug));
      return `    <item>
      <title>${xml(post.title)}</title>
      <link>${xml(url)}</link>
      <guid isPermaLink="false">${xml(post.id)}</guid>
      <pubDate>${new Date(post.publishedAt!).toUTCString()}</pubDate>
      <category>${xml(newsCategoryLabel(post.category))}</category>
      <dc:creator>${xml(post.authorName)}</dc:creator>
      <description>${xml(newsDescription(post))}</description>
    </item>`;
    })
    .join("\n");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xml(NEWS_SECTION_NAME)}</title>
    <link>${xml(absoluteUrl("/news"))}</link>
    <description>${xml(NEWS_SECTION_DESCRIPTION)}</description>
    <language>en</language>
    <atom:link href="${xml(absoluteUrl("/news/feed.xml"))}" rel="self" type="application/rss+xml" />${
      posts[0]?.publishedAt ? `\n    <lastBuildDate>${new Date(posts[0].publishedAt).toUTCString()}</lastBuildDate>` : ""
    }
${items}
  </channel>
</rss>
`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
