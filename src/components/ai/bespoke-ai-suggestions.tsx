"use client";

import {
  ArrowUpRight,
  BriefcaseBusiness,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const BESPOKE_AI_SUGGESTIONS = [
  {
    label: "What products can Bespoke build?",
    hint: "Websites, apps, SaaS, AI, automation",
    prompt:
      "Help me explain the kind of products Bespoke Technologies can build for my business or  idea.",
    icon: Sparkles,
  },
  {
    label: "Show relevant proof",
    hint: "Delivered work for serious builds",
    prompt: "Show me relevant projects and proof for a serious product build.",
    icon: BriefcaseBusiness,
  },
  {
    label: "Plan a project",
    hint: "Turn an idea into a clear path",
    prompt: "Help me make a plan for a project I have told you before, if I didn't mention anyone, ask me.",
    icon: MessageCircle,
  },
  {
    label: "Why trust Bespoke?",
    hint: "Accountability, ownership, standards",
    prompt: "Why should I trust Bespoke Technologies with my product?",
    icon: ShieldCheck,
  },
] as const;

type BespokeAISuggestionsProps = {
  onSelect: (prompt: string) => void;
};

/**
 * Suggested prompts presented as clean, tappable cards — a calm two-column
 * grid that reads as a considered menu rather than scattered chips.
 */
export function BespokeAISuggestions({ onSelect }: BespokeAISuggestionsProps) {
  return (
    <div className="grid w-full gap-2.5 sm:grid-cols-2">
      {BESPOKE_AI_SUGGESTIONS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.prompt}
            type="button"
            onClick={() => onSelect(item.prompt)}
            className="group flex items-center gap-3 rounded-xl border border-ktf-gray-200 bg-white px-3.5 py-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-ktf-blue/40 hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ktf-blue/8 text-ktf-blue-deep transition-colors group-hover:bg-ktf-blue/12">
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-ktf-obsidian">
                {item.label}
              </span>
              <span className="mt-0.5 block truncate text-[11.5px] text-ktf-gray-500">
                {item.hint}
              </span>
            </span>
            <ArrowUpRight
              className="h-4 w-4 shrink-0 text-ktf-gray-300 transition-colors group-hover:text-ktf-blue"
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
