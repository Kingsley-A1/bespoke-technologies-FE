"use client";

import Link from "next/link";
import { useState } from "react";
import type { ContentBlock } from "../content/schemas";
import { LessonBlockRenderer } from "./lesson-block-renderer";

type SaveProgress = (input: { blockId: string; completed?: boolean; position?: Record<string, number> }) => Promise<void>;

type LessonPlayerData = {
  course: { slug: string; versionNumber: number; title: string };
  module: { title: string; sortOrder: number };
  lesson: { slug: string; title: string; objective: string; context?: string; estimatedMinutes: number; blocks: ContentBlock[] };
  navigation?: { previous?: { slug: string; title: string }; next?: { slug: string; title: string } };
};

async function requestProgress(input: { courseSlug: string; lessonSlug: string; blockId: string; completed?: boolean; position?: Record<string, number> }) {
  const response = await fetch("/api/learn/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Progress was not accepted.");
}

function idempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `learn-activity-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function LessonPlayer({ lesson, saveProgress, progressEnabled = true, resumePositions = {} }: { lesson: LessonPlayerData; saveProgress?: SaveProgress; progressEnabled?: boolean; resumePositions?: Record<string, Record<string, number>> }) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const persist: SaveProgress = saveProgress ?? ((input) => requestProgress({ courseSlug: lesson.course.slug, lessonSlug: lesson.lesson.slug, ...input }));
  const save = async (input: { blockId: string; completed?: boolean; position?: Record<string, number> }) => {
    setSaveState("saving");
    try {
      await persist(input);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };
  const onProgress = progressEnabled ? save : undefined;
  const submitActivity = progressEnabled ? async (input: { blockId: string; response?: string[]; reflection?: string }) => {
    setSaveState("saving");
    try {
      const response = await fetch(`/api/learn/activities/${encodeURIComponent(input.blockId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug: lesson.course.slug,
          lessonSlug: lesson.lesson.slug,
          idempotencyKey: input.reflection ? undefined : idempotencyKey(),
          response: input.response,
          reflection: input.reflection,
        }),
      });
      const payload = await response.json() as { ok?: boolean; feedback?: string[]; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "Your response was not accepted.");
      setSaveState("saved");
      return { feedback: payload.feedback ?? [] };
    } catch (error) {
      setSaveState("error");
      throw error;
    }
  } : undefined;

  return (
    <article className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:py-10">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <details className="rounded-lg border border-ktf-gray-200 bg-white p-4" open>
          <summary className="cursor-pointer text-sm font-semibold text-ktf-navy">Course navigation</summary>
          <div className="mt-4 space-y-2 text-sm leading-6 text-ktf-gray-700">
            <p className="font-medium">{lesson.course.title}</p>
            <p>Version {lesson.course.versionNumber}</p>
            <p>{lesson.module.sortOrder + 1}. {lesson.module.title}</p>
            <Link href={`/courses/${lesson.course.slug}/learn`} className="inline-flex min-h-11 items-center text-ktf-blue underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">Back to course</Link>
          </div>
        </details>
      </aside>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ktf-blue">{lesson.lesson.estimatedMinutes} minute lesson</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-ktf-navy sm:text-4xl">{lesson.lesson.title}</h1>
        <p className="mt-4 text-lg leading-8 text-ktf-gray-700">{lesson.lesson.objective}</p>
        {lesson.lesson.context && <p className="mt-4 border-l-2 border-ktf-blue/40 pl-4 text-sm leading-6 text-ktf-gray-600">{lesson.lesson.context}</p>}

        <div className="mt-9 space-y-8">
          {lesson.lesson.blocks.map((block) => <LessonBlockRenderer key={block.id} block={block} assetUrl={(assetId) => `/api/learn/assets/${encodeURIComponent(assetId)}`} onProgress={onProgress} onActivitySubmit={submitActivity} resumePosition={resumePositions[block.id]} />)}
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-ktf-gray-200 pt-5 text-sm">
          {lesson.navigation?.previous ? <Link href={`/courses/${lesson.course.slug}/lessons/${lesson.navigation.previous.slug}`} className="inline-flex min-h-11 items-center rounded-md border border-ktf-gray-300 px-4 font-semibold text-ktf-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">Previous<span className="sr-only">: {lesson.navigation.previous.title}</span></Link> : <Link href={`/courses/${lesson.course.slug}/learn`} className="inline-flex min-h-11 items-center rounded-md border border-ktf-gray-300 px-4 font-semibold text-ktf-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">Course home</Link>}
          {lesson.navigation?.next ? <Link href={`/courses/${lesson.course.slug}/lessons/${lesson.navigation.next.slug}`} className="inline-flex min-h-11 items-center rounded-md border border-ktf-gray-300 px-4 font-semibold text-ktf-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">Next<span className="sr-only">: {lesson.navigation.next.title}</span></Link> : <Link href={`/courses/${lesson.course.slug}/learn`} className="inline-flex min-h-11 items-center rounded-md border border-ktf-gray-300 px-4 font-semibold text-ktf-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">Course home</Link>}
        </div>
        <div className="mt-4 min-h-6 text-sm" aria-live="polite">
          {saveState === "saving" && <span className="text-ktf-gray-600">Saving progress…</span>}
          {saveState === "saved" && <span className="text-ktf-success">Progress saved.</span>}
          {saveState === "error" && <p role="alert" className="text-red-800">We couldn&apos;t save your progress. Your work is still on this page; try the action again when your connection returns.</p>}
        </div>
      </div>
    </article>
  );
}
