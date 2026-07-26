"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
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
  /** Project mark shown first on mobile. Defaults to `src`. */
  logoSrc?: string;
  logoUnoptimized?: boolean;
  /** Optional portrait product surface revealed inside the mobile device. */
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

export const MOBILE_SCREEN_REVEAL_DELAY_MS = 1300;
export const MOBILE_SCREEN_REVEAL_DURATION_MS = 700;
export const MOBILE_ROTATE_INTERVAL_MS = 4500;
const DESKTOP_ROTATE_INTERVAL_MS = 5000;
/** How long autoplay stays paused after the user touches the carousel. */
const INTERACTION_GRACE_MS = 6000;

export function circularWindow<T>(items: readonly T[], offset: number, size: number) {
  if (items.length === 0 || size <= 0) return [];
  return Array.from(
    { length: size },
    (_, index) => items[(offset + index) % items.length],
  );
}

export function logicalMobileIndex(physicalIndex: number, itemCount: number) {
  if (itemCount <= 0) return 0;
  return (physicalIndex - 1 + itemCount) % itemCount;
}

function PhoneScreen({ phone }: { phone: HeroPhone }) {
  return (
    <Image
      src={phone.src}
      alt={phone.href ? "" : phone.alt}
      fill
      sizes="(min-width: 1024px) 240px, 220px"
      unoptimized={phone.unoptimized}
      className="object-cover object-top"
    />
  );
}

