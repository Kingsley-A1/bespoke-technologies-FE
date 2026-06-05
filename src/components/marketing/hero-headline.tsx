"use client";

/**
 * Bespoke Technologies — Hero Headline
 *
 * Rotates the product category (websites → mobile apps → SaaS platforms → AI systems)
 * on a calm, premium interval. The rotating word is the only blue emphasis; surrounding
 * lines stay navy — creating a clear focal anchor on each rotation.
 *
 * Accessibility:
 * - A single, crawlable sentence is exposed to assistive tech and search via
 *   the `sr-only` span; the animated visual is `aria-hidden`.
 * - Rotation and motion are fully disabled under `prefers-reduced-motion`.
 */

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const PRODUCTS = [
  "Websites",
  "Mobile Apps",
  "SaaS Platforms",
  "AI Systems",
] as const;

const ROTATE_MS = 2800;

export function HeroHeadline({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % PRODUCTS.length),
      ROTATE_MS,
    );
    return () => clearInterval(id);
  }, [reduce]);

  const product = reduce ? PRODUCTS[0] : PRODUCTS[index];

  return (
    <h1 id="home-hero-title" className={className}>
      <span className="sr-only">
        We build the digital products — Websites, Mobile Apps, SaaS Platforms,
        and AI Systems — your business relies on.
      </span>

      <span aria-hidden="true" className="block">
        <span className="block text-ktf-navy">We build</span>

        <span className="relative block min-h-[1.1em] overflow-hidden">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={product}
              className="block text-ktf-blue-deep"
              initial={{ opacity: 0, y: reduce ? 0 : "0.45em" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : "-0.45em" }}
              transition={{
                duration: reduce ? 0.15 : 0.52,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {product}
            </motion.span>
          </AnimatePresence>
        </span>

        <span className="block text-ktf-navy">your business relies on.</span>
      </span>
    </h1>
  );
}
