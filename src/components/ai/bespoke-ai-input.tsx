"use client";

import {
  ArrowUp,
  BriefcaseBusiness,
  ChevronDown,
  MessageCircle,
  Mic,
  Plus,
  Sparkles,
  Square,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type BespokeAIResponseMode = "concise" | "extended";

type BespokeAIInputProps = {
  responseMode?: BespokeAIResponseMode;
  disabled?: boolean;
  isStreaming?: boolean;
  onResponseModeChange?: (mode: BespokeAIResponseMode) => void;
  onSubmit: (message: string) => void;
  onStop: () => void;
};

const RESPONSE_MODES: Array<{
  label: string;
  value: BespokeAIResponseMode;
}> = [
  { label: "Concise", value: "concise" },
  { label: "Extended", value: "extended" },
];

const INPUT_ACTIONS = [
  {
    label: "Choose build path",
    prompt:
      "Help me choose the right build path for my product or business idea.",
    icon: Sparkles,
  },
  {
    label: "Show proof",
    prompt: "Show me relevant projects and proof for a serious product build.",
    icon: BriefcaseBusiness,
  },
  {
    label: "Prepare contact",
    prompt: "Help me prepare a clear scope summary before contacting the team.",
    icon: MessageCircle,
  },
] as const;

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  start: () => void;
  stop: () => void;
};

type WindowWithSpeechRecognition = Window &
  typeof globalThis & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };

export function BespokeAIInput({
  responseMode = "extended",
  disabled,
  isStreaming,
  onResponseModeChange,
  onSubmit,
  onStop,
}: BespokeAIInputProps) {
  const inputId = useId();
  const actionMenuId = `${inputId}-actions`;
  const modeMenuId = `${inputId}-response-mode`;
  const actionMenuRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [input, setInput] = useState("");

  const selectedMode =
    RESPONSE_MODES.find((mode) => mode.value === responseMode) ??
    RESPONSE_MODES[1];

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setIsActionMenuOpen(false);
        setIsModeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, []);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleSubmit = () => {
    const nextMessage = input.trim();
    if (!nextMessage || disabled || isStreaming) return;

    onSubmit(nextMessage);
    setInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleActionSelect = (prompt: string) => {
    setInput(prompt);
    setIsActionMenuOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleModeSelect = (mode: BespokeAIResponseMode) => {
    onResponseModeChange?.(mode);
    setIsModeMenuOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleVoiceInput = () => {
    if (disabled || isStreaming) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionConstructor =
      (window as WindowWithSpeechRecognition).SpeechRecognition ??
      (window as WindowWithSpeechRecognition).webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) return;

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setInput((current) => `${current}${current ? " " : ""}${transcript}`);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  return (
    <form
      ref={actionMenuRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setIsActionMenuOpen(false);
          setIsModeMenuOpen(false);
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Message Bespoke AI
      </label>
      <div className="rounded-2xl border border-ktf-gray-200 bg-white shadow-sm transition-colors focus-within:border-ktf-blue/40 focus-within:ring-2 focus-within:ring-ktf-blue/10">
        <textarea
          ref={inputRef}
          id={inputId}
          data-bespoke-ai-chat-input="true"
          value={input}
          onChange={(event) => handleInputChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          autoComplete="off"
          placeholder="Describe what you want to build"
          className="block max-h-40 min-h-[48px] w-full resize-none appearance-none border-0 bg-transparent px-4 pt-3.5 pb-1 text-[15px] leading-6 text-ktf-obsidian outline-none ring-0 placeholder:text-ktf-gray-400 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled}
          rows={1}
        />

        <div className="flex items-center gap-1 px-2 pb-2">
          <button
            type="button"
            onClick={() => {
              setIsActionMenuOpen((current) => !current);
              setIsModeMenuOpen(false);
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ktf-gray-600 transition-colors hover:bg-ktf-surface hover:text-ktf-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
            aria-label="Open Bespoke AI actions"
            aria-expanded={isActionMenuOpen}
            aria-controls={actionMenuId}
            aria-haspopup="menu"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="relative hidden shrink-0 sm:block">
            <button
              type="button"
              onClick={() => {
                setIsModeMenuOpen((current) => !current);
                setIsActionMenuOpen(false);
              }}
              className="flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-ktf-gray-600 transition-colors hover:bg-ktf-surface hover:text-ktf-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
              aria-label="Set Bespoke AI response length"
              aria-expanded={isModeMenuOpen}
              aria-controls={modeMenuId}
              aria-haspopup="listbox"
            >
              {selectedMode.label}
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            {isModeMenuOpen ? (
              <div
                id={modeMenuId}
                role="listbox"
                aria-label="Bespoke AI response length"
                className="absolute bottom-full left-0 z-20 mb-2 w-36 rounded-lg border border-ktf-gray-200 bg-white p-1 shadow-xl"
              >
                {RESPONSE_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    role="option"
                    aria-selected={mode.value === responseMode}
                    onClick={() => handleModeSelect(mode.value)}
                    className={cn(
                      "flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue",
                      mode.value === responseMode
                        ? "bg-ktf-blue/8 text-ktf-blue"
                        : "text-ktf-gray-700 hover:bg-ktf-surface hover:text-ktf-obsidian",
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex-1" />

          <button
            type="button"
            onClick={handleVoiceInput}
            disabled={disabled || isStreaming}
            className={cn(
              "hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ktf-gray-600 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue sm:flex",
              isListening
                ? "bg-ktf-blue/10 text-ktf-blue"
                : "hover:bg-ktf-surface hover:text-ktf-obsidian disabled:cursor-not-allowed disabled:opacity-40",
            )}
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
          >
            <Mic className="h-4 w-4" aria-hidden="true" />
          </button>

          <button
            type={isStreaming ? "button" : "submit"}
            onClick={isStreaming ? onStop : undefined}
            disabled={!isStreaming && (disabled || !input.trim())}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue",
              isStreaming
                ? "bg-ktf-obsidian hover:bg-ktf-gray-800"
                : "bg-ktf-blue hover:bg-ktf-blue-deep disabled:cursor-not-allowed disabled:bg-ktf-gray-200 disabled:text-ktf-gray-400",
            )}
            aria-label={isStreaming ? "Stop Bespoke AI response" : "Send message"}
          >
            {isStreaming ? (
              <Square className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ArrowUp className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {isActionMenuOpen ? (
        <div
          id={actionMenuId}
          role="menu"
          aria-label="Bespoke AI quick actions"
          className="absolute bottom-full left-0 z-20 mb-2 w-72 rounded-xl border border-ktf-gray-200 bg-white p-2 shadow-xl"
        >
          {INPUT_ACTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.prompt}
                type="button"
                role="menuitem"
                onClick={() => handleActionSelect(item.prompt)}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-ktf-gray-700 transition-colors hover:bg-ktf-surface hover:text-ktf-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </form>
  );
}
