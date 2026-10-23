"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { PanelLeft, PanelLeftClose, SquarePen, X } from "lucide-react";
import { useMediaQuery } from "@/hooks";
import { getBespokeAIErrorPayload } from "@/lib/ai/bespoke-ai-errors";
import type { BespokeAIUIMessage } from "@/lib/ai/bespoke-ai-types";
import { cn } from "@/lib/utils";
import { BespokeAIErrorState } from "./bespoke-ai-error-state";
import { BespokeAIHistorySidebar } from "./bespoke-ai-history-sidebar";
import { BespokeAIIcon } from "./bespoke-ai-icon";
import { BespokeAIInput } from "./bespoke-ai-input";
import { BespokeAIMessage } from "./bespoke-ai-message";
import { BespokeAISuggestions } from "./bespoke-ai-suggestions";
import { useBespokeAIConversations } from "./use-bespoke-ai-conversations";

type BespokeAIPanelProps = {
  /** panel: the desktop side panel. sheet: the mobile bottom sheet. admin: the Coworker workspace. */
  mode: "panel" | "sheet" | "admin";
  onClose?: () => void;
  /** Lets the mobile sheet be dragged down from its header. */
  onHeaderPointerDown?: (event: React.PointerEvent<HTMLElement>) => void;
};

const iconButton =
  "flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35";

