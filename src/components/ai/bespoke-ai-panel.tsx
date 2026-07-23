"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  PanelLeft,
  PanelLeftClose,
  PanelRightClose,
  PictureInPicture2,
  SquarePen,
  X,
} from "lucide-react";
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
  mode?: "page" | "panel" | "admin";
  isDocked?: boolean;
  onClose?: () => void;
  onHeaderPointerDown?: (event: React.PointerEvent<HTMLElement>) => void;
  onToggleDock?: () => void;
};

const PUBLIC_HEADLINES = [
  "Ready to build the big idea?",
  "What could we make possible today?",
  "Ready to turn the idea into a plan?",
] as const;

const ADMIN_HEADLINES = [
  "What needs your attention today?",
  "Ready to move the work forward?",
  "Where can I help you decide faster?",
] as const;

export function BespokeAIPanel({ mode = "page", isDocked = false, onClose, onHeaderPointerDown, onToggleDock }: BespokeAIPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isAdmin = mode === "admin";
  const isStandalone = mode === "page";
  const assistantName = isAdmin ? "Bespoke Coworker" : "Bespoke AI";
  const [headlineIndex, setHeadlineIndex] = useState(0);
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
  const headlines = isAdmin ? ADMIN_HEADLINES : PUBLIC_HEADLINES;

  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = window.setInterval(() => setHeadlineIndex((current) => (current + 1) % headlines.length), 7000);
    return () => window.clearInterval(timer);
  }, [headlines.length, prefersReducedMotion]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (isLoaded) updateConversationMessages(activeConversationId, messages);
  }, [activeConversationId, isLoaded, messages, updateConversationMessages]);

  const sendPrompt = (prompt: string) => sendMessage({ text: prompt });
  const handleRetry = () => { clearError(); void regenerate(); };
  const handleToggleHistory = () => {
    if (isDesktop) setIsHistoryDockOpen((current) => !current);
    else setIsHistoryDrawerOpen(true);
  };
  const handleCloseHistory = () => {
    if (isDesktop) setIsHistoryDockOpen(false);
    else setIsHistoryDrawerOpen(false);
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
      assistantName={assistantName}
      activeConversationId={activeConversationId}
      className={cn("hidden lg:flex", mode === "panel" ? "w-[42%] min-w-52 max-w-60" : "w-72 max-w-72")}
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
        isStandalone && "h-dvh bg-[#f7f9fc] p-0 sm:p-3 lg:p-5",
        mode === "panel" && "h-full",
        isAdmin && "h-[calc(100dvh-9.5rem)] min-h-[580px] rounded-lg border border-slate-200 shadow-card",
      )}
      aria-labelledby="bespoke-ai-panel-title"
    >
      <div className={cn("mx-auto flex min-h-0 flex-1 overflow-hidden bg-white", isStandalone && "max-w-[1440px] sm:rounded-lg sm:border sm:border-slate-200 sm:shadow-[0_30px_90px_-45px_rgba(15,38,71,0.45)]") }>
        {isDesktop && isHistoryDockOpen ? historySidebar : null}
        {mobileHistoryDrawer}

        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <header
            onPointerDown={onHeaderPointerDown}
            className={cn("flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-3 sm:px-5", onHeaderPointerDown && "cursor-grab touch-none select-none active:cursor-grabbing")}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <button type="button" onClick={handleToggleHistory} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-ktf-blue" aria-label={isDesktop && isHistoryDockOpen ? "Hide conversation history" : "Show conversation history"} aria-expanded={isDesktop ? isHistoryDockOpen : isHistoryDrawerOpen}>
                {isDesktop && isHistoryDockOpen ? <PanelLeftClose className="h-4.5 w-4.5" /> : <PanelLeft className="h-4.5 w-4.5" />}
              </button>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ktf-blue text-white"><BespokeAIIcon className="h-4 w-4" inverse /></span>
              <div className="min-w-0">
                <h1 id="bespoke-ai-panel-title" className="truncate text-sm font-bold text-slate-950">{assistantName}</h1>
                <p className="truncate text-[10px] font-medium text-slate-500">{isAdmin ? "Your private operations partner" : "Ideas, proof, and a clear way forward"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="mr-1 hidden items-center gap-1.5 text-[10px] font-semibold text-emerald-700 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Ready</span>
              {onToggleDock ? (
                <button type="button" onClick={onToggleDock} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-ktf-blue" aria-label={isDocked ? "Detach Bespoke AI panel" : "Dock Bespoke AI to the side"} title={isDocked ? "Detach panel" : "Dock to side"}>
                  {isDocked ? <PictureInPicture2 className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
                </button>
              ) : null}
              <button type="button" onClick={handleStartNewConversation} disabled={hasEmptyState && !isStreaming} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-ktf-blue disabled:cursor-not-allowed disabled:opacity-35" aria-label="Start a new chat" title="New chat"><SquarePen className="h-4 w-4" /></button>
              {onClose ? <button data-bespoke-ai-close="true" type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900" aria-label={`Close ${assistantName}`}><X className="h-4 w-4" /></button> : null}
            </div>
          </header>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            {hasEmptyState ? (
              <div data-bespoke-ai-empty-state="true" className="relative flex min-h-full items-center justify-center overflow-hidden px-4 py-7 sm:px-6">
                {isStandalone && !isAdmin ? (
                  <Image src="/ai/bespoke-ai-glass-orb.png" alt="" width={1672} height={909} priority className="pointer-events-none absolute left-1/2 top-[-16%] w-[min(680px,82vw)] -translate-x-1/2 opacity-[0.14] mix-blend-multiply" />
                ) : (
                  <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(10,132,255,0.07),transparent_70%)]" />
                )}
                <div data-bespoke-ai-empty-content="true" className={cn("relative z-10 w-full pt-8 sm:pt-10", mode === "panel" ? "max-w-[360px]" : "max-w-[720px]")}>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-500">{isAdmin ? "Welcome back." : "Hello there."}</p>
                    <h2 key={headlineIndex} className={cn("mt-1 animate-fade-in font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950", mode === "panel" ? "text-[1.75rem]" : "text-[clamp(1.9rem,4vw,2.75rem)]")}>{headlines[headlineIndex]}</h2>
                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">{isAdmin ? "Ask one clear question about the work. I’ll use only the admin context your role is allowed to see." : "Start with a question or choose a quick path."}</p>
                  </div>
                  <div data-bespoke-ai-empty-suggestions="true" className="mt-5"><BespokeAISuggestions compact={mode === "panel"} experience={isAdmin ? "admin" : "public"} onSelect={sendPrompt} /></div>
                  <div className="mt-4">{composer}</div>
                  <p className="mt-2.5 text-center text-[10px] leading-4 text-slate-400">{assistantName} can make mistakes. Verify important decisions.</p>
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

          {!hasEmptyState ? <div className="shrink-0 border-t border-slate-100 bg-white/96 px-3 py-3 backdrop-blur sm:px-5"><div className="mx-auto w-full max-w-3xl">{composer}<p className="mt-2 text-center text-[10px] text-slate-400">{assistantName} can make mistakes. Verify important decisions.</p></div></div> : null}
        </div>
      </div>
    </section>
  );
}