function MobilePhoneScreen({
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
        sizes="(max-width: 639px) 180px, 210px"
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
            transitionDuration: `${MOBILE_SCREEN_REVEAL_DURATION_MS}ms`,
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <Image
            src={phone.screenshotSrc!}
            alt=""
            fill
            sizes="(max-width: 639px) 180px, 210px"
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
 * Desktop always renders a circular window of three screens and advances that
 * window every five seconds. Mobile uses cloned boundary slides so swiping and
 * autoplay can continue from the final project back to the first without a
 * visible dead end.
 */
export function HeroPhoneShowcase({ phones }: HeroPhoneShowcaseProps) {
  const [fanned, setFanned] = useState(false);
  const [desktopOffset, setDesktopOffset] = useState(0);
  const [desktopCycle, setDesktopCycle] = useState(0);
  const [active, setActive] = useState(0);
  const [revealMobileScreenshot, setRevealMobileScreenshot] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const lastInteractionRef = useRef(Number.NEGATIVE_INFINITY);
  const settleTimerRef = useRef<number | undefined>(undefined);

  const desktopPhones = useMemo(
    () => circularWindow(phones, desktopOffset, 3),
    [desktopOffset, phones],
  );
  const mobileSlides = useMemo(() => {
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
      () => setRevealMobileScreenshot(true),
      MOBILE_SCREEN_REVEAL_DELAY_MS,
    );
    return () => window.clearTimeout(id);
  }, [active, phones]);

  // Fan the current desktop trio after each circular-window change.
  useEffect(() => {
    const id = window.setTimeout(
      () => setFanned(true),
      desktopCycle === 0 ? 450 : 100,
    );
    return () => window.clearTimeout(id);
  }, [desktopCycle]);

  useEffect(() => {
    if (phones.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      setFanned(false);
      setDesktopOffset((current) => (current + 3) % phones.length);
      setDesktopCycle((current) => current + 1);
    }, DESKTOP_ROTATE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [phones.length]);

  // Keep the first real mobile slide in view, including after viewport changes.
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

  // Mobile autoplay walks onto a cloned edge, then the scroll-settle handler
  // silently repositions it to the equivalent real slide.
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
    }, MOBILE_ROTATE_INTERVAL_MS);

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
        ? logicalMobileIndex(physicalIndex, phones.length)
        : 0;
    if (activeRef.current !== logicalIndex) {
      activeRef.current = logicalIndex;
      setRevealMobileScreenshot(false);
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

  const sidePhoneBase =
    "z-0 mt-9 w-[202px] transition-transform duration-700 ease-out motion-reduce:transition-none";

  const desktopPositions = [
    "left-[7%] top-[38%]",
    "left-1/2 top-[22%] -translate-x-1/2",
    "right-[7%] top-[38%]",
  ] as const;

  if (phones.length === 0) return null;

  return (
    <>
      {/* Desktop — always three devices, sourced from a circular project window. */}
      <div
        ref={stageRef}
        data-hero-phone-stage="desktop"
        data-hero-desktop-cycle={desktopCycle}
        data-hero-hydrated="false"
        className="ktf-hero-console group relative hidden min-h-[650px] items-start justify-center pt-14 lg:flex"
      >
        <div aria-hidden="true" className="absolute inset-x-[11%] top-[52%] h-px bg-gradient-to-r from-transparent via-ktf-blue/35 to-transparent" />
        {desktopPositions.map((position) => (
          <span key={position} aria-hidden="true" className={cn("absolute h-2.5 w-2.5 rounded-full border-2 border-white bg-ktf-blue shadow-[0_0_0_4px_rgba(10,132,255,0.12)]", position)} />
        ))}
        <PhoneFrame
          key={`${desktopCycle}-${desktopPhones[0].slot}-left`}
          href={desktopPhones[0].href}
          label={desktopPhones[0].label}
          className={cn(
            sidePhoneBase,
            "-mr-[7rem] animate-fade-in",
            fanned
              ? "-translate-x-20 -rotate-[7deg] group-hover:-translate-x-24 group-hover:-rotate-[8deg]"
              : "translate-x-0 rotate-0",
          )}
        >
          <PhoneScreen phone={desktopPhones[0]} />
        </PhoneFrame>
        <PhoneFrame
          key={`${desktopCycle}-${desktopPhones[1].slot}-center`}
          href={desktopPhones[1].href}
          label={desktopPhones[1].label}
          className="z-10 w-[242px] animate-fade-in transition-transform duration-500 group-hover:-translate-y-2 motion-reduce:transition-none"
        >
          <PhoneScreen phone={desktopPhones[1]} />
        </PhoneFrame>
        <PhoneFrame
          key={`${desktopCycle}-${desktopPhones[2].slot}-right`}
          href={desktopPhones[2].href}
          label={desktopPhones[2].label}
          className={cn(
            sidePhoneBase,
            "-ml-[7rem] animate-fade-in",
            fanned
              ? "translate-x-20 rotate-[7deg] group-hover:translate-x-24 group-hover:rotate-[8deg]"
              : "translate-x-0 rotate-0",
          )}
        >
          <PhoneScreen phone={desktopPhones[2]} />
        </PhoneFrame>
        <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-4">
          {desktopPhones.map((phone, index) => (
            <a key={`${desktopCycle}-${phone.slot}-${index}`} href={phone.href} target="_blank" rel="noreferrer" className="mx-auto w-full max-w-[245px] animate-fade-in rounded-lg border border-ktf-gray-200/90 bg-white/90 px-4 py-3 text-left shadow-sm backdrop-blur transition hover:border-ktf-blue/30 hover:shadow-card-hover">
              <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-ktf-blue"><span className="font-mono text-ktf-gray-400">0{index + 1}</span>{phone.discipline}</span>
              <span className="mt-1.5 block truncate text-xs font-semibold text-ktf-navy">{phone.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Mobile — cloned edge slides make manual and automatic swiping circular. */}
      <div
        className="ktf-hero-console relative lg:hidden"
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
          {mobileSlides.map((slide, physicalIndex) => (
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
                  className="w-[180px] sm:w-[210px]"
                >
                  <MobilePhoneScreen
                    phone={slide.phone}
                    active={active === slide.logicalIndex}
                    revealScreenshot={
                      active === slide.logicalIndex
                      && revealMobileScreenshot
                    }
                  />
                </PhoneFrame>
                <div className="mt-4 w-[min(260px,82vw)] rounded-lg border border-ktf-gray-200 bg-white/90 px-4 py-3 text-center shadow-sm">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ktf-blue">{slide.phone.discipline}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-ktf-navy">{slide.phone.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

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
    </>
  );
}
