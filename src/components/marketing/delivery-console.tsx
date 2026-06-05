"use client";

import Image from "next/image";
import Link from "next/link";
import { BRAND_ICON_SRC } from "@/lib/constants";
import { cn } from "@/lib/utils";

const HEX_R = 24;
const HEX_CX = 90;
const HEX_CY = 86;
const HEX_D = HEX_R * Math.sqrt(3);
const NEIGHBOR_ANGLES = [30, 90, 150, 210, 270, 330];

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i);
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

const CENTER_HEX = hexPoints(HEX_CX, HEX_CY, HEX_R);

const CAPABILITIES = [
  { label: "Web", accent: false },
  { label: "Apps", accent: false },
  { label: "SaaS", accent: true },
  { label: "AI", accent: true },
  { label: "Cloud", accent: false },
  { label: "UX", accent: false },
] as const;

const OUTER_HEXES = NEIGHBOR_ANGLES.map((deg, i) => {
  const a = (deg * Math.PI) / 180;
  const cx = HEX_CX + HEX_D * Math.cos(a);
  const cy = HEX_CY + HEX_D * Math.sin(a);
  return { points: hexPoints(cx, cy, HEX_R), cx, cy, ...CAPABILITIES[i] };
});

const METRICS = [
  { value: 14, suffix: "+", label: "Projects delivered" },
  { value: 99, suffix: "%", label: "Client satisfaction" },
  { value: 2, suffix: "+", label: "Years delivering" },
] as const;

const PHASES = [
  { label: "Strategy", detail: "Scope" },
  { label: "UX", detail: "Prototype" },
  { label: "Build", detail: "System" },
  { label: "Launch", detail: "Release" },
  { label: "Handover", detail: "Own it" },
] as const;

const CONSOLE_FLOW = [
  { label: "Value", href: "#home-hero-title" },
  { label: "System", href: "#delivery-console" },
  { label: "Plan", href: "#delivery-timeline" },
  { label: "CTA", href: "/contact" },
] as const;

function Metric({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-ktf-gray-200 bg-white px-3 py-2">
      <p className="text-h5 font-bold leading-none text-ktf-navy tabular-nums">
        {value}
        <span className="text-ktf-blue-deep">{suffix}</span>
      </p>
      <p className="mt-1 text-[11px] leading-tight text-ktf-gray-500">
        {label}
      </p>
    </div>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={cn("h-3.5 w-3.5 shrink-0", className)}
    >
      <path
        fill="currentColor"
        d="M8.9 3.2 13.6 8l-4.7 4.8-1.1-1.1 2.7-2.8H2.4V7.1h8.1L7.8 4.3z"
      />
    </svg>
  );
}

export function DeliveryConsole({
  className,
  id = "delivery-console",
}: {
  className?: string;
  id?: string;
}) {
  return (
    <aside
      id={id}
      aria-label="Bespoke delivery console"
      className={cn(
        "w-full max-w-full overflow-hidden rounded-xl border border-ktf-gray-200 bg-white shadow-[0_18px_48px_-38px_rgba(11,31,58,0.42)]",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-ktf-gray-200 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ktf-blue/15 bg-white shadow-xs">
            <Image
              src={BRAND_ICON_SRC}
              alt="Bespoke Technologies logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-body-sm font-semibold text-ktf-navy">
              Bespoke Delivery Console
            </p>
            <p className="truncate text-caption text-ktf-gray-500">
              Proof, process, launch path
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-ktf-success/30 bg-ktf-success/10 px-2.5 py-1 text-caption font-semibold text-ktf-success">
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-ktf-success"
          />
          Live Ops
        </span>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <nav
          aria-label="Delivery console flow"
          className="rounded-xl border border-ktf-blue/15 bg-ktf-blue/5 p-2"
        >
          <ol className="flex flex-wrap items-center gap-1">
            {CONSOLE_FLOW.map((item, index) => {
              const classes =
                "inline-flex items-center rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ktf-blue-deep transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue sm:px-2.5 sm:text-[11px]";

              return (
                <li
                  key={item.href}
                  className="inline-flex items-center gap-1 text-ktf-blue-deep"
                >
                  {index > 0 && <ArrowIcon className="opacity-70" />}
                  {item.href.startsWith("/") ? (
                    <Link href={item.href} className={classes}>
                      {item.label}
                    </Link>
                  ) : (
                    <a href={item.href} className={classes}>
                      {item.label}
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="rounded-xl border border-ktf-gray-200 bg-ktf-surface p-3 sm:p-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <svg
              viewBox="0 0 180 172"
              role="img"
              aria-label="Bespoke Technologies build engine for web, apps, SaaS, AI, cloud, and UX"
              className="h-auto w-[104px] shrink-0 sm:w-[140px]"
            >
              {OUTER_HEXES.map((h, i) => (
                <g key={h.label}>
                  <polygon
                    points={h.points}
                    strokeWidth={1.25}
                    className={cn(
                      "fill-white",
                      h.accent ? "stroke-ktf-blue/55" : "stroke-ktf-gray-300",
                    )}
                  />
                  <polygon
                    points={h.points}
                    className="ktf-hex-pulse fill-ktf-blue"
                    style={{ animationDelay: `${i * 0.5}s` }}
                  />
                  <text
                    x={h.cx}
                    y={h.cy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className={cn(
                      "text-[10px] font-semibold",
                      h.accent ? "fill-ktf-blue-deep" : "fill-ktf-navy",
                    )}
                  >
                    {h.label}
                  </text>
                </g>
              ))}
              <polygon
                points={CENTER_HEX}
                strokeWidth={1.35}
                className="fill-white stroke-ktf-blue-deep"
              />
              <image
                href={BRAND_ICON_SRC}
                x={HEX_CX - 15}
                y={HEX_CY - 15}
                width="30"
                height="30"
                preserveAspectRatio="xMidYMid meet"
              />
            </svg>

            <div className="grid min-w-0 flex-1 grid-cols-1 gap-2">
              {METRICS.map((metric) => (
                <Metric key={metric.label} {...metric} />
              ))}
            </div>
          </div>
        </div>

        <div
          id="delivery-timeline"
          className="rounded-xl border border-ktf-gray-200 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-caption font-bold uppercase tracking-widest text-ktf-gray-500">
              Delivery timeline
            </p>
            <span className="rounded-full bg-ktf-blue/10 px-2 py-0.5 text-caption font-semibold text-ktf-blue-deep">
              Sprint map
            </span>
          </div>
          <ol className="mt-3 flex items-start">
            {PHASES.map((phase, i) => (
              <li
                key={phase.label}
                className="relative flex flex-1 flex-col items-center text-center"
              >
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute right-1/2 top-2 h-px w-full bg-ktf-blue/30"
                  />
                )}
                <span className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full border border-ktf-blue/40 bg-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-ktf-blue-deep" />
                </span>
                <span className="mt-1.5 text-[11px] font-semibold leading-tight text-ktf-navy">
                  {phase.label}
                </span>
                <span className="mt-0.5 text-[10px] leading-tight text-ktf-gray-500">
                  {phase.detail}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </aside>
  );
}
