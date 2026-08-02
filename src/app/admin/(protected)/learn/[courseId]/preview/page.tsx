import { notFound } from "next/navigation";
import { requireAdminPermission } from "@/features/admin/access";
import { getAdminLearnCourse } from "@/features/learn/admin-authoring.server";
import { LessonBlockRenderer } from "@/features/learn/components/lesson-block-renderer";
import { contentBlockSchema } from "@/features/learn/content/schemas";

function DraftBlockPreview({ block }: { block: { stableId: string; type: string; required: boolean; completionRule: string; sortOrder: number; config?: unknown } }) {
  const parsed = contentBlockSchema.safeParse({ id: block.stableId, type: block.type, required: block.required, completionRule: block.completionRule, order: block.sortOrder, config: block.config });
  if (!parsed.success) return <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">This draft block is incomplete or invalid and cannot be rendered. Correct it before publication.</p>;
  return <LessonBlockRenderer block={parsed.data} assetUrl={(assetId) => `/admin/api/learn/assets/${encodeURIComponent(assetId)}`} />;
}

export default async function AdminLearnPreviewPage({ params }: { params: Promise<{ courseId: string }> }) {
  await requireAdminPermission("learn.manage");
  const { courseId } = await params;
  const course = await getAdminLearnCourse(courseId);
  if (!course) notFound();
  return <main className="mx-auto w-full max-w-4xl space-y-8 px-5 py-10 sm:px-8"><section className="border-b border-slate-200 pb-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-ktf-blue">Private draft preview — never public</p><h1 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-slate-950">{course.version.title}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">{course.version.summary}</p><p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-slate-600">{course.version.description}</p></section><section className="space-y-8" aria-labelledby="preview-outline"><h2 id="preview-outline" className="text-2xl font-bold text-slate-950">Learner preview</h2>{course.modules.map((module) => <article key={module.id} className="rounded-lg border border-slate-200 bg-white p-5"><h3 className="font-semibold text-slate-950">{module.sortOrder + 1}. {module.title}</h3>{module.summary && <p className="mt-2 text-sm leading-6 text-slate-600">{module.summary}</p>}<ol className="mt-6 space-y-8">{module.lessons.map((lesson) => <li key={lesson.id} className="rounded-md border border-slate-200 p-5"><p className="text-sm font-semibold text-slate-900">{lesson.title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{lesson.objective}</p><div className="mt-5 space-y-6">{lesson.blocks.map((block) => <DraftBlockPreview key={block.id} block={block} />)}</div></li>)}</ol></article>)}</section></main>;
}
