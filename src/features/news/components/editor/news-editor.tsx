"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Circle,
  ExternalLink,
  Eye,
  Loader2,
  Save,
  ShieldAlert,
} from "lucide-react";
import {
  inputClass,
  labelClass,
  Panel,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "@/features/admin/components/admin-ui";
import { cn } from "@/lib/utils";
import { NEWS_CATEGORIES, type NewsCategory } from "../../categories";
import { collectNewsImageIds, excerpt, newsDocumentText, readStoredNewsDocument } from "../../content";
import { slugifyNewsTitle } from "../../editor-input";
import { formatNewsDate } from "../../seo";
import { deriveNewsState, newsPublishBlockers, toLagosDateTimeInput, wasEverPublic } from "../../status";
import type { NewsPost } from "../../types";
import { NewsStatePill } from "../news-state-pill";
import { CoverField } from "./cover-field";
import { RichTextEditor, type UploadedImage } from "./rich-text-editor";
import { SearchPreview, WhatsAppPreview } from "./share-previews";
import { postImage, UploadError } from "./upload-image";

interface Draft {
  title: string;
  dek: string;
  category: NewsCategory;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  authorName: string;
  isFeatured: boolean;
  coverAlt: string;
  body: JSONContent;
}

type SaveState = "idle" | "saving" | "saved" | "error";
type StatusAction = "publish" | "schedule" | "unpublish" | "archive" | "restore";

class RequestError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function send<T>(url: string, method: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new RequestError("Network error. Your changes are still here; try again when you are back online.");
  }
  const data = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
  if (!response.ok) throw new RequestError(data.error ?? "The request failed.", data.code);
  return data as T;
}

function draftFrom(post: NewsPost | null, defaultAuthor: string): Draft {
  return {
    title: post?.title ?? "",
    dek: post?.dek ?? "",
    category: post?.category ?? "announcements",
    slug: post?.slug ?? "",
    seoTitle: post?.seoTitle ?? "",
    seoDescription: post?.seoDescription ?? "",
    authorName: post?.authorName ?? defaultAuthor,
    isFeatured: post?.isFeatured ?? false,
    coverAlt: post?.coverAlt ?? "",
    body: (post?.body as JSONContent | undefined) ?? { type: "doc", content: [] },
  };
}

function Counter({ value, max }: { value: string; max: number }) {
  return (
    <span className={cn("text-[11px] tabular-nums", value.length > max ? "font-semibold text-rose-600" : "text-slate-400")}>
      {value.length}/{max}
    </span>
  );
}

