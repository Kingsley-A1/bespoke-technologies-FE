import {
  ArrowRight,
  Blocks,
  Boxes,
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

const visualContent = {
  services: {
    title: "One integrated delivery system",
    detail: "Product · Design · Engineering · Operations",
    icons: [PenTool, Blocks, ShieldCheck],
  },
  projects: {
    title: "From brief to live product",
    detail: "Selected work across customer and business systems",
    icons: [Layers3, FileCode2, Rocket],
  },
  about: {
    title: "Principles translated into systems",
    detail: "Judgment · Craft · Accountability",
    icons: [CircleDot, GitBranch, CheckCircle2],
  },
  partnerships: {
    title: "Create more value together",
    detail: "Referral · Co-development · Technology",
    icons: [UsersRound, Network, Sparkles],
  },
  reviews: {
    title: "Proof through client experience",
    detail: "Product quality · Delivery · Partnership",
    icons: [MessageSquareText, CheckCircle2, Sparkles],
  },
  contact: {
    title: "Your clearest path forward",
    detail: "Brief · Discovery · Scope · Build",
    icons: [MessageSquareText, GitBranch, Rocket],
  },
} as const;

function PageHeroVisual({ variant }: { variant: PageHeroVariant }) {
  const visual = visualContent[variant];

  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div
        aria-hidden="true"
        className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_45%_45%,rgba(10,132,255,0.16),transparent_44%),radial-gradient(circle_at_86%_8%,rgba(155,126,255,0.16),transparent_34%)] blur-2xl"
      />
      <div className="overflow-hidden rounded-[1.4rem] border border-ktf-gray-200 bg-white shadow-[0_26px_70px_-52px_rgba(11,31,58,0.5)]">
        <div className="flex items-center justify-between border-b border-ktf-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-ktf-gray-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-ktf-gray-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-ktf-blue/55" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ktf-gray-500">
            Bespoke system
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-h5 font-bold text-ktf-navy">{visual.title}</p>
              <p className="mt-2 text-caption leading-relaxed text-ktf-gray-600">
                {visual.detail}
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ktf-blue-deep text-white">
              <Boxes className="h-5 w-5" />
            </span>
          </div>

          <div className="relative mt-7 grid grid-cols-3 gap-3">
            <span
              aria-hidden="true"
              className="absolute top-5 right-[16%] left-[16%] h-px bg-ktf-blue/25"
            />
            {visual.icons.map((Icon, index) => (
              <div
                key={`${variant}-${index}`}
                className="relative flex min-w-0 flex-col items-center rounded-xl border border-ktf-gray-200 bg-ktf-surface px-2 py-4 text-center"
              >
                <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-ktf-blue/20 bg-white text-ktf-blue-deep">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-ktf-gray-600">
                  Stage {index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-ktf-gray-200 bg-ktf-surface px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ktf-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Production-minded
          </span>
          <ArrowRight className="h-4 w-4 text-ktf-blue-deep" />
        </div>
      </div>
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
    <section className="relative overflow-hidden border-b border-ktf-gray-200 bg-white py-16 sm:py-20 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(10,132,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,31,58,0.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
        }}
      />

      <Container size="lg" className="relative">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.8fr)] lg:items-center lg:gap-16">
          <Reveal>
            <p className="text-overline font-bold uppercase tracking-[0.2em] text-ktf-blue-deep">
              {label}
            </p>
            <h1 className="mt-5 max-w-3xl text-[2.45rem] font-bold leading-[1.08] tracking-[-0.04em] text-ktf-navy sm:text-h1 lg:text-[3.55rem]">
              {title}
            </h1>
            <p className="mt-6 max-w-2xl text-body-lg leading-body text-ktf-gray-600">
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
