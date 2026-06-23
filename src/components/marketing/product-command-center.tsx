"use client";

import {
  Check,
  CheckCircle2,
  Code2,
  FileKey2,
  GitBranch,
  LockKeyhole,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const phases = [
  { label: "Scope", icon: GitBranch },
  { label: "Prototype", icon: Code2 },
  { label: "Build", icon: ShieldCheck },
  { label: "Launch", icon: Rocket },
] as const;

const deliverables = [
  "Validated build plan",
  "Source code and documentation",
  "Deployment handover",
] as const;

export function ProductCommandCenter({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.aside
      aria-label="Bespoke product delivery system"
      className={cn(
        "ktf-hero-console relative mx-auto min-w-0 w-full max-w-[620px]",
        className,
      )}
      initial={false}
    >
      <div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_55%_42%,rgba(10,132,255,0.18),transparent_42%),radial-gradient(circle_at_85%_12%,rgba(148,111,255,0.18),transparent_34%)] blur-2xl"
      />

      <div className="overflow-hidden rounded-[1.4rem] border border-ktf-gray-200 bg-white shadow-[0_30px_80px_-45px_rgba(11,31,58,0.52)]">
        <div className="flex items-center justify-between border-b border-ktf-gray-200 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-ktf-gray-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-ktf-gray-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-ktf-blue/50" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ktf-gray-500">
              Client build console
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ktf-success">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure by design
          </span>
        </div>

        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.16fr_0.84fr]">
          <div className="rounded-2xl border border-ktf-gray-200 bg-ktf-surface p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-caption font-semibold uppercase tracking-[0.16em] text-ktf-blue-deep">
                  Recommended path
                </p>
                <h2 className="mt-2 text-h5 font-bold text-ktf-navy">
                  From product idea to owned system
                </h2>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ktf-blue/15 bg-white text-ktf-blue-deep shadow-xs">
                <Rocket className="h-5 w-5" />
              </span>
            </div>

            <ol className="mt-7 grid grid-cols-4">
              {phases.map((phase, index) => {
                const Icon = phase.icon;
                return (
                  <li
                    key={phase.label}
                    className="relative flex min-w-0 flex-col items-center text-center"
                  >
                    {index > 0 ? (
                      <span
                        aria-hidden="true"
                        className="absolute right-1/2 top-4 h-px w-full bg-ktf-blue/25"
                      />
                    ) : null}
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-ktf-blue/25 bg-white text-ktf-blue-deep">
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <span className="mt-2 text-[10px] font-semibold text-ktf-navy sm:text-[11px]">
                      {phase.label}
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="mt-6 overflow-hidden rounded-xl border border-ktf-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-ktf-gray-100 px-3.5 py-2.5">
                <span className="text-caption font-semibold text-ktf-navy">
                  Scope readiness
                </span>
                <span className="text-[11px] font-semibold text-ktf-success">
                  Verified
                </span>
              </div>
              <div className="grid grid-cols-3 gap-px bg-ktf-gray-100">
                {["Users", "Risk", "Launch"].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-center gap-1 bg-white px-2 py-3 text-[10px] font-medium text-ktf-gray-600 sm:text-[11px]"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-ktf-success" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-ktf-blue/15 bg-ktf-blue/5 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ktf-blue-deep text-white">
                  <LockKeyhole className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-body-sm font-semibold text-ktf-navy">
                    Production baseline
                  </p>
                  <p className="text-caption text-ktf-gray-600">
                    Security, testing, and deployment included
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white">
                <motion.span
                  className="block h-full rounded-full bg-ktf-blue-deep"
                  initial={reduceMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  style={{ transformOrigin: "left" }}
                  transition={{
                    duration: 0.9,
                    delay: 0.65,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              </div>
            </div>

            <div className="flex-1 rounded-2xl border border-ktf-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 text-ktf-navy">
                <FileKey2 className="h-4 w-4 text-ktf-blue-deep" />
                <p className="text-body-sm font-semibold">Handover standard</p>
              </div>
              <ul className="mt-4 space-y-3">
                {deliverables.map((deliverable) => (
                  <li
                    key={deliverable}
                    className="flex items-center gap-2 text-caption text-ktf-gray-600"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ktf-success/10 text-ktf-success">
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    {deliverable}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-ktf-gray-200 bg-ktf-surface px-4 py-3 sm:px-5">
          <span className="text-[11px] text-ktf-gray-500">
            Scope · UX · Engineering · Launch
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ktf-blue-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-ktf-blue-deep" />
            One accountable team
          </span>
        </div>
      </div>
    </motion.aside>
  );
}
