import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/layout";
import { COMPANY_IDENTITY } from "@/lib/company";

export function VerificationShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-[78vh] overflow-hidden bg-[linear-gradient(145deg,#f7fbff_0%,#edf5ff_42%,#ffffff_100%)] py-10 text-slate-950 sm:py-16">
      <div
        aria-hidden
        className="absolute -left-28 top-16 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute bottom-0 left-1/3 h-56 w-80 rounded-full bg-indigo-300/15 blur-3xl"
      />

      <Container size="md" className="relative">
        <header className="mb-7 flex min-w-0 flex-wrap items-center justify-between gap-4 sm:mb-10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-cyan-500 text-white shadow-lg shadow-blue-600/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold text-slate-950">
                {COMPANY_IDENTITY.registeredName}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">
                Document verification
              </p>
            </div>
          </div>
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue-200/80 bg-white/75 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.13em] text-blue-800 shadow-sm backdrop-blur sm:text-[10px]">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            Official verification service
          </div>
        </header>

        {children}

        <footer className="mt-8 flex flex-col gap-2 border-t border-blue-100/80 pt-6 text-xs leading-5 text-slate-500 sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
          <span>Issued and verified by {COMPANY_IDENTITY.registeredName}</span>
          <span>Registration number {COMPANY_IDENTITY.registrationNumber}</span>
        </footer>
      </Container>
    </main>
  );
}

export function VerificationFailure({
  title,
  description,
  documentId,
  Icon,
  accentClassName,
  iconClassName,
}: {
  title: string;
  description: string;
  documentId: string;
  Icon: LucideIcon;
  accentClassName: string;
  iconClassName: string;
}) {
  return (
    <VerificationShell>
      <section className="min-w-0 max-w-full overflow-hidden rounded-[2rem] border border-white/90 bg-white/85 shadow-[0_28px_80px_-34px_rgba(15,60,130,0.4)] backdrop-blur-xl">
        <div className={`h-2 bg-gradient-to-r ${accentClassName}`} />
        <div className="p-7 sm:p-11">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconClassName}`}>
            <Icon className="h-7 w-7" />
          </div>
          <p className="mt-7 text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-700">
            Secure document check
          </p>
          <h1 className="mt-3 max-w-2xl break-words text-3xl font-extrabold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            {description}
          </p>
          <div className="mt-6 inline-flex max-w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs font-semibold text-slate-700">
            <span className="break-all">{documentId.toUpperCase()}</span>
          </div>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-6 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Enter verification credentials
            </Link>
          </div>
        </div>
      </section>
    </VerificationShell>
  );
}

export function VerificationFact({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-blue-100/80 bg-white p-5 shadow-[0_12px_32px_-24px_rgba(15,70,150,0.5)]">
      <dt className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-700">
        {label}
      </dt>
      <dd className={`mt-2 break-words text-sm text-slate-800 ${mono ? "font-mono text-xs font-semibold" : "font-bold"}`}>
        {value}
      </dd>
    </div>
  );
}
