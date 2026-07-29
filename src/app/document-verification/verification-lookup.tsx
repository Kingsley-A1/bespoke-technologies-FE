"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

export function VerificationLookup() {
  const [documentId, setDocumentId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = documentId.trim().toUpperCase();
    const trimmedCode = verificationCode.trim();
    const normalizedCode = /^(?:[A-Fa-f0-9]{4}-?){8}$/.test(trimmedCode)
      ? trimmedCode.replaceAll("-", "").toUpperCase()
      : trimmedCode;
    if (!normalized || !normalizedCode) return;
    window.location.assign(
      `/${encodeURIComponent(normalized)}/${encodeURIComponent(normalizedCode)}`,
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 min-w-0 max-w-full space-y-5">
      <label className="block min-w-0 max-w-full">
        <span className="mb-2 block text-xs font-bold text-slate-700">Document ID</span>
        <input
          value={documentId}
          onChange={(event) => setDocumentId(event.target.value)}
          className="h-12 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-mono text-sm uppercase text-slate-950 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          placeholder="BT-OWN-2026-0002"
          autoComplete="off"
          spellCheck={false}
          required
        />
      </label>

      <label className="block min-w-0 max-w-full">
        <span className="mb-2 block text-xs font-bold text-slate-700">Verification code</span>
        <input
          value={verificationCode}
          onChange={(event) => setVerificationCode(event.target.value)}
          className="h-12 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-mono text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          placeholder="0123-4567-89AB-CDEF-0123-4567-89AB-CDEF"
          autoComplete="off"
          spellCheck={false}
          required
        />
      </label>

      <button className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-200">
        <Search className="h-4 w-4" />
        Verify document
      </button>
      <p className="text-xs leading-5 text-slate-500">
        Verification credentials are case-sensitive for previously issued certificates.
      </p>
    </form>
  );
}
