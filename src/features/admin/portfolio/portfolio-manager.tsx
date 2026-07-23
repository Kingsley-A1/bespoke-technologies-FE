"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ExternalLink, ImageUp, Pencil, Plus, Trash2 } from "lucide-react";
import { UploadLoading } from "@/features/admin/components/admin-loading";
import {
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "@/features/admin/components/admin-ui";
import type { PortfolioProject } from "@/types/portfolio";

export function PortfolioManager({ projects }: { projects: PortfolioProject[] }) {
  const [editing, setEditing] = useState<PortfolioProject | null>(null);
  return (
    <div className="space-y-6">
      <details className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <div>
            <h2 className="text-base font-bold text-slate-950">Upload a finished project</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Add the same metadata shown on the public portfolio, plus a production image.</p>
          </div>
          <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 group-open:hidden">
            <Plus className="h-4 w-4" /> New project
          </span>
        </summary>
        <div className="border-t border-slate-200 p-5 sm:p-6">
          <PortfolioForm />
        </div>
      </details>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
          <h2 className="text-base font-bold text-slate-950">Public portfolio</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{projects.length} database-backed projects. Drafts remain visible here but not on the website.</p>
        </div>
        {projects.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">No portfolio projects have been added.</p>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
            {projects.map((project) => <PortfolioCard key={project.id} project={project} onEdit={() => setEditing(project)} />)}
          </div>
        )}
      </section>
      {editing ? <PortfolioEditModal project={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

function PortfolioCard({ project, onEdit }: { project: PortfolioProject; onEdit: () => void }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (!window.confirm(`Delete ${project.name} from the portfolio? This cannot be undone.`)) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/admin/api/portfolio-projects/${encodeURIComponent(project.id)}`, { method: "DELETE" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "The project could not be deleted.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The project could not be deleted.");
      setDeleting(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white transition-[border-color,box-shadow] hover:border-ktf-blue/20 hover:shadow-card-hover">
      <div className="relative aspect-video bg-slate-100">
        <Image src={project.image} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" unoptimized={Boolean(project.imageKey)} />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${project.published ? "bg-emerald-600 text-white" : "bg-slate-900 text-white"}`}>
            {project.published ? "Published" : "Draft"}
          </span>
          {project.featured && <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-800">Featured</span>}
        </div>
      </div>
      <div className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ktf-blue-deep">{project.category}</p>
        <h3 className="mt-2 text-sm font-bold text-slate-950">{project.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{project.description}</p>
        <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
          <button type="button" onClick={onEdit} className={`${secondaryButtonClass} flex-1`}><Pencil className="h-3.5 w-3.5" /> Edit</button>
          {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" className={secondaryButtonClass} aria-label={`Open ${project.name}`}><ExternalLink className="h-3.5 w-3.5" /></a>}
          <button type="button" onClick={remove} disabled={deleting} className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 px-3 text-rose-700 transition hover:bg-rose-50 disabled:opacity-50" aria-label={`Delete ${project.name}`}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        {error && <p className="mt-3 text-xs text-rose-700" role="alert">{error}</p>}
      </div>
    </article>
  );
}

function PortfolioEditModal({ project, onClose }: { project: PortfolioProject; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/55 p-3 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="portfolio-edit-title">
      <button type="button" onClick={onClose} className="fixed inset-0 cursor-default" aria-label="Close project editor" />
      <div className="relative mx-auto max-w-3xl rounded-lg bg-white p-5 shadow-2xl sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h3 id="portfolio-edit-title" className="font-bold text-slate-950">Edit {project.name}</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">Changes update the public portfolio after saving.</p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Close</button>
        </div>
        <PortfolioForm project={project} onSaved={onClose} />
      </div>
    </div>
  );
}

export function PortfolioForm({ project, onSaved }: { project?: PortfolioProject; onSaved?: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string }>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSaving(true);
    setMessage(undefined);
    const form = new FormData(formElement);
    try {
      const response = await fetch(project ? `/admin/api/portfolio-projects/${encodeURIComponent(project.id)}` : "/admin/api/portfolio-projects", {
        method: project ? "PUT" : "POST",
        body: form,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "The project could not be saved.");
      setMessage({ tone: "success", text: project ? "Project updated." : "Finished project uploaded." });
      if (!project) formElement.reset();
      router.refresh();
      onSaved?.();
    } catch (caught) {
      setMessage({ tone: "error", text: caught instanceof Error ? caught.message : "The project could not be saved." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project ID" hint={project ? "The stable URL-safe ID cannot be changed." : "Lowercase letters, numbers, and hyphens."}>
          <input name="id" required={!project} disabled={Boolean(project)} defaultValue={project?.id} placeholder="customer-platform" className={inputClass} />
        </Field>
        <Field label="Project name"><input name="name" required defaultValue={project?.name} className={inputClass} /></Field>
        <Field label="Type">
          <select name="type" defaultValue={project?.type || "web"} className={inputClass}>
            <option value="web">Web</option><option value="mobile">Mobile</option><option value="ios">iOS</option><option value="desktop">Desktop</option><option value="web+mobile">Web + mobile</option>
          </select>
        </Field>
        <Field label="Category"><input name="category" required defaultValue={project?.category} placeholder="Business software" className={inputClass} /></Field>
        <Field label="Year"><input name="year" inputMode="numeric" required defaultValue={project?.year || new Date().getFullYear()} className={inputClass} /></Field>
        <Field label="Sort order"><input name="sortOrder" type="number" min="0" defaultValue={project?.sortOrder} placeholder="Added automatically" className={inputClass} /></Field>
        <Field label="Live project URL"><input name="liveUrl" type="url" defaultValue={project?.liveUrl} placeholder="https://" className={inputClass} /></Field>
        <Field asDiv label={project ? "Replace project image" : "Project image"} hint="PNG, JPEG, or WebP. Maximum 8 MB.">
          <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold leading-4 text-slate-600 hover:border-ktf-blue">
            <ImageUp className="h-4 w-4 shrink-0" /><span className="min-w-0 break-words">{project ? "Choose a new image (optional)" : "Choose finished-project image"}</span>
            <input name="image" type="file" required={!project} accept="image/png,image/jpeg,image/webp" className="sr-only" />
          </label>
        </Field>
      </div>
      <Field label="Description"><textarea name="description" required minLength={20} maxLength={1200} defaultValue={project?.description} className={textareaClass} /></Field>
      <Field label="Tags" hint="Comma-separated; up to 12 tags."><input name="tags" required defaultValue={project?.tags.join(", ")} placeholder="Next.js, Product Design, Cloud" className={inputClass} /></Field>
      <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <Check name="published" label="Published on website" defaultChecked={project?.published !== false} />
        <Check name="featured" label="Featured project" defaultChecked={project?.featured} />
        <Check name="comingSoon" label="Coming soon" defaultChecked={project?.comingSoon} />
      </div>
      {saving && <UploadLoading label={project ? "Saving project changes" : "Uploading project and metadata"} />}
      {message && <p role="status" className={`text-xs font-medium ${message.tone === "error" ? "text-rose-700" : "text-emerald-700"}`}>{message.text}</p>}
      <button type="submit" disabled={saving} className={primaryButtonClass}>{saving ? "Saving…" : project ? "Save project" : "Upload finished project"}</button>
    </form>
  );
}

function Field({ asDiv = false, label, hint, children }: { asDiv?: boolean; label: string; hint?: string; children: React.ReactNode }) {
  const content = <><span className={labelClass}>{label}</span>{children}{hint && <span className="mt-1 block text-[10px] leading-4 text-slate-400">{hint}</span>}</>;
  return asDiv ? <div>{content}</div> : <label>{content}</label>;
}

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return <label className="flex items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 rounded border-slate-300 text-ktf-blue" />{label}</label>;
}
