import Link from "next/link";
import { AdminAssetUploader } from "./admin-asset-uploader";

type Action = (formData: FormData) => void | Promise<void>;
type AdminBlock = { id: string; stableId: string; type: string; required: boolean; completionRule: string; config?: unknown; sortOrder: number };

type Course = {
  courseId: string;
  assets: Array<{ id: string; filename: string; mimeType: string; byteSize: number }>;
  version: { id: string; number: number; state: string; title: string; summary: string; description: string; outcomes: string[]; audience?: string; prerequisites: string[]; commitment?: string; formats: string[]; accessPolicy: string; seoTitle?: string; seoDescription?: string; reviewedAt?: string };
  modules: Array<{
    id: string;
    title: string;
    summary?: string;
    sortOrder: number;
    lessons: Array<{
      id: string;
      slug: string;
      title: string;
      objective: string;
      sortOrder: number;
      blocks: AdminBlock[];
    }>;
  }>;
};

const noAction: Action = async () => undefined;
const fieldClass = "mt-1 block h-10 w-full rounded-md border border-slate-300 px-3 text-sm";
const areaClass = "mt-1 block min-h-20 w-full rounded-md border border-slate-300 p-3 text-sm";

export function AdminCourseEditor({
  course,
  addModuleAction = noAction,
  addLessonAction = noAction,
  addBlockAction = noAction,
  updateBlockAction = noAction,
  duplicateBlockAction = noAction,
  removeBlockAction = noAction,
  moveItemAction = noAction,
  addAuthorAction = noAction,
  updateCourseAction = noAction,
  validateAction = noAction,
  publishAction = noAction,
  forkVersionAction = noAction,
  archiveAction = noAction,
  grantAccessAction = noAction,
  revokeAccessAction = noAction,
}: {
  course: Course;
  addModuleAction?: Action;
  addLessonAction?: Action;
  addBlockAction?: Action;
  updateBlockAction?: Action;
  duplicateBlockAction?: Action;
  removeBlockAction?: Action;
  moveItemAction?: Action;
  addAuthorAction?: Action;
  updateCourseAction?: Action;
  validateAction?: Action;
  publishAction?: Action;
  forkVersionAction?: Action;
  archiveAction?: Action;
  grantAccessAction?: Action;
  revokeAccessAction?: Action;
}) {
  const canEdit = course.version.state === "draft";

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ktf-blue">Version {course.version.number} · {course.version.state.replaceAll("_", " ")}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-950">{course.version.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{course.version.summary}</p>
        <p className="mt-4 rounded-md bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          {canEdit
            ? "This draft is private. Saving modules, lessons, or blocks does not publish it."
            : "This version is immutable. Create a new draft version before changing course content."}
        </p>
        <Link href={`/admin/learn/${course.courseId}/preview`} className="mt-4 inline-flex h-10 items-center rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:border-ktf-blue/30 hover:text-ktf-blue">Preview this private version</Link>
      </section>

      {!canEdit && <form action={forkVersionAction} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card"><input type="hidden" name="courseId" value={course.courseId} /><h3 className="text-base font-bold text-slate-950">Create an editable revision</h3><p className="mt-1 text-xs leading-5 text-slate-500">The published hierarchy is copied into a new private draft. Learner history remains attached to the existing version.</p><button className="mt-4 h-10 rounded-md border border-ktf-blue/30 px-4 text-sm font-semibold text-ktf-blue">Create draft revision</button></form>}
      {!canEdit && <form action={archiveAction} className="rounded-lg border border-red-200 bg-white p-5 shadow-card"><input type="hidden" name="courseId" value={course.courseId} /><h3 className="text-base font-bold text-slate-950">Archive course</h3><p className="mt-1 text-xs leading-5 text-slate-500">Archiving immediately removes the course from public discovery while preserving versions, learner records, and audits.</p><label className="mt-4 flex items-start gap-3 text-xs leading-5 text-slate-700"><input name="confirmed" type="checkbox" required className="mt-0.5 size-4" /><span>I understand that this removes the course from public access.</span></label><button className="mt-4 h-10 rounded-md border border-red-700/30 px-4 text-sm font-semibold text-red-800">Archive course</button></form>}

      {canEdit && (
        <section className="grid gap-5 lg:grid-cols-2">
          <form action={updateCourseAction} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card lg:col-span-2">
            <input type="hidden" name="courseId" value={course.courseId} />
            <input type="hidden" name="courseVersionId" value={course.version.id} />
            <h3 className="text-base font-bold text-slate-950">Course details and catalogue metadata</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">Only reviewed, factual course information belongs here. This form saves the draft; it does not publish it.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700">Course title<input name="title" required defaultValue={course.version.title} className={fieldClass} /></label>
              <label className="text-xs font-semibold text-slate-700">Access policy<select name="accessPolicy" defaultValue={course.version.accessPolicy} className={fieldClass}><option value="unavailable">Unavailable</option><option value="public_preview">Public preview</option><option value="authenticated_free">Authenticated free</option><option value="manual_grant">Manually granted</option></select></label>
              <label className="text-xs font-semibold text-slate-700 md:col-span-2">Summary<textarea name="summary" required defaultValue={course.version.summary} className={areaClass} /></label>
              <label className="text-xs font-semibold text-slate-700 md:col-span-2">Description<textarea name="description" required defaultValue={course.version.description} className={areaClass} /></label>
              <label className="text-xs font-semibold text-slate-700">Outcomes <span className="font-normal">(one per line)</span><textarea name="outcomes" defaultValue={course.version.outcomes.join("\n")} className={areaClass} /></label>
              <label className="text-xs font-semibold text-slate-700">Prerequisites <span className="font-normal">(one per line)</span><textarea name="prerequisites" defaultValue={course.version.prerequisites.join("\n")} className={areaClass} /></label>
              <label className="text-xs font-semibold text-slate-700">Audience<input name="audience" defaultValue={course.version.audience} className={fieldClass} /></label>
              <label className="text-xs font-semibold text-slate-700">Commitment<input name="commitment" defaultValue={course.version.commitment} className={fieldClass} /></label>
              <label className="text-xs font-semibold text-slate-700">Formats <span className="font-normal">(one per line)</span><textarea name="formats" defaultValue={course.version.formats.join("\n")} className={areaClass} /></label>
              <label className="text-xs font-semibold text-slate-700">SEO title<input name="seoTitle" defaultValue={course.version.seoTitle} maxLength={60} className={fieldClass} /></label>
              <label className="text-xs font-semibold text-slate-700 md:col-span-2">SEO description<textarea name="seoDescription" defaultValue={course.version.seoDescription} maxLength={160} className={areaClass} /></label>
              <button className="h-10 rounded-md border border-ktf-blue/30 px-4 text-sm font-semibold text-ktf-blue md:col-span-2">Save course details</button>
            </div>
          </form>
          <form action={addAuthorAction} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
            <input type="hidden" name="courseId" value={course.courseId} />
            <input type="hidden" name="courseVersionId" value={course.version.id} />
            <h3 className="text-base font-bold text-slate-950">Add course author</h3>
            <div className="mt-4 grid gap-3">
              <input name="authorName" required placeholder="Author display name" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
              <input name="authorSlug" required placeholder="author-slug" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
              <button className="h-10 rounded-md border border-ktf-blue/30 px-4 text-sm font-semibold text-ktf-blue">Add author</button>
            </div>
          </form>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="text-base font-bold text-slate-950">Publication controls</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">Validation checks review date, authorship, hierarchy, block schema, and accessibility before publication.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <form action={validateAction} className="flex flex-1 gap-2">
                <input type="hidden" name="courseId" value={course.courseId} />
                <label className="sr-only" htmlFor="review-date">Review date</label>
                <input id="review-date" type="date" name="reviewDate" required className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-sm" />
                <button className="h-10 rounded-md border border-ktf-blue/30 px-3 text-sm font-semibold text-ktf-blue">Validate draft</button>
              </form>
              <form action={publishAction}>
                <input type="hidden" name="courseId" value={course.courseId} />
                <button className="h-10 rounded-md bg-ktf-blue px-4 text-sm font-semibold text-white">Publish version</button>
              </form>
            </div>
          </div>
        </section>
      )}

      {canEdit && <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
        <h3 className="text-base font-bold text-slate-950">Course assets</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">Upload only reviewed course media. Image alternative text and audio/video transcripts are checked before publication.</p>
        <AdminAssetUploader courseId={course.courseId} />
        {course.assets.length > 0 && <ul className="mt-5 divide-y divide-slate-100 border-t border-slate-100 text-sm">{course.assets.map((asset) => <li key={asset.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><span className="font-medium text-slate-800">{asset.filename}</span><code className="break-all text-xs text-slate-600">{asset.id}</code><span className="text-xs text-slate-500">{asset.mimeType} · {asset.byteSize.toLocaleString()} bytes</span></li>)}</ul>}
      </section>}

      <section className="grid gap-5 lg:grid-cols-2" aria-label="Individual course access">
        <form action={grantAccessAction} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
          <input type="hidden" name="courseId" value={course.courseId} />
          <h3 className="text-base font-bold text-slate-950">Grant individual access</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">The learner must already have verified this email address.</p>
          <label className="mt-4 block text-xs font-semibold text-slate-700">Learner email<input name="learnerEmail" type="email" required className={fieldClass} /></label>
          <button className="mt-3 h-10 rounded-md border border-ktf-blue/30 px-4 text-sm font-semibold text-ktf-blue">Grant access</button>
        </form>
        <form action={revokeAccessAction} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
          <input type="hidden" name="courseId" value={course.courseId} />
          <h3 className="text-base font-bold text-slate-950">Revoke individual access</h3>
          <label className="mt-4 block text-xs font-semibold text-slate-700">Learner email<input name="learnerEmail" type="email" required className={fieldClass} /></label>
          <label className="mt-3 block text-xs font-semibold text-slate-700">Revocation reason<input name="reason" required className={fieldClass} /></label>
          <button className="mt-3 h-10 rounded-md border border-red-700/30 px-4 text-sm font-semibold text-red-800">Revoke access</button>
        </form>
      </section>

      {canEdit && (
        <form action={addModuleAction} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
          <input type="hidden" name="courseId" value={course.courseId} />
          <input type="hidden" name="courseVersionId" value={course.version.id} />
          <h3 className="text-base font-bold text-slate-950">Add module</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input name="title" required placeholder="Module title" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
            <input name="summary" placeholder="Optional summary" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
            <button className="h-10 rounded-md bg-ktf-blue px-4 text-sm font-semibold text-white">Add module</button>
          </div>
        </form>
      )}

      <section className="space-y-5">
        {course.modules.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Add the first module when reviewed curriculum material is ready.</div>
        ) : course.modules.map((module) => (
          <article key={module.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card">
            <div>
              <p className="text-xs font-semibold text-ktf-blue">Module {module.sortOrder + 1}</p>
              <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="mt-1 text-lg font-bold text-slate-950">{module.title}</h3>{canEdit && <MoveItemControls courseId={course.courseId} itemId={module.id} kind="module" action={moveItemAction} />}</div>
              {module.summary && <p className="mt-1 text-sm text-slate-600">{module.summary}</p>}
            </div>
            {canEdit && (
              <form action={addLessonAction} className="mt-5 grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-2">
                <input type="hidden" name="courseId" value={course.courseId} />
                <input type="hidden" name="moduleId" value={module.id} />
                <input name="title" required placeholder="Lesson title" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
                <input name="slug" required placeholder="lesson-slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
                <input name="objective" required placeholder="One clear learning objective" className="h-10 rounded-md border border-slate-300 px-3 text-sm md:col-span-2" />
                <input name="context" placeholder="Optional context" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
                <input name="estimatedMinutes" type="number" min="1" max="120" defaultValue="10" className="h-10 rounded-md border border-slate-300 px-3 text-sm" />
                <button className="h-10 rounded-md bg-ktf-blue px-4 text-sm font-semibold text-white md:col-span-2">Add lesson</button>
              </form>
            )}
            <div className="mt-5 space-y-4">
              {module.lessons.map((lesson) => (
                <section key={lesson.id} className="rounded-md border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-ktf-blue">Lesson {lesson.sortOrder + 1} · /{lesson.slug}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3"><h4 className="mt-1 font-semibold text-slate-950">{lesson.title}</h4>{canEdit && <MoveItemControls courseId={course.courseId} itemId={lesson.id} kind="lesson" action={moveItemAction} />}</div>
                  <p className="mt-1 text-sm text-slate-600">{lesson.objective}</p>
                  {lesson.blocks.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {lesson.blocks.map((block) => (
                        <li key={block.id} className="flex items-center justify-between rounded bg-slate-50 px-3 py-2 text-xs text-slate-600">
                          <span>{block.stableId} · {block.type.replaceAll("_", " ")}</span>
                          <span>{block.required ? "Required" : "Optional"}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {canEdit && <>
                    {lesson.blocks.map((block) => <div key={`${block.id}-controls`} className="mt-3 rounded-md border border-slate-200 p-3">
                      <MoveItemControls courseId={course.courseId} itemId={block.id} kind="block" action={moveItemAction} />
                      <details><summary className="cursor-pointer text-sm font-semibold text-ktf-blue">Edit block</summary><BlockForm courseId={course.courseId} lessonId={lesson.id} action={updateBlockAction} existingBlock={block} /></details>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <form action={duplicateBlockAction} className="flex gap-2"><input type="hidden" name="courseId" value={course.courseId} /><input type="hidden" name="blockRowId" value={block.id} /><label className="sr-only" htmlFor={`duplicate-${block.id}`}>New stable block ID</label><input id={`duplicate-${block.id}`} name="newBlockId" required placeholder="new-stable-block-id" className="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3 text-xs" /><button className="h-10 whitespace-nowrap rounded-md border border-ktf-blue/30 px-3 text-xs font-semibold text-ktf-blue">Duplicate block</button></form>
                        <form action={removeBlockAction} className="flex items-center justify-end gap-2"><input type="hidden" name="courseId" value={course.courseId} /><input type="hidden" name="blockRowId" value={block.id} /><label className="flex items-center gap-2 text-xs text-slate-600"><input name="confirmed" type="checkbox" required />Confirm</label><button className="h-10 rounded-md border border-red-700/30 px-3 text-xs font-semibold text-red-800">Remove block</button></form>
                      </div>
                    </div>)}
                    <BlockForm courseId={course.courseId} lessonId={lesson.id} action={addBlockAction} />
                  </>}
                </section>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function MoveItemControls({ courseId, itemId, kind, action }: { courseId: string; itemId: string; kind: "module" | "lesson" | "block"; action: Action }) {
  return <div className="flex gap-2"><form action={action}><input type="hidden" name="courseId" value={courseId} /><input type="hidden" name="itemId" value={itemId} /><input type="hidden" name="kind" value={kind} /><input type="hidden" name="direction" value="earlier" /><button className="h-9 rounded-md border border-slate-200 px-2 text-xs font-semibold text-slate-700">Move earlier</button></form><form action={action}><input type="hidden" name="courseId" value={courseId} /><input type="hidden" name="itemId" value={itemId} /><input type="hidden" name="kind" value={kind} /><input type="hidden" name="direction" value="later" /><button className="h-9 rounded-md border border-slate-200 px-2 text-xs font-semibold text-slate-700">Move later</button></form></div>;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function blockDefaults(block?: AdminBlock) {
  const config = record(block?.config);
  const textList = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").join("\n") : "";
  const options = Array.isArray(config.options) ? config.options.map((option) => record(option)).map((option) => [option.id, option.label, option.feedback, option.correct ? "true" : "false"].map((value) => String(value ?? "")).join(" | ")).join("\n") : "";
  const slides = Array.isArray(config.slides) ? config.slides.map((slide) => record(slide)).map((slide) => `${String(slide.assetId ?? "")} | ${String(slide.altText ?? "")}`).join("\n") : "";
  return { type: block?.type ?? "rich_text", blockId: block?.stableId ?? "", required: String(block?.required ?? false), completionRule: block?.completionRule ?? "none", paragraphs: textList(config.paragraphs), title: String(config.title ?? ""), body: String(config.body ?? ""), tone: String(config.tone ?? "info"), assetId: String(config.assetId ?? ""), altText: String(config.altText ?? ""), decorative: String(config.decorative ?? false), caption: String(config.caption ?? ""), transcript: String(config.transcript ?? ""), captionsAssetId: String(config.captionsAssetId ?? ""), slides, label: String(config.label ?? ""), description: String(config.description ?? ""), prompt: String(config.prompt ?? ""), instructions: String(config.instructions ?? ""), options, kind: String(config.kind ?? "single_choice"), retryLimit: String(config.retryLimit ?? 0), guidance: String(config.guidance ?? ""), artifactKind: String(config.artifactKind ?? "reflection") };
}

function BlockForm({ courseId, lessonId, action, existingBlock }: { courseId: string; lessonId: string; action: Action; existingBlock?: AdminBlock }) {
  const values = blockDefaults(existingBlock);
  return (
    <details className={existingBlock ? "mt-3" : "mt-4 border-t border-slate-100 pt-4"} open={Boolean(existingBlock)}>
      {!existingBlock && <summary className="cursor-pointer text-sm font-semibold text-ktf-blue">Add typed content block</summary>}
      <form action={action} className="mt-4 grid gap-3 md:grid-cols-2">
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="lessonId" value={lessonId} />
        {existingBlock && <input type="hidden" name="blockRowId" value={existingBlock.id} />}
        <label className="text-xs font-semibold text-slate-700">Block type
          <select name="blockType" defaultValue={values.type} className={fieldClass}>
            <option value="rich_text">Rich text</option><option value="callout">Callout</option><option value="image">Image</option><option value="slides">Slides</option><option value="video">Video</option><option value="audio">Audio</option><option value="download">Download</option><option value="quiz">Quiz</option><option value="interactive">Interactive</option><option value="reflection">Reflection</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">Stable block ID<input name="blockId" required readOnly={Boolean(existingBlock)} defaultValue={values.blockId} placeholder="explain-concept" className={fieldClass} /></label>
        <label className="text-xs font-semibold text-slate-700">Completion rule
          <select name="completionRule" defaultValue={values.completionRule} className={fieldClass}>
            <option value="none">No completion requirement</option><option value="acknowledged">Acknowledged</option><option value="submitted">Submitted</option><option value="assessment_passed">Assessment passed</option><option value="media_complete">Media complete</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-700">Required
          <select name="required" defaultValue={values.required} className={fieldClass}><option value="false">Optional</option><option value="true">Required</option></select>
        </label>
        <label className="text-xs font-semibold text-slate-700 md:col-span-2">Paragraphs / body (one paragraph per line)<textarea name="paragraphs" defaultValue={values.paragraphs} className={areaClass} /></label>
        <label className="text-xs font-semibold text-slate-700">Title<input name="title" defaultValue={values.title} className={fieldClass} /></label>
        <label className="text-xs font-semibold text-slate-700">Callout body<textarea name="body" defaultValue={values.body} className={areaClass} /></label>
        <label className="text-xs font-semibold text-slate-700">Callout tone<select name="tone" defaultValue={values.tone} className={fieldClass}><option value="info">Information</option><option value="caution">Caution</option><option value="practice">Practice</option></select></label>
        <label className="text-xs font-semibold text-slate-700">Asset ID<input name="assetId" defaultValue={values.assetId} className={fieldClass} /></label>
        <label className="text-xs font-semibold text-slate-700">Alt text<input name="altText" defaultValue={values.altText} className={fieldClass} /></label>
        <label className="text-xs font-semibold text-slate-700">Decorative image<select name="decorative" defaultValue="false" className={fieldClass}><option value="false">No — meaningful image</option><option value="true">Yes — decorative only</option></select></label>
        <label className="text-xs font-semibold text-slate-700">Image caption<input name="caption" defaultValue={values.caption} className={fieldClass} /></label>
        <label className="text-xs font-semibold text-slate-700">Media transcript<input name="transcript" defaultValue={values.transcript} className={fieldClass} /></label>
        <label className="text-xs font-semibold text-slate-700">Captions asset ID<input name="captionsAssetId" defaultValue={values.captionsAssetId} className={fieldClass} /></label>
        <label className="text-xs font-semibold text-slate-700 md:col-span-2">Slides (one <code>asset-id | meaningful alt text</code> per line)<textarea name="slides" defaultValue={values.slides} className={areaClass} /></label>
        <label className="text-xs font-semibold text-slate-700">Download label<input name="label" defaultValue={values.label} className={fieldClass} /></label>
        <label className="text-xs font-semibold text-slate-700">Download description<input name="description" defaultValue={values.description} className={fieldClass} /></label>
        <label className="text-xs font-semibold text-slate-700 md:col-span-2">Prompt<input name="prompt" defaultValue={values.prompt} className={fieldClass} /></label>
        <label className="text-xs font-semibold text-slate-700 md:col-span-2">Instructions<textarea name="instructions" defaultValue={values.instructions} className={areaClass} /></label>
        <label className="text-xs font-semibold text-slate-700 md:col-span-2">Choice options (one <code>id | label | explanatory feedback | true/false</code> per line)<textarea name="options" defaultValue={values.options} className={areaClass} /></label>
        <label className="text-xs font-semibold text-slate-700">Interaction kind
          <select name="kind" defaultValue={values.kind} className={fieldClass}><option value="single_choice">Single choice</option><option value="multiple_choice">Multiple choice</option><option value="scenario_choice">Scenario choice</option><option value="short_structured_response">Short structured response</option></select>
        </label>
        <label className="text-xs font-semibold text-slate-700">Retry limit<input name="retryLimit" type="number" min="0" max="10" defaultValue={values.retryLimit} className={fieldClass} /></label>
        <label className="text-xs font-semibold text-slate-700">Guidance<textarea name="guidance" defaultValue={values.guidance} className={areaClass} /></label>
        <label className="text-xs font-semibold text-slate-700">Reflection artifact<select name="artifactKind" defaultValue={values.artifactKind} className={fieldClass}><option value="reflection">Reflection</option><option value="ai_opportunity_blueprint">AI Opportunity Blueprint</option></select></label>
        <button className="h-11 rounded-md bg-ktf-blue px-4 text-sm font-semibold text-white md:col-span-2">{existingBlock ? "Save block changes" : "Save typed block"}</button>
      </form>
    </details>
  );
}
