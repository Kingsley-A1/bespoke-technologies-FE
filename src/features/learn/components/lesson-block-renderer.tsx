"use client";

import { useRef, useState } from "react";
import type { ContentBlock } from "../content/schemas";

type ProgressCallback = (input: { blockId: string; completed?: boolean; position?: Record<string, number> }) => void | Promise<void>;
type ActivitySubmitCallback = (input: { blockId: string; response?: string[]; reflection?: string }) => Promise<{ feedback: string[] }>;

export function LessonBlockRenderer({
  block,
  assetUrl,
  onProgress,
  onActivitySubmit,
  resumePosition,
}: {
  block: ContentBlock;
  assetUrl: (assetId: string) => string;
  onProgress?: ProgressCallback;
  onActivitySubmit?: ActivitySubmitCallback;
  resumePosition?: Record<string, number>;
}) {
  const complete = () => onProgress?.({ blockId: block.id, completed: true });
  const acknowledge = block.required && block.completionRule === "acknowledged" ? (
    <button type="button" onClick={complete} className="mt-4 inline-flex min-h-11 items-center rounded-md border border-ktf-blue/30 px-3 text-sm font-semibold text-ktf-blue hover:bg-ktf-blue/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">Mark as understood</button>
  ) : null;

  switch (block.type) {
    case "rich_text": return <section className="space-y-4 text-base leading-7 text-ktf-gray-700">{block.config.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}{acknowledge}</section>;
    case "callout": return <aside className="border-l-2 border-ktf-blue bg-ktf-blue/5 p-5" aria-label={`${block.config.tone} callout`}><h3 className="font-semibold text-ktf-navy">{block.config.title}</h3><p className="mt-2 leading-7 text-ktf-gray-700">{block.config.body}</p>{acknowledge}</aside>;
    case "image": return <figure><img src={assetUrl(block.config.assetId)} alt={block.config.decorative ? "" : block.config.altText ?? ""} width={1600} height={900} loading="lazy" className="h-auto w-full rounded-md border border-ktf-gray-200" />{block.config.caption && <figcaption className="mt-2 text-sm leading-6 text-ktf-gray-600">{block.config.caption}</figcaption>}{acknowledge}</figure>;
    case "slides": return <Slides block={block} assetUrl={assetUrl} onProgress={onProgress} resumePosition={resumePosition} />;
    case "video": return <Media block={block} kind="video" assetUrl={assetUrl} onProgress={onProgress} resumePosition={resumePosition} />;
    case "audio": return <Media block={block} kind="audio" assetUrl={assetUrl} onProgress={onProgress} resumePosition={resumePosition} />;
    case "download": return <section className="rounded-md border border-ktf-gray-200 p-5"><a href={assetUrl(block.config.assetId)} onClick={() => { if (block.completionRule !== "none") complete(); }} className="font-semibold text-ktf-blue underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">{block.config.label}</a>{block.config.description && <p className="mt-2 text-sm leading-6 text-ktf-gray-600">{block.config.description}</p>}</section>;
    case "quiz":
    case "interactive": return <Interaction block={block} onProgress={onProgress} onActivitySubmit={onActivitySubmit} />;
    case "reflection": return <Reflection block={block} onProgress={onProgress} onActivitySubmit={onActivitySubmit} />;
  }
}

function Slides({ block, assetUrl, onProgress, resumePosition }: { block: Extract<ContentBlock, { type: "slides" }>; assetUrl: (assetId: string) => string; onProgress?: ProgressCallback; resumePosition?: Record<string, number> }) {
  const [index, setIndex] = useState(() => Math.max(0, Math.min(block.config.slides.length - 1, Math.floor(resumePosition?.slide ?? 0))));
  const slide = block.config.slides[index]!;
  const move = (next: number) => {
    const bounded = Math.max(0, Math.min(block.config.slides.length - 1, next));
    setIndex(bounded);
    onProgress?.({ blockId: block.id, completed: bounded === block.config.slides.length - 1 && block.completionRule === "media_complete", position: { slide: bounded } });
  };
  return <section aria-label="Slides" tabIndex={0} onKeyDown={(event) => { if (event.key === "ArrowLeft") { event.preventDefault(); move(index - 1); } if (event.key === "ArrowRight") { event.preventDefault(); move(index + 1); } }}><img src={assetUrl(slide.assetId)} alt={slide.decorative ? "" : slide.altText ?? ""} width={1600} height={900} loading="lazy" className="aspect-video h-auto w-full rounded-md border border-ktf-gray-200 object-contain" /><div className="mt-3 flex items-center justify-between gap-3"><button type="button" onClick={() => move(index - 1)} disabled={index === 0} className="min-h-11 rounded-md border border-ktf-gray-300 px-3 text-sm font-semibold disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">Previous slide</button><p className="text-sm text-ktf-gray-600" aria-live="polite">Slide {index + 1} of {block.config.slides.length}</p><button type="button" onClick={() => move(index + 1)} disabled={index === block.config.slides.length - 1} className="min-h-11 rounded-md border border-ktf-gray-300 px-3 text-sm font-semibold disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">Next slide</button></div></section>;
}

