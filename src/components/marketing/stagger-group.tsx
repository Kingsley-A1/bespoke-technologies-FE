"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Reveals a group of cards once, the first time it scrolls into view.
 *
 * Server HTML is fully visible. After hydration a group that is still below
 * the fold is marked "pending" (it is off screen, so nothing flashes), then
 * "shown" when it enters the viewport. Groups already on screen, and every
 * group under reduced motion, are marked "static" and never move. The state
 * lives in a data attribute, so revealing never re-renders React.
 */
export function StaggerGroup({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || element.getBoundingClientRect().top < window.innerHeight) {
      element.dataset.reveal = "static";
      return;
    }
    element.dataset.reveal = "pending";

    let frame = 0;
    const reveal = () => {
      element.dataset.reveal = "shown";
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
    // Shown when it enters view. The scroll check also catches visitors who
    // jump past it (fast scroll, End key, anchor link), which an observer
    // does not report, so nothing stays hidden above them.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) reveal();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (element.getBoundingClientRect().top < window.innerHeight) reveal();
      });
    };
    observer.observe(element);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className={cn("ktf-stagger", className)} style={style}>
      {children}
    </div>
  );
}
