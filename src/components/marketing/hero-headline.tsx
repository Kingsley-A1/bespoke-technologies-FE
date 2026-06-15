"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { PRODUCT_TYPES } from "@/lib/constants";

const ROTATE_MS = 2600;

export function HeroHeadline({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % PRODUCT_TYPES.length),
      ROTATE_MS,
    );
    return () => clearInterval(id);
  }, [reduce]);

  const product = reduce ? PRODUCT_TYPES[0] : PRODUCT_TYPES[index];

  return (
    <h1 id="home-hero-title" className={className}>
      <span className="sr-only">
        Ship your SaaS product, website, mobile app, business software, AI app,
        or social platform faster. Own the system from day one, secured.
      </span>

      <span aria-hidden="true" className="block text-ktf-navy">
        <span className="block">Ship your</span>
        <span className="relative block min-h-[1.08em] overflow-hidden text-[0.78em] leading-[1.08] sm:text-[1em]">
          <span className="invisible block whitespace-nowrap">
            Social Platforms
          </span>
          <span className="absolute inset-0">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={product}
                className="block whitespace-nowrap text-ktf-blue-deep"
                initial={{ opacity: 0, y: reduce ? 0 : "0.52em" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : "-0.42em" }}
                transition={{
                  duration: reduce ? 0 : 0.46,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {product}
              </motion.span>
            </AnimatePresence>
          </span>
        </span>
        <span className="block">Fast & Secured.</span>
        <span className="mt-5 block max-w-xl text-[0.42em] font-semibold leading-[1.35] tracking-[-0.02em] text-ktf-gray-700 sm:mt-6 sm:text-[0.38em]">
          Own the system from day one,{" "}
          {/* <span className="inline-flex items-center gap-[0.28em] text-ktf-blue-deep">
            <LockKeyhole
              className="h-[0.92em] w-[0.92em]"
              strokeWidth={2.2}
            />
            Secured.
          </span> */}
        </span>
      </span>
    </h1>
  );
}
