"use client";

import { useState } from "react";

export function AdminAssetUploader({ courseId }: { courseId: string }) {
  const [state, setState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(form: HTMLFormElement) {
    setState("uploading");
    setMessage("");
    try {
      const response = await fetch("/admin/api/learn/assets", { method: "POST", body: new FormData(form) });
      const payload = await response.json() as { ok?: boolean; error?: string; asset?: { id: string; filename: string } };
      if (!response.ok || !payload.ok || !payload.asset) throw new Error(payload.error ?? "Asset upload could not be completed.");
      form.reset();
      setState("success");
      setMessage(`Uploaded ${payload.asset.filename}. Its asset ID is ${payload.asset.id}.`);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Asset upload could not be completed.");
    }
  }

  return <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void submit(event.currentTarget); }} encType="multipart/form-data">
    <input type="hidden" name="courseId" value={courseId} />
    <label className="text-xs font-semibold text-slate-700 md:col-span-2">Asset file<input name="file" type="file" required className="mt-1 block w-full text-sm" /></label>
    <label className="text-xs font-semibold text-slate-700">Alternative text<input name="altText" className="mt-1 block h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
    <label className="text-xs font-semibold text-slate-700">Caption<input name="caption" className="mt-1 block h-10 w-full rounded-md border border-slate-300 px-3 text-sm" /></label>
    <label className="text-xs font-semibold text-slate-700 md:col-span-2">Media transcript <span className="font-normal">(required for audio/video)</span><textarea name="transcript" className="mt-1 block min-h-20 w-full rounded-md border border-slate-300 p-3 text-sm" /></label>
    <label className="flex min-h-11 items-center gap-2 text-xs text-slate-700"><input name="decorative" type="checkbox" value="true" />Decorative image only</label>
    <button disabled={state === "uploading"} className="h-10 rounded-md border border-ktf-blue/30 px-4 text-sm font-semibold text-ktf-blue disabled:opacity-50">{state === "uploading" ? "Uploading…" : "Upload asset"}</button>
    {message && <p className={state === "error" ? "text-sm text-red-800 md:col-span-2" : "text-sm text-ktf-success md:col-span-2"} role={state === "error" ? "alert" : "status"}>{message}</p>}
  </form>;
}
