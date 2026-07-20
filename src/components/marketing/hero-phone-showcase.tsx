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
    "z-0 mt-8 w-[195px] transition-transform duration-700 ease-out motion-reduce:transition-none";

  return (
    <>
      {/* Desktop — lead device centered, side devices fanned out by default */}
      <div className="ktf-hero-console group relative hidden items-start justify-center lg:flex">
        <PhoneFrame
          href={phones[0].href}
          label={phones[0].label}
          className={cn(
            sidePhoneBase,
            "-mr-[7.25rem]",
            fanned
              ? "-translate-x-16 -rotate-6 group-hover:-translate-x-20"
              : "translate-x-0 rotate-0",
          )}
        >
          <PhoneScreen phone={phones[0]} />
        </PhoneFrame>
        <PhoneFrame href={phones[1].href} label={phones[1].label} className="z-10 w-[235px]">
          <PhoneScreen phone={phones[1]} />
        </PhoneFrame>
        <PhoneFrame
          href={phones[2].href}
          label={phones[2].label}
          className={cn(
            sidePhoneBase,
            "-ml-[7.25rem]",
            fanned
              ? "translate-x-16 rotate-6 group-hover:translate-x-20"
              : "translate-x-0 rotate-0",
          )}
        >
          <PhoneScreen phone={phones[2]} />
        </PhoneFrame>
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
              <PhoneFrame href={phone.href} label={phone.label} className="w-[180px] sm:w-[210px]">
                <PhoneScreen phone={phone} />
              </PhoneFrame>
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
