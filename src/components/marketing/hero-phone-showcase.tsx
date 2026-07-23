"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
  /** Visible project identity beneath the device. */
  name: string;
  discipline: string;
}

interface HeroPhoneShowcaseProps {
  /** Exactly three phones; the second one is the lead device on desktop. */
  phones: readonly [HeroPhone, HeroPhone, HeroPhone];
}

const ROTATE_INTERVAL_MS = 3000;
/** How long autoplay stays paused after the user touches the carousel. */
const INTERACTION_GRACE_MS = 6000;

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

/**
 * The hero's three delivered-project phones.
 *
 * Desktop: the side devices start tucked behind the lead phone and slide out
 * into a fanned, fully readable trio shortly after load — no hover required.
 * Mobile: a swipeable, snap-aligned carousel that rotates to the next phone
 * every 3 seconds, pausing while the user interacts and honoring
 * reduced-motion preferences. Every frame links to its live project.
 */
export function HeroPhoneShowcase({ phones }: HeroPhoneShowcaseProps) {
  const [fanned, setFanned] = useState(false);
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const lastInteractionRef = useRef(Number.NEGATIVE_INFINITY);

  // Desktop: fan the side phones out deliberately once the hero has settled.
  useEffect(() => {
    const id = window.setTimeout(() => setFanned(true), 450);
    return () => window.clearTimeout(id);
  }, []);

  // Mobile: rotate to the next phone every 3 seconds.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      const track = trackRef.current;
      if (!track || document.hidden) return;
      const width = track.clientWidth;
      // Width is 0 when the carousel is display:none on desktop.
      if (width === 0) return;
      if (performance.now() - lastInteractionRef.current < INTERACTION_GRACE_MS) return;
      const next = (Math.round(track.scrollLeft / width) + 1) % phones.length;
      track.scrollTo({ left: next * width, behavior: "smooth" });
    }, ROTATE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [phones.length]);

  function pauseAutoplay(event: { timeStamp: number }) {
    lastInteractionRef.current = event.timeStamp;
  }

  function handleTrackScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  }

  function goTo(index: number, event: { timeStamp: number }) {
    const track = trackRef.current;
    if (!track) return;
    pauseAutoplay(event);
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
  }

  const sidePhoneBase =
    "z-0 mt-9 w-[202px] transition-transform duration-700 ease-out motion-reduce:transition-none";

  const desktopPositions = [
    "left-[7%] top-[38%]",
    "left-1/2 top-[22%] -translate-x-1/2",
    "right-[7%] top-[38%]",
  ] as const;

  return (
    <>
      {/* Desktop — lead device centered, side devices fanned out by default */}
      <div
        data-hero-phone-stage="desktop"
        className="ktf-hero-console group relative hidden min-h-[650px] items-start justify-center pt-14 lg:flex"
      >
        <div aria-hidden="true" className="absolute inset-x-[11%] top-[52%] h-px bg-gradient-to-r from-transparent via-ktf-blue/35 to-transparent" />
        {desktopPositions.map((position) => (
          <span key={position} aria-hidden="true" className={cn("absolute h-2.5 w-2.5 rounded-full border-2 border-white bg-ktf-blue shadow-[0_0_0_4px_rgba(10,132,255,0.12)]", position)} />
        ))}
        <PhoneFrame
          href={phones[0].href}
          label={phones[0].label}
          className={cn(
            sidePhoneBase,
            "-mr-[7rem]",
            fanned
              ? "-translate-x-20 -rotate-[7deg] group-hover:-translate-x-24 group-hover:-rotate-[8deg]"
              : "translate-x-0 rotate-0",
          )}
        >
          <PhoneScreen phone={phones[0]} />
        </PhoneFrame>
        <PhoneFrame href={phones[1].href} label={phones[1].label} className="z-10 w-[242px] transition-transform duration-500 group-hover:-translate-y-2 motion-reduce:transition-none">
          <PhoneScreen phone={phones[1]} />
        </PhoneFrame>
        <PhoneFrame
          href={phones[2].href}
          label={phones[2].label}
          className={cn(
            sidePhoneBase,
            "-ml-[7rem]",
            fanned
              ? "translate-x-20 rotate-[7deg] group-hover:translate-x-24 group-hover:rotate-[8deg]"
              : "translate-x-0 rotate-0",
          )}
        >
          <PhoneScreen phone={phones[2]} />
        </PhoneFrame>
        <div className="absolute inset-x-0 bottom-0 grid grid-cols-3 gap-4">
          {phones.map((phone, index) => (
            <a key={phone.slot} href={phone.href} target="_blank" rel="noreferrer" className="mx-auto w-full max-w-[245px] rounded-lg border border-ktf-gray-200/90 bg-white/90 px-4 py-3 text-left shadow-sm backdrop-blur transition hover:border-ktf-blue/30 hover:shadow-card-hover">
              <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.14em] text-ktf-blue"><span className="font-mono text-ktf-gray-400">0{index + 1}</span>{phone.discipline}</span>
              <span className="mt-1.5 block truncate text-xs font-semibold text-ktf-navy">{phone.name}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Mobile — swipeable carousel, one device in full view at a time */}
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
          {phones.map((phone, index) => (
            <div
              key={phone.slot}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${phones.length}`}
              className="flex w-full shrink-0 snap-center justify-center px-6 py-1"
            >
              <div className="flex flex-col items-center">
                <PhoneFrame href={phone.href} label={phone.label} className="w-[180px] sm:w-[210px]"><PhoneScreen phone={phone} /></PhoneFrame>
                <div className="mt-4 w-[min(260px,82vw)] rounded-lg border border-ktf-gray-200 bg-white/90 px-4 py-3 text-center shadow-sm">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ktf-blue">{phone.discipline}</p>
                  <p className="mt-1 truncate text-xs font-semibold text-ktf-navy">{phone.name}</p>
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
