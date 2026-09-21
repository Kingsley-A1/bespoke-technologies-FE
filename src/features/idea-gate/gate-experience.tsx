"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  LoaderCircle,
  PenLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  IDEA_GATE_OWNER_ROLES,
  IDEA_GATE_PATH,
  IDEA_GATE_PRODUCT_NAME,
  IDEA_GATE_QUESTIONS,
  IDEA_GATE_STAGES,
  IDEA_GATE_TAGLINE,
} from "./definition";
import { IdeaGateStartShare } from "./share-actions";
import type { IdeaGateAnswers, IdeaGateRecord } from "./types";
import gateLogo from "@/app/idea-execution-gate/assets/logo.png";

type Stage = "landing" | "context" | "gates" | "review";
type SaveState = "idle" | "saving" | "saved" | "error";

interface ContextForm {
  ideaTitle: string;
  ideaSummary: string;
  ideaStage: string;
  ownerRole: string;
  website: string;
}

const initialContext: ContextForm = {
  ideaTitle: "",
  ideaSummary: "",
  ideaStage: "",
  ownerRole: "",
  website: "",
};

const TOTAL_GATES = IDEA_GATE_QUESTIONS.length;

export function IdeaGateExperience() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("landing");
  const [context, setContext] = useState(initialContext);
  const [assessment, setAssessment] = useState<IdeaGateRecord | null>(null);
  const [answers, setAnswers] = useState<IdeaGateAnswers>({});
  const [gateIndex, setGateIndex] = useState(0);
  const [loadingResume, setLoadingResume] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/idea-gates/current", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 204) return null;
        if (!response.ok) throw new Error("Saved progress could not be loaded.");
        return (await response.json()) as { assessment: IdeaGateRecord };
      })
      .then((payload) => {
        if (cancelled || !payload?.assessment) return;
        setAssessment(payload.assessment);
        setAnswers(payload.assessment.answers);
        setContext({
          ideaTitle: payload.assessment.ideaTitle,
          ideaSummary: payload.assessment.ideaSummary,
          ideaStage: payload.assessment.ideaStage,
          ownerRole: payload.assessment.ownerRole,
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

  const resume = () => {
    if (!assessment) return;
    if (assessment.status === "completed" && assessment.shareToken) {
      router.push(`${IDEA_GATE_PATH}/report/${assessment.shareToken}`);
      return;
    }
    const firstUnanswered = IDEA_GATE_QUESTIONS.findIndex(
      (gate) => assessment.answers[gate.id] === undefined,
    );
    setGateIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
    setStage(firstUnanswered >= 0 ? "gates" : "review");
  };

  const beginFresh = () => {
    setAssessment(null);
    setAnswers({});
    setContext(initialContext);
    setGateIndex(0);
    setError("");
    setStage("context");
  };

  async function createAssessment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!context.ideaTitle.trim() || !context.ideaStage || !context.ownerRole) {
      setError("An idea name, stage and your role are required.");
      return;
    }
    if (context.ideaSummary.trim().length < 20) {
      setError("Describe the idea in at least a sentence — it shapes the whole analysis.");
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
      const response = await fetch("/api/idea-gates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaTitle: context.ideaTitle.trim(),
          ideaSummary: context.ideaSummary.trim(),
          ideaStage: context.ideaStage,
          ownerRole: context.ownerRole,
          website: context.website,
          source: attribution.utm_source || "website",
          attribution,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        assessment?: IdeaGateRecord;
        message?: string;
      };
      if (!response.ok || !payload.assessment) {
        throw new Error(payload.message || "The assessment could not be started.");
      }
      setAssessment(payload.assessment);
      setAnswers({});
      setGateIndex(0);
      setStage("gates");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The assessment could not be started.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function saveAnswer(optionIndex: number, evidence: string) {
    if (!assessment) return;
    const gate = IDEA_GATE_QUESTIONS[gateIndex];
    const option = gate.options[optionIndex];
    const previous = answers[gate.id];
    setAnswers((current) => ({
      ...current,
      [gate.id]: { score: option.score, optionIndex, evidence },
    }));
    setSaveState("saving");
    setError("");
    try {
      const response = await fetch(`/api/idea-gates/${assessment.id}/answers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateId: gate.id, optionIndex, evidence }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        assessment?: IdeaGateRecord;
        message?: string;
      };
      if (!response.ok || !payload.assessment) {
        throw new Error(payload.message || "The answer could not be saved.");
      }
      setAssessment(payload.assessment);
      setAnswers(payload.assessment.answers);
      setSaveState("saved");
    } catch (caught) {
      setAnswers((current) => {
        const next = { ...current };
        if (previous === undefined) delete next[gate.id];
        else next[gate.id] = previous;
        return next;
      });
      setSaveState("error");
      setError(
        caught instanceof Error ? caught.message : "The answer could not be saved. Try again.",
      );
    }
  }

  async function completeAssessment() {
    if (!assessment) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/idea-gates/${assessment.id}/complete`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        reportPath?: string;
        message?: string;
      };
      if (!response.ok || !payload.reportPath) {
        throw new Error(payload.message || "The result could not be generated.");
      }
      router.push(payload.reportPath);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The result could not be generated.",
      );
      setSubmitting(false);
    }
  }

  if (stage === "landing") {
    return (
      <LandingStep
        assessment={assessment}
        loadingResume={loadingResume}
        onStart={beginFresh}
        onResume={resume}
      />
    );
  }

  if (stage === "context") {
    return (
      <ContextStep
        context={context}
        setContext={setContext}
        onBack={() => setStage("landing")}
        onSubmit={createAssessment}
        submitting={submitting}
        error={error}
      />
    );
  }

  if (stage === "review") {
    return (
      <ReviewStep
        answers={answers}
        submitting={submitting}
        error={error}
        onEdit={(index) => {
          setGateIndex(index);
          setSaveState("idle");
          setError("");
          setStage("gates");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onBack={() => {
          setGateIndex(TOTAL_GATES - 1);
          setStage("gates");
        }}
        onSubmit={() => void completeAssessment()}
      />
    );
  }

  return (
    <GateStep
      key={gateIndex}
      gateIndex={gateIndex}
      answers={answers}
      saveState={saveState}
      error={error}
      onSave={saveAnswer}
      onPrevious={() => {
        setSaveState("idle");
        setError("");
        if (gateIndex === 0) setStage("context");
        else setGateIndex((index) => index - 1);
      }}
      onNext={() => {
        setSaveState("idle");
        setError("");
        if (gateIndex === TOTAL_GATES - 1) setStage("review");
        else setGateIndex((index) => index + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    />
  );
}

function GateMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <span className={`inline-flex overflow-hidden rounded-md bg-white ${className}`}>
      <Image src={gateLogo} alt="" aria-hidden="true" className="h-full w-full object-contain" />
    </span>
  );
}

function LandingStep({
  assessment,
  loadingResume,
  onStart,
  onResume,
}: {
  assessment: IdeaGateRecord | null;
  loadingResume: boolean;
  onStart: () => void;
  onResume: () => void;
}) {
  return (
    <div>
      <section className="bg-linear-to-b from-ktf-surface to-white px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:pb-24 lg:pt-16">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-ktf-blue/20 bg-ktf-blue/5 py-1.5 pl-2 pr-4">
            <GateMark className="h-6 w-6" />
            <span className="text-caption font-bold uppercase tracking-[0.14em] text-ktf-blue-deep">
              {IDEA_GATE_PRODUCT_NAME}
            </span>
          </div>
          <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.08] tracking-[-0.035em] text-ktf-navy sm:text-5xl lg:text-6xl">
            From idea to execution. With clarity.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ktf-gray-600">
            Ten execution gates. A score out of 20, a Green, Amber or Red verdict, and the
            specific evidence your idea still needs before anyone writes code.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button
              onClick={onStart}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ktf-blue px-7 text-sm font-semibold text-white transition hover:bg-ktf-blue-deep"
            >
              Assess my idea <ArrowRight className="h-4 w-4" />
            </button>
            <IdeaGateStartShare />
            <span className="text-sm text-ktf-gray-500">
              10 gates · About 6 minutes · No account needed
            </span>
          </div>
          {!loadingResume && assessment && (
            <div className="mt-8 flex max-w-2xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-ktf-blue/20 bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-ktf-navy">
                  {assessment.status === "completed"
                    ? "Your saved result is ready"
                    : "Saved assessment found"}
                </p>
                <p className="mt-1 text-xs text-ktf-gray-600">
                  {assessment.ideaTitle} · {assessment.progressCount}/{TOTAL_GATES} gates completed
                </p>
              </div>
              <button
                onClick={onResume}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-ktf-blue/30 px-4 text-xs font-semibold text-ktf-blue"
              >
                {assessment.status === "completed" ? "View result" : "Continue"}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {[
            [
              "01",
              "Describe the idea",
              "One name, one paragraph. No pitch deck, no forms to download.",
            ],
            [
              "02",
              "Pass the ten gates",
              "Problem, user, timing, value, market, reach, feasibility, MVP, first build and long-term advantage.",
            ],
            [
              "03",
              "Get a decision you can act on",
              "A score out of 20, a verdict, the risks, a recommended first version and the first thing to build.",
            ],
          ].map(([number, title, body]) => (
            <article key={number} className="rounded-2xl border border-ktf-gray-200 bg-white p-6">
              <p className="text-xs font-bold text-ktf-blue">{number}</p>
              <h2 className="mt-3 text-base font-bold text-ktf-navy">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-ktf-gray-600">{body}</p>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-6 max-w-5xl rounded-2xl border border-ktf-gray-200 bg-ktf-surface p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ktf-gray-600">
            How it is scored
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ktf-gray-600">
            Every gate scores 0 for no evidence, 1 for weak evidence and 2 for strong evidence.
            The total and the verdict come from that scale alone — the same rule for every idea,
            every time. Nothing you write changes the score; it only sharpens the written analysis.
          </p>
        </div>
      </section>
    </div>
  );
}

const fieldClass =
  "h-11 w-full rounded-xl border border-ktf-gray-300 bg-white px-4 text-sm outline-none focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/15";

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
    <div className="bg-ktf-surface px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto max-w-xl rounded-2xl border border-ktf-gray-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-ktf-blue">
          Your idea
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-ktf-navy">
          Introduce the idea
        </h1>
        <p className="mt-2 text-sm leading-6 text-ktf-gray-600">
          This is the only context the analysis gets, so write it the way you would explain it
          to someone who has to act on it. No contact details needed yet.
        </p>
        <form onSubmit={onSubmit} className="mt-7 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ktf-navy">
              What is the idea called?
            </span>
            <input
              required
              maxLength={160}
              value={context.ideaTitle}
              onChange={(event) =>
                setContext((current) => ({ ...current, ideaTitle: event.target.value }))
              }
              className={fieldClass}
              placeholder="e.g. Clinic Scheduler"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ktf-navy">
              Describe it in a few sentences
            </span>
            <textarea
              required
              rows={5}
              maxLength={2000}
              value={context.ideaSummary}
              onChange={(event) =>
                setContext((current) => ({ ...current, ideaSummary: event.target.value }))
              }
              className="w-full rounded-xl border border-ktf-gray-300 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/15"
              placeholder="What it does, who it is for, and what it changes for them."
            />
            <span className="mt-1.5 block text-xs text-ktf-gray-500">
              {context.ideaSummary.trim().length}/2000 characters
            </span>
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              label="Stage"
              value={context.ideaStage}
              options={IDEA_GATE_STAGES}
              onChange={(ideaStage) => setContext((current) => ({ ...current, ideaStage }))}
            />
            <SelectField
              label="Your role"
              value={context.ownerRole}
              options={IDEA_GATE_OWNER_ROLES}
              onChange={(ownerRole) => setContext((current) => ({ ...current, ownerRole }))}
            />
          </div>
          <div className="flex items-start gap-2.5 rounded-2xl border border-ktf-gray-200 bg-ktf-surface p-4 text-xs leading-5 text-ktf-gray-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ktf-blue" />
            <span>
              Your answers are saved so you can come back to them. Incomplete assessments are
              removed after 90 days.{" "}
              <a href="/privacy" className="font-semibold text-ktf-blue hover:underline">
                Privacy policy
              </a>
            </span>
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
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-ktf-gray-600 transition hover:text-ktf-navy"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ktf-blue px-6 text-sm font-semibold text-white transition hover:bg-ktf-blue-deep disabled:opacity-60"
            >
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              Start the gates
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function GateStep({
  gateIndex,
  answers,
  saveState,
  error,
  onSave,
  onPrevious,
  onNext,
}: {
  gateIndex: number;
  answers: IdeaGateAnswers;
  saveState: SaveState;
  error: string;
  onSave: (optionIndex: number, evidence: string) => Promise<void>;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const gate = IDEA_GATE_QUESTIONS[gateIndex];
  const saved = answers[gate.id];
  const [evidence, setEvidence] = useState(saved?.evidence ?? "");
  const reduceMotion = useReducedMotion();
  const selectedIndex = saved?.optionIndex ?? -1;
  const isLast = gateIndex === TOTAL_GATES - 1;

  return (
    <div className="bg-ktf-surface px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-ktf-gray-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.14em]">
          <span className="text-ktf-blue">
            Gate {gate.number} · {gate.label}
          </span>
          <span className="text-ktf-gray-500">
            {gateIndex + 1} of {TOTAL_GATES}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1" aria-hidden="true">
          {IDEA_GATE_QUESTIONS.map((step, index) => (
            <span
              key={step.id}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-ktf-gray-200"
            >
              <motion.span
                className="block h-full rounded-full bg-ktf-blue"
                initial={false}
                animate={{
                  width:
                    index < gateIndex || (index === gateIndex && selectedIndex >= 0)
                      ? "100%"
                      : "0%",
                }}
                transition={
                  reduceMotion ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
                }
              />
            </span>
          ))}
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="mt-7 text-balance text-xl font-bold leading-snug tracking-[-0.02em] text-ktf-navy sm:text-2xl">
            {gate.question}
          </h1>
          <p className="mt-3 text-sm leading-6 text-ktf-gray-600">{gate.context}</p>

          <div
            className="mt-6 space-y-2.5"
            role="radiogroup"
            aria-label={`${gate.question} — evidence strength`}
          >
            {gate.options.map((option, index) => {
              const selected = selectedIndex === index;
              return (
                <motion.button
                  key={option.label}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={saveState === "saving"}
                  onClick={() => void onSave(index, evidence)}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.28,
                    ease: [0.22, 1, 0.36, 1],
                    delay: reduceMotion ? 0 : 0.06 * index,
                  }}
                  className={`flex w-full items-start gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition ${
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
                  <span
                    className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                      selected ? "bg-ktf-blue text-white" : "bg-ktf-gray-100 text-ktf-gray-500"
                    }`}
                  >
                    {option.score}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <label className="mt-5 block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-ktf-navy">
              <PenLine className="h-4 w-4 text-ktf-blue" />
              {gate.evidenceLabel}
              <span className="font-normal text-ktf-gray-500">(optional)</span>
            </span>
            <textarea
              rows={3}
              maxLength={1200}
              value={evidence}
              onChange={(event) => setEvidence(event.target.value)}
              onBlur={() => {
                if (selectedIndex >= 0 && evidence !== (saved?.evidence ?? "")) {
                  void onSave(selectedIndex, evidence);
                }
              }}
              className="w-full rounded-xl border border-ktf-gray-300 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/15"
              placeholder={gate.evidencePlaceholder}
            />
            <span className="mt-1.5 block text-xs text-ktf-gray-500">
              Notes sharpen the written analysis. They never change your score.
            </span>
          </label>
        </motion.div>

        <AnimatePresence initial={false}>
          {selectedIndex >= 0 && (
            <motion.p
              key="encouragement"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-5 flex items-start gap-2 rounded-2xl bg-ktf-blue/5 px-4 py-3 text-sm leading-6 text-ktf-blue-deep"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
              {gate.encouragement}
            </motion.p>
          )}
        </AnimatePresence>

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

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrevious}
            className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-ktf-gray-600 transition hover:text-ktf-navy"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>
          <button
            type="button"
            disabled={selectedIndex < 0 || saveState === "saving" || saveState === "error"}
            onClick={onNext}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ktf-blue px-6 text-sm font-semibold text-white transition hover:bg-ktf-blue-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLast ? "Review answers" : "Next gate"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

function ReviewStep({
  answers,
  submitting,
  error,
  onEdit,
  onBack,
  onSubmit,
}: {
  answers: IdeaGateAnswers;
  submitting: boolean;
  error: string;
  onEdit: (index: number) => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const answered = IDEA_GATE_QUESTIONS.filter((gate) => answers[gate.id] !== undefined);
  const complete = answered.length === TOTAL_GATES;

  return (
    <div className="bg-ktf-surface px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto max-w-2xl rounded-2xl border border-ktf-gray-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-ktf-blue">Review</p>
        <h1 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-ktf-navy">
          Check your evidence before scoring
        </h1>
        <p className="mt-2 text-sm leading-6 text-ktf-gray-600">
          {complete
            ? "All ten gates are answered. Change anything that does not reflect where the idea really stands."
            : `${answered.length} of ${TOTAL_GATES} gates answered. Complete the remaining gates to get your result.`}
        </p>

        <ul className="mt-7 divide-y divide-ktf-gray-200 border-y border-ktf-gray-200">
          {IDEA_GATE_QUESTIONS.map((gate, index) => {
            const answer = answers[gate.id];
            return (
              <li key={gate.id} className="flex items-start gap-3 py-3.5">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                    answer === undefined
                      ? "bg-ktf-gray-100 text-ktf-gray-500"
                      : answer.score === 2
                        ? "bg-emerald-50 text-emerald-700"
                        : answer.score === 1
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {answer === undefined ? "—" : answer.score}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-6 text-ktf-navy">
                    {gate.number}. {gate.question}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ktf-gray-500">
                    {answer === undefined
                      ? "Not answered yet"
                      : gate.options[answer.optionIndex]?.label}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onEdit(index)}
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-ktf-blue transition hover:bg-ktf-blue/5"
                >
                  {answer === undefined ? "Answer" : "Edit"}
                </button>
              </li>
            );
          })}
        </ul>

        {error && <ErrorMessage message={error} />}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-ktf-gray-600 transition hover:text-ktf-navy"
          >
            <ArrowLeft className="h-4 w-4" /> Back to gates
          </button>
          <button
            type="button"
            disabled={!complete || submitting}
            onClick={onSubmit}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ktf-blue px-6 text-sm font-semibold text-white transition hover:bg-ktf-blue-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            {submitting ? "Scoring your idea…" : "Get my result"}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
        {submitting && (
          <p className="mt-3 text-center text-xs text-ktf-gray-500 sm:text-right">
            Scoring the gates and writing your analysis. This takes a few seconds.
          </p>
        )}
        <p className="mt-6 text-xs leading-5 text-ktf-gray-500">
          {IDEA_GATE_TAGLINE} Your score comes from the ten gate answers alone.
        </p>
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
        className={fieldClass}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700"
    >
      {message}
    </p>
  );
}
