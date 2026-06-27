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
    <div className="mx-auto w-full max-w-[460px]">
      <div className="rounded-xl border border-ktf-gray-200 bg-white p-6 sm:p-7">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ktf-blue-deep text-white">
            <Boxes className="h-5 w-5" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ktf-gray-500">
            Bespoke system
          </span>
        </div>

        <p className="mt-5 text-h5 font-bold text-ktf-navy">{visual.title}</p>
        <p className="mt-2 text-body-sm leading-body text-ktf-gray-600">
          {visual.detail}
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {visual.icons.map((Icon, index) => (
            <div
              key={`${variant}-${index}`}
              className="flex min-w-0 flex-col items-center gap-2.5 rounded-md border border-ktf-gray-200 bg-ktf-surface px-2 py-4 text-center"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md border border-ktf-blue/15 bg-white text-ktf-blue-deep">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ktf-gray-600">
                Stage {index + 1}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-1.5 border-t border-ktf-gray-100 pt-4 text-[11px] font-semibold text-ktf-success">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Production-minded delivery
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
