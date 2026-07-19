"use client";

import {
  BriefcaseBusiness,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const BESPOKE_AI_SUGGESTIONS = [
  {
    label: "What products can Bespoke build?",
    prompt:
      "Help me explain the kind of products Bespoke Technologies can build for my business or  idea.",
    icon: Sparkles,
  },
  {
    label: "Show relevant proof",
    prompt: "Show me relevant projects and proof for a serious product build.",
    icon: BriefcaseBusiness,
  },
  {
    label: "Plan a Project",
    prompt: "Help me make a plan for a project I have told you before, if I didn't mention anyone, ask me.",
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
    <div className="flex flex-wrap justify-center gap-2">
      {BESPOKE_AI_SUGGESTIONS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.prompt}
            type="button"
            onClick={() => onSelect(item.prompt)}
            className="inline-flex items-center gap-1.5 rounded-full border border-ktf-gray-200 bg-white px-3.5 py-2 text-[13px] font-medium text-ktf-gray-700 transition-colors hover:border-ktf-blue/40 hover:bg-ktf-blue/5 hover:text-ktf-blue-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
          >
            <Icon className="h-3.5 w-3.5 shrink-0 text-ktf-blue-deep" aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
