"use client";

import {
  BriefcaseBusiness,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const BESPOKE_AI_SUGGESTIONS = [
  {
    label: "Choose my build path",
    prompt:
      "Help me choose the right build path for my product or business idea.",
    icon: Sparkles,
  },
  {
    label: "Show relevant proof",
    prompt: "Show me relevant projects and proof for a serious product build.",
    icon: BriefcaseBusiness,
  },
  {
    label: "Plan an MVP",
    prompt: "Help me scope a production-ready MVP without overbuilding.",
    icon: MessageCircle,
  },
  {
    label: "Why trust Bespoke?",
    prompt: "Why should I trust Bespoke Technologies with my product?",
    icon: ShieldCheck,
  },
] as const;

type BespokeAISuggestionsProps = {
  onSelect: (prompt: string) => void;
};

export function BespokeAISuggestions({ onSelect }: BespokeAISuggestionsProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {BESPOKE_AI_SUGGESTIONS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.prompt}
            type="button"
            onClick={() => onSelect(item.prompt)}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-ktf-gray-200 bg-white px-3 py-2 text-left text-sm font-semibold text-ktf-navy shadow-xs transition-colors hover:border-ktf-blue/40 hover:text-ktf-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
