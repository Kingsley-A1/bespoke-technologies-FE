"use client";

import type { BespokeAIUIMessage } from "@/lib/ai/bespoke-ai-types";
import { cn } from "@/lib/utils";
import { BespokeAIActionCard } from "./bespoke-ai-action-card";

type BespokeAIMessageProps = {
  message: BespokeAIUIMessage;
};

export function BespokeAIMessage({ message }: BespokeAIMessageProps) {
  const isUser = message.role === "user";

  return (
    <article className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-lg px-4 py-3 text-sm leading-relaxed shadow-xs",
          isUser
            ? "bg-ktf-blue text-white"
            : "border border-ktf-gray-200 bg-white text-ktf-obsidian",
        )}
      >
        <div className="grid gap-2">
          {message.parts.map((part, index) => {
            if (part.type === "text") {
              return (
                <p key={`${message.id}-${index}`} className="whitespace-pre-wrap">
                  {part.text}
                </p>
              );
            }

            if (part.type.startsWith("tool-")) {
              return (
                <ToolPart
                  key={`${message.id}-${index}`}
                  part={part as {
                    state?: string;
                    output?: unknown;
                    type: string;
                  }}
                />
              );
            }

            return null;
          })}
        </div>
      </div>
    </article>
  );
}

function ToolPart({
  part,
}: {
  part: {
    state?: string;
    output?: unknown;
    type: string;
  };
}) {
  if (part.state === "output-available" && isActionResult(part.output)) {
    return <BespokeAIActionCard result={part.output} />;
  }

  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <div className="mt-3 rounded-md border border-ktf-gray-200 bg-ktf-surface px-3 py-2 text-xs font-medium text-ktf-gray-600">
        Preparing Bespoke action...
      </div>
    );
  }

  return null;
}

function isActionResult(
  value: unknown,
): value is Parameters<typeof BespokeAIActionCard>[0]["result"] {
  return Boolean(value && typeof value === "object" && "type" in value);
}
