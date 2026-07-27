import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { getSharedDigitalAudit } from "@/features/digital-audits/repository";
import { DIGITAL_AUDIT_RECOMMENDATIONS } from "@/features/digital-audits/definition";
import { DigitalAuditShareActions } from "@/features/digital-audits/share-actions";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const audit = await getSharedDigitalAudit(token);
  if (!audit?.result) return { title: "Digital Readiness Report", robots: { index: false } };
  const name = audit.shareBusinessName ? audit.businessName : "Digital Readiness Report";
  return {
    title: `${name} — ${audit.result.overall}/100`,
    description: `${name} received a ${audit.result.tier} digital readiness result from Bespoke Technologies.`,
    robots: { index: false, follow: false },
    openGraph: {
      title: `${name} — Digital Readiness ${audit.result.overall}/100`,
      description: `${audit.result.tier} readiness across six practical business dimensions.`,
    },
  };
}

export default async function DigitalAuditReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const audit = await getSharedDigitalAudit(token);
  if (!audit?.result) notFound();
  const displayName = audit.shareBusinessName ? audit.businessName : "Digital Readiness Report";
  const discussRoadmapHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hello Bespoke Technologies, I completed the Digital Readiness Audit for ${audit.businessName} and would like to discuss the recommended roadmap.`,
  )}`;

  return (
    <div className="bg-ktf-surface px-4 py-10 sm:px-6 sm:py-16 print:bg-white print:p-0">
      <div className="mx-auto max-w-5xl space-y-7">
        <section className="rounded-2xl border border-ktf-gray-200 bg-white p-6 shadow-sm sm:p-9 print:border-0 print:p-0 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-ktf-blue">
                Bespoke Digital Readiness Report
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-ktf-navy sm:text-4xl">
                {displayName}
              </h1>
              <p className="mt-2 text-sm text-ktf-gray-500">
                {audit.industry} · {audit.teamSize} people
              </p>
            </div>
            <DigitalAuditShareActions businessName={displayName} />
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-xl bg-ktf-navy p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ktf-gray-400">
                Overall score
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-6xl font-bold tracking-[-0.05em]">{audit.result.overall}</span>
                <span className="text-xl text-ktf-gray-400">/100</span>
              </div>
              <span className="mt-4 inline-flex rounded-full bg-ktf-blue/20 px-3 py-1 text-xs font-semibold text-blue-200">
                {audit.result.tier}
              </span>
              <p className="mt-5 text-sm leading-6 text-ktf-gray-300">
                {audit.result.interpretation}
              </p>
            </div>
            <div className="rounded-xl border border-ktf-gray-200 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ktf-gray-500">
                Six-dimension overview
              </p>
              <div className="mt-5 space-y-4">
                {audit.result.dimensions.map((dimension) => (
                  <div key={dimension.id}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-ktf-navy">{dimension.label}</span>
                      <span className="tabular-nums text-ktf-gray-500">{dimension.score}/100</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ktf-gray-200">
                      <div className="h-full rounded-full bg-ktf-blue" style={{ width: `${dimension.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ktf-gray-600">
            Three practical priorities
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {audit.result.weakest.map((dimension, index) => {
              const recommendation = DIGITAL_AUDIT_RECOMMENDATIONS[dimension.id];
              return (
                <article key={dimension.id} className="rounded-xl border border-ktf-gray-200 bg-white p-6 print:break-inside-avoid">
                  <p className="text-xs font-bold text-ktf-blue">
                    Priority {index + 1} · {dimension.short}
                  </p>
                  <h3 className="mt-3 text-lg font-bold leading-snug text-ktf-navy">
                    {recommendation.title}
                  </h3>
                  <dl className="mt-5 space-y-4 text-sm leading-6">
                    <ResultRow label="Risk" value={recommendation.risk} />
                    <ResultRow label="Recommended move" value={recommendation.move} />
                    <ResultRow label="Business outcome" value={recommendation.outcome} />
                  </dl>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border border-ktf-blue/20 bg-white p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-ktf-navy">Turn the report into a roadmap</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ktf-gray-600">
              Bespoke Technologies can translate these priorities into a sequenced delivery plan.
            </p>
          </div>
          <a href={discussRoadmapHref} className="mt-5 inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-ktf-blue px-5 text-sm font-semibold text-white sm:mt-0">
            Discuss the roadmap <ArrowRight className="h-4 w-4" />
          </a>
        </section>

        <p className="flex items-start gap-2 text-xs leading-5 text-ktf-gray-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ktf-blue" />
          This report is a strategic self-assessment based on six responses. It is not a formal cybersecurity, compliance or technical audit.
        </p>
      </div>
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-ktf-gray-500">{label}</dt>
      <dd className="mt-1 text-ktf-gray-700">{value}</dd>
    </div>
  );
}
