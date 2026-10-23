import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./motion-reveal";

/**
 * Two-tone section heading: a short claim in full ink followed by a muted
 * explanation, in a single <h2>. One readable sentence replaces the
 * eyebrow + heading + paragraph stack, so sections stay calm and scannable.
 */
export function SectionHeading({
  id,
  title,
  lead,
  action,
  tone = "light",
  align = "left",
  className,
}: {
  id?: string;
  title: string;
  lead?: string;
  action?: ReactNode;
  tone?: "light" | "dark";
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-6",
        align === "center" ? "items-center text-center" : "lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <h2
        id={id}
        className={cn(
          "max-w-[46rem] text-[1.6rem] font-semibold leading-[1.18] tracking-[-0.035em] sm:text-[2rem] lg:text-[2.25rem]",
          tone === "dark" ? "text-white" : "text-ktf-obsidian",
        )}
      >
        {title}
        {lead && (
          <>
            {" "}
            <span className={tone === "dark" ? "text-ktf-gray-400" : "text-ktf-gray-500"}>{lead}</span>
          </>
        )}
      </h2>
      {action && <div className="flex shrink-0 flex-wrap gap-3">{action}</div>}
    </Reveal>
  );
}
