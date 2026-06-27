"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import { cn } from "@/lib/utils";

type Banner = { src: string; alt: string };

/**
 * Showcase banners (1536×1024, 3:2). Data-driven so the set can be swapped by
 * editing this list alone.
 */
const BANNERS: Banner[] = [
  {
    src: "/assets/we_build_your_dream_website.png",
    alt: "Bespoke Technologies — modern, conversion-focused websites for serious businesses.",
  },
  {
    src: "/assets/ai_apps_that_works_smarter.png",
    alt: "Bespoke Technologies — AI applications that automate tasks and work smarter.",
  },
  {
    src: "/assets/mobile_apps_for_real_users.png",
    alt: "Bespoke Technologies — fast, intuitive mobile apps built for real users.",
  },
  {
    src: "/assets/cloud_solutions.png",
    alt: "Bespoke Technologies — secure, scalable cloud solutions built to scale.",
  },
  {
    src: "/assets/built_for_business.png",
    alt: "Bespoke Technologies — digital products built for business and your audience.",
  },
];

const AUTO_ADVANCE = 5000;
const SWIPE_DISTANCE = 56;
const SWIPE_VELOCITY = 6000;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

export function ShowcaseCarousel() {
  const reduceMotion = useReducedMotion();
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const [paused, setPaused] = useState(false);

  const count = BANNERS.length;
  const active = ((page % count) + count) % count;

  const paginate = useCallback(
    (next: number) => setPage(([current]) => [current + next, next]),
    [],
  );

  const goTo = useCallback(
    (target: number) => setPage([target, target >= active ? 1 : -1]),
    [active],
  );

  useEffect(() => {
    if (reduceMotion || paused) return;

    const id = window.setInterval(() => paginate(1), AUTO_ADVANCE);
    return () => window.clearInterval(id);
  }, [reduceMotion, paused, paginate]);

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const swipe = info.offset.x * info.velocity.x;
    if (info.offset.x < -SWIPE_DISTANCE || swipe < -SWIPE_VELOCITY) {
      paginate(1);
    } else if (info.offset.x > SWIPE_DISTANCE || swipe > SWIPE_VELOCITY) {
      paginate(-1);
    }
  };

  const banner = BANNERS[active];

  return (
    <div
      className="group relative"
      role="group"
      aria-roledescription="carousel"
      aria-label="Bespoke Technologies product showcase"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* 3:2 frame matches the source banners exactly — object-cover never crops
          the baked-in headlines or contact bar. */}
      <div className="relative aspect-3/2 w-full overflow-hidden rounded-md border border-ktf-gray-200 bg-ktf-surface shadow-[0_12px_28px_-20px_rgba(11,31,58,0.32)]">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={page}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    x: { type: "spring", stiffness: 300, damping: 34 },
                    opacity: { duration: 0.25 },
                  }
            }
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.55}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 cursor-grab touch-pan-y active:cursor-grabbing"
          >
            <Image
              src={banner.src}
              alt={banner.alt}
              fill
              draggable={false}
              priority={active === 0}
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="select-none object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Prev / Next — muted, surface on hover/focus */}
        <button
          type="button"
          onClick={() => paginate(-1)}
          aria-label="Previous slide"
          className="absolute top-1/2 left-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ktf-gray-200 bg-white/85 text-ktf-navy opacity-0 shadow-sm backdrop-blur-md transition-opacity hover:bg-white focus-visible:opacity-100 group-hover:opacity-100"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => paginate(1)}
          aria-label="Next slide"
          className="absolute top-1/2 right-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ktf-gray-200 bg-white/85 text-ktf-navy opacity-0 shadow-sm backdrop-blur-md transition-opacity hover:bg-white focus-visible:opacity-100 group-hover:opacity-100"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Dots */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {BANNERS.map((item, i) => {
          const isActive = i === active;
          return (
            <button
              key={item.src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}: ${item.alt}`}
              aria-current={isActive ? "true" : undefined}
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

      <p className="sr-only" aria-live="polite">
        Slide {active + 1} of {count}: {banner.alt}
      </p>
    </div>
  );
}
