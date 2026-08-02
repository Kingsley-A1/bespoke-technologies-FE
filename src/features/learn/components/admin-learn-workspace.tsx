import Link from "next/link";
import type { AdminAuthoringCourseSummary } from "../admin-authoring-repository";

export function AdminLearnWorkspace({ courses, createAction = async () => undefined }: { courses: readonly AdminAuthoringCourseSummary[]; createAction?: (formData: FormData) => void | Promise<void> }) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ktf-blue">Bespoke Learn</p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950">Course publishing</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Create and review course drafts here. Saving a draft never exposes it to learners; publication is a separate validated action.</p>
      </section>
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between gap-4"><h3 className="text-base font-bold text-slate-950">Courses</h3><span className="text-xs font-medium text-slate-500">{courses.length} total</span></div>
          {courses.length === 0 ? <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><p className="text-sm font-semibold text-slate-800">No course drafts exist yet.</p><p className="mt-2 text-xs leading-5 text-slate-500">The public catalogue remains empty until a reviewed course is validated and published.</p></div> : <ul className="mt-5 divide-y divide-slate-100">{courses.map((course) => <li key={course.versionId} className="flex items-center justify-between gap-4 py-4 first:pt-0"><div><p className="text-sm font-semibold text-slate-900">{course.title}</p><p className="mt-1 text-xs text-slate-500">/{course.slug} · Version {course.versionNumber} · {course.state.replaceAll("_", " ")}</p></div><Link href={`/admin/learn/${course.courseId}`} className="inline-flex h-10 items-center rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:border-ktf-blue/30 hover:text-ktf-blue">Open draft</Link></li>)}</ul>}
        </div>
        <form action={createAction} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card sm:p-6">
          <h3 className="text-base font-bold text-slate-950">Create draft course</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">This creates a private first version. Course content is supplied and reviewed by your team.</p>
          <div className="mt-5 space-y-4">
            <label className="block"><span className="text-xs font-semibold text-slate-700">Publisher name</span><input name="publisherName" required defaultValue="Bespoke Technologies" className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-700">Publisher slug</span><input name="publisherSlug" required defaultValue="bespoke-technologies" className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-700">Course title</span><input name="title" required className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-700">Course slug</span><input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-700">Summary</span><textarea name="summary" required className="mt-1.5 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-700">Description</span><textarea name="description" required className="mt-1.5 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" /></label>
            <button type="submit" className="inline-flex h-11 w-full items-center justify-center rounded-md bg-ktf-blue px-4 text-sm font-semibold text-white hover:bg-ktf-blue-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">Create draft course</button>
          </div>
        </form>
      </section>
    </div>
  );
}