export function NewsEditor({ initialPost, defaultAuthor }: { initialPost: NewsPost | null; defaultAuthor: string }) {
  const router = useRouter();
  const [post, setPost] = useState<NewsPost | null>(initialPost);
  const [draft, setDraft] = useState<Draft>(() => draftFrom(initialPost, defaultAuthor));
  const [slugTouched, setSlugTouched] = useState(
    Boolean(initialPost && initialPost.slug !== slugifyNewsTitle(initialPost.title)),
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string; code?: string } | null>(null);
  const [busyAction, setBusyAction] = useState<StatusAction | "delete" | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return `${toLagosDateTimeInput(tomorrow).slice(0, 10)}T09:00`;
  });
  const [now, setNow] = useState(() => new Date());

  const changeCounter = useRef(0);
  const savedCounter = useRef(0);
  const postRef = useRef(post);
  const draftRef = useRef(draft);
  const slugTouchedRef = useRef(slugTouched);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  // Refs are updated at the moment state is committed, so queued requests
  // always read the latest version and draft without waiting for a render.
  const commitPost = useCallback((next: NewsPost) => {
    postRef.current = next;
    setPost(next);
  }, []);
  const commitDraft = useCallback((next: (current: Draft) => Draft) => {
    draftRef.current = next(draftRef.current);
    setDraft(draftRef.current);
  }, []);

  const dirty = saveState !== "saving" && changeCounter.current !== savedCounter.current;
  const state = post ? deriveNewsState(post, now) : "draft";
  const everPublic = post ? wasEverPublic(post, now) : false;
  const isLive = state === "published" || state === "scheduled";

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const update = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    changeCounter.current += 1;
    setSaveState((current) => (current === "saved" ? "idle" : current));
    commitDraft((current) => ({ ...current, [key]: value }));
  }, [commitDraft]);

  /** Serializes every server mutation so versions never race each other. */
  const enqueue = useCallback(<T,>(task: () => Promise<T>) => {
    const run = queue.current.then(task, task);
    queue.current = run.catch(() => undefined);
    return run;
  }, []);

  const save = useCallback(
    () =>
      enqueue(async () => {
        const startedAt = changeCounter.current;
        const current = postRef.current;
        if (current && startedAt === savedCounter.current) return current;
        const value = draftRef.current;
        const payload = {
          title: value.title,
          dek: value.dek,
          category: value.category,
          slug: slugTouchedRef.current ? value.slug : undefined,
          autoSlug: !slugTouchedRef.current,
          seoTitle: value.seoTitle,
          seoDescription: value.seoDescription,
          authorName: value.authorName,
          isFeatured: value.isFeatured,
          coverAlt: value.coverAlt,
          body: value.body,
        };
        setSaveState("saving");
        try {
          const { post: saved } = current
            ? await send<{ post: NewsPost }>(`/admin/api/news/${current.id}`, "PATCH", { ...payload, version: current.version })
            : await send<{ post: NewsPost }>("/admin/api/news", "POST", payload);
          if (!current) window.history.replaceState(null, "", `/admin/news/${saved.id}`);
          savedCounter.current = startedAt;
          commitPost(saved);
          if (!slugTouchedRef.current) commitDraft((draftNow) => ({ ...draftNow, slug: saved.slug }));
          setSaveState(changeCounter.current === startedAt ? "saved" : "idle");
          setMessage((existing) => (existing?.tone === "error" ? null : existing));
          return saved;
        } catch (error) {
          setSaveState("error");
          setMessage({
            tone: "error",
            text: error instanceof Error ? error.message : "Save failed.",
            code: error instanceof RequestError ? error.code : undefined,
          });
          throw error;
        }
      }),
    [enqueue, commitPost, commitDraft],
  );

  /** Saves a brand-new post so uploads have somewhere to attach. */
  const ensurePost = useCallback(async () => {
    if (postRef.current) return postRef.current;
    if (!draftRef.current.title.trim()) {
      throw new UploadError("Add a headline first so the post can be saved.");
    }
    return save();
  }, [save]);

  // Drafts autosave quietly; live posts change only when the editor presses Update.
  useEffect(() => {
    if (!dirty || isLive || !draft.title.trim() || saveState === "error") return;
    const timer = window.setTimeout(() => void save().catch(() => undefined), 2500);
    return () => window.clearTimeout(timer);
  }, [draft, dirty, isLive, save, saveState]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (draftRef.current.title.trim()) void save().catch(() => undefined);
      }
    };
    const onLeave = (event: BeforeUnloadEvent) => {
      if (changeCounter.current !== savedCounter.current) event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [save]);

  async function uploadCover(file: File) {
    const target = await ensurePost();
    await enqueue(async () => {
      const latest = postRef.current ?? target;
      const { post: saved } = await postImage<{ post: NewsPost }>(`/admin/api/news/${latest.id}/cover`, file, {
        alt: draftRef.current.coverAlt,
      });
      commitPost(saved);
    });
  }

  async function uploadInlineImage(file: File): Promise<UploadedImage> {
    const target = await ensurePost();
    return postImage<UploadedImage>(`/admin/api/news/${target.id}/images`, file);
  }

  async function runStatus(action: StatusAction) {
    setBusyAction(action);
    setMessage(null);
    try {
      if (!postRef.current || changeCounter.current !== savedCounter.current) await save();
      const saved = await enqueue(async () => {
        const current = postRef.current!;
        const { post: next } = await send<{ post: NewsPost }>(`/admin/api/news/${current.id}/status`, "POST", {
          action,
          version: current.version,
          ...(action === "schedule" ? { publishAt: scheduleAt } : {}),
        });
        commitPost(next);
        return next;
      });
      setScheduleOpen(false);
      const text =
        action === "publish"
          ? "Published. The article is live."
          : action === "schedule"
            ? `Scheduled for ${formatNewsDate(saved.publishedAt)} (Lagos time).`
            : action === "unpublish"
              ? "Unpublished. The article is no longer public."
              : action === "archive"
                ? "Archived."
                : "Restored to draft.";
      setMessage({ tone: "success", text });
      router.refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "That did not work.",
        code: error instanceof RequestError ? error.code : undefined,
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function deletePost() {
    const current = postRef.current;
    if (!current) return;
    if (!window.confirm(`Delete "${current.title}" permanently? Its images are deleted too. This cannot be undone.`)) return;
    setBusyAction("delete");
    try {
      await enqueue(() => send(`/admin/api/news/${current.id}`, "DELETE", { version: postRef.current!.version }));
      savedCounter.current = changeCounter.current;
      router.push("/admin/news");
      router.refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Delete failed.",
        code: error instanceof RequestError ? error.code : undefined,
      });
      setBusyAction(null);
    }
  }

  async function openPreview() {
    const preview = window.open("about:blank", "_blank");
    try {
      const saved = await save();
      if (preview) preview.location.href = `/admin/news/${saved.id}/preview`;
    } catch {
      preview?.close();
    }
  }

  const bodyDoc = useMemo(() => readStoredNewsDocument(draft.body), [draft.body]);
  const bodyText = useMemo(() => newsDocumentText(bodyDoc), [bodyDoc]);
  const blockers = newsPublishBlockers({
    title: draft.title,
    bodyText,
    hasImages: collectNewsImageIds(bodyDoc).length > 0,
    coverAssetId: post?.coverAssetId,
    shareAssetId: post?.shareAssetId,
    coverAlt: draft.coverAlt,
  });
  const previewDescription = draft.seoDescription || (draft.dek ? excerpt(draft.dek, 200) : excerpt(bodyText, 160));
  const previewTitle = draft.seoTitle || draft.title;
  const displaySlug = slugTouched ? draft.slug : (post?.slug ?? slugifyNewsTitle(draft.title));

  const saveLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "error"
        ? "Not saved"
        : dirty
          ? isLive
            ? "Unsaved changes — readers see the previous version"
            : "Unsaved changes"
          : post
            ? "All changes saved"
            : "New post";

  const busy = busyAction !== null;

  return (
    <div className="mx-auto max-w-[1360px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/admin/news"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-slate-600 hover:bg-white hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" /> All posts
          </Link>
          <NewsStatePill state={state} />
          <span
            className={cn(
              "inline-flex items-center gap-1.5 truncate text-xs",
              saveState === "error"
                ? "font-semibold text-rose-700"
                : dirty && isLive
                  ? "font-semibold text-amber-700"
                  : "text-slate-500",
            )}
            aria-live="polite"
          >
            {saveState === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saveLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void openPreview()}
            className={secondaryButtonClass}
            disabled={!draft.title.trim()}
          >
            <Eye className="h-4 w-4" /> Preview
          </button>
          {state === "published" && post && (
            <a href={`/news/${post.slug}`} target="_blank" rel="noreferrer" className={secondaryButtonClass}>
              <ExternalLink className="h-4 w-4" /> View live
            </a>
          )}
          <button
            type="button"
            onClick={() => void save().catch(() => undefined)}
            className={isLive ? primaryButtonClass : secondaryButtonClass}
            disabled={!draft.title.trim() || saveState === "saving" || (!dirty && Boolean(post))}
          >
            <Save className="h-4 w-4" /> {isLive ? "Update" : "Save draft"}
          </button>
        </div>
      </div>

      {message && (
        <div
          role={message.tone === "error" ? "alert" : "status"}
          className={cn(
            "flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3.5 text-xs leading-5",
            message.tone === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800",
          )}
        >
          <p className="flex items-start gap-2">
            {message.tone === "error" ? (
              message.code === "reauth_required" ? (
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {message.text}
          </p>
          {message.code === "reauth_required" && (
            <a href="/admin/reauth" target="_blank" rel="noreferrer" className="font-semibold underline">
              Confirm identity in a new tab, then try again
            </a>
          )}
          {message.code === "version_conflict" && (
            <button type="button" onClick={() => window.location.reload()} className="font-semibold underline">
              Reload the latest version
            </button>
          )}
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <Panel>
            <div className="space-y-4 p-5 sm:p-7">
              <label className="block">
                <span className="sr-only">Headline</span>
                <textarea
                  value={draft.title}
                  onChange={(event) => update("title", event.target.value.replace(/\n/g, " "))}
                  placeholder="Headline"
                  rows={1}
                  maxLength={140}
                  className="field-sizing-content w-full resize-none border-0 bg-transparent p-0 text-[1.75rem] font-extrabold leading-tight tracking-[-0.03em] text-slate-950 outline-none placeholder:text-slate-300 sm:text-[2.1rem]"
                />
              </label>
              <label className="block">
                <span className="flex items-center justify-between">
                  <span className={labelClass}>Summary</span>
                  <Counter value={draft.dek} max={320} />
                </span>
                <textarea
                  value={draft.dek}
                  onChange={(event) => update("dek", event.target.value)}
                  rows={2}
                  maxLength={320}
                  placeholder="One or two sentences shown under the headline, on cards and in link previews."
                  className={cn(textareaClass, "min-h-0 text-[15px] leading-6")}
                />
              </label>
            </div>
          </Panel>

          <Panel>
            <div className="border-b border-slate-200 px-5 py-4 sm:px-7">
              <h2 className="text-sm font-bold text-slate-950">Cover image</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Shown at the top of the article and used as the WhatsApp and social share image.
              </p>
            </div>
            <div className="p-5 sm:p-7">
              <CoverField
                coverAssetId={post?.coverAssetId}
                coverAlt={draft.coverAlt}
                onAltChange={(value) => update("coverAlt", value)}
                onUpload={uploadCover}
              />
            </div>
          </Panel>

          <Panel className="overflow-visible">
            <RichTextEditor
              initialContent={draft.body}
              onChange={(content) => update("body", content)}
              onUploadImage={uploadInlineImage}
            />
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel>
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-950">Publishing</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {state === "published" && post?.publishedAt && `Live since ${formatNewsDate(post.publishedAt)}.`}
                {state === "scheduled" &&
                  post?.publishedAt &&
                  `Goes live ${formatNewsDate(post.publishedAt)} at ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" }).format(new Date(post.publishedAt))} (Lagos).`}
                {state === "draft" &&
                  (everPublic
                    ? "Unpublished. It was public before and keeps its original date."
                    : "Only your team can see this draft.")}
                {state === "archived" && "Hidden from the public site."}
              </p>
            </div>
            <div className="space-y-4 p-5">
              {(state === "draft" || state === "scheduled") && (
                <ul className="space-y-1.5" aria-label="Publishing checklist">
                  {[
                    { label: "Headline", done: draft.title.trim().length >= 3 },
                    { label: "Article body", done: !blockers.includes("Write the article body.") },
                    { label: "Cover image", done: Boolean(post?.coverAssetId && post.shareAssetId) },
                    { label: "Cover alt text", done: Boolean(draft.coverAlt.trim()) },
                  ].map((item) => (
                    <li key={item.label} className="flex items-center gap-2 text-xs">
                      {item.done ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-slate-300" />
                      )}
                      <span className={item.done ? "text-slate-700" : "text-slate-500"}>{item.label}</span>
                    </li>
                  ))}
                </ul>
              )}

              {state === "draft" && (
                <div className="space-y-2">
                  <button
                    type="button"
                    className={cn(primaryButtonClass, "w-full")}
                    disabled={busy || blockers.length > 0}
                    onClick={() => void runStatus("publish")}
                  >
                    {busyAction === "publish" && <Loader2 className="h-4 w-4 animate-spin" />} Publish now
                  </button>
                  {!everPublic && (
                    <button
                      type="button"
                      className={cn(secondaryButtonClass, "h-10 w-full")}
                      disabled={busy || blockers.length > 0}
                      onClick={() => setScheduleOpen((open) => !open)}
                      aria-expanded={scheduleOpen}
                    >
                      <CalendarClock className="h-4 w-4" /> Schedule…
                    </button>
                  )}
                  {scheduleOpen && (
                    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <label className="block">
                        <span className={labelClass}>Go live at (Lagos time, WAT)</span>
                        <input
                          type="datetime-local"
                          className={inputClass}
                          value={scheduleAt}
                          min={toLagosDateTimeInput(new Date(Date.now() + 5 * 60 * 1000))}
                          onChange={(event) => setScheduleAt(event.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className={cn(primaryButtonClass, "w-full")}
                        disabled={busy}
                        onClick={() => void runStatus("schedule")}
                      >
                        {busyAction === "schedule" && <Loader2 className="h-4 w-4 animate-spin" />} Confirm schedule
                      </button>
                    </div>
                  )}
                </div>
              )}

              {state === "scheduled" && (
                <div className="space-y-2">
                  <button
                    type="button"
                    className={cn(primaryButtonClass, "w-full")}
                    disabled={busy}
                    onClick={() => void runStatus("publish")}
                  >
                    {busyAction === "publish" && <Loader2 className="h-4 w-4 animate-spin" />} Publish now instead
                  </button>
                  <button
                    type="button"
                    className={cn(secondaryButtonClass, "h-10 w-full")}
                    disabled={busy}
                    onClick={() => void runStatus("unpublish")}
                  >
                    Cancel schedule
                  </button>
                </div>
              )}

              {state === "published" && (
                <button
                  type="button"
                  className={cn(secondaryButtonClass, "h-10 w-full")}
                  disabled={busy}
                  onClick={() => void runStatus("unpublish")}
                >
                  {busyAction === "unpublish" && <Loader2 className="h-4 w-4 animate-spin" />} Unpublish
                </button>
              )}

              {state === "archived" && (
                <button
                  type="button"
                  className={cn(secondaryButtonClass, "h-10 w-full")}
                  disabled={busy}
                  onClick={() => void runStatus("restore")}
                >
                  Restore to draft
                </button>
              )}

              {post && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  {state !== "archived" ? (
                    <button
                      type="button"
                      className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                      disabled={busy}
                      onClick={() => void runStatus("archive")}
                    >
                      Archive
                    </button>
                  ) : (
                    <span />
                  )}
                  {(state === "draft" || state === "archived") && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-rose-700 hover:underline"
                      disabled={busy}
                      onClick={() => void deletePost()}
                    >
                      {busyAction === "delete" ? "Deleting…" : "Delete permanently"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </Panel>

          <Panel>
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-950">Details</h2>
            </div>
            <div className="space-y-4 p-5">
              <label className="block">
                <span className={labelClass}>Category</span>
                <select
                  className={inputClass}
                  value={draft.category}
                  onChange={(event) => update("category", event.target.value as NewsCategory)}
                >
                  {NEWS_CATEGORIES.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Author byline</span>
                <input
                  className={inputClass}
                  value={draft.authorName}
                  maxLength={120}
                  onChange={(event) => update("authorName", event.target.value)}
                />
              </label>
              <label className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-xs font-semibold text-slate-700">Feature on /news</span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">
                    The newest featured post leads the news page.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={draft.isFeatured}
                  onChange={(event) => update("isFeatured", event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-ktf-blue"
                />
              </label>
              <label className="block">
                <span className={labelClass}>URL</span>
                <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 focus-within:border-ktf-blue focus-within:ring-2 focus-within:ring-ktf-blue/20">
                  <span className="shrink-0 border-r border-slate-200 bg-slate-50 px-2.5 py-2.5 text-[11px] text-slate-500">
                    /news/
                  </span>
                  <input
                    className="h-10 min-w-0 flex-1 px-2.5 text-sm text-slate-900 outline-none"
                    value={displaySlug}
                    onChange={(event) => {
                      slugTouchedRef.current = true;
                      setSlugTouched(true);
                      update(
                        "slug",
                        event.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "-")
                          .replace(/-{2,}/g, "-"),
                      );
                    }}
                    placeholder="generated-from-headline"
                  />
                </div>
                <span className="mt-1.5 block text-[11px] leading-4 text-slate-500">
                  {everPublic
                    ? "Changing the URL of a published post keeps the old link working with a permanent redirect."
                    : slugTouched
                      ? "Custom URL."
                      : "Follows the headline until the post is published."}
                </span>
              </label>
            </div>
          </Panel>

          <Panel>
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-950">Search &amp; sharing</h2>
              <p className="mt-0.5 text-xs text-slate-500">Optional. Leave blank to use the headline and summary.</p>
            </div>
            <div className="space-y-4 p-5">
              <label className="block">
                <span className="flex items-center justify-between">
                  <span className={labelClass}>Search title</span>
                  <Counter value={draft.seoTitle} max={70} />
                </span>
                <input
                  className={inputClass}
                  value={draft.seoTitle}
                  maxLength={70}
                  onChange={(event) => update("seoTitle", event.target.value)}
                  placeholder={draft.title}
                />
              </label>
              <label className="block">
                <span className="flex items-center justify-between">
                  <span className={labelClass}>Search description</span>
                  <Counter value={draft.seoDescription} max={160} />
                </span>
                <textarea
                  className={cn(textareaClass, "min-h-20")}
                  value={draft.seoDescription}
                  maxLength={200}
                  onChange={(event) => update("seoDescription", event.target.value)}
                  placeholder="Defaults to the summary"
                />
              </label>
              <div>
                <p className={labelClass}>WhatsApp preview</p>
                <WhatsAppPreview title={previewTitle} description={previewDescription} shareAssetId={post?.shareAssetId} />
              </div>
              <div>
                <p className={labelClass}>Google preview</p>
                <SearchPreview title={previewTitle} description={previewDescription} slug={displaySlug} />
              </div>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
