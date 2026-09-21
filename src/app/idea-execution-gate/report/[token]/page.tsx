import type { Metadata } from "next";
import Image from "next/image";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import {
  IDEA_GATE_DECISIONS,
  IDEA_GATE_EXECUTION_BENCHMARK,
  IDEA_GATE_PRODUCT_NAME,
  IDEA_GATE_QUESTIONS,
  IDEA_GATE_TAGLINE,
} from "@/features/idea-gate/definition";
import { IdeaGateContactCapture } from "@/features/idea-gate/contact-capture";
import {
  getSharedIdeaGate,
  recordIdeaGateShareView,
} from "@/features/idea-gate/repository";
import { IdeaGateShareActions } from "@/features/idea-gate/share-actions";
import { IDEA_GATE_COOKIE, parseIdeaGateCookie } from "@/features/idea-gate/security";
import type { IdeaGateDecision } from "@/features/idea-gate/types";
import {
  CONTACT_EMAIL,
  PHONE_DISPLAY,
  SITE_URL,
  WHATSAPP_NUMBER,
} from "@/lib/constants";
import gateLogo from "@/app/idea-execution-gate/assets/logo.png";

export const dynamic = "force-dynamic";

const DECISION_STYLES: Record<
  IdeaGateDecision,
  { pill: string; bar: string; dot: string }
