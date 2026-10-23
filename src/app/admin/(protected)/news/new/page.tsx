import { requireAdminPermission } from "@/features/admin/access";
import { NewsEditor } from "@/features/news/components/editor/news-editor";

export const metadata = { title: "New post" };

export default async function NewNewsPostPage() {
  const session = await requireAdminPermission("news.manage");
  return <NewsEditor initialPost={null} defaultAuthor={session.displayName} />;
}
