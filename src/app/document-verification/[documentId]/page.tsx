import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BadgeCheck, Ban, FileQuestion, RefreshCcw } from "lucide-react";
import { Container } from "@/components/layout";
import { formatAdminDate } from "@/features/admin/billing/money";
import { getOwnershipCertificateVerificationByNumber } from "@/features/admin/certificates/repository";
import { COMPANY_IDENTITY } from "@/lib/company";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Document Verification",
  description: "Public verification record for an official Bespoke Technologies document.",
  robots: { index: false, follow: false },
};

const STATUS_STYLE = {
  VALID: {
    label: "Valid document",
    bar: "bg-emerald-400",
    text: "text-emerald-400",
    Icon: BadgeCheck,
  },
  REVOKED: {
    label: "Revoked document",
    bar: "bg-rose-500",
    text: "text-rose-400",
    Icon: Ban,
  },
  SUPERSEDED: {
    label: "Superseded document",
    bar: "bg-amber-400",
    text: "text-amber-300",
    Icon: RefreshCcw,
  },
} as const;

export default async function DocumentVerificationPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const documentId = decodeURIComponent((await params).documentId);
  let record;
  try {
    record = await getOwnershipCertificateVerificationByNumber(documentId);
  } catch (error) {
    console.error("Public document verification is temporarily unavailable", error);
    return (
      <VerificationFailure
        title="Verification temporarily unavailable"
        description="The verification service could not reach the document registry. Please try again shortly."
        documentId={documentId}
        Icon={AlertTriangle}
        barClassName="bg-amber-400"
        iconClassName="text-amber-300"
      />
    );
  }
  if (!record) {
    return (
      <VerificationFailure
        title="Document not found"
        description="No public verification record matches this document ID. Check the ID and try again."
        documentId={documentId}
        Icon={FileQuestion}
        barClassName="bg-slate-500"
        iconClassName="text-slate-400"
      />
    );
  }
  const { certificate, status } = record;
  const style = STATUS_STYLE[status];
  const StatusIcon = style.Icon;

  return (
    <main className="min-h-[70vh] bg-[#07111f] py-20 text-white sm:py-28">
      <Container size="md">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl">
          <div className={`h-2 ${style.bar}`} />
          <div className="p-6 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-300">
                  {COMPANY_IDENTITY.registeredName} verification
                </p>
                <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">
                  {style.label}
                </h1>
                <p className="mt-3 font-mono text-xs text-slate-400">
                  {certificate.certificateNumber}
                </p>
              </div>
              <StatusIcon className={`h-12 w-12 ${style.text}`} />
            </div>

            <dl className="mt-9 grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-2">
              <Fact label="Verification status" value={status} />
              <Fact label="Document type" value="Project Ownership Certificate" />
              <Fact label="Document ID" value={certificate.certificateNumber} mono />
              <Fact label="Project / client" value={`${certificate.project.name} / ${certificate.owner.name}`} />
              <Fact label="Issue date" value={formatAdminDate(certificate.issuedAt)} />
              <Fact label="Issuer" value={COMPANY_IDENTITY.registeredName} />
            </dl>
          </div>
        </section>
      </Container>
    </main>
  );
}

function VerificationFailure({
  title,
  description,
  documentId,
  Icon,
  barClassName,
  iconClassName,
}: {
  title: string;
  description: string;
  documentId: string;
  Icon: typeof FileQuestion;
  barClassName: string;
  iconClassName: string;
}) {
  return (
    <main className="min-h-[70vh] bg-[#07111f] py-20 text-white sm:py-28">
      <Container size="md">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl">
          <div className={`h-2 ${barClassName}`} />
          <div className="p-6 sm:p-10">
            <Icon className={`h-12 w-12 ${iconClassName}`} />
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-300">
              {COMPANY_IDENTITY.registeredName} verification
            </p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">{title}</h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
              {description}{" "}
              <span className="font-mono text-xs text-white">{documentId.toUpperCase()}</span>
            </p>
            <Link
              href="/"
              className="mt-7 inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Verify another document
            </Link>
          </div>
        </section>
      </Container>
    </main>
  );
}

function Fact({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-[#0b1727] p-5">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-blue-300">{label}</dt>
      <dd className={`mt-2 break-words text-sm text-slate-100 ${mono ? "font-mono text-xs" : "font-semibold"}`}>
        {value}
      </dd>
    </div>
  );
}
