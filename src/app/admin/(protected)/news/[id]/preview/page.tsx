import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { NewsArticleView } from "@/features/news/components/news-article-view";
import { getNewsPostById } from "@/features/news/repository";
import { deriveNewsState } from "@/features/news/status";

export const metadata = { title: "Preview post" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Renders the saved post with the public article layout. Admin pages are noindex. */
export default async function NewsPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPermission("news.manage");
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const post = await getNewsPostById(id);
  if (!post) notFound();
  const state = deriveNewsState(post);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 sm:px-8">
        <p className="flex items-center gap-2 font-semibold">
          <Eye className="h-4 w-4" />
          Preview of the last saved version · {state === "published" ? "Live" : state.charAt(0).toUpperCase() + state.slice(1)}
        </p>
        <Link href={`/admin/news/${post.id}`} className="inline-flex items-center gap-1.5 font-semibold underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to editor
        </Link>
      </div>
      <div className="bg-white">
        <NewsArticleView post={post} preview />
      </div>
    </div>
  );
}
