import { notFound } from "next/navigation";
import { requireAdminPermission } from "@/features/admin/access";
import { NewsEditor } from "@/features/news/components/editor/news-editor";
import { getNewsPostById } from "@/features/news/repository";

export const metadata = { title: "Edit post" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditNewsPostPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminPermission("news.manage");
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const post = await getNewsPostById(id);
  if (!post) notFound();
  return <NewsEditor key={post.id} initialPost={post} defaultAuthor={session.displayName} />;
}
