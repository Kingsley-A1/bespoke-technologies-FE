"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ArrowRight,
  PanelLeft,
  PanelLeftClose,
  SquarePen,
  X,
} from "lucide-react";
import { useMediaQuery } from "@/hooks";
import { getBespokeAIErrorPayload } from "@/lib/ai/bespoke-ai-errors";
import type { BespokeAIUIMessage } from "@/lib/ai/bespoke-ai-types";
import { SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { BespokeAIErrorState } from "./bespoke-ai-error-state";
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

export function BespokeAIPanel({
  mode = "page",
  onClose,
}: BespokeAIPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [isHistoryDockOpen, setIsHistoryDockOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [responseMode, setResponseMode] =
    useState<BespokeAIResponseMode>("extended");
  const {
    activeConversation,
    activeConversationId,
    conversations,
    deleteConversation,
    isLoaded,
    renameConversation,
    selectConversation,
    startNewConversation,
    togglePinnedConversation,
    updateConversationMessages,
  } = useBespokeAIConversations();
  const { messages, sendMessage, status, stop, error, regenerate, clearError } =
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
  const hasEmptyState = messages.length === 0;
  const aiError = error ? getBespokeAIErrorPayload(error) : null;

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

  const handleRetry = () => {
    clearError();
    void regenerate();
  };

  const handleToggleHistory = () => {
    if (isDesktop) {
      setIsHistoryDockOpen((current) => !current);
      return;
    }

    setIsHistoryDrawerOpen(true);
  };

  const handleCloseHistory = () => {
    if (isDesktop) {
      setIsHistoryDockOpen(false);
      return;
    }

    setIsHistoryDrawerOpen(false);
  };

  const handleStartNewConversation = () => {
    if (isStreaming) stop();
    startNewConversation();
    if (!isDesktop) setIsHistoryDrawerOpen(false);
  };

  const handleSelectConversation = (conversationId: string) => {
    if (isStreaming) stop();
    selectConversation(conversationId);
    if (!isDesktop) setIsHistoryDrawerOpen(false);
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (isStreaming && conversationId === activeConversationId) stop();
    deleteConversation(conversationId);
  };

  const historySidebar = (
    <BespokeAIHistorySidebar
      activeConversationId={activeConversationId}
      className={cn(
        "hidden lg:flex",
        mode === "panel"
          ? "w-[42%] min-w-52 max-w-60"
          : "w-80 max-w-80",
      )}
      conversations={conversations}
      onClose={handleCloseHistory}
      onDeleteConversation={handleDeleteConversation}
      onNewConversation={handleStartNewConversation}
      onRenameConversation={renameConversation}
      onSelectConversation={handleSelectConversation}
      onTogglePinnedConversation={togglePinnedConversation}
      showCloseButton
    />
  );

  const mobileHistoryDrawer = isHistoryDrawerOpen ? (
    <div className="fixed inset-0 z-400 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-ktf-obsidian/30"
        aria-label="Close conversation history overlay"
        onClick={() => setIsHistoryDrawerOpen(false)}
      />
      <BespokeAIHistorySidebar
        activeConversationId={activeConversationId}
        className="relative z-10"
        conversations={conversations}
        onClose={() => setIsHistoryDrawerOpen(false)}
        onDeleteConversation={handleDeleteConversation}
        onNewConversation={handleStartNewConversation}
        onRenameConversation={renameConversation}
        onSelectConversation={handleSelectConversation}
        onTogglePinnedConversation={togglePinnedConversation}
        showCloseButton
      />
    </div>
  ) : null;

  return (
    <section
      className={cn(
        "flex min-h-0 flex-1 bg-ktf-white",
        mode === "page" && "min-h-[calc(100vh-4.25rem)]",
        mode === "panel" && "h-full",
      )}
      aria-labelledby="bespoke-ai-panel-title"
    >
      <div className="flex min-h-0 flex-1">
        {isDesktop && isHistoryDockOpen ? historySidebar : null}
        {mobileHistoryDrawer}
        <div className="flex min-w-0 flex-1 flex-col bg-ktf-white">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-ktf-gray-200 px-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={handleToggleHistory}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ktf-gray-600 hover:bg-ktf-surface hover:text-ktf-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
                aria-label={
                  isDesktop && isHistoryDockOpen
                    ? "Hide conversation history"
                    : "Show conversation history"
                }
                aria-expanded={
                  isDesktop ? isHistoryDockOpen : isHistoryDrawerOpen
                }
              >
                {isDesktop && isHistoryDockOpen ? (
                  <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <PanelLeft className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ktf-blue to-ktf-blue-deep text-white shadow-sm">
                <BespokeAIIcon className="h-5 w-5" inverse />
              </span>
              <div className="min-w-0">
                <h1
                  id="bespoke-ai-panel-title"
                  className="truncate text-sm font-bold text-ktf-obsidian"
                >
                  Bespoke AI
                </h1>
                <p className="truncate text-[11px] font-medium text-ktf-gray-500">
                  Build guidance for {SITE_NAME}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleStartNewConversation}
                disabled={hasEmptyState && !isStreaming}
                className="flex h-10 w-10 items-center justify-center rounded-md text-ktf-gray-600 transition-colors hover:bg-ktf-surface hover:text-ktf-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Start a new chat"
                title="New chat"
              >
                <SquarePen className="h-5 w-5" aria-hidden="true" />
              </button>
              {mode === "panel" ? (
                <Link
                  href="/bespoke-ai"
                  className="hidden min-h-10 items-center rounded-md px-3 text-sm font-semibold text-ktf-blue hover:bg-ktf-blue/8 sm:inline-flex"
                >
                  Open full page
                </Link>
              ) : null}
              {onClose ? (
                <button
                  data-bespoke-ai-close="true"
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-md text-ktf-gray-600 hover:bg-ktf-surface hover:text-ktf-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
                  aria-label="Close Bespoke AI"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </header>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto px-4 py-5"
          >
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              {hasEmptyState ? (
                <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-1 pt-8 pb-2 text-center sm:pt-14">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ktf-blue to-ktf-blue-deep text-white shadow-lg shadow-ktf-blue/20">
                    <BespokeAIIcon className="h-7 w-7" inverse />
                  </span>
                  <h2 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-ktf-obsidian">
                    How can I help you build?
                  </h2>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-ktf-gray-500">
                    Ask about services, explore real delivered work, or shape a
                    clean scope — before you ever contact the team.
                  </p>

                  <div className="mt-8 w-full">
                    <BespokeAISuggestions onSelect={sendPrompt} />
                  </div>

                  <div className="mt-7 inline-flex flex-wrap items-center justify-center gap-1.5 text-xs text-ktf-gray-500">
                    Prefer a human conversation?
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-1 font-semibold text-ktf-blue hover:text-ktf-blue-deep"
                    >
                      Contact us
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <BespokeAIMessage key={message.id} message={message} />
                ))
              )}
              {isStreaming ? (
                <div
                  className="flex items-center gap-3"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ktf-blue to-ktf-blue-deep text-white shadow-sm"
                    aria-hidden="true"
                  >
                    <BespokeAIIcon className="h-4 w-4" inverse />
                  </span>
                  <span className="flex items-center gap-1" aria-hidden="true">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ktf-gray-400" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ktf-gray-400 [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ktf-gray-400 [animation-delay:240ms]" />
                  </span>
                  <span className="sr-only">Bespoke AI is responding</span>
                </div>
              ) : null}
              {error ? (
                <BespokeAIErrorState
                  error={error}
                  onRetry={aiError?.canRetry ? handleRetry : undefined}
                />
              ) : null}
            </div>
          </div>

          <div className="shrink-0 border-t border-ktf-gray-200 bg-white px-3 pt-3 pb-2.5 sm:px-4">
            <div className="mx-auto w-full max-w-3xl">
              <BespokeAIInput
                disabled={Boolean(aiError?.shouldDisableInput)}
                isStreaming={isStreaming}
                responseMode={responseMode}
                onResponseModeChange={setResponseMode}
                onSubmit={sendPrompt}
                onStop={stop}
              />
              <p className="mt-2 text-center text-[11px] leading-relaxed text-ktf-gray-400">
                Bespoke AI can make mistakes. Verify important details before you
                rely on them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
