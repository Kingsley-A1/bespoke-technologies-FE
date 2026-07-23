"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { UploadLoading } from "../components/admin-loading";

export function CertificationUploader({ assignmentId }: { assignmentId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    try {
      const response = await fetch("/admin/api/learning/certification", { method: "POST", body: new FormData(event.currentTarget) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Certification upload failed.");
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Certification upload failed."); }
    finally { setPending(false); }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-ktf-gray-300 bg-ktf-surface px-3 py-2 text-[11px] font-semibold text-ktf-gray-600 hover:border-ktf-blue/40"><span className="flex items-center gap-2"><Upload className="h-3.5 w-3.5" /> Upload certification</span><input type="file" name="certificate" accept="application/pdf,image/png,image/jpeg" className="max-w-36 text-[10px]" required /></label>
      {pending && <UploadLoading label="Uploading certification" />}
      {error && <p role="alert" className="text-[11px] text-rose-700">{error}</p>}
      <button disabled={pending} className="h-8 rounded-lg bg-ktf-navy px-3 text-[11px] font-semibold text-white disabled:opacity-50">Save certification</button>
    </form>
  );
}
