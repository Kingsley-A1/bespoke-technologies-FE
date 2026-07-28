"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

export function VerificationLookup() {
  const [documentId, setDocumentId] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = documentId.trim().toUpperCase();
    if (!normalized) return;
    window.location.assign(`/${encodeURIComponent(normalized)}`);
  }

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row">
      <label className="flex-1">
        <span className="sr-only">Document ID</span>
        <input
          value={documentId}
          onChange={(event) => setDocumentId(event.target.value)}
          className="h-12 w-full rounded-lg border border-white/15 bg-white/[0.06] px-4 font-mono text-sm uppercase text-white outline-none placeholder:normal-case placeholder:text-slate-500 focus:border-blue-400"
          placeholder="Enter a document ID, e.g. BT-OWN-2026-0002"
          autoComplete="off"
          required
        />
      </label>
      <button className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500">
        <Search className="h-4 w-4" />
        Verify document
      </button>
    </form>
  );
}
