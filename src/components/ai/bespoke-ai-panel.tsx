"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { BespokeAIUIMessage } from "@/lib/ai/bespoke-ai-types";
import { BRAND_ICON_SRC, SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { BespokeAIInput } from "./bespoke-ai-input";
import { BespokeAIMessage } from "./bespoke-ai-message";
import { BespokeAISuggestions } from "./bespoke-ai-suggestions";

type BespokeAIPanelProps = {
  mode?: "page" | "panel";
  onClose?: () => void;
};

export function BespokeAIPanel({ mode = "page", onClose }: BespokeAIPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationId = useMemo(() => crypto.randomUUID(), []);
  const { messages, sendMessage, status, stop, error } = useChat<BespokeAIUIMessage>({
    id: conversationId,
    transport: new DefaultChatTransport({
      api: "/api/bespoke-ai",
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          conversationId: id,
          messages: messages.slice(-16),
        },
      }),
    }),
  });

  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  const sendPrompt = (prompt: string) => {
    sendMessage({ text: prompt });
  };

  return (
    <section
      className={cn(
        "flex min-h-0 flex-1 flex-col bg-ktf-white",
        mode === "page" && "min-h-[calc(100vh-4rem)]",
        mode === "panel" && "h-full",
      )}
      aria-label="Bespoke AI assistant"
    >
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-ktf-gray-200 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src={BRAND_ICON_SRC}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <h1
              id="bespoke-ai-panel-title"
              className="truncate text-base font-bold text-ktf-obsidian"
            >
              Bespoke AI
            </h1>
            <p className="truncate text-xs font-medium text-ktf-gray-600">
              Company assistant for {SITE_NAME}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === "panel" ? (
            <Link
              href="/bespoke-ai"
              className="hidden min-h-10 items-center rounded-md px-3 text-sm font-semibold text-ktf-blue hover:bg-ktf-blue/8 sm:inline-flex"
            >
              Full page
            </Link>
          ) : null}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-md text-ktf-gray-600 hover:bg-ktf-surface hover:text-ktf-obsidian"
              aria-label="Close Bespoke AI"
            >
              <span aria-hidden="true" className="text-xl leading-none">
                ×
              </span>
            </button>
          ) : null}
        </div>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {messages.length === 0 ? (
            <div className="rounded-xl border border-ktf-gray-200 bg-white p-5 shadow-card">
              <p className="text-sm font-semibold text-ktf-blue">
                Hi, I am Bespoke AI.
              </p>
              <p className="mt-2 text-base leading-relaxed text-ktf-obsidian">
                What would you like to build or understand today?
              </p>
              <div className="mt-4">
                <BespokeAISuggestions onSelect={sendPrompt} />
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <BespokeAIMessage key={message.id} message={message} />
            ))
          )}
          {isStreaming ? (
            <div className="flex justify-start">
              <div className="rounded-lg border border-ktf-gray-200 bg-white px-4 py-3 text-sm text-ktf-gray-600 shadow-xs">
                Bespoke AI is thinking...
              </div>
            </div>
          ) : null}
          {error ? (
            <div className="rounded-lg border border-ktf-error/20 bg-ktf-error/5 px-4 py-3 text-sm text-ktf-gray-800">
              {error.message || "Bespoke AI is temporarily unavailable."}
              <Link href="/contact" className="ml-1 font-semibold text-ktf-blue">
                Contact the team
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-ktf-gray-200 bg-white px-4 py-3">
        <div className="mx-auto w-full max-w-3xl">
          {messages.length > 0 ? (
            <div className="mb-3">
              <BespokeAISuggestions onSelect={sendPrompt} />
            </div>
          ) : null}
          <BespokeAIInput
            disabled={false}
            isStreaming={isStreaming}
            onSubmit={sendPrompt}
            onStop={stop}
          />
        </div>
      </div>
    </section>
  );
}
