"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PhoneFrame } from "@/components/marketing/phone-frame";
import { cn } from "@/lib/utils";

export interface HeroPhone {
  slot: string;
  src: string;
  alt: string;
  /** Live project URL — clicking the frame opens the delivered platform. */
  href?: string;
  /** Accessible name for the frame link. */
  label?: string;
  /** True when the screen is an admin-uploaded asset streamed from our API. */
  unoptimized?: boolean;
  /** Project mark shown first. Defaults to `src`. */
  logoSrc?: string;
  logoUnoptimized?: boolean;
  /** Optional portrait product surface revealed inside the device. */
  screenshotSrc?: string;
  screenshotUnoptimized?: boolean;
  /** Visible project identity beneath the device. */
  name: string;
  discipline: string;
}

interface HeroPhoneShowcaseProps {
  /** All admin-selected and fallback screens in their display order. */
  phones: readonly HeroPhone[];
}

export const SCREEN_REVEAL_DELAY_MS = 1300;
export const SCREEN_REVEAL_DURATION_MS = 700;
export const SLIDE_ROTATE_INTERVAL_MS = 4500;
/** How long autoplay stays paused after the user touches the carousel. */
const INTERACTION_GRACE_MS = 6000;

export function logicalSlideIndex(physicalIndex: number, itemCount: number) {
  if (itemCount <= 0) return 0;
  return (physicalIndex - 1 + itemCount) % itemCount;
}

