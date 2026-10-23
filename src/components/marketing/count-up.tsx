"use client";

import { useEffect, useRef } from "react";

/** Splits "18+" / "99%" into a number and its suffix; null when not a plain number. */
export function parseCountValue(value: string) {
  const match = /^(\d+)(\D*)$/.exec(value.trim());
  return match ? { target: Number(match[1]), suffix: match[2] } : null;
}

/**
 * Counts a statistic up once, the first time it scrolls into view. The real
 * value is server-rendered for crawlers, no-JS visitors and screen readers;
 * only the visible digits animate. Values on screen at load, values that are
 * not plain numbers, and reduced-motion visitors see the final value at once.
 */
export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    const parsed = parseCountValue(value);
    if (!element || !parsed) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (element.getBoundingClientRect().top < window.innerHeight) return;

    element.textContent = `0${parsed.suffix}`;
    let frame = 0;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      const start = performance.now();
      const duration = 900;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = `${Math.round(parsed.target * eased)}${parsed.suffix}`;
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      element.textContent = value;
    };
  }, [value]);

  return (
    <>
      <span className="sr-only">{value}</span>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        {value}
      </span>
    </>
  );
}
