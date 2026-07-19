"use client";

import {
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  Quote,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { CLIENT_STORIES } from "@/lib/constants";

const STORY_INTERVAL = 7800;

export function ClientStory() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hasStories = CLIENT_STORIES.length > 0;
  const shouldRotate = hasStories && !reduceMotion && !paused && !hovered;

  useEffect(() => {
    if (!shouldRotate) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % CLIENT_STORIES.length);
    }, STORY_INTERVAL);

    return () => window.clearInterval(interval);
  }, [shouldRotate]);

  // No published client stories yet — render nothing until real feedback exists.
  if (!hasStories) return null;

  const story = CLIENT_STORIES[activeIndex];

  const selectStory = (index: number) => {
    setActiveIndex((index + CLIENT_STORIES.length) % CLIENT_STORIES.length);
  };

  return (
    <div
      className="overflow-hidden rounded-xl border border-ktf-gray-200 bg-white shadow-[0_12px_28px_-20px_rgba(11,31,58,0.32)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setHovered(false);
        }
      }}
    >
      <div className="grid lg:grid-cols-[220px_1fr]">
        <div className="border-b border-ktf-gray-200 bg-ktf-navy p-5 text-white lg:border-r lg:border-b-0 lg:p-6">
          <div className="flex items-center justify-between lg:block">
            <div>
              <p className="text-caption font-semibold uppercase tracking-[0.18em] text-ktf-blue">
                Client stories
              </p>
              <p className="mt-2 text-body-sm leading-relaxed text-ktf-gray-400">
                Progress through the problem, delivery, and product outcome.
              </p>
            </div>
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10 lg:mt-6"
              aria-label={paused ? "Resume client story rotation" : "Pause client story rotation"}
              aria-pressed={paused}
              onClick={() => setPaused((current) => !current)}
            >
              {paused ? (
                <Play className="h-4 w-4" fill="currentColor" />
              ) : (
                <Pause className="h-4 w-4" fill="currentColor" />
              )}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-2 lg:grid-cols-1">
            {CLIENT_STORIES.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className="group min-h-11 text-left"
                aria-label={`Show story ${index + 1}: ${item.company}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => selectStory(index)}
              >
                <span className="block h-1 overflow-hidden rounded-full bg-white/15">
                  <span
                    className={`block h-full origin-left rounded-full bg-ktf-blue transition-transform duration-300 ${
                      index === activeIndex ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </span>
                <span
                  className={`mt-2 hidden text-caption font-medium transition-colors lg:block ${
                    index === activeIndex
                      ? "text-white"
                      : "text-ktf-gray-500 group-hover:text-ktf-gray-300"
                  }`}
                >
                  {item.company}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative min-h-[520px] p-5 sm:p-8 lg:min-h-[480px] lg:p-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.article
              key={story.id}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: reduceMotion ? 0 : 0.38 }}
              className="flex h-full flex-col"
              aria-live="polite"
            >
              <div className="grid gap-5 sm:grid-cols-3">
                {[
                  ["Challenge", story.challenge],
                  ["What we built", story.delivery],
                  ["Outcome", story.outcome],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className="border-l-2 border-ktf-blue/25 pl-4"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ktf-blue-deep">
                      0{index + 1} · {label}
                    </p>
                    <p className="mt-2 text-body-sm font-medium leading-relaxed text-ktf-navy">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-1 flex-col justify-between rounded-lg bg-ktf-surface p-5 sm:p-7">
                <Quote className="h-7 w-7 text-ktf-blue-deep" aria-hidden="true" />
                <blockquote className="mt-5 max-w-3xl text-xl font-semibold leading-[1.45] tracking-tight text-ktf-navy sm:text-2xl">
                  “{story.quote}”
                </blockquote>
                <div className="mt-8 flex flex-col gap-5 border-t border-ktf-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ktf-blue-deep text-caption font-bold text-white">
                      {story.initials}
                    </span>
                    <span>
                      <span className="block text-body-sm font-semibold text-ktf-navy">
                        {story.author}
                      </span>
                      <span className="block text-caption text-ktf-gray-500">
                        {story.role}, {story.company}
                      </span>
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-ktf-gray-300 text-ktf-navy transition-colors hover:border-ktf-blue/40 hover:bg-ktf-blue/5"
                      aria-label="Previous client story"
                      onClick={() => selectStory(activeIndex - 1)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-ktf-blue-deep text-white transition-colors hover:bg-ktf-blue-pressed"
                      aria-label="Next client story"
                      onClick={() => selectStory(activeIndex + 1)}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.article>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
