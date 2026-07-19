import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  CircleDot,
  FileCode2,
  GitBranch,
  Layers3,
  MessageSquareText,
  Network,
  PenTool,
  Rocket,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/marketing/motion-reveal";
import { BrowserFrame } from "@/components/marketing/browser-frame";

export type PageHeroVariant =
  | "services"
  | "projects"
  | "about"
  | "partnerships"
  | "reviews"
  | "contact";

interface PageHeroProps {
  label: string;
  title: string;
  description: string;
  variant: PageHeroVariant;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}

interface VisualFacet {
  icon: LucideIcon;
  label: string;
  detail: string;
}

const visualContent: Record<
  PageHeroVariant,
  { eyebrow: string; title: string; facets: [VisualFacet, VisualFacet, VisualFacet] }
> = {
  services: {
    eyebrow: "Delivery system",
    title: "One integrated team",
    facets: [
      { icon: PenTool, label: "Product & design", detail: "Strategy, UX, and interface" },
      { icon: Blocks, label: "Engineering", detail: "Production-grade build" },
      { icon: ShieldCheck, label: "Security & launch", detail: "Tested and deployed" },
    ],
  },
  projects: {
    eyebrow: "Selected work",
    title: "From brief to live product",
    facets: [
      { icon: Layers3, label: "Discovery", detail: "Scope and validation" },
      { icon: FileCode2, label: "Build", detail: "Customer and business systems" },
      { icon: Rocket, label: "Launch", detail: "Shipped and owned" },
    ],
  },
  about: {
    eyebrow: "How we work",
    title: "Principles into systems",
    facets: [
      { icon: CircleDot, label: "Judgment", detail: "The right call, not the easy one" },
      { icon: GitBranch, label: "Craft", detail: "Considered, durable engineering" },
      { icon: CheckCircle2, label: "Accountability", detail: "We own the outcome" },
    ],
  },
  partnerships: {
    eyebrow: "Ways to partner",
    title: "More value together",
    facets: [
      { icon: UsersRound, label: "Referral", detail: "Introduce and earn" },
      { icon: Network, label: "Co-development", detail: "Build alongside us" },
      { icon: Sparkles, label: "Technology", detail: "Integrate and extend" },
    ],
  },
  reviews: {
    eyebrow: "Client experience",
    title: "Proof through the work",
    facets: [
      { icon: MessageSquareText, label: "Product quality", detail: "Built to a standard" },
      { icon: CheckCircle2, label: "Delivery", detail: "On scope, on time" },
      { icon: Sparkles, label: "Partnership", detail: "Beyond one release" },
    ],
  },
  contact: {
    eyebrow: "Your path forward",
    title: "A clear way to start",
    facets: [
      { icon: MessageSquareText, label: "Brief", detail: "Tell us the goal" },
      { icon: GitBranch, label: "Discovery", detail: "Scope and shape the build" },
      { icon: Rocket, label: "Build", detail: "Ship a product you own" },
    ],
  },
};

function PageHeroVisual({ variant }: { variant: PageHeroVariant }) {
  const visual = visualContent[variant];

  return (
    <div className="relative mx-auto w-full max-w-[440px]">
      {/* Gradient stage — same language as the homepage hero, smaller dose. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-8 rounded-full bg-[conic-gradient(from_150deg_at_50%_45%,rgba(10,132,255,0.12),rgba(0,87,217,0.04),rgba(10,132,255,0.13),rgba(11,31,58,0.05),rgba(10,132,255,0.12))] blur-2xl"
      />
      <BrowserFrame className="relative">
        <div className="bg-white p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ktf-blue-deep">
              {visual.eyebrow}
            </p>
            <span
              aria-hidden="true"
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-ktf-gray-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-ktf-success" />
              Live
            </span>
          </div>
          <p className="mt-2 text-h5 font-bold tracking-[-0.02em] text-ktf-navy">
            {visual.title}
          </p>

          <ol className="mt-6 divide-y divide-ktf-gray-100 border-t border-ktf-gray-100">
            {visual.facets.map((facet, index) => (
              <li key={facet.label} className="flex items-start gap-3.5 py-3.5">
                <span
                  aria-hidden="true"
                  className="mt-1 font-mono text-[10px] font-semibold tracking-[0.08em] text-ktf-gray-400"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-ktf-blue/15 bg-ktf-surface text-ktf-blue-deep">
                  <facet.icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-body-sm font-semibold text-ktf-navy">
                    {facet.label}
                  </span>
                  <span className="block text-caption text-ktf-gray-500">
                    {facet.detail}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-5 flex items-center gap-1.5 border-t border-ktf-gray-100 pt-4 text-[11px] font-semibold text-ktf-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Production-minded delivery
          </div>
        </div>
      </BrowserFrame>
    </div>
  );
}

export function PageHero({
  label,
  title,
  description,
  variant,
  primaryAction,
  secondaryAction,
}: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-ktf-gray-200 bg-white py-8 sm:py-10 lg:py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(11,31,58,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,31,58,0.03) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(120% 90% at 85% 0%, black 0%, transparent 62%)",
          WebkitMaskImage:
            "radial-gradient(120% 90% at 85% 0%, black 0%, transparent 62%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(10,132,255,0.08),transparent_60%)]"
      />

      <Container size="lg" className="relative">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.8fr)] lg:items-center lg:gap-16">
          <Reveal>
            <p className="inline-flex items-center gap-2 text-overline font-bold uppercase tracking-[0.2em] text-ktf-blue-deep">
              <span className="h-px w-6 bg-ktf-blue-deep/40" aria-hidden="true" />
              {label}
            </p>
            <h1 className="mt-4 max-w-3xl text-[2.45rem] font-bold leading-[1.06] tracking-[-0.04em] text-ktf-navy sm:text-h1 lg:text-[3.55rem]">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-body-lg leading-body text-ktf-gray-600">
              {description}
            </p>

            {primaryAction || secondaryAction ? (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {primaryAction ? (
                  <Button
                    size="lg"
                    href={primaryAction.href}
                    className="w-full bg-ktf-blue-deep hover:bg-ktf-blue-pressed sm:w-auto"
                  >
                    {primaryAction.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : null}
                {secondaryAction ? (
                  <Button
                    variant="outline"
                    size="lg"
                    href={secondaryAction.href}
                    className="w-full sm:w-auto"
                  >
                    {secondaryAction.label}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </Reveal>

          <Reveal delay={0.08}>
            <PageHeroVisual variant={variant} />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
