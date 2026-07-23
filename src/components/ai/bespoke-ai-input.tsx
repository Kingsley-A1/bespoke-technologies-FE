"use client";

import { ArrowUp, Sparkles, Square } from "lucide-react";
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
    inputElement.style.height = `${Math.min(inputElement.scrollHeight, 148)}px`;
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
      <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-[0_18px_50px_-26px_rgba(15,38,71,0.45)] transition-[border-color,box-shadow] focus-within:border-ktf-blue focus-within:shadow-[0_20px_56px_-24px_rgba(10,132,255,0.38)]">
        <div className="flex items-center gap-2 px-4 pt-3.5 text-[11px] font-semibold text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-ktf-blue" aria-hidden="true" />
          Ask {assistantName}
        </div>
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
          className="block max-h-[148px] min-h-[62px] w-full resize-none appearance-none border-0 bg-transparent px-4 py-2 text-[15px] leading-6 text-ktf-obsidian outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[70px]"
          disabled={disabled}
          rows={2}
        />
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-3 py-2.5">
          <span className="hidden text-[10px] font-medium text-slate-400 sm:block">Enter to send · Shift + Enter for a new line</span>
          <span className="text-[10px] font-medium text-slate-400 sm:hidden">Ask anything</span>
          <button
            type={isStreaming ? "button" : "submit"}
            onClick={isStreaming ? onStop : undefined}
            disabled={!isStreaming && (disabled || !input.trim())}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm transition-[background-color,transform] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue",
              isStreaming
                ? "bg-ktf-obsidian hover:bg-slate-800"
                : "bg-ktf-blue hover:bg-ktf-blue-deep disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none",
            )}
            aria-label={isStreaming ? `Stop ${assistantName} response` : "Send message"}
          >
            {isStreaming ? <Square className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowUp className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </form>
  );
}
