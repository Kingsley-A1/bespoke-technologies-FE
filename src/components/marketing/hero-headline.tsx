"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Core product offerings cycled through the hero promise.
 * The active word is the "key product" and is rendered in Bespoke Blue.
 */
const PRODUCTS = [
  "Website",
  "Mobile App",
  "AI Solution",
  "Cloud Infrastructure",
  "Business Solution",
  "Personal Website",
] as const;

const ROTATE_INTERVAL = 3000;

export function HeroHeadline({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % PRODUCTS.length);
    }, ROTATE_INTERVAL);

    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const word = reduceMotion ? PRODUCTS[0] : PRODUCTS[index];

  return (
    <h1 id="home-hero-title" className={className}>
      <span className="sr-only">
        Launch secure, production-ready software your business can own.
      </span>

      <span aria-hidden="true" className="block text-ktf-navy">
        <span className="block">Launch Secure,</span>
        <span className="block">Production-ready</span>
        {/* Rotating product word — its own line so length changes never reflow
            the rest of the headline. */}
        <span className="relative block min-h-[1.1em]">
          {reduceMotion ? (
            <span className="block whitespace-nowrap text-ktf-blue-deep">
              {word}
            </span>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={word}
                initial={{ opacity: 0, y: "0.34em" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "-0.34em" }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="absolute inset-x-0 top-0 block whitespace-nowrap text-ktf-blue-deep"
              >
                {word}
              </motion.span>
            </AnimatePresence>
          )}
        </span>
        <span className="block">your business can own.</span>
      </span>
    </h1>
  );
}
