import type { Metadata } from "next";
import { AlertTriangle, BadgeCheck, Ban, FileX2, RefreshCcw } from "lucide-react";
import { formatAdminDate } from "@/features/admin/billing/money";
import { getOwnershipCertificateVerification } from "@/features/admin/certificates/repository";
import { COMPANY_IDENTITY } from "@/lib/company";
import {
  VerificationFact,
  VerificationFailure,
  VerificationShell,
} from "../../verification-ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Document Verification",
  description: "Public verification record for an official Bespoke Technologies document.",
  robots: { index: false, follow: false },
};

const STATUS_STYLE = {
  VALID: {
    label: "Valid document",
    description: "The document ID and cryptographic verification code match an active ownership record.",
    accent: "from-emerald-600 via-emerald-400 to-cyan-300",
    icon: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800",
    Icon: BadgeCheck,
  },
  REVOKED: {
    label: "Revoked document",
    description: "The credentials match, but Bespoke Technologies has revoked this ownership record.",
    accent: "from-rose-700 via-rose-500 to-orange-300",
    icon: "bg-rose-50 text-rose-700 ring-rose-100",
    badge: "border-rose-200 bg-rose-50 text-rose-800",
    Icon: Ban,
  },
  SUPERSEDED: {
    label: "Superseded document",
    description: "The credentials match, but a newer ownership certificate has replaced this record.",
    accent: "from-amber-600 via-amber-400 to-yellow-200",
    icon: "bg-amber-50 text-amber-700 ring-amber-100",
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    Icon: RefreshCcw,
  },
} as const;

export default async function SecureDocumentVerificationPage({
  params,
}: {
  params: Promise<{ documentId: string; verificationCode: string }>;
}) {
  const { documentId, verificationCode } = await params;
  let record;
  try {
    record = await getOwnershipCertificateVerification(
      documentId,
      verificationCode,
    );
  } catch (error) {
    console.error("Public document verification is temporarily unavailable", error);
    return (
      <VerificationFailure
        title="Verification temporarily unavailable"
        description="The verification service could not reach the document registry. No authenticity decision has been made. Please try again shortly."
        documentId={documentId}
        Icon={AlertTriangle}
        accentClassName="from-amber-600 via-orange-400 to-yellow-200"
        iconClassName="bg-amber-50 text-amber-700 ring-1 ring-amber-100"
      />
    );
  }

  if (!record) {
    return (
      <VerificationFailure
        title="Credentials do not match"
        description="The supplied document ID and verification code do not match a public ownership record. Check both values against the original certificate."
        documentId={documentId}
        Icon={FileX2}
        accentClassName="from-slate-700 via-slate-500 to-blue-300"
        iconClassName="bg-slate-100 text-slate-700 ring-1 ring-slate-200"
      />
    );
  }

  const { certificate, status } = record;
  const style = STATUS_STYLE[status];
  const StatusIcon = style.Icon;

  return (
    <VerificationShell>
      <section className="overflow-hidden rounded-[2rem] border border-white/90 bg-white/85 shadow-[0_30px_90px_-36px_rgba(15,60,130,0.45)] backdrop-blur-xl">
        <div className={`h-2 bg-gradient-to-r ${style.accent}`} />
        <div className="p-7 sm:p-11">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] ${style.badge}`}>
                <BadgeCheck className="h-3.5 w-3.5" />
                Cryptographic credential matched
              </div>
              <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-700">
                Ownership certificate status
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-5xl">
                {style.label}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {style.description}
              </p>
              <p className="mt-4 font-mono text-xs font-semibold text-slate-500">
                {certificate.certificateNumber}
              </p>
            </div>
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ring-1 ${style.icon}`}>
              <StatusIcon className="h-8 w-8" />
            </div>
          </div>

          <dl className="mt-9 grid gap-3 sm:grid-cols-2">
            <VerificationFact label="Verification status" value={status} />
            <VerificationFact label="Document type" value="Project Ownership Certificate" />
            <VerificationFact label="Document ID" value={certificate.certificateNumber} mono />
            <VerificationFact label="Project / client" value={`${certificate.project.name} / ${certificate.owner.name}`} />
            <VerificationFact label="Issue date" value={formatAdminDate(certificate.issuedAt)} />
            <VerificationFact label="Issuer" value={COMPANY_IDENTITY.registeredName} />
          </dl>

          <div className="mt-7 rounded-2xl border border-blue-100 bg-[linear-gradient(120deg,#eff6ff_0%,#ecfeff_100%)] p-5 text-xs leading-6 text-slate-600">
            Verification confirms that the supplied credentials match the issuer&apos;s current registry.
            The governing project agreement remains the final authority for ownership terms.
          </div>
        </div>
      </section>
    </VerificationShell>
  );
}
