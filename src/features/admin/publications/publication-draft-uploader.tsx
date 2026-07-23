"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadLoading } from "../components/admin-loading";

export function PublicationDraftUploader({ publicationId }: { publicationId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    try {
      const response = await fetch(`/admin/api/publications/${publicationId}/complete`, { method: "POST", body: new FormData(event.currentTarget) });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Upload failed.");
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Upload failed."); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="w-full space-y-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3"><p className="text-[11px] font-semibold text-amber-800">Incomplete upload · add the PDF to continue</p><input name="document" type="file" accept="application/pdf" required className="block w-full text-[10px] text-slate-600" />{pending && <UploadLoading label="Completing upload" />}{error && <p role="alert" className="text-[10px] text-rose-700">{error}</p>}<button disabled={pending} className="h-8 rounded-lg bg-ktf-navy px-3 text-[11px] font-semibold text-white">Save PDF</button></form>;
}
