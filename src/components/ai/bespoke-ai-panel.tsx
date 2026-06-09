"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { PanelLeft } from "lucide-react";
import type { BespokeAIUIMessage } from "@/lib/ai/bespoke-ai-types";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { BespokeAIHistorySidebar } from "./bespoke-ai-history-sidebar";
import { BespokeAIIcon } from "./bespoke-ai-icon";
import {
  BespokeAIInput,
  type BespokeAIResponseMode,
} from "./bespoke-ai-input";
import { BespokeAIMessage } from "./bespoke-ai-message";
import { BespokeAISuggestions } from "./bespoke-ai-suggestions";
import { useBespokeAIConversations } from "./use-bespoke-ai-conversations";

type BespokeAIPanelProps = {
  mode?: "page" | "panel";
  onClose?: () => void;
};

export function BespokeAIPanel({ mode = "page", onClose }: BespokeAIPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [responseMode, setResponseMode] =
    useState<BespokeAIResponseMode>("extended");
  const {
    activeConversation,
    activeConversationId,
    conversations,
    deleteConversation,
    isLoaded,
    selectConversation,
    startNewConversation,
    updateConversationMessages,
  } = useBespokeAIConversations();
  const { messages, sendMessage, status, stop, error } =
    useChat<BespokeAIUIMessage>({
      id: activeConversationId,
      messages: activeConversation?.messages ?? [],
    transport: new DefaultChatTransport({
      api: "/api/bespoke-ai",
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          conversationId: id,
          detailLevel: responseMode,
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

  useEffect(() => {
    if (!isLoaded) return;

    updateConversationMessages(activeConversationId, messages);
  }, [
    activeConversationId,
    isLoaded,
    messages,
    updateConversationMessages,
  ]);

  const sendPrompt = (prompt: string) => {
    sendMessage({ text: prompt });
  };

  const handleStartNewConversation = () => {
    if (isStreaming) stop();
    startNewConversation();
    setIsHistoryOpen(false);
  };

  const handleSelectConversation = (conversationId: string) => {
    if (isStreaming) stop();
    selectConversation(conversationId);
    setIsHistoryOpen(false);
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (isStreaming && conversationId === activeConversationId) stop();
    deleteConversation(conversationId);
  };

  const hasEmptyState = messages.length === 0;

  const historySidebar = (
    <BespokeAIHistorySidebar
      activeConversationId={activeConversationId}
      conversations={conversations}
      onDeleteConversation={handleDeleteConversation}
      onNewConversation={handleStartNewConversation}
      onSelectConversation={handleSelectConversation}
    />
  );

  const chatPanel = (
    <div className="flex min-h-0 flex-1 flex-col bg-ktf-white">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-ktf-gray-200 px-4">
        <div className="flex min-w-0 items-center gap-3">
          {mode === "page" ? (
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ktf-gray-600 hover:bg-ktf-surface hover:text-ktf-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue lg:hidden"
              aria-label="Open conversation history"
            >
              <PanelLeft className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ktf-blue/20 bg-ktf-blue/8 text-ktf-blue">
            <BespokeAIIcon className="h-6 w-6" />
          </span>
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
        <div className="flex items-center gap-3">
          {mode === "panel" ? (
            <Link
              href="/bespoke-ai"
              className="hidden min-h-10 items-center rounded-md px-3 text-sm font-semibold text-ktf-blue hover:bg-ktf-blue/8 sm:inline-flex"
            >
              Full Page
            </Link>
          ) : null}
          {onClose ? (
            <button
              data-bespoke-ai-close="true"
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
          {hasEmptyState ? (
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

      <div className="shrink-0 border-t border-ktf-gray-200 bg-white px-3 py-3 sm:px-4">
        <div className="mx-auto w-full max-w-3xl">
          <BespokeAIInput
            disabled={false}
            isStreaming={isStreaming}
            responseMode={responseMode}
            onResponseModeChange={setResponseMode}
            onSubmit={sendPrompt}
            onStop={stop}
          />
        </div>
      </div>
    </div>
  );

  return (
    <section
      className={cn(
        "flex min-h-0 flex-1 bg-ktf-white",
        mode === "page" && "min-h-[calc(100vh-4rem)]",
        mode === "panel" && "h-full",
      )}
      aria-label="Bespoke AI assistant"
    >
      {mode === "page" ? (
        <div className="flex min-h-0 flex-1">
          <div className="hidden lg:block">{historySidebar}</div>
          {isHistoryOpen ? (
            <div className="fixed inset-0 z-400 lg:hidden">
              <button
                type="button"
                className="absolute inset-0 bg-ktf-obsidian/30"
                aria-label="Close conversation history overlay"
                onClick={() => setIsHistoryOpen(false)}
              />
              <BespokeAIHistorySidebar
                activeConversationId={activeConversationId}
                className="relative z-10"
                conversations={conversations}
                onClose={() => setIsHistoryOpen(false)}
                onDeleteConversation={handleDeleteConversation}
                onNewConversation={handleStartNewConversation}
                onSelectConversation={handleSelectConversation}
              />
            </div>
          ) : null}
          {chatPanel}
        </div>
      ) : (
        chatPanel
      )}
    </section>
  );
}
