"use client";

import { useState } from "react";
import {
  Check,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BespokeAIConversation } from "./use-bespoke-ai-conversations";

type BespokeAIHistorySidebarProps = {
  activeConversationId: string;
  className?: string;
  conversations: BespokeAIConversation[];
  onClose?: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (conversationId: string, title: string) => void;
  onSelectConversation: (conversationId: string) => void;
  onTogglePinnedConversation: (conversationId: string) => void;
  showCloseButton?: boolean;
};

export function BespokeAIHistorySidebar({
  activeConversationId,
  className,
  conversations,
  onClose,
  onDeleteConversation,
  onNewConversation,
  onRenameConversation,
  onSelectConversation,
  onTogglePinnedConversation,
  showCloseButton = false,
}: BespokeAIHistorySidebarProps) {
  const [editingConversationId, setEditingConversationId] = useState<
    string | undefined
  >();
  const [editingTitle, setEditingTitle] = useState("");
  const [menuConversationId, setMenuConversationId] = useState<
    string | undefined
  >();

  const handleStartEditing = (conversation: BespokeAIConversation) => {
    setMenuConversationId(undefined);
    setEditingConversationId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleSaveTitle = (conversationId: string) => {
    onRenameConversation(conversationId, editingTitle);
    setEditingConversationId(undefined);
    setEditingTitle("");
  };

  const handleCancelEditing = () => {
    setEditingConversationId(undefined);
    setEditingTitle("");
  };

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-80 max-w-[86vw] shrink-0 flex-col border-r border-ktf-gray-200 bg-ktf-surface",
        className,
      )}
      aria-label="Bespoke AI conversation history"
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-ktf-gray-200 px-4">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-ktf-obsidian">
            Bespoke AI
          </h2>
          <p className="mt-0.5 truncate text-xs font-medium text-ktf-gray-500">
            Conversation history
          </p>
        </div>
        {onClose && showCloseButton ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ktf-gray-600 hover:bg-white hover:text-ktf-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
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

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {conversations.length > 0 ? (
          <div className="grid gap-1">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              const isEditing = editingConversationId === conversation.id;
              const isMenuOpen = menuConversationId === conversation.id;

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "group relative rounded-lg transition-colors",
                    isActive
                      ? "bg-white shadow-xs ring-1 ring-ktf-blue/20"
                      : "hover:bg-white",
                  )}
                >
                  {isEditing ? (
                    <form
                      className="flex min-h-12 items-center gap-1 p-1.5"
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleSaveTitle(conversation.id);
                      }}
                    >
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(event) =>
                          setEditingTitle(event.currentTarget.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Escape") handleCancelEditing();
                        }}
                        className="min-h-10 min-w-0 flex-1 rounded-md border border-ktf-gray-300 bg-white px-2 text-sm font-semibold text-ktf-obsidian outline-none focus:border-ktf-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
                        aria-label={`Rename ${conversation.title}`}
                      />
                      <button
                        type="submit"
                        className="flex h-10 w-10 items-center justify-center rounded-md text-ktf-blue hover:bg-ktf-blue/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
                        aria-label="Save conversation title"
                      >
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditing}
                        className="flex h-10 w-10 items-center justify-center rounded-md text-ktf-gray-500 hover:bg-ktf-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
                        aria-label="Cancel rename"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </form>
                  ) : (
                    <div className="grid min-h-12 grid-cols-[1fr_auto] items-center gap-1 p-1">
                      <button
                        type="button"
                        onClick={() => onSelectConversation(conversation.id)}
                        className="flex min-h-11 min-w-0 items-center gap-2 rounded-md px-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
                        aria-current={isActive ? "true" : undefined}
                      >
                        {conversation.isPinned ? (
                          <Pin
                            className="h-3.5 w-3.5 shrink-0 text-ktf-blue"
                            aria-hidden="true"
                          />
                        ) : (
                          <MessageSquare
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isActive
                                ? "text-ktf-blue"
                                : "text-ktf-gray-500",
                            )}
                            aria-hidden="true"
                          />
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-ktf-obsidian">
                            {conversation.title}
                          </span>
                          <span className="block truncate text-[11px] font-medium text-ktf-gray-500">
                            {formatConversationDate(conversation.updatedAt)}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setMenuConversationId(
                            isMenuOpen ? undefined : conversation.id,
                          )
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-md text-ktf-gray-500 opacity-100 transition-colors hover:bg-ktf-gray-200 hover:text-ktf-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue lg:opacity-0 lg:group-hover:opacity-100"
                        aria-expanded={isMenuOpen}
                        aria-label={`Conversation actions for ${conversation.title}`}
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}

                  {isMenuOpen ? (
                    <div className="absolute right-2 top-11 z-10 w-44 rounded-lg border border-ktf-gray-200 bg-white p-1 shadow-card">
                      <button
                        type="button"
                        onClick={() => {
                          onTogglePinnedConversation(conversation.id);
                          setMenuConversationId(undefined);
                        }}
                        className="flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-ktf-gray-700 hover:bg-ktf-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
                      >
                        {conversation.isPinned ? (
                          <PinOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Pin className="h-4 w-4" aria-hidden="true" />
                        )}
                        {conversation.isPinned ? "Unpin chat" : "Pin chat"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartEditing(conversation)}
                        className="flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-ktf-gray-700 hover:bg-ktf-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteConversation(conversation.id);
                          setMenuConversationId(undefined);
                        }}
                        className="flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-left text-sm font-medium text-ktf-error hover:bg-ktf-error/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                      </button>
                    </div>
                  ) : null}
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
