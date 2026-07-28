import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/layout";
import { COMPANY_IDENTITY } from "@/lib/company";
import { VERIFY_ORIGIN } from "@/lib/subdomain-seo";
import { VerificationLookup } from "./verification-lookup";

export const metadata: Metadata = {
  title: "Verify a Bespoke Technologies Document",
  description: "Confirm the status and issuer of an official Bespoke Technologies document.",
  alternates: { canonical: VERIFY_ORIGIN },
  robots: { index: true, follow: false },
};

export default function DocumentVerificationHome() {
  return (
    <main className="min-h-[70vh] bg-[#07111f] py-20 text-white sm:py-28">
      <Container size="md">
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-10">
          <ShieldCheck className="h-11 w-11 text-blue-400" />
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-300">
            {COMPANY_IDENTITY.registeredName} verification
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
            Verify an official document
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Enter the document ID exactly as it appears on the certificate.
          </p>
          <VerificationLookup />
        </section>
      </Container>
    </main>
  );
}
