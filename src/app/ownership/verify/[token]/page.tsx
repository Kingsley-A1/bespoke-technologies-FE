import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Ban, Download, ShieldCheck } from "lucide-react";
import { Container } from "@/components/layout";
import { formatAdminDate, formatMoney } from "@/features/admin/billing/money";
import { getOwnershipCertificateByToken } from "@/features/admin/certificates/repository";

export const metadata: Metadata = {
  title: "Verify Ownership Certificate",
  description: "Verify the current status of a Bespoke Technologies project ownership certificate.",
  robots: { index: false, follow: false },
};

export default async function VerifyCertificatePage({ params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  const certificate = await getOwnershipCertificateByToken(token);
  if (!certificate) notFound();
  const issued = certificate.status === "issued";
  const amount = certificate.commercial.displayPublicly && certificate.commercial.amount !== undefined && certificate.commercial.currency
    ? formatMoney(certificate.commercial.amount, certificate.commercial.currency)
    : undefined;
  return <main className="bg-[#07111f] py-20 text-white sm:py-28">
    <Container size="md">
      <section className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] shadow-2xl">
        <div className={`h-2 ${issued ? "bg-emerald-400" : "bg-rose-500"}`} />
        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-300">Bespoke Technologies verification</p><h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">{issued ? "Certificate verified" : "Certificate revoked"}</h1><p className="mt-3 font-mono text-xs text-slate-400">{certificate.certificateNumber}</p></div>{issued ? <BadgeCheck className="h-12 w-12 text-emerald-400" /> : <Ban className="h-12 w-12 text-rose-400" />}</div>
          <div className="mt-9 grid gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-2">
            <Fact label="Project" value={certificate.project.name} />
            <Fact label="Legal owner" value={certificate.owner.name} />
            <Fact label="Project type" value={certificate.project.type} />
            <Fact label="Completed" value={formatAdminDate(certificate.project.completionDate)} />
            <Fact label="Issued by" value={`${certificate.company.name} · ${certificate.company.ceoName}, ${certificate.company.ceoTitle}`} />
            <Fact label="Issue date" value={formatAdminDate(certificate.issuedAt)} />
            {amount && <Fact label="Recorded value" value={amount} />}
            <Fact label="PDF fingerprint" value={certificate.pdfSha256 || "Not available"} mono />
          </div>
          {certificate.revocationReason && <p className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100"><strong>Revocation reason:</strong> {certificate.revocationReason}</p>}
          <div className="mt-7 flex flex-wrap gap-3">{issued && <Link href={`/ownership/verify/${token}/pdf`} className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-500"><Download className="h-4 w-4" /> Download issued PDF</Link>}<Link href="/" className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-semibold text-slate-200"><ShieldCheck className="h-4 w-4" /> Bespoke Technologies</Link></div>
        </div>
      </section>
    </Container>
  </main>;
}

function Fact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="bg-[#0b1727] p-5"><dt className="text-[10px] font-bold uppercase tracking-wider text-blue-300">{label}</dt><dd className={`mt-2 break-all text-sm text-slate-100 ${mono ? "font-mono text-[10px]" : "font-semibold"}`}>{value}</dd></div>;
}

