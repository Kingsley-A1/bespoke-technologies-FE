"use client";

import { MessageSquare, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BespokeAIConversation } from "./use-bespoke-ai-conversations";

type BespokeAIHistorySidebarProps = {
  activeConversationId: string;
  className?: string;
  conversations: BespokeAIConversation[];
  onClose?: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onSelectConversation: (conversationId: string) => void;
};

export function BespokeAIHistorySidebar({
  activeConversationId,
  className,
  conversations,
  onClose,
  onDeleteConversation,
  onNewConversation,
  onSelectConversation,
}: BespokeAIHistorySidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-80 max-w-[86vw] shrink-0 flex-col border-r border-ktf-gray-200 bg-ktf-surface",
        className,
      )}
      aria-label="Bespoke AI conversation history"
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-ktf-gray-200 px-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-ktf-gray-700">
            AI History
          </h2>
          <p className="mt-0.5 text-xs font-medium text-ktf-gray-500">
            Continue previous chats
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ktf-gray-600 hover:bg-white hover:text-ktf-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue lg:hidden"
            aria-label="Close conversation history"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="border-b border-ktf-gray-200 p-3">
        <button
          type="button"
          onClick={onNewConversation}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-ktf-blue px-3 text-sm font-semibold text-white transition-colors hover:bg-ktf-blue-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New chat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {conversations.length > 0 ? (
          <div className="grid gap-2">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "group grid grid-cols-[1fr_auto] items-start gap-1 rounded-lg border bg-white p-1.5 shadow-xs transition-colors",
                    isActive
                      ? "border-ktf-blue/35"
                      : "border-ktf-gray-200 hover:border-ktf-blue/25",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conversation.id)}
                    className="min-w-0 rounded-md px-2.5 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
                    aria-current={isActive ? "true" : undefined}
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-ktf-blue" : "text-ktf-gray-500",
                        )}
                        aria-hidden="true"
                      />
                      <span className="truncate text-sm font-semibold text-ktf-obsidian">
                        {conversation.title}
                      </span>
                    </span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-ktf-gray-600">
                      {conversation.preview}
                    </span>
                    <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ktf-gray-500">
                      {formatConversationDate(conversation.updatedAt)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteConversation(conversation.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-ktf-gray-400 opacity-100 transition-colors hover:bg-ktf-error/8 hover:text-ktf-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue lg:opacity-0 lg:group-hover:opacity-100"
                    aria-label={`Delete conversation: ${conversation.title}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-ktf-gray-300 bg-white px-4 py-6 text-center">
            <p className="text-sm font-semibold text-ktf-obsidian">
              No conversations yet
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ktf-gray-600">
              Start with Bespoke AI and your chats will appear here.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

function formatConversationDate(value: string) {
  const updatedAt = new Date(value);
  if (Number.isNaN(updatedAt.getTime())) return "Recently";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(updatedAt);
}
