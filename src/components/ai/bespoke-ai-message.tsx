"use client";

import type { BespokeAIUIMessage } from "@/lib/ai/bespoke-ai-types";
import { cn } from "@/lib/utils";
import { BespokeAIActionCard } from "./bespoke-ai-action-card";
import { BespokeAIIcon } from "./bespoke-ai-icon";

type BespokeAIMessageProps = {
  message: BespokeAIUIMessage;
};

export function BespokeAIMessage({ message }: BespokeAIMessageProps) {
  const isUser = message.role === "user";
  const textParts = message.parts.filter((part) => part.type === "text");
  const toolParts = message.parts.filter((part) => part.type.startsWith("tool-"));

  return (
    <article
      className={cn(
        "flex w-full flex-col gap-2",
        isUser ? "items-end" : "items-start",
      )}
      aria-label={isUser ? "Your message" : "Bespoke AI message"}
    >
      {textParts.length > 0 ? (
        isUser ? (
          // User turn — a quiet, compact pill.
          <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ktf-surface px-4 py-2.5 text-sm leading-relaxed text-ktf-obsidian">
            <div className="grid gap-2">
              {textParts.map((part, index) => {
                if (part.type !== "text") return null;
                return (
                  <p key={`${message.id}-${index}`} className="whitespace-pre-wrap">
                    {part.text}
                  </p>
                );
              })}
            </div>
          </div>
        ) : (
          // Assistant turn — flat, document-like, no bubble chrome.
          <div className="flex w-full gap-3">
            <span
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ktf-blue to-ktf-blue-deep text-white shadow-sm"
              aria-hidden="true"
            >
              <BespokeAIIcon className="h-4 w-4" inverse />
            </span>
            <div className="grid min-w-0 flex-1 gap-2 pt-1 text-sm leading-relaxed text-ktf-obsidian">
              {textParts.map((part, index) => {
                if (part.type !== "text") return null;
                return (
                  <p key={`${message.id}-${index}`} className="whitespace-pre-wrap">
                    {part.text}
                  </p>
                );
              })}
            </div>
          </div>
        )
      ) : null}

      {toolParts.length > 0 ? (
        <div className={cn("w-full", !isUser && "pl-10")}>
          {toolParts.map((part, index) => {
            if (part.type === "text") {
              return null;
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
      ) : null}
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
