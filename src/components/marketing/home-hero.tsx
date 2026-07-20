import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { HeroHeadline } from "@/components/marketing/hero-headline";
import {
  HeroPhoneShowcase,
  type HeroPhone,
} from "@/components/marketing/hero-phone-showcase";
import { Reveal } from "@/components/marketing/motion-reveal";
import { PROJECTS } from "@/lib/constants";
import { listSiteAssetsSafe, type SiteAssetKey } from "@/features/admin/site-assets/repository";

const PROOF_POINTS = [
  { value: "16+", label: "Projects delivered" },
  { value: "3–4 wks", label: "Focused launch paths" },
  { value: "99%", label: "Client satisfaction" },
  { value: "You own it", label: "Code, docs, deployment" },
] as const;

/**
 * Baked-in fallback screens: real delivered Bespoke projects, captured at a
 * mobile viewport. The admin can replace any slot from Settings → Homepage
 * hero screenshots.
 */
const FALLBACK_SCREENS: Record<
  SiteAssetKey,
  { src: string; alt: string; projectId: string }
> = {
  "hero-phone-1": {
    src: "/hero/luminary.png",
    alt: "Luminary College — education platform delivered by Bespoke Technologies",
    projectId: "luminary-college",
  },
  "hero-phone-2": {
    src: "/hero/maxit.png",
    alt: "Maxit Autos — premium car rental platform delivered by Bespoke Technologies",
    projectId: "maxit-autos",
  },
  "hero-phone-3": {
    src: "/hero/downbelow.png",
    alt: "DownBelow Family Health Initiatives — health education platform delivered by Bespoke Technologies",
    projectId: "down-below",
  },
};

/**
 * Homepage hero — a compact two-line promise, then three real product phones
 * front and center. On desktop the side phones slide out into a fanned trio
 * by default; on mobile the trio rotates as a swipeable carousel. Each frame
 * links to the live project it shows. The supporting copy, CTAs, and proof
 * row sit under the devices.
 */
export async function HomeHero() {
  const assets = await listSiteAssetsSafe();

  const phones = (Object.keys(FALLBACK_SCREENS) as SiteAssetKey[]).map((slot) => {
    const fallback = FALLBACK_SCREENS[slot];
    const hasAsset = Boolean(assets[slot]);
    const project = PROJECTS.find((entry) => entry.id === fallback.projectId);
    return {
      slot,
      src: hasAsset ? `/api/site-assets/${slot}` : fallback.src,
      alt: fallback.alt,
      unoptimized: hasAsset,
      href: project?.liveUrl,
      label: project ? `View the live ${project.name} project` : undefined,
    } satisfies HeroPhone;
  }) as [HeroPhone, HeroPhone, HeroPhone];

  return (
    <section
      aria-labelledby="home-hero-title"
      className="relative overflow-hidden border-b border-ktf-gray-200 bg-white pt-8 pb-14 sm:pt-10 sm:pb-16 lg:pt-12"
    >
      {/* Engineered grid, faded before the fold */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(11,31,58,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,31,58,0.03) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(110% 70% at 50% 0%, black 0%, transparent 72%)",
          WebkitMaskImage: "radial-gradient(110% 70% at 50% 0%, black 0%, transparent 72%)",
        }}
      />
      {/* Soft headline glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,rgba(10,132,255,0.09),transparent_70%)]"
      />

      <Container size="lg" className="relative">
        <Reveal className="mx-auto max-w-2xl text-center">
          <HeroHeadline className="text-[1.8rem] font-bold leading-[1.12] tracking-[-0.03em] sm:text-[2.5rem] lg:text-[2.9rem]" />
        </Reveal>
      </Container>

      {/* Phone trio — fanned out on desktop, rotating carousel on mobile */}
      <Container size="xl" className="relative mt-8 sm:mt-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-4 h-[85%] w-[680px] max-w-[92vw] -translate-x-1/2 rounded-full bg-[conic-gradient(from_140deg_at_50%_45%,rgba(10,132,255,0.14),rgba(0,87,217,0.05),rgba(10,132,255,0.16),rgba(11,31,58,0.06),rgba(10,132,255,0.14))] blur-3xl"
        />
        <HeroPhoneShowcase phones={phones} />
      </Container>

      {/* Supporting copy, actions, and proof under the devices */}
      <Container size="lg" className="relative mt-10 sm:mt-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="mx-auto max-w-xl text-body leading-body text-ktf-gray-600 sm:text-body-lg">
            Designed, engineered, secured, and handed over — by one accountable
            team.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              href="/contact"
              className="w-full bg-ktf-blue-deep hover:bg-ktf-blue-pressed sm:w-auto"
            >
              Book a Product Scope Call
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              href="/projects"
              className="w-full border-ktf-gray-300 sm:w-auto"
            >
              See Relevant Work
            </Button>
          </div>

          <dl className="mx-auto mt-9 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-ktf-gray-200 pt-7">
            {PROOF_POINTS.map((point) => (
              <div key={point.label} className="text-center">
                <dt className="text-body font-bold leading-none text-ktf-navy">{point.value}</dt>
                <dd className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-ktf-gray-500">
                  {point.label}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Container>
    </section>
  );
}