export function BespokeAIPanel({ mode, onClose, onHeaderPointerDown }: BespokeAIPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isAdmin = mode === "admin";
  // The side panel and the sheet are narrow surfaces: history opens over the
  // conversation instead of beside it.
  const isCompact = mode === "panel" || mode === "sheet";
  const assistantName = isAdmin ? "Bespoke Coworker" : "Bespoke AI";
  const [isHistoryDockOpen, setIsHistoryDockOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
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
  } = useBespokeAIConversations(isAdmin ? null : "bespoke-ai-conversations:v1");

  const { messages, sendMessage, status, stop, error, regenerate, clearError } = useChat<BespokeAIUIMessage>({
    id: activeConversationId,
    messages: activeConversation?.messages ?? [],
    transport: new DefaultChatTransport({
      api: isAdmin ? "/admin/api/coworker" : "/api/bespoke-ai",
      prepareSendMessagesRequest: ({ id, messages: nextMessages }) => ({
        body: {
          conversationId: id,
          detailLevel: isAdmin ? "extended" : "concise",
          messages: nextMessages.slice(-16),
        },
      }),
    }),
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const hasEmptyState = messages.length === 0;
  const aiError = error ? getBespokeAIErrorPayload(error) : null;
  const headline = isAdmin ? "What needs your attention today?" : "What would you like to build?";

  // Escape closes the history list (the surrounding panel ignores that press).
  useEffect(() => {
    if (!isHistoryDrawerOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsHistoryDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isHistoryDrawerOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (isLoaded) updateConversationMessages(activeConversationId, messages);
  }, [activeConversationId, isLoaded, messages, updateConversationMessages]);

  const sendPrompt = (prompt: string) => sendMessage({ text: prompt });
  const handleRetry = () => { clearError(); void regenerate(); };
  const usesHistoryDock = isDesktop && !isCompact;
  const handleToggleHistory = () => {
    if (usesHistoryDock) setIsHistoryDockOpen((current) => !current);
    else setIsHistoryDrawerOpen(true);
  };
  const handleCloseHistory = () => {
    if (usesHistoryDock) setIsHistoryDockOpen(false);
    else setIsHistoryDrawerOpen(false);
  };
  const handleStartNewConversation = () => {
    if (isStreaming) stop();
    startNewConversation();
    setIsHistoryDrawerOpen(false);
  };
  const handleSelectConversation = (conversationId: string) => {
    if (isStreaming) stop();
    selectConversation(conversationId);
    setIsHistoryDrawerOpen(false);
  };
  const handleDeleteConversation = (conversationId: string) => {
    if (isStreaming && conversationId === activeConversationId) stop();
    deleteConversation(conversationId);
  };

  const historySidebar = (
    <BespokeAIHistorySidebar
      assistantName={assistantName}
      activeConversationId={activeConversationId}
      className="hidden w-72 max-w-72 lg:flex"
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
    <div
      data-bespoke-ai-history-drawer="true"
      className={cn("z-400", isCompact ? "absolute inset-0 flex" : "fixed inset-0 lg:hidden")}
    >
      <button type="button" className="absolute inset-0 bg-slate-950/35" aria-label="Close conversation history overlay" onClick={() => setIsHistoryDrawerOpen(false)} />
      <BespokeAIHistorySidebar
        assistantName={assistantName}
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

  const composer = (
    <BespokeAIInput
      assistantName={assistantName}
      disabled={Boolean(aiError?.shouldDisableInput)}
      isStreaming={isStreaming}
      placeholder={isAdmin ? "Ask about work, clients, invoices, tasks, or learning" : "What would you like to build?"}
      onSubmit={sendPrompt}
      onStop={stop}
    />
  );

  return (
    <section
      className={cn(
        "flex min-h-0 flex-1 overflow-hidden bg-white",
        isCompact && "relative h-full bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_58%,#edf4fd_100%)]",
        isAdmin && "h-[calc(100dvh-86px)] min-h-[620px]",
      )}
      aria-labelledby="bespoke-ai-panel-title"
    >
      <div className={cn("flex min-h-0 flex-1 overflow-hidden", isCompact ? "bg-transparent" : "bg-white")}>
        {usesHistoryDock && isHistoryDockOpen ? historySidebar : null}
        {mobileHistoryDrawer}

        <div className={cn("flex min-w-0 flex-1 flex-col", isCompact ? "bg-transparent" : "bg-white")}>
          <header
            onPointerDown={onHeaderPointerDown}
            className={cn(
              "flex h-14 shrink-0 items-center justify-between gap-2 px-3 sm:px-4",
              !isCompact && "border-b border-slate-100",
              onHeaderPointerDown && "touch-none select-none",
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={handleToggleHistory}
                className={iconButton}
                aria-label={usesHistoryDock && isHistoryDockOpen ? "Hide conversation history" : "Show conversation history"}
                aria-expanded={usesHistoryDock ? isHistoryDockOpen : isHistoryDrawerOpen}
              >
                {usesHistoryDock && isHistoryDockOpen ? <PanelLeftClose className="h-4.5 w-4.5" /> : <PanelLeft className="h-4.5 w-4.5" />}
              </button>
              <h1 id="bespoke-ai-panel-title" className="flex min-w-0 items-center gap-2 truncate text-[15px] font-semibold text-slate-950">
                <BespokeAIIcon className="h-4.5 w-4.5 shrink-0 text-ktf-blue-deep" />
                {assistantName}
              </h1>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handleStartNewConversation}
                disabled={hasEmptyState && !isStreaming}
                className={iconButton}
                aria-label="Start a new chat"
                title="New chat"
              >
                <SquarePen className="h-4 w-4" />
              </button>
              {onClose ? (
                <button data-bespoke-ai-close="true" type="button" onClick={onClose} className={iconButton} aria-label={`Close ${assistantName}`}>
                  <X className="h-4.5 w-4.5" />
                </button>
              ) : null}
            </div>
          </header>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            {hasEmptyState ? (
              <div data-bespoke-ai-empty-state="true" className="relative flex min-h-full items-center justify-center overflow-hidden px-4 py-7 sm:px-6">
                {isCompact ? null : (
                  <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(10,132,255,0.07),transparent_70%)]" />
                )}
                <div data-bespoke-ai-empty-content="true" className={cn("relative z-10 w-full pt-6 sm:pt-8", isCompact ? "max-w-[380px]" : "max-w-[720px]")}>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-500">{isAdmin ? "Welcome back." : "Hello there."}</p>
                    <h2 className={cn("mt-1 font-semibold leading-[1.1] tracking-[-0.035em] text-slate-950", isCompact ? "text-[1.6rem]" : "text-[clamp(1.9rem,4vw,2.6rem)]")}>{headline}</h2>
                    {isAdmin ? <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">Ask one clear question about the work. I’ll use only the admin context your role is allowed to see.</p> : null}
                  </div>
                  <div data-bespoke-ai-empty-suggestions="true" className="mt-5"><BespokeAISuggestions compact={isCompact} experience={isAdmin ? "admin" : "public"} onSelect={sendPrompt} /></div>
                  {!isCompact ? (
                    <>
                      <div className="mt-4">{composer}</div>
                      <p className="mt-2.5 text-center text-[10px] leading-4 text-slate-400">{assistantName} can make mistakes. Verify important decisions.</p>
                    </>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
                {messages.map((message) => <BespokeAIMessage key={message.id} message={message} assistantName={assistantName} />)}
                {isStreaming ? <div className="flex items-center gap-3" role="status" aria-live="polite"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ktf-blue text-white"><BespokeAIIcon className="h-3.5 w-3.5" inverse /></span><span className="flex gap-1" aria-hidden="true"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" /></span><span className="sr-only">{assistantName} is responding</span></div> : null}
                {error ? <BespokeAIErrorState assistantName={assistantName} error={error} onRetry={aiError?.canRetry ? handleRetry : undefined} showContactAction={!isAdmin} /> : null}
              </div>
            )}
          </div>

          {!hasEmptyState || isCompact ? <div className={cn("shrink-0 px-3 pb-3 pt-2 sm:px-4", isCompact ? "bg-transparent pb-[max(0.75rem,env(safe-area-inset-bottom))]" : "border-t border-slate-100 bg-white py-3")}><div className="mx-auto w-full max-w-3xl">{composer}<p className="mt-2 text-center text-[10px] text-slate-400">{assistantName} can make mistakes. Verify important decisions.</p></div></div> : null}
        </div>
      </div>
    </section>
  );
}
