"use client";

import { BriefcaseBusiness, Lightbulb, Route } from "lucide-react";
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
    <div className={cn("flex w-full flex-wrap justify-center gap-2", compact && "flex-col items-center")}>
      {suggestions.map((item) => {
        const Icon = item.icon;
        return (
          <button
            data-bespoke-ai-quick-start="true"
            key={item.prompt}
            type="button"
            onClick={() => onSelect(item.prompt)}
            title={item.hint}
            className="inline-flex min-h-10 min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-left text-[13px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
          >
            <Icon className="h-4 w-4 shrink-0 text-ktf-blue-deep" aria-hidden="true" />
            <span className="min-w-0 truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