> = {
  green: {
    pill: "bg-emerald-100 text-emerald-800",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  amber: {
    pill: "bg-amber-100 text-amber-900",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
  },
  red: { pill: "bg-rose-100 text-rose-800", bar: "bg-rose-500", dot: "bg-rose-500" },
};

const SCORE_STYLES = {
  2: { label: "Strong evidence", className: "bg-emerald-50 text-emerald-700" },
  1: { label: "Weak evidence", className: "bg-amber-50 text-amber-800" },
  0: { label: "No evidence yet", className: "bg-rose-50 text-rose-700" },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const assessment = await getSharedIdeaGate(token);
  if (!assessment?.result) {
    return { title: "Idea Execution Gate report", robots: { index: false } };
  }
  const name = assessment.shareIdeaTitle ? assessment.ideaTitle : "Idea Execution Gate report";
  const decision = IDEA_GATE_DECISIONS[assessment.result.decision];
  return {
    title: `${name} — ${assessment.result.totalScore}/${assessment.result.maxScore}`,
    description: `${decision.label}: ${decision.headline}. Assessed against the ten Bespoke execution gates.`,
    robots: { index: false, follow: false },
    openGraph: {
      title: `${name} — Idea Execution Gate ${assessment.result.totalScore}/${assessment.result.maxScore}`,
      description: `${decision.label} · ${assessment.result.gatesPassed} of 10 gates passed.`,
    },
  };
}

export default async function IdeaGateReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const assessment = await getSharedIdeaGate(token);
  if (!assessment?.result) notFound();

  const { result } = assessment;
  const analysis = assessment.analysis;
  const decision = IDEA_GATE_DECISIONS[result.decision];
  const styles = DECISION_STYLES[result.decision];
  const displayTitle = assessment.shareIdeaTitle
    ? assessment.ideaTitle
    : "Idea Execution Gate report";

  // The owner of the session sees the optional contact panel; everyone with the
  // link sees the report itself. The write endpoint re-checks the credential.
  const credential = parseIdeaGateCookie((await cookies()).get(IDEA_GATE_COOKIE)?.value);
  const isOwner = credential?.id === assessment.id;

  await recordIdeaGateShareView(assessment.id).catch(() => undefined);

  const discussHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hello Bespoke Technologies, I completed the ${IDEA_GATE_PRODUCT_NAME} for ${assessment.ideaTitle} and would like to discuss executing it.`,
  )}`;

  return (
    <div className="bg-ktf-surface px-4 py-10 sm:px-6 sm:py-16 print:bg-white print:px-[14mm] print:py-[14mm]">
      <div className="mx-auto max-w-5xl space-y-7 print:space-y-6">
        {/* Header and verdict */}
        <section className="rounded-2xl border border-ktf-gray-200 bg-white p-6 shadow-sm sm:p-9 print:border-0 print:p-0 print:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 overflow-hidden rounded bg-white">
                  <Image
                    src={gateLogo}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-contain"
                  />
                </span>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-ktf-blue">
                  {IDEA_GATE_PRODUCT_NAME}
                </p>
              </div>
              <h1 className="mt-3 text-balance text-3xl font-bold tracking-[-0.03em] text-ktf-navy sm:text-4xl">
                {displayTitle}
              </h1>
              <p className="mt-2 text-sm text-ktf-gray-500">
                {assessment.ideaStage} · assessed by a {assessment.ownerRole.toLowerCase()}
              </p>
            </div>
            <IdeaGateShareActions ideaTitle={displayTitle} />
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-2xl bg-ktf-navy p-6 text-white print:break-inside-avoid">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ktf-gray-400">
                Execution score
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-6xl font-bold tracking-[-0.05em]">
                  {result.totalScore}
                </span>
                <span className="text-xl text-ktf-gray-400">/{result.maxScore}</span>
              </div>
              <span
                className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${styles.pill}`}
              >
                <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
                {decision.label}
              </span>
              <p className="mt-5 text-sm leading-6 text-ktf-gray-300">
                {result.gatesPassed} of {IDEA_GATE_QUESTIONS.length} gates pass on strong
                evidence. The framework benchmark before engineering is{" "}
                {IDEA_GATE_EXECUTION_BENCHMARK}/{result.maxScore}.
              </p>
            </div>

            <div className="rounded-2xl border border-ktf-gray-200 p-6 print:break-inside-avoid">
              <h2 className="text-lg font-bold leading-snug text-ktf-navy">
                {decision.headline}
              </h2>
              <p className="mt-3 text-sm leading-6 text-ktf-gray-600">{decision.condition}</p>
              <dl className="mt-5 space-y-4 text-sm leading-6">
                <ReportRow label="What this means" value={decision.action} />
                {analysis && <ReportRow label="Where the idea stands" value={analysis.summary} />}
              </dl>
            </div>
          </div>
        </section>

        {/* Gate-by-gate breakdown */}
        <section className="rounded-2xl border border-ktf-gray-200 bg-white p-6 sm:p-8 print:break-inside-auto">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ktf-gray-600">
            The ten gates
          </h2>
          <ul className="mt-5 divide-y divide-ktf-gray-200 border-y border-ktf-gray-200">
            {result.breakdown.map((entry) => {
              const scoreStyle = SCORE_STYLES[entry.score];
              return (
                <li key={entry.id} className="py-4 print:break-inside-avoid">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${scoreStyle.className}`}
                    >
                      {entry.score}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-6 text-ktf-navy">
                        {entry.number}. {entry.question}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-ktf-gray-600">
                        {entry.optionLabel}
                      </p>
                      {entry.evidence && (
                        <p className="mt-2 border-l-2 border-ktf-gray-200 pl-3 text-sm leading-6 text-ktf-gray-500">
                          {entry.evidence}
                        </p>
                      )}
                    </div>
                    <span className="hidden shrink-0 text-xs font-semibold text-ktf-gray-400 sm:block">
                      {scoreStyle.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex items-center gap-3 text-xs text-ktf-gray-500">
            <span className="h-1.5 w-full overflow-hidden rounded-full bg-ktf-gray-200">
              <span
                className={`block h-full rounded-full ${styles.bar}`}
                style={{ width: `${(result.totalScore / result.maxScore) * 100}%` }}
              />
            </span>
            <span className="shrink-0 tabular-nums">
              {result.totalScore}/{result.maxScore}
            </span>
          </div>
        </section>

        {analysis && (
          <>
            {/* Strengths and gaps */}
            <section className="grid gap-4 lg:grid-cols-2">
              <ListPanel
                title="Strongest areas"
                items={analysis.strengths}
                accent="text-emerald-700"
              />
              <ListPanel title="Weakest areas" items={analysis.gaps} accent="text-amber-700" />
            </section>

            <ListPanel
              title="Key execution risks"
              items={analysis.risks}
              accent="text-rose-700"
            />

            {/* Execution guidance */}
            <section className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-ktf-gray-200 bg-white p-6 print:break-inside-avoid">
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ktf-gray-600">
                  Recommended first version
                </h2>
                <p className="mt-3 text-sm leading-6 text-ktf-gray-700">{analysis.mvp}</p>
              </article>
              <article className="rounded-2xl border border-ktf-gray-200 bg-white p-6 print:break-inside-avoid">
                <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ktf-gray-600">
                  First build target
                </h2>
                <p className="mt-3 text-sm leading-6 text-ktf-gray-700">{analysis.firstBuild}</p>
              </article>
            </section>

            <section className="rounded-2xl border border-ktf-gray-200 bg-white p-6 sm:p-8 print:break-inside-avoid">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ktf-gray-600">
                Do these next
              </h2>
              <ol className="mt-5 space-y-3">
                {analysis.nextActions.map((action, index) => (
                  <li key={action} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ktf-blue/10 text-xs font-bold text-ktf-blue">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-6 text-ktf-gray-700">{action}</span>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}

        {isOwner && <IdeaGateContactCapture assessmentId={assessment.id} />}

        {/* Continue with Bespoke */}
        <section className="rounded-2xl border border-ktf-blue/20 bg-white p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 print:hidden">
          <div>
            <h2 className="text-xl font-bold text-ktf-navy">Execute it with Bespoke</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ktf-gray-600">
              Strategy, product design, prototyping or engineering — one accountable team, and
              you own the code, the documentation and the deployment.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 sm:mt-0 sm:shrink-0">
            <a
              href={discussHref}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-ktf-blue px-6 text-sm font-semibold text-white transition hover:bg-ktf-blue-deep"
            >
              Discuss this idea <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/contact"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-ktf-gray-300 px-5 text-sm font-semibold text-ktf-gray-700 transition hover:border-ktf-blue/40 hover:text-ktf-blue"
            >
              Contact us
            </a>
          </div>
        </section>

        <p className="flex items-start gap-2 text-xs leading-5 text-ktf-gray-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ktf-blue" />
          This is a strategic assessment of execution readiness based on ten self-reported
          answers. The score and verdict are calculated from those answers alone. It is not
          investment, legal or financial advice, and it is not a guarantee of commercial outcome.
        </p>

        {/* Report footer — kept for the printed PDF */}
        <div className="flex flex-col items-center gap-1.5 border-t border-ktf-gray-200 pt-6 text-center">
          <span className="inline-flex h-7 w-7 overflow-hidden rounded bg-white">
            <Image
              src={gateLogo}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-contain"
            />
          </span>
          <p className="text-xs font-semibold text-ktf-gray-600">{IDEA_GATE_PRODUCT_NAME}</p>
          <p className="text-overline text-ktf-gray-400">from Bespoke Technologies</p>
          <p className="mt-1 text-[11px] text-ktf-gray-500">{IDEA_GATE_TAGLINE}</p>
          <p className="mt-2 text-[11px] text-ktf-gray-500">
            {SITE_URL.replace(/^https?:\/\//, "")} · {PHONE_DISPLAY} · {CONTACT_EMAIL}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReportRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-ktf-gray-500">
        {label}
      </dt>
      <dd className="mt-1 text-ktf-gray-700">{value}</dd>
    </div>
  );
}

function ListPanel({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: string;
}) {
  return (
    <section className="rounded-2xl border border-ktf-gray-200 bg-white p-6 print:break-inside-avoid">
      <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ktf-gray-600">
        {title}
      </h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-ktf-gray-700">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current ${accent}`} />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
