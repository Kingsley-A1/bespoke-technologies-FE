"use client";

import { ArrowUpRight, BriefcaseBusiness, Lightbulb, Route } from "lucide-react";

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

export function BespokeAISuggestions({ experience = "public", onSelect }: { experience?: "public" | "admin"; onSelect: (prompt: string) => void }) {
  const suggestions = experience === "admin" ? BESPOKE_COWORKER_SUGGESTIONS : BESPOKE_AI_SUGGESTIONS;
  return (
    <div className="grid w-full gap-2 sm:grid-cols-3">
      {suggestions.map((item) => {
        const Icon = item.icon;
        return (
          <button
            data-bespoke-ai-quick-start="true"
            key={item.prompt}
            type="button"
            onClick={() => onSelect(item.prompt)}
            className="group flex min-h-[88px] flex-col items-start justify-between rounded-lg border border-slate-200 bg-white p-3 text-left shadow-[0_10px_30px_-24px_rgba(15,38,71,0.5)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-ktf-blue/35 hover:shadow-[0_16px_36px_-24px_rgba(10,132,255,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
          >
            <span className="flex w-full items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ktf-blue/8 text-ktf-blue-deep"><Icon className="h-3.5 w-3.5" aria-hidden="true" /></span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-ktf-blue" aria-hidden="true" />
            </span>
            <span className="mt-3">
              <span className="block text-xs font-bold text-slate-900">{item.label}</span>
              <span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{item.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
