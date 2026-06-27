"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Pause, Play } from "lucide-react";
import { DELIVERY_PROCESS } from "@/lib/constants";
import { useMediaQuery } from "@/hooks";
import { cn } from "@/lib/utils";

const STEP_INTERVAL = 3000;

type DeliveryPhase = (typeof DELIVERY_PROCESS)[number];

function StepCard({ phase }: { phase: DeliveryPhase }) {
  return (
    <article className="h-full rounded-md border border-ktf-gray-200 bg-white p-6 shadow-xs">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ktf-blue/25 bg-ktf-blue/5 text-caption font-bold text-ktf-blue-deep">
        {phase.step}
      </span>
      <h3 className="mt-5 text-h5 font-semibold text-ktf-navy">{phase.title}</h3>
      <p className="mt-2 text-body-sm leading-body text-ktf-gray-600">
        {phase.description}
      </p>
    </article>
  );
}

/**
 * Delivery steps presented as three cards.
 * Desktop (md+): all three are always in view as a static grid.
 * Mobile: cards auto-advance every 3s and can be suspended (pause) or
 * navigated directly via the indicators.
 */
export function DeliverySteps() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = DELIVERY_PROCESS.length;
  const shouldRotate = !isDesktop && !reduceMotion && !paused;

  useEffect(() => {
    if (!shouldRotate) return;

    const id = window.setInterval(
      () => setActive((current) => (current + 1) % count),
      STEP_INTERVAL,
    );
    return () => window.clearInterval(id);
  }, [shouldRotate, count]);

  const phase = DELIVERY_PROCESS[active];

  return (
    <div className="mt-10">
      {/* Desktop — all three steps in view */}
      <div className="hidden gap-6 md:grid md:grid-cols-3">
        {DELIVERY_PROCESS.map((item) => (
          <StepCard key={item.step} phase={item} />
        ))}
      </div>

      {/* Mobile — one card at a time, auto-advancing and suspendable */}
      <div className="md:hidden">
        <div className="relative min-h-[12.5rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={phase.step}
              initial={reduceMotion ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: reduceMotion ? 0 : 0.35 }}
            >
              <StepCard phase={phase} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div
            className="flex items-center gap-2"
            role="tablist"
            aria-label="Delivery steps"
          >
            {DELIVERY_PROCESS.map((item, index) => {
              const isActive = index === active;
              return (
                <button
                  key={item.step}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Show step ${index + 1}: ${item.title}`}
                  onClick={() => setActive(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue",
                    isActive
                      ? "w-6 bg-ktf-blue-deep"
                      : "w-2 bg-ktf-gray-300 hover:bg-ktf-gray-400",
                  )}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setPaused((current) => !current)}
            aria-pressed={paused}
            aria-label={paused ? "Resume step rotation" : "Pause step rotation"}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-ktf-gray-200 bg-white text-ktf-navy transition-colors hover:border-ktf-blue/40 hover:text-ktf-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
          >
            {paused ? (
              <Play className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true" />
            ) : (
              <Pause className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
