import type { Metadata } from "next";
import { BadgeCheck, Fingerprint, ScanLine, ShieldCheck } from "lucide-react";
import { VERIFY_ORIGIN } from "@/lib/subdomain-seo";
import { VerificationLookup } from "./verification-lookup";
import { VerificationShell } from "./verification-ui";

export const metadata: Metadata = {
  title: "Verify a Bespoke Technologies Document",
  description: "Confirm the status and issuer of an official Bespoke Technologies document.",
  alternates: { canonical: VERIFY_ORIGIN },
  robots: { index: true, follow: false },
};

export default function DocumentVerificationHome() {
  return (
    <VerificationShell>
      <section className="grid w-full min-w-0 max-w-full overflow-hidden rounded-[2rem] border border-white/90 bg-white/85 shadow-[0_30px_90px_-36px_rgba(15,60,130,0.45)] backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-w-0 overflow-hidden bg-[linear-gradient(145deg,#053e9f_0%,#087eea_52%,#14b8d4_130%)] p-7 text-white sm:p-10 lg:p-12">
          <div aria-hidden className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[40px] border-white/10" />
          <div aria-hidden className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-inner backdrop-blur">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <p className="mt-8 text-[10px] font-extrabold uppercase tracking-[0.22em] text-blue-100">
              Authenticity, checked live
            </p>
            <h1 className="mt-3 break-words text-3xl font-extrabold tracking-[-0.045em] sm:text-5xl">
              Verify an official document
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-blue-50/90">
              Match the readable document ID with its unique verification code.
              Both credentials are required before a document is confirmed.
            </p>

            <div className="mt-9 grid gap-3 text-xs font-semibold text-blue-50 sm:grid-cols-3 lg:grid-cols-1">
              <TrustItem Icon={Fingerprint} text="Cryptographic credential match" />
              <TrustItem Icon={BadgeCheck} text="Live validity and revocation status" />
              <TrustItem Icon={ScanLine} text="QR-ready verification" />
            </div>
          </div>
        </div>

        <div className="min-w-0 p-7 sm:p-10 lg:p-12">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-700">
            Document credentials
          </p>
          <h2 className="mt-3 break-words text-2xl font-extrabold tracking-[-0.035em] text-slate-950 sm:text-3xl">
            Confirm the document in seconds
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-600">
            Scan the QR code on the certificate, or enter both values exactly as printed.
            The document ID by itself is not proof of authenticity.
          </p>
          <VerificationLookup />
        </div>
      </section>
    </VerificationShell>
  );
}

function TrustItem({ Icon, text }: { Icon: typeof Fingerprint; text: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
      <Icon className="h-4 w-4 shrink-0 text-cyan-200" />
      <span className="min-w-0">{text}</span>
    </div>
  );
}
