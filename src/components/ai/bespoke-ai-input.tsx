"use client";

import { ArrowUp, Square } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type BespokeAIResponseMode = "concise" | "extended";

type BespokeAIInputProps = {
  assistantName?: string;
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
  onSubmit: (message: string) => void;
  onStop: () => void;
};

export function BespokeAIInput({
  assistantName = "Bespoke AI",
  disabled,
  isStreaming,
  placeholder = "What would you like to build?",
  onSubmit,
  onStop,
}: BespokeAIInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    const inputElement = inputRef.current;
    if (!inputElement) return;
    inputElement.style.height = "auto";
    inputElement.style.height = `${Math.min(inputElement.scrollHeight, 120)}px`;
  }, [input]);

  const handleSubmit = () => {
    const nextMessage = input.trim();
    if (!nextMessage || disabled || isStreaming) return;
    onSubmit(nextMessage);
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <form
      data-bespoke-ai-composer="true"
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <label htmlFor={inputId} className="sr-only">Message {assistantName}</label>
      <div className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_8px_24px_-18px_rgba(15,38,71,0.35)] transition-[border-color,box-shadow] focus-within:border-slate-300 focus-within:shadow-[0_10px_28px_-16px_rgba(10,132,255,0.28)]">
        <textarea
          ref={inputRef}
          id={inputId}
          data-bespoke-ai-chat-input="true"
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          autoComplete="off"
          placeholder={placeholder}
          className="block max-h-[140px] min-h-[52px] w-full resize-none appearance-none border-0 bg-transparent py-3.5 pl-5 pr-14 text-sm leading-6 text-ktf-obsidian outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          rows={1}
        />
        <button
          type={isStreaming ? "button" : "submit"}
          onClick={isStreaming ? onStop : undefined}
          disabled={!isStreaming && (disabled || !input.trim())}
          className={cn(
            "absolute bottom-2 right-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue",
            isStreaming
              ? "bg-ktf-obsidian hover:bg-slate-800"
              : "bg-ktf-obsidian hover:bg-ktf-charcoal disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
          )}
          aria-label={isStreaming ? `Stop ${assistantName} response` : "Send message"}
        >
          {isStreaming ? <Square className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowUp className="h-4.5 w-4.5" aria-hidden="true" />}
        </button>
      </div>
    </form>
  );
}
