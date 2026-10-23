import Link from "next/link";
import { ExternalLink, Newspaper, Plus, Search } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { EmptyPanel, inputClass, Panel, primaryButtonClass } from "@/features/admin/components/admin-ui";
import { isNewsCategory, NEWS_CATEGORIES, newsCategoryLabel } from "@/features/news/categories";
import { newsMediaPath } from "@/features/news/content";
import { countAdminNewsByState, listAdminNews } from "@/features/news/repository";
import { formatNewsDate } from "@/features/news/seo";
import { deriveNewsState, type NewsState } from "@/features/news/status";
import { NewsStatePill } from "@/features/news/components/news-state-pill";
import { isR2Configured } from "@/lib/storage/r2";
import { cn } from "@/lib/utils";

export const metadata = { title: "What's New" };

const STATES: { value?: NewsState; label: string }[] = [
  { label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Live" },
  { value: "archived", label: "Archived" },
];

type SearchParams = Promise<{ state?: string; category?: string; q?: string }>;

export default async function AdminNewsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminPermission("news.manage");
  const params = await searchParams;
  const state = STATES.find((item) => item.value === params.state)?.value;
  const category = isNewsCategory(params.category) ? params.category : undefined;
  const query = params.q?.slice(0, 120) ?? "";
  const [posts, counts] = await Promise.all([listAdminNews({ state, category, query }), countAdminNewsByState()]);
  const total = counts.draft + counts.scheduled + counts.published + counts.archived;
  const now = new Date();

  const filterHref = (next: { state?: NewsState; category?: string; q?: string }) => {
    const search = new URLSearchParams();
    if (next.state) search.set("state", next.state);
    if (next.category) search.set("category", next.category);
    if (next.q) search.set("q", next.q);
    const value = search.toString();
    return value ? `/admin/news?${value}` : "/admin/news";
  };

  return (
    <div className="space-y-6">
      {!isR2Configured() && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
          <p className="font-semibold">Image storage is not configured.</p>
          <p className="mt-1">
            Covers and article images need the Cloudflare R2 environment variables. Posts cannot be published without a cover.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5">
          {STATES.map((item) => {
            const count = item.value ? counts[item.value] : total;
            const active = item.value === state;
            return (
              <Link
                key={item.label}
                href={filterHref({ state: item.value, category, q: query })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition",
                  active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                )}
              >
                {item.label}
                <span className={cn("tabular-nums", active ? "text-white/70" : "text-slate-400")}>{count}</span>
              </Link>
            );
          })}
        </nav>
        <Link href="/admin/news/new" className={primaryButtonClass}>
          <Plus className="h-4 w-4" /> New post
        </Link>
      </div>

      <Panel>
        <form className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4 sm:px-6" action="/admin/news">
          {state && <input type="hidden" name="state" value={state} />}
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={query} placeholder="Search headlines or URLs" aria-label="Search posts" className={cn(inputClass, "pl-9")} />
          </div>
          <select name="category" defaultValue={category ?? ""} aria-label="Category" className={cn(inputClass, "w-auto min-w-[180px]")}>
            <option value="">All categories</option>
            {NEWS_CATEGORIES.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.label}
              </option>
            ))}
          </select>
          <button type="submit" className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            Apply
          </button>
        </form>

        {posts.length === 0 ? (
          total === 0 ? (
            <div className="px-6 py-14 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-ktf-blue-deep">
                <Newspaper className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-semibold text-slate-900">Publish the first post</p>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-500">
                Announcements, product updates and project documentation appear at /news, on the home page, in the sitemap and in the RSS feed.
              </p>
              <Link href="/admin/news/new" className={cn(primaryButtonClass, "mt-5")}>
                <Plus className="h-4 w-4" /> New post
              </Link>
            </div>
          ) : (
            <EmptyPanel title="No posts match" body="Try a different status, category or search." />
          )
        ) : (
          <ul className="divide-y divide-slate-100">
            {posts.map((post) => {
              const postState = deriveNewsState(post, now);
              const date =
                postState === "published"
                  ? `Published ${formatNewsDate(post.publishedAt)}`
                  : postState === "scheduled"
                    ? `Goes live ${formatNewsDate(post.publishedAt)}`
                    : `Edited ${formatNewsDate(post.updatedAt)}`;
              return (
                <li key={post.id} className="group relative flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50/70 sm:px-6">
                  <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                    {post.coverAssetId ? (
                      // eslint-disable-next-line @next/next/no-img-element -- processed cover from the media route
                      <img src={newsMediaPath(post.coverAssetId)} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-slate-300">
                        <Newspaper className="h-5 w-5" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/news/${post.id}`}
                      className="line-clamp-1 text-sm font-semibold text-slate-950 after:absolute after:inset-0 hover:underline"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                      <span>{newsCategoryLabel(post.category)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{date}</span>
                      <span aria-hidden="true" className="hidden sm:inline">·</span>
                      <span className="hidden truncate sm:inline">/news/{post.slug}</span>
                      {post.isFeatured && <span className="rounded bg-blue-50 px-1.5 py-0.5 font-semibold text-blue-700">Featured</span>}
                    </p>
                  </div>
                  <NewsStatePill state={postState} />
                  {postState === "published" && (
                    <a
                      href={`/news/${post.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`View ${post.title} on the website`}
                      className="relative z-10 hidden h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-900 sm:inline-flex"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
