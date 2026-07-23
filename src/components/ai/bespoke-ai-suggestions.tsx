"use client";

import { ArrowUpRight, BriefcaseBusiness, Lightbulb, Route } from "lucide-react";
import { cn } from "@/lib/utils";

export const BESPOKE_AI_SUGGESTIONS = [
  {
    label: "Explore what we build",
    hint: "Find the right product path",
    prompt: "Help me understand what Bespoke Technologies can build for my idea or business.",
    icon: Lightbulb,
  },
  {
    label: "See relevant work",
    hint: "Match my idea to real projects",
    prompt: "Show me the most relevant Bespoke Technologies projects for what I want to build.",
    icon: BriefcaseBusiness,
  },
  {
    label: "Shape my big idea",
    hint: "Turn an early thought into a plan",
    prompt: "Help me turn my big idea into a clear, practical project plan. Ask me one question at a time.",
    icon: Route,
  },
] as const;

const BESPOKE_COWORKER_SUGGESTIONS = [
  {
    label: "Prioritise today",
    hint: "Find the work needing attention",
    prompt: "Based on the admin workspace I can access, what should I prioritise today and why?",
    icon: Route,
  },
  {
    label: "Review delivery",
    hint: "Projects, tasks, and risks",
    prompt: "Give me a concise review of current project delivery, overdue work, and visible risks.",
    icon: BriefcaseBusiness,
  },
  {
    label: "Check business health",
    hint: "Pipeline, invoices, and follow-ups",
    prompt: "Summarise the business health I am permitted to see, including pipeline, invoices, and important follow-ups.",
    icon: Lightbulb,
  },
] as const;

export function BespokeAISuggestions({
  compact = false,
  experience = "public",
  onSelect,
}: {
  compact?: boolean;
  experience?: "public" | "admin";
  onSelect: (prompt: string) => void;
}) {
  const suggestions = experience === "admin" ? BESPOKE_COWORKER_SUGGESTIONS : BESPOKE_AI_SUGGESTIONS;
  return (
    <div className={cn("grid w-full gap-2", !compact && "sm:grid-cols-3")}>
      {suggestions.map((item) => {
        const Icon = item.icon;
        return (
          <button
            data-bespoke-ai-quick-start="true"
            key={item.prompt}
            type="button"
            onClick={() => onSelect(item.prompt)}
            className="group flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-left transition-[border-color,background-color,box-shadow] hover:border-ktf-blue/30 hover:bg-blue-50/35 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-ktf-blue-deep">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block break-words text-xs font-semibold leading-5 text-slate-900">{item.label}</span>
              <span className="block break-words text-[10px] leading-4 text-slate-500">{item.hint}</span>
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-ktf-blue" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