function PhoneScreen({
  phone,
  active,
  revealScreenshot,
}: {
  phone: HeroPhone;
  active: boolean;
  revealScreenshot: boolean;
}) {
  const logoSrc = phone.logoSrc || phone.src;
  const hasReveal =
    Boolean(phone.screenshotSrc)
    && phone.screenshotSrc !== logoSrc;

  return (
    <div
      data-project-name={phone.name}
      data-mobile-image-stage={
        hasReveal && revealScreenshot ? "screenshot" : "logo"
      }
      className="absolute inset-0 overflow-hidden bg-white"
    >
      <Image
        src={logoSrc}
        alt={phone.href ? "" : phone.alt}
        fill
        sizes="(min-width: 1024px) 250px, (min-width: 640px) 210px, 180px"
        loading={active ? "eager" : "lazy"}
        unoptimized={phone.logoUnoptimized ?? phone.unoptimized}
        className="object-contain p-5"
      />
      {hasReveal && (
        <div
          aria-hidden={!revealScreenshot}
          className={cn(
            "absolute inset-0 translate-x-full overflow-hidden bg-white shadow-[-18px_0_32px_rgba(11,31,58,0.18)] transition-transform motion-reduce:translate-x-0 motion-reduce:transition-none",
            revealScreenshot && "translate-x-0",
          )}
          style={{
            transitionDuration: `${SCREEN_REVEAL_DURATION_MS}ms`,
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <Image
            src={phone.screenshotSrc!}
            alt=""
            fill
            sizes="(min-width: 1024px) 250px, (min-width: 640px) 210px, 180px"
            loading={active ? "eager" : "lazy"}
            unoptimized={phone.screenshotUnoptimized}
            className="object-cover object-top"
          />
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-px bg-white/70 shadow-[0_0_18px_rgba(255,255,255,0.8)]"
          />
        </div>
      )}
    </div>
  );
}

/**
 * The homepage's rotating delivered-project showcase.
 *
 * One device is on stage at a time at every breakpoint. Cloned boundary slides
 * let swiping and autoplay continue from the final project back to the first
 * without a visible dead end; desktop adds arrow controls because there is no
 * touch affordance there.
 */
export function HeroPhoneShowcase({ phones }: HeroPhoneShowcaseProps) {
  const [active, setActive] = useState(0);
  const [revealScreenshot, setRevealScreenshot] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const lastInteractionRef = useRef(Number.NEGATIVE_INFINITY);
  const settleTimerRef = useRef<number | undefined>(undefined);

  const slides = useMemo(() => {
    if (phones.length <= 1) {
      return phones.map((phone, logicalIndex) => ({
        phone,
        logicalIndex,
        clone: false,
      }));
    }
    return [
      { phone: phones[phones.length - 1], logicalIndex: phones.length - 1, clone: true },
      ...phones.map((phone, logicalIndex) => ({ phone, logicalIndex, clone: false })),
      { phone: phones[0], logicalIndex: 0, clone: true },
    ];
  }, [phones]);

  useEffect(() => {
    stageRef.current?.setAttribute("data-hero-hydrated", "true");
  }, []);

  useEffect(() => {
    const phone = phones[active];
    const hasReveal =
      Boolean(phone?.screenshotSrc)
      && phone?.screenshotSrc !== (phone?.logoSrc || phone?.src);
    if (!hasReveal) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(
      () => setRevealScreenshot(true),
      SCREEN_REVEAL_DELAY_MS,
    );
    return () => window.clearTimeout(id);
  }, [active, phones]);

  // Keep the first real slide in view, including after viewport changes.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const positionAtLogicalSlide = () => {
      const width = track.clientWidth;
      if (width === 0) return;
      const physicalIndex = phones.length > 1 ? activeRef.current + 1 : 0;
      track.scrollTo({ left: physicalIndex * width, behavior: "auto" });
    };

    const frame = window.requestAnimationFrame(positionAtLogicalSlide);
    const observer = new ResizeObserver(positionAtLogicalSlide);
    observer.observe(track);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [phones.length]);

  // Autoplay walks onto a cloned edge, then the scroll-settle handler silently
  // repositions it to the equivalent real slide.
  useEffect(() => {
    if (phones.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      const track = trackRef.current;
      if (!track || document.hidden) return;
      const width = track.clientWidth;
      if (width === 0) return;
      if (performance.now() - lastInteractionRef.current < INTERACTION_GRACE_MS) return;
      const physicalIndex = Math.round(track.scrollLeft / width);
      track.scrollTo({ left: (physicalIndex + 1) * width, behavior: "smooth" });
    }, SLIDE_ROTATE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [phones.length]);

  useEffect(
    () => () => {
      if (settleTimerRef.current !== undefined) {
        window.clearTimeout(settleTimerRef.current);
      }
    },
    [],
  );

  function pauseAutoplay(event: { timeStamp: number }) {
    lastInteractionRef.current = event.timeStamp;
  }

  function handleTrackScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0 || phones.length === 0) return;
    const physicalIndex = Math.round(track.scrollLeft / track.clientWidth);
    const logicalIndex =
      phones.length > 1
        ? logicalSlideIndex(physicalIndex, phones.length)
        : 0;
    if (activeRef.current !== logicalIndex) {
      activeRef.current = logicalIndex;
      setRevealScreenshot(false);
      setActive(logicalIndex);
    }

    if (settleTimerRef.current !== undefined) {
      window.clearTimeout(settleTimerRef.current);
    }
    settleTimerRef.current = window.setTimeout(() => {
      const width = track.clientWidth;
      if (physicalIndex === 0) {
        track.scrollTo({ left: phones.length * width, behavior: "auto" });
      } else if (physicalIndex === phones.length + 1) {
        track.scrollTo({ left: width, behavior: "auto" });
      }
    }, 120);
  }

  function goTo(index: number, event: { timeStamp: number }) {
    const track = trackRef.current;
    if (!track) return;
    pauseAutoplay(event);
    const physicalIndex = phones.length > 1 ? index + 1 : index;
    track.scrollTo({
      left: physicalIndex * track.clientWidth,
      behavior: "smooth",
    });
  }

  function step(direction: number, event: { timeStamp: number }) {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    pauseAutoplay(event);
    const physicalIndex = Math.round(track.scrollLeft / track.clientWidth);
    track.scrollTo({
      left: (physicalIndex + direction) * track.clientWidth,
      behavior: "smooth",
    });
  }

  if (phones.length === 0) return null;

  const arrowClass =
    "absolute top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ktf-gray-200 bg-white/85 text-ktf-navy shadow-sm backdrop-blur-md transition hover:border-ktf-blue/40 hover:bg-white hover:text-ktf-blue lg:flex";

  return (
    <div
      ref={stageRef}
      data-hero-phone-stage="carousel"
      data-hero-hydrated="false"
      data-hero-slide-index={active}
      className="ktf-hero-console relative mx-auto max-w-3xl"
      role="region"
      aria-roledescription="carousel"
      aria-label="Delivered projects"
    >
      <div
        ref={trackRef}
        onScroll={handleTrackScroll}
        onPointerDown={pauseAutoplay}
        onTouchStart={pauseAutoplay}
        onWheel={pauseAutoplay}
        className="flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, physicalIndex) => (
          <div
            key={`${slide.phone.slot}-${physicalIndex}`}
            role={slide.clone ? undefined : "group"}
            aria-hidden={slide.clone || undefined}
            inert={slide.clone || undefined}
            aria-roledescription={slide.clone ? undefined : "slide"}
            aria-label={slide.clone ? undefined : `${slide.logicalIndex + 1} of ${phones.length}`}
            className="flex w-full shrink-0 snap-center justify-center px-6 py-1"
          >
            <div className="flex flex-col items-center">
              <PhoneFrame
                href={slide.phone.href}
                label={slide.phone.label}
                className="w-[180px] sm:w-[210px] lg:w-[250px]"
              >
                <PhoneScreen
                  phone={slide.phone}
                  active={active === slide.logicalIndex}
                  revealScreenshot={
                    active === slide.logicalIndex && revealScreenshot
                  }
                />
              </PhoneFrame>
              <div className="mt-4 w-[min(300px,82vw)] rounded-lg border border-ktf-gray-200 bg-white/90 px-4 py-3 text-center shadow-sm lg:mt-6">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ktf-blue">{slide.phone.discipline}</p>
                <p className="mt-1 truncate text-xs font-semibold text-ktf-navy">{slide.phone.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {phones.length > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => step(-1, event)}
            aria-label="Previous project"
            className={cn(arrowClass, "left-0")}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={(event) => step(1, event)}
            aria-label="Next project"
            className={cn(arrowClass, "right-0")}
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      )}

      <div className="mt-5 flex justify-center gap-2">
        {phones.map((phone, index) => (
          <button
            key={phone.slot}
            type="button"
            onClick={(event) => goTo(index, event)}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={active === index ? "true" : undefined}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              active === index ? "w-6 bg-ktf-blue" : "w-1.5 bg-ktf-gray-300",
            )}
          />
        ))}
      </div>
    </div>
  );
}
