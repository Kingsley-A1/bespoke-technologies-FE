"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Route change feedback for the public site: a brief, light fade of the new
 * page (CSS, 0.2s). It never covers the page or delays interaction, never runs
 * on the first paint, and is disabled under reduced motion in globals.css.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Derived-state pattern: the first render never animates; any later
  // pathname change re-keys the wrapper so the fade plays once.
  const [previousPath, setPreviousPath] = useState(pathname);
  const [hasNavigated, setHasNavigated] = useState(false);

  if (previousPath !== pathname) {
    setPreviousPath(pathname);
    setHasNavigated(true);
  }

  return (
    <div key={pathname} className={hasNavigated ? "ktf-page-enter flex flex-1 flex-col" : "flex flex-1 flex-col"}>
      {children}
    </div>
  );
}
