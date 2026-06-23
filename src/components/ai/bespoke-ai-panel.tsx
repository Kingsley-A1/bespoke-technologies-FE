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
  const hasEmptyState = messages.length === 0;

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
        mode === "page" && "min-h-[calc(100vh-4rem)]",
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
                <div className="overflow-hidden rounded-2xl border border-ktf-gray-200 bg-white shadow-card">
                  <div className="border-b border-ktf-gray-100 bg-ktf-surface/70 p-5 sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-ktf-blue-deep">
                      Product build assistant
                    </p>
                    <h2 className="mt-3 max-w-2xl text-2xl font-bold leading-tight text-ktf-obsidian sm:text-3xl">
                      Find the clearest route from idea to shipped product.
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ktf-gray-700 sm:text-base">
                      Ask Bespoke AI to recommend a build path, surface relevant
                      work, clarify scope, or help you prepare for a product
                      call.
                    </p>
                  </div>

                  <div className="p-5 sm:p-6">
                    <ul className="grid gap-2 sm:grid-cols-3" role="list">
                      {AI_PROOF_POINTS.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-2 rounded-lg border border-ktf-gray-200 bg-white px-3 py-3 text-sm font-semibold leading-snug text-ktf-navy"
                        >
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-ktf-success"
                            aria-hidden="true"
                          />
                          {point}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5">
                      <BespokeAISuggestions onSelect={sendPrompt} />
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-ktf-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-ktf-gray-600">
                        Prefer a human conversation?
                      </p>
                      <Link
                        href="/contact"
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ktf-blue px-4 text-sm font-bold text-white transition-colors hover:bg-ktf-blue-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
                      >
                        Book a scope call
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
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
                <div
                  className="rounded-lg border border-ktf-error/20 bg-ktf-error/5 px-4 py-3 text-sm text-ktf-gray-800"
                  role="alert"
                >
                  {error.message || "Bespoke AI is temporarily unavailable."}
                  <Link
                    href="/contact"
                    className="ml-1 font-semibold text-ktf-blue"
                  >
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
      </div>
    </section>
  );
}
