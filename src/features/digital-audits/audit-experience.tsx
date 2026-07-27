"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  LoaderCircle,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  DIGITAL_AUDIT_INDUSTRIES,
  DIGITAL_AUDIT_QUESTIONS,
  DIGITAL_AUDIT_TEAM_SIZES,
} from "./definition";
import { DigitalAuditStartShare } from "./share-actions";
import type {
  DigitalAuditAnswers,
  DigitalAuditRecord,
} from "./types";

type Stage = "landing" | "context" | "assessment";
type SaveState = "idle" | "saving" | "saved" | "error";

interface ContextForm {
  businessName: string;
  industry: string;
  teamSize: string;
  email: string;
  phone: string;
  contactConsent: boolean;
  shareBusinessName: boolean;
  website: string;
}

const initialContext: ContextForm = {
  businessName: "",
  industry: "",
  teamSize: "",
  email: "",
  phone: "",
  contactConsent: false,
  shareBusinessName: true,
  website: "",
};

export function DigitalAuditExperience() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("landing");
  const [context, setContext] = useState(initialContext);
  const [audit, setAudit] = useState<DigitalAuditRecord | null>(null);
  const [answers, setAnswers] = useState<DigitalAuditAnswers>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loadingResume, setLoadingResume] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/digital-audits/current", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 204) return null;
        if (!response.ok) throw new Error("Saved progress could not be loaded.");
        return (await response.json()) as { audit: DigitalAuditRecord };
      })
      .then((payload) => {
        if (cancelled || !payload?.audit) return;
        setAudit(payload.audit);
        setAnswers(payload.audit.answers);
        setContext({
          businessName: payload.audit.businessName,
          industry: payload.audit.industry,
          teamSize: payload.audit.teamSize,
          email: payload.audit.email ?? "",
          phone: payload.audit.phone ?? "",
          contactConsent: payload.audit.contactConsent,
          shareBusinessName: payload.audit.shareBusinessName,
          website: "",
        });
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoadingResume(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resumeAudit = () => {
    if (!audit) return;
    if (audit.status === "completed" && audit.shareToken) {
      router.push(`/digital-readiness-audit/report/${audit.shareToken}`);
      return;
    }
    const firstUnanswered = DIGITAL_AUDIT_QUESTIONS.findIndex(
      (question) => audit.answers[question.id] === undefined,
    );
    setQuestionIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
    setStage("assessment");
  };

  const beginFresh = () => {
    setAudit(null);
    setAnswers({});
    setContext(initialContext);
    setQuestionIndex(0);
    setError("");
    setStage("context");
  };

  async function createAudit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!context.businessName.trim() || !context.industry || !context.teamSize) {
      setError("Business name, industry and team size are required.");
      return;
    }
    if (
      context.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(context.email)
    ) {
      setError("Enter a valid email address or leave it blank.");
      return;
    }
    const query = new URLSearchParams(window.location.search);
    const attribution = Object.fromEntries(
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
        .map((key) => [key, query.get(key)?.slice(0, 240)])
        .filter((entry): entry is [string, string] => Boolean(entry[1])),
    );
    setSubmitting(true);
    try {
      const response = await fetch("/api/digital-audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...context,
          businessName: context.businessName.trim(),
          email: context.email.trim(),
          phone: context.phone.trim(),
          source: attribution.utm_source || "website",
          attribution,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        audit?: DigitalAuditRecord;
        message?: string;
      };
      if (!response.ok || !payload.audit) {
        throw new Error(payload.message || "The audit could not be started.");
      }
      setAudit(payload.audit);
      setAnswers({});
      setQuestionIndex(0);
      setStage("assessment");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The audit could not be started.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveAnswer(optionIndex: number) {
    if (!audit) return;
    const question = DIGITAL_AUDIT_QUESTIONS[questionIndex];
    const option = question.options[optionIndex];
    const previous = answers[question.id];
    setAnswers((current) => ({ ...current, [question.id]: option.maturity }));
    setSaveState("saving");
    setError("");
    try {
      const response = await fetch(`/api/digital-audits/${audit.id}/answers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, optionIndex }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        audit?: DigitalAuditRecord;
        message?: string;
      };
      if (!response.ok || !payload.audit) {
        throw new Error(payload.message || "The answer could not be saved.");
      }
      setAudit(payload.audit);
      setAnswers(payload.audit.answers);
      setSaveState("saved");
    } catch (caught) {
      setAnswers((current) => {
        const next = { ...current };
        if (previous === undefined) delete next[question.id];
        else next[question.id] = previous;
        return next;
      });
      setSaveState("error");
      setError(
        caught instanceof Error
          ? caught.message
          : "The answer could not be saved. Try again.",
      );
    }
  }

  async function completeAudit() {
    if (!audit) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/digital-audits/${audit.id}/complete`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        reportPath?: string;
        message?: string;
      };
      if (!response.ok || !payload.reportPath) {
        throw new Error(payload.message || "The report could not be completed.");
      }
      router.push(payload.reportPath);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The report could not be completed.");
      setSubmitting(false);
    }
  }

  if (stage === "landing") {
    return (
      <LandingStep
        audit={audit}
        loadingResume={loadingResume}
        onStart={beginFresh}
        onResume={resumeAudit}
      />
    );
  }

  if (stage === "context") {
    return (
      <ContextStep
        context={context}
        setContext={setContext}
        onBack={() => setStage("landing")}
        onSubmit={createAudit}
        submitting={submitting}
        error={error}
      />
    );
  }

  const question = DIGITAL_AUDIT_QUESTIONS[questionIndex];
  const selectedMaturity = answers[question.id];
  const selectedIndex = question.options.findIndex(
    (option) => option.maturity === selectedMaturity,
  );
  return (
    <AssessmentStep
      questionIndex={questionIndex}
      selectedIndex={selectedIndex}
      saveState={saveState}
      error={error}
      submitting={submitting}
      onSelect={saveAnswer}
      onPrevious={() => {
        if (questionIndex === 0) setStage("context");
        else setQuestionIndex((index) => index - 1);
      }}
      onNext={() => {
        if (questionIndex === DIGITAL_AUDIT_QUESTIONS.length - 1) {
          void completeAudit();
        } else {
          setQuestionIndex((index) => index + 1);
          setSaveState("idle");
          setError("");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    />
  );
}

function LandingStep({
  audit,
  loadingResume,
  onStart,
  onResume,
}: {
  audit: DigitalAuditRecord | null;
  loadingResume: boolean;
  onStart: () => void;
  onResume: () => void;
}) {
  return (
    <div>
      <section className="bg-linear-to-b from-ktf-surface to-white px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <p className="text-overline font-bold uppercase tracking-[0.18em] text-ktf-blue">
            Bespoke Digital Readiness Audit
          </p>
          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-ktf-navy sm:text-5xl lg:text-6xl">
            How ready is your business to operate, grow and compete digitally?
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ktf-gray-600">
            Six focused questions. Receive a consistent readiness score, a six-dimension
            breakdown and three practical priorities.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              onClick={onStart}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-ktf-blue px-6 text-sm font-semibold text-white transition hover:bg-ktf-blue-deep"
            >
              Start the audit <ArrowRight className="h-4 w-4" />
            </button>
            <DigitalAuditStartShare />
            <span className="text-sm text-ktf-gray-500">6 questions · About 2 minutes</span>
          </div>
          {!loadingResume && audit && (
            <div className="mt-8 flex max-w-2xl flex-wrap items-center justify-between gap-4 rounded-xl border border-ktf-blue/20 bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-ktf-navy">
                  {audit.status === "completed" ? "Your saved report is ready" : "Saved audit found"}
                </p>
                <p className="mt-1 text-xs text-ktf-gray-600">
                  {audit.businessName} · {audit.progressCount}/6 questions completed
                </p>
              </div>
              <button
                onClick={onResume}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-ktf-blue/30 px-3 text-xs font-semibold text-ktf-blue"
              >
                {audit.status === "completed" ? "View report" : "Resume audit"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>
      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {[
            ["01", "Clear assessment", "One consistent maturity choice across each of six business dimensions."],
            ["02", "Saved progress", "Your progress is securely saved so you can return on this device."],
            ["03", "Shareable report", "Copy, share, print or send the completed report to your team."],
          ].map(([number, title, body]) => (
            <article key={number} className="rounded-xl border border-ktf-gray-200 bg-white p-6">
              <p className="text-xs font-bold text-ktf-blue">{number}</p>
              <h2 className="mt-3 text-base font-bold text-ktf-navy">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-ktf-gray-600">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ContextStep({
  context,
  setContext,
  onBack,
  onSubmit,
  submitting,
  error,
}: {
  context: ContextForm;
  setContext: React.Dispatch<React.SetStateAction<ContextForm>>;
  onBack: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitting: boolean;
  error: string;
}) {
  return (
    <div className="bg-ktf-surface px-4 py-12 sm:px-6 sm:py-16">
      <section className="mx-auto max-w-2xl rounded-2xl border border-ktf-gray-200 bg-white p-6 shadow-sm sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-ktf-blue">
          Business context
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-ktf-navy">
          Set up your report
        </h1>
        <p className="mt-3 text-sm leading-6 text-ktf-gray-600">
          These details personalise the report. Contact details are optional.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ktf-navy">
              Business or organisation name
            </span>
            <input
              required
              value={context.businessName}
              onChange={(event) =>
                setContext((current) => ({ ...current, businessName: event.target.value }))
              }
              className="h-12 w-full rounded-lg border border-ktf-gray-300 px-4 text-sm outline-none focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/15"
              placeholder="e.g. Northstar Services"
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <SearchableIndustryField
              label="Industry"
              value={context.industry}
              options={DIGITAL_AUDIT_INDUSTRIES}
              onChange={(industry) =>
                setContext((current) => ({ ...current, industry }))
              }
            />
            <SelectField
              label="Team size"
              value={context.teamSize}
              options={DIGITAL_AUDIT_TEAM_SIZES}
              onChange={(teamSize) =>
                setContext((current) => ({ ...current, teamSize }))
              }
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ktf-navy">
                Work email <span className="font-normal text-ktf-gray-500">(optional)</span>
              </span>
              <input
                type="email"
                value={context.email}
                onChange={(event) =>
                  setContext((current) => ({ ...current, email: event.target.value }))
                }
                className="h-12 w-full rounded-lg border border-ktf-gray-300 px-4 text-sm outline-none focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/15"
                placeholder="you@company.com"
              />
              <span className="mt-1.5 block text-xs text-ktf-gray-500">
                Used to send the completed report.
              </span>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-ktf-navy">
                WhatsApp or phone <span className="font-normal text-ktf-gray-500">(optional)</span>
              </span>
              <input
                value={context.phone}
                onChange={(event) =>
                  setContext((current) => ({ ...current, phone: event.target.value }))
                }
                className="h-12 w-full rounded-lg border border-ktf-gray-300 px-4 text-sm outline-none focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/15"
                placeholder="+234…"
              />
            </label>
          </div>
          <div className="space-y-3 rounded-xl border border-ktf-gray-200 bg-ktf-surface p-4">
            <Checkbox
              checked={context.shareBusinessName}
              onChange={(shareBusinessName) =>
                setContext((current) => ({ ...current, shareBusinessName }))
              }
              label="Include the business name on the shareable report."
            />
            <Checkbox
              checked={context.contactConsent}
              onChange={(contactConsent) =>
                setContext((current) => ({ ...current, contactConsent }))
              }
              label="Bespoke Technologies may contact me about this audit and a technology roadmap."
            />
            <p className="text-xs leading-5 text-ktf-gray-500">
              Progress and results are securely saved for 90 days if incomplete and up
              to 24 months when completed. Contact details never appear on shared reports.{" "}
              <a href="/privacy" className="font-semibold text-ktf-blue hover:underline">
                Privacy policy
              </a>
            </p>
          </div>
          <input
            tabIndex={-1}
            autoComplete="off"
            value={context.website}
            onChange={(event) =>
              setContext((current) => ({ ...current, website: event.target.value }))
            }
            name="website"
            className="hidden"
            aria-hidden="true"
          />
          {error && <ErrorMessage message={error} />}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold text-ktf-gray-600"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              disabled={submitting}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-ktf-blue px-6 text-sm font-semibold text-white transition hover:bg-ktf-blue-deep disabled:opacity-60"
            >
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Continue to the six questions
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function AssessmentStep({
  questionIndex,
  selectedIndex,
  saveState,
  error,
  submitting,
  onSelect,
  onPrevious,
  onNext,
}: {
  questionIndex: number;
  selectedIndex: number;
  saveState: SaveState;
  error: string;
  submitting: boolean;
  onSelect: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const question = DIGITAL_AUDIT_QUESTIONS[questionIndex];
  const progress = ((questionIndex + (selectedIndex >= 0 ? 1 : 0)) / DIGITAL_AUDIT_QUESTIONS.length) * 100;

  return (
    <div className="min-h-[calc(100dvh-4.25rem)] bg-ktf-surface px-2 py-2 sm:px-6 sm:py-16">
      <section className="mx-auto max-w-2xl rounded-lg border border-ktf-gray-200 bg-white p-5 shadow-sm sm:rounded-xl sm:p-9">
        <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.14em]">
          <span className="text-ktf-blue">{question.short}</span>
          <span className="text-ktf-gray-500">
            {questionIndex + 1} of {DIGITAL_AUDIT_QUESTIONS.length}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ktf-gray-200">
          <div
            className="h-full rounded-full bg-ktf-blue transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <h1 className="mt-8 text-2xl font-bold leading-snug tracking-[-0.025em] text-ktf-navy">
          {question.prompt}
        </h1>
        <p className="mt-3 text-sm leading-6 text-ktf-gray-600">{question.context}</p>
        <div className="mt-7 space-y-3" role="radiogroup" aria-label={question.prompt}>
          {question.options.map((option, index) => {
            const selected = selectedIndex === index;
            return (
              <button
                key={option.label}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={saveState === "saving"}
                onClick={() => void onSelect(index)}
                className={`flex w-full items-start gap-4 rounded-lg border p-4 text-left transition ${
                  selected
                    ? "border-ktf-blue bg-ktf-blue/5 shadow-[0_0_0_1px_rgba(10,132,255,.2)]"
                    : "border-ktf-gray-200 hover:border-ktf-blue/40"
                } disabled:cursor-wait`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    selected ? "border-ktf-blue bg-ktf-blue text-white" : "border-ktf-gray-300"
                  }`}
                >
                  {selected ? <Check className="h-3 w-3" /> : null}
                </span>
                <span className="text-sm font-medium leading-6 text-ktf-gray-800">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 min-h-5 text-xs">
          {saveState === "saving" && (
            <span className="inline-flex items-center gap-1.5 text-ktf-gray-500">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Saving…
            </span>
          )}
          {saveState === "saved" && (
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <CircleCheck className="h-3.5 w-3.5" /> Saved
            </span>
          )}
        </div>
        {error && <ErrorMessage message={error} />}
        <div className="mt-7 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrevious}
            className="inline-flex h-11 items-center gap-2 px-3 text-sm font-semibold text-ktf-gray-600"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>
          <button
            type="button"
            disabled={selectedIndex < 0 || saveState === "saving" || saveState === "error" || submitting}
            onClick={onNext}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-ktf-blue px-6 text-sm font-semibold text-white transition hover:bg-ktf-blue-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {questionIndex === DIGITAL_AUDIT_QUESTIONS.length - 1 ? "Create my report" : "Next"}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-7 flex items-center gap-2 rounded-lg bg-ktf-surface px-3 py-2 text-xs leading-5 text-ktf-gray-500">
          <ShieldCheck className="h-4 w-4 shrink-0 text-ktf-blue" />
          This is a strategic self-assessment, not a formal security or compliance audit.
        </div>
      </section>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ktf-navy">{label}</span>
      <select
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-lg border border-ktf-gray-300 bg-white px-4 text-sm outline-none focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/15"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function SearchableIndustryField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const query = value.trim().toLocaleLowerCase();
  const matches = options.filter((option) => option.toLocaleLowerCase().includes(query));

  return (
    <div className="relative">
      <label htmlFor="digital-audit-industry" className="mb-2 block text-sm font-semibold text-ktf-navy">
        {label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ktf-gray-500" />
        <input
          id="digital-audit-industry"
          required
          value={value}
          role="combobox"
          aria-autocomplete="list"
          aria-controls="digital-audit-industry-options"
          aria-expanded={isOpen}
          onFocus={() => setIsOpen(true)}
          onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsOpen(false);
          }}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          className="h-12 w-full rounded-lg border border-ktf-gray-300 bg-white py-0 pl-11 pr-4 text-sm outline-none focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/15"
          placeholder="Search industries, including forex and crypto"
        />
      </div>
      {isOpen && (
        <div
          id="digital-audit-industry-options"
          role="listbox"
          className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-ktf-gray-200 bg-white p-1 shadow-lg"
        >
          {matches.length > 0 ? (
            matches.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={value === option}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className="flex w-full rounded-md px-3 py-2.5 text-left text-sm text-ktf-gray-700 transition hover:bg-ktf-surface hover:text-ktf-navy"
              >
                {option}
              </button>
            ))
          ) : (
            <p className="px-3 py-2.5 text-sm text-ktf-gray-500">
              No listed industry matches. You can still enter your industry above.
            </p>
          )}
        </div>
      )}
      <span className="mt-1.5 block text-xs text-ktf-gray-500">Search and choose an industry, or enter one not listed.</span>
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-ktf-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-ktf-gray-300 accent-ktf-blue"
      />
      <span>{label}</span>
    </label>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
      {message}
    </p>
  );
}
