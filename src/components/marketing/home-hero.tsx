import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { HeroHeadline } from "@/components/marketing/hero-headline";
import {
  HeroPhoneShowcase,
  type HeroPhone,
} from "@/components/marketing/hero-phone-showcase";
import { Reveal } from "@/components/marketing/motion-reveal";
import { listPublishedPortfolioProjectsSafe } from "@/features/admin/portfolio/repository";
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
  { src: string; alt: string; projectId: string; discipline: string }
> = {
  "hero-phone-1": {
    src: "/hero/luminary.png",
    alt: "Luminary College — education platform delivered by Bespoke Technologies",
    projectId: "luminary-college",
    discipline: "Education platform",
  },
  "hero-phone-2": {
    src: "/hero/maxit.png",
    alt: "Maxit Autos — premium car rental platform delivered by Bespoke Technologies",
    projectId: "maxit-autos",
    discipline: "Mobility experience",
  },
  "hero-phone-3": {
    src: "/hero/downbelow.png",
    alt: "DownBelow Family Health Initiatives — health education platform delivered by Bespoke Technologies",
    projectId: "down-below",
    discipline: "Health platform",
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
  const [assets, projects] = await Promise.all([
    listSiteAssetsSafe(),
    listPublishedPortfolioProjectsSafe(),
  ]);

  const phones = (Object.keys(FALLBACK_SCREENS) as SiteAssetKey[]).map((slot) => {
    const fallback = FALLBACK_SCREENS[slot];
    const hasAsset = Boolean(assets[slot]);
    const project = projects.find((entry) => entry.id === fallback.projectId);
    return {
      slot,
      src: hasAsset ? `/api/site-assets/${slot}` : fallback.src,
      alt: fallback.alt,
      unoptimized: hasAsset,
      href: project?.liveUrl,
      label: project ? `View the live ${project.name} project` : undefined,
      name: project?.name ?? fallback.discipline,
      discipline: fallback.discipline,
    } satisfies HeroPhone;
  }) as [HeroPhone, HeroPhone, HeroPhone];

  return (
    <section
      aria-labelledby="home-hero-title"
      className="relative overflow-hidden border-b border-ktf-gray-200 bg-ktf-surface pt-8 pb-14 sm:pt-10 sm:pb-16 lg:pt-14"
    >
      {/* Base wash — a whisper of cool tone so the stage never reads as flat white */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fb_60%,#eef2f8_100%)]"
      />
      {/* Engineered grid, denser and drawn through the device stage */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(11,31,58,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,31,58,0.045) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(120% 78% at 50% 34%, black 0%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(120% 78% at 50% 34%, black 0%, transparent 78%)",
        }}
      />
      {/* Soft headline glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,rgba(10,132,255,0.10),transparent_70%)]"
      />

      <Container size="lg" className="relative">
        <Reveal className="mx-auto max-w-2xl text-center">
          <HeroHeadline className="text-[1.25rem] font-bold leading-[1.2] tracking-[-0.03em] sm:text-[2.5rem] lg:text-[2.9rem]" />
        </Reveal>
      </Container>

      {/* Phone trio — fanned out on desktop, rotating carousel on mobile */}
      <Container size="xl" className="relative mt-8 sm:mt-10">
        {/* Ambient stage behind the devices — depth and grounding without noise */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {/* Cool spotlight pooling behind the trio */}
          <div className="absolute left-1/2 top-1 h-[80%] w-[640px] max-w-[94vw] -translate-x-1/2 rounded-full bg-[radial-gradient(58%_58%_at_50%_44%,rgba(10,132,255,0.20),rgba(0,87,217,0.06)_52%,transparent_74%)] blur-2xl" />
          {/* Blueprint rings — quiet engineering motif */}
          <div className="absolute left-1/2 top-[46%] h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ktf-blue/[0.09] sm:h-[380px] sm:w-[380px] lg:h-[460px] lg:w-[460px]" />
          <div className="absolute left-1/2 top-[46%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ktf-blue/[0.06] sm:h-[520px] sm:w-[520px] lg:h-[620px] lg:w-[620px]" />
          {/* Grounding reflection beneath the devices */}
          <div className="absolute bottom-2 left-1/2 h-10 w-[64%] max-w-[540px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(11,31,58,0.18),transparent)] blur-md" />
        </div>
        <div className="pointer-events-none absolute left-1/2 top-8 hidden w-[min(860px,88vw)] -translate-x-1/2 items-center justify-between lg:flex" aria-hidden="true">
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-ktf-gray-400">Brief</span>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-ktf-blue/25 to-ktf-blue/50" />
          <span className="mx-3 flex h-7 w-7 items-center justify-center rounded-full border border-ktf-blue/25 bg-white/80 text-[9px] font-bold text-ktf-blue shadow-sm">BT</span>
          <span className="h-px flex-1 bg-gradient-to-r from-ktf-blue/50 via-ktf-blue/25 to-transparent" />
          <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-ktf-gray-400">Live</span>
        </div>
        <HeroPhoneShowcase phones={phones} />
      </Container>

      {/* Supporting copy, actions, and proof under the devices */}
      <Container size="lg" className="relative mt-9 sm:mt-11">
        <div data-home-hero-support="true">
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
              Contact Us
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
        </div>
      </Container>
    </section>
  );
}
