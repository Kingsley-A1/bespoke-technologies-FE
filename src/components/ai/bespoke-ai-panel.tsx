"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ArrowRight,
  CheckCircle2,
  PanelLeft,
  PanelLeftClose,
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

const AI_PROOF_POINTS = [
  "Choose the right service path",
  "Review relevant proof and projects",
  "Prepare a cleaner scope conversation",
] as const;

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
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-ktf-blue/15 bg-gradient-to-br from-ktf-blue/12 to-white text-ktf-blue shadow-xs">
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
                  Build guidance for {SITE_NAME}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
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
                <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-1 pt-6 pb-2 text-center sm:pt-10">
                  <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-ktf-blue/15 bg-gradient-to-br from-ktf-blue/12 to-white text-ktf-blue shadow-xs">
                    <BespokeAIIcon className="h-7 w-7" />
                  </span>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-ktf-blue-deep">
                    Product build assistant
                  </p>
                  <h2 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-ktf-obsidian sm:text-[1.95rem]">
                    Find the clearest route from idea to shipped product.
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-ktf-gray-600 sm:text-base">
                    Ask Bespoke AI to recommend a build path, surface relevant
                    work, clarify scope, or prepare for a product call.
                  </p>

                  <div className="mt-7 w-full text-left">
                    <BespokeAISuggestions onSelect={sendPrompt} />
                  </div>

                  <ul
                    className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
                    role="list"
                  >
                    {AI_PROOF_POINTS.map((point) => (
                      <li
                        key={point}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ktf-gray-600"
                      >
                        <CheckCircle2
                          className="h-3.5 w-3.5 shrink-0 text-ktf-success"
                          aria-hidden="true"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 inline-flex flex-wrap items-center justify-center gap-1.5 text-sm text-ktf-gray-500">
                    Prefer a human conversation?
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-1 font-semibold text-ktf-blue hover:text-ktf-blue-deep"
                    >
                      Book a scope call
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
                  className="flex justify-start"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <div className="rounded-lg border border-ktf-gray-200 bg-white px-4 py-3 text-sm text-ktf-gray-600 shadow-xs">
                    Bespoke AI is preparing a useful response...
                  </div>
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

          <div className="shrink-0 border-t border-ktf-gray-200 bg-white px-3 py-3 sm:px-4">
            <div className="mx-auto w-full max-w-3xl">
              <BespokeAIInput
                disabled={Boolean(aiError?.shouldDisableInput)}
                isStreaming={isStreaming}
                responseMode={responseMode}
                onResponseModeChange={setResponseMode}
                onSubmit={sendPrompt}
                onStop={stop}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
