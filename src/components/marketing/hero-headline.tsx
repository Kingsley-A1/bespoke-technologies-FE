"use client";

/**
 * Bespoke Technologies — Hero Headline
 *
 * Rotates the sentence subject (Time → Customers → Technology) on a calm,
 * premium interval, inspired by the OpenAI welcome pattern ("Let's invent…").
 * The active subject is the only blue emphasis; the rest stays navy.
 *
 * Accessibility:
 * - A single, crawlable sentence is exposed to assistive tech and search via
 *   the `sr-only` span; the animated visual is `aria-hidden`.
 * - Rotation and motion are fully disabled under `prefers-reduced-motion`.
 */

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const SUBJECTS = ["Time is", "Customers are", "Technology is"] as const;
const ROTATE_MS = 3000;

export function HeroHeadline({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % SUBJECTS.length),
      ROTATE_MS,
    );
    return () => clearInterval(id);
  }, [reduce]);

  const subject = reduce ? SUBJECTS[0] : SUBJECTS[index];

  return (
    <h1 id="home-hero-title" className={className}>
      <span className="sr-only">
        Time, customers, and technology are not waiting. Why should you?
      </span>

      <span aria-hidden="true" className="block text-balance">
        <span className="relative block min-h-[1.05em]">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={subject}
              className="block text-ktf-blue-deep"
              initial={{ opacity: 0, y: reduce ? 0 : "0.5em" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : "-0.5em" }}
              transition={{
                duration: reduce ? 0.2 : 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {subject}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="block text-ktf-navy">not waiting, why should you?</span>
      </span>
    </h1>
  );
}
