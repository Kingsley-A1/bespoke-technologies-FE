"use client";

import { Send, Square } from "lucide-react";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type BespokeAIInputProps = {
  disabled?: boolean;
  isStreaming?: boolean;
  onSubmit: (message: string) => void;
  onStop: () => void;
};

export function BespokeAIInput({
  disabled,
  isStreaming,
  onSubmit,
  onStop,
}: BespokeAIInputProps) {
  const inputId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");

  const handleInputChange = (value: string) => {
    setInput(value);

    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 144)}px`;
  };

  const handleSubmit = () => {
    const nextMessage = input.trim();
    if (!nextMessage || disabled || isStreaming) return;

    onSubmit(nextMessage);
    setInput("");

    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.style.height = "52px";
      textareaRef.current.focus();
    });
  };

  return (
    <form
      className="rounded-2xl border border-ktf-gray-200 bg-white p-2 shadow-[0_16px_45px_-30px_rgba(11,31,58,0.45)] transition-colors focus-within:border-ktf-blue/60 focus-within:ring-4 focus-within:ring-ktf-blue/10"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Message Bespoke AI
      </label>
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          id={inputId}
          value={input}
          onChange={(event) => handleInputChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          rows={1}
          placeholder="Ask Bespoke AI about services, projects, reviews, or contact..."
          className="h-[52px] max-h-36 min-h-[52px] flex-1 resize-none overflow-y-auto rounded-xl border-0 bg-ktf-surface px-4 py-3.5 text-[15px] leading-6 text-ktf-obsidian outline-none placeholder:text-ktf-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
        />
        <button
          type={isStreaming ? "button" : "submit"}
          onClick={isStreaming ? onStop : undefined}
          disabled={!isStreaming && (disabled || !input.trim())}
          className={cn(
            "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue",
            isStreaming
              ? "bg-ktf-obsidian hover:bg-ktf-gray-800"
              : "bg-ktf-blue hover:bg-ktf-blue-deep disabled:cursor-not-allowed disabled:bg-ktf-gray-300",
          )}
          aria-label={isStreaming ? "Stop Bespoke AI response" : "Send message"}
        >
          {isStreaming ? (
            <Square className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Send className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </form>
  );
}
