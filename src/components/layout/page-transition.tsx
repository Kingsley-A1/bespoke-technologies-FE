"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

/**
 * Door-style route transition for the public site: on navigation the new page
 * is revealed by a light panel sliding open (left → right) while the content
 * settles in underneath. Runs only on client-side navigations — never on the
 * first paint — and disables itself entirely under reduced motion.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  // Derived-state pattern: track the previous pathname in state and flip the
  // "has navigated" flag during render so the very first paint never animates.
  const [previousPath, setPreviousPath] = useState(pathname);
  const [hasNavigated, setHasNavigated] = useState(false);

  if (previousPath !== pathname) {
    setPreviousPath(pathname);
    setHasNavigated(true);
  }

  if (reduceMotion) {
    return <>{children}</>;
  }

  const animate = hasNavigated;

  return (
    <div key={pathname} className="relative flex flex-1 flex-col">
      <motion.div
        initial={animate ? { opacity: 0.2, x: -14 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        className="flex flex-1 flex-col"
      >
        {children}
      </motion.div>

      {animate && (
        <motion.span
          aria-hidden="true"
          initial={{ x: "0%" }}
          animate={{ x: "102%" }}
          transition={{ duration: 0.65, ease: [0.65, 0, 0.35, 1] }}
          className="pointer-events-none fixed inset-0 z-[500] bg-gradient-to-r from-ktf-surface via-white to-white"
        >
          <span className="absolute inset-y-0 left-0 w-0.5 bg-ktf-blue-deep/70" />
        </motion.span>
      )}
    </div>
  );
}