function Media({ block, kind, assetUrl, onProgress, resumePosition }: { block: Extract<ContentBlock, { type: "video" | "audio" }>; kind: "video" | "audio"; assetUrl: (assetId: string) => string; onProgress?: ProgressCallback; resumePosition?: Record<string, number> }) {
  const Tag = kind;
  const restored = useRef(false);
  const mediaProps = {
    controls: true,
    playsInline: true,
    preload: "metadata" as const,
    onLoadedMetadata: (event: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) => {
      const seconds = resumePosition?.seconds;
      if (!restored.current && typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0) {
        event.currentTarget.currentTime = seconds;
        restored.current = true;
      }
    },
    onTimeUpdate: (event: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) => onProgress?.({ blockId: block.id, position: { seconds: Math.floor(event.currentTarget.currentTime) } }),
    onEnded: () => { if (block.completionRule === "media_complete") onProgress?.({ blockId: block.id, completed: true }); },
  };
  return <section><Tag {...mediaProps} className={kind === "video" ? "h-auto w-full rounded-md border border-ktf-gray-200" : "w-full"}><source src={assetUrl(block.config.assetId)} />{block.config.captionsAssetId && <track kind="captions" src={assetUrl(block.config.captionsAssetId)} />}</Tag>{block.config.transcript && <details className="mt-3 rounded-md border border-ktf-gray-200 p-4"><summary className="cursor-pointer font-semibold text-ktf-navy">Transcript</summary><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ktf-gray-700">{block.config.transcript}</p></details>}</section>;
}

function Interaction({ block, onProgress, onActivitySubmit }: { block: Extract<ContentBlock, { type: "quiz" | "interactive" }>; onProgress?: ProgressCallback; onActivitySubmit?: ActivitySubmitCallback }) {
  const [selection, setSelection] = useState<string[]>([]);
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [error, setError] = useState("");
  const config = block.config;
  const isChoice = "options" in config;
  const submit = async () => {
    setError("");
    const values = isChoice ? selection : response.trim() ? [response.trim()] : [];
    const correct = isChoice && config.options.filter((option) => option.correct).every((option) => values.includes(option.id)) && values.length === config.options.filter((option) => option.correct).length;
    try {
      const result = onActivitySubmit ? await onActivitySubmit({ blockId: block.id, response: values }) : undefined;
      setFeedback(result?.feedback ?? (isChoice ? config.options.filter((option) => values.includes(option.id)).map((option) => option.feedback) : [config.guidance]));
      setSubmitted(true);
      if (!onActivitySubmit) onProgress?.({ blockId: block.id, completed: block.completionRule === "submitted" || (block.completionRule === "assessment_passed" && correct) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your response could not be saved.");
    }
  };
  return <section className="rounded-md border border-ktf-gray-200 p-5"><h3 className="text-lg font-semibold text-ktf-navy">{config.prompt}</h3>{config.instructions && <p className="mt-2 text-sm leading-6 text-ktf-gray-600">{config.instructions}</p>}{isChoice ? <fieldset className="mt-5 space-y-3"><legend className="sr-only">Response options</legend>{config.options.map((option) => { const multiple = config.kind === "multiple_choice"; const checked = selection.includes(option.id); return <label key={option.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-ktf-gray-200 p-3"><input type={multiple ? "checkbox" : "radio"} name={block.id} checked={checked} onChange={() => setSelection((current) => multiple ? checked ? current.filter((value) => value !== option.id) : [...current, option.id] : [option.id])} /><span className="text-sm text-ktf-gray-800">{option.label}</span></label>; })}</fieldset> : <div className="mt-5"><label htmlFor={`${block.id}-response`} className="text-sm font-semibold text-ktf-navy">Your response</label><textarea id={`${block.id}-response`} value={response} onChange={(event) => setResponse(event.target.value)} className="mt-2 min-h-28 w-full rounded-md border border-ktf-gray-300 p-3 text-sm" /><p className="mt-2 text-sm text-ktf-gray-600">{config.guidance}</p></div>}<button type="button" onClick={() => { void submit(); }} disabled={isChoice ? selection.length === 0 : !response.trim()} className="mt-5 inline-flex min-h-11 items-center rounded-md bg-ktf-blue px-4 text-sm font-semibold text-white disabled:opacity-50">Submit response</button>{submitted && <div className="mt-4 rounded-md bg-ktf-surface p-4 text-sm leading-6 text-ktf-gray-700" role="status" aria-live="polite">{feedback.map((message, index) => <p key={index}>{message}</p>)}</div>}{error && <p className="mt-3 text-sm text-red-800" role="alert">{error}</p>}</section>;
}

function Reflection({ block, onProgress, onActivitySubmit }: { block: Extract<ContentBlock, { type: "reflection" }>; onProgress?: ProgressCallback; onActivitySubmit?: ActivitySubmitCallback }) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const save = async () => {
    setError("");
    try {
      if (onActivitySubmit) await onActivitySubmit({ blockId: block.id, reflection: value });
      else onProgress?.({ blockId: block.id, completed: block.completionRule === "submitted" });
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your reflection could not be saved.");
    }
  };
  return <section className="rounded-md border border-ktf-gray-200 p-5"><h3 className="text-lg font-semibold text-ktf-navy">{block.config.prompt}</h3>{block.config.guidance && <p className="mt-2 text-sm leading-6 text-ktf-gray-600">{block.config.guidance}</p>}<label htmlFor={`${block.id}-reflection`} className="sr-only">Your reflection</label><textarea id={`${block.id}-reflection`} value={value} onChange={(event) => setValue(event.target.value)} className="mt-5 min-h-32 w-full rounded-md border border-ktf-gray-300 p-3 text-sm" /><button type="button" disabled={!value.trim()} onClick={() => { void save(); }} className="mt-4 inline-flex min-h-11 items-center rounded-md bg-ktf-blue px-4 text-sm font-semibold text-white disabled:opacity-50">Save reflection</button>{saved && <p className="mt-3 text-sm text-ktf-success" role="status">Reflection saved.</p>}{error && <p className="mt-3 text-sm text-red-800" role="alert">{error}</p>}</section>;
}
