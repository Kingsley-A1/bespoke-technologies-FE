"use client";

import { useCallback, useEffect, useState } from "react";
import type { BespokeAIUIMessage } from "@/lib/ai/bespoke-ai-types";

type BespokeAIConversationTitleSource = "generated" | "manual";

export type BespokeAIConversation = {
  id: string;
  title: string;
  titleSource: BespokeAIConversationTitleSource;
  preview: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  isPinned: boolean;
  messages: BespokeAIUIMessage[];
};

type ConversationState = {
  activeConversationId: string;
  conversations: BespokeAIConversation[];
};

const PUBLIC_STORAGE_KEY = "bespoke-ai-conversations:v1";
const MAX_CONVERSATIONS = 24;
const UNTITLED_CONVERSATION = "New conversation";

export function useBespokeAIConversations(storageKey: string | null = PUBLIC_STORAGE_KEY) {
  const [conversationState, setConversationState] = useState<ConversationState>(
    () => createInitialConversationState(storageKey),
  );
  const { activeConversationId, conversations } = conversationState;

  useEffect(() => {
    if (typeof window === "undefined" || !storageKey) return;

    window.localStorage.setItem(
      storageKey,
      JSON.stringify(conversations.slice(0, MAX_CONVERSATIONS)),
    );
  }, [conversations, storageKey]);

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );

  const startNewConversation = useCallback(() => {
    const conversation = createConversation();

    setConversationState((current) => ({
      activeConversationId: conversation.id,
      conversations: sortConversations([
        conversation,
        ...current.conversations,
      ]).slice(0, MAX_CONVERSATIONS),
    }));
  }, []);

  const selectConversation = useCallback((conversationId: string) => {
    setConversationState((current) => ({
      ...current,
      activeConversationId: conversationId,
    }));
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversationState((current) => {
      const nextConversations = current.conversations.filter(
        (conversation) => conversation.id !== conversationId,
      );

      if (conversationId === current.activeConversationId) {
        const nextActiveConversation =
          nextConversations[0] ?? createConversation();

        return {
          activeConversationId: nextActiveConversation.id,
          conversations:
            nextConversations.length > 0
              ? nextConversations
              : [nextActiveConversation],
        };
      }

      return {
        ...current,
        conversations: nextConversations,
      };
    });
  }, []);

  const renameConversation = useCallback(
    (conversationId: string, title: string) => {
      const nextTitle = clampText(title.trim(), 64);
      if (!nextTitle) return;

      setConversationState((current) => ({
        ...current,
        conversations: sortConversations(
          current.conversations.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  title: nextTitle,
                  titleSource: "manual",
                  updatedAt: new Date().toISOString(),
                }
              : conversation,
          ),
        ),
      }));
    },
    [],
  );

  const togglePinnedConversation = useCallback((conversationId: string) => {
    setConversationState((current) => ({
      ...current,
      conversations: sortConversations(
        current.conversations.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                isPinned: !conversation.isPinned,
                updatedAt: new Date().toISOString(),
              }
            : conversation,
        ),
      ),
    }));
  }, []);

  const updateConversationMessages = useCallback(
    (conversationId: string, messages: BespokeAIUIMessage[]) => {
      const now = new Date().toISOString();

      setConversationState((current) => {
        const existingConversation = current.conversations.find(
          (conversation) => conversation.id === conversationId,
        );
        const nextConversation = buildConversationFromMessages({
          conversationId,
          createdAt: existingConversation?.createdAt ?? now,
          isPinned: existingConversation?.isPinned ?? false,
          messages,
          previousTitle: existingConversation?.title,
          previousTitleSource: existingConversation?.titleSource,
          updatedAt: now,
        });
        const otherConversations = current.conversations.filter(
          (conversation) => conversation.id !== conversationId,
        );

        return {
          ...current,
          conversations: sortConversations([
            nextConversation,
            ...otherConversations,
          ]).slice(0, MAX_CONVERSATIONS),
        };
      });
    },
    [],
  );

  return {
    activeConversation,
    activeConversationId,
    conversations,
    deleteConversation,
    isLoaded: true,
    renameConversation,
    selectConversation,
    startNewConversation,
    togglePinnedConversation,
    updateConversationMessages,
  };
}

function createInitialConversationState(storageKey: string | null): ConversationState {
  const storedConversations = readStoredConversations(storageKey);
  const conversations =
    storedConversations.length > 0
      ? sortConversations(storedConversations)
      : [createConversation()];

  return {
    activeConversationId: conversations[0].id,
    conversations,
  };
}

function createConversation(conversationId = createConversationId()) {
  const now = new Date().toISOString();

  return {
    id: conversationId,
    title: UNTITLED_CONVERSATION,
    titleSource: "generated",
    preview: "Start a new conversation.",
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
    isPinned: false,
    messages: [],
  } satisfies BespokeAIConversation;
}

function buildConversationFromMessages({
  conversationId,
  createdAt,
  isPinned,
  messages,
  previousTitle,
  previousTitleSource,
  updatedAt,
}: {
  conversationId: string;
  createdAt: string;
  isPinned: boolean;
  messages: BespokeAIUIMessage[];
  previousTitle?: string;
  previousTitleSource?: BespokeAIConversationTitleSource;
  updatedAt: string;
}) {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const latestMessage = messages[messages.length - 1];
  const title =
    previousTitleSource === "manual" && previousTitle
      ? previousTitle
      : createConversationTopic(getMessageText(firstUserMessage));
  const preview =
    getMessageText(latestMessage) || "Start a new conversation.";

  return {
    id: conversationId,
    title,
    titleSource:
      previousTitleSource === "manual" && previousTitle
        ? "manual"
        : "generated",
    preview: clampText(preview, 82),
    createdAt,
    updatedAt,
    messageCount: messages.length,
    isPinned,
    messages,
  } satisfies BespokeAIConversation;
}

function readStoredConversations(storageKey: string | null) {
  try {
    if (typeof window === "undefined" || !storageKey) return [];

    const storedValue = window.localStorage.getItem(storageKey);
    if (!storedValue) return [];

    const parsedValue = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) return [];

    return parsedValue
      .map(normalizeStoredConversation)
      .filter((conversation): conversation is BespokeAIConversation =>
        Boolean(conversation),
      )
      .slice(0, MAX_CONVERSATIONS);
  } catch {
    return [];
  }
}

function normalizeStoredConversation(value: unknown) {
  if (!value || typeof value !== "object") return undefined;

  const conversation = value as Partial<BespokeAIConversation>;
  if (
    !conversation.id ||
    !conversation.title ||
    !conversation.createdAt ||
    !conversation.updatedAt ||
    !Array.isArray(conversation.messages)
  ) {
    return undefined;
  }

  return {
    id: conversation.id,
    title: clampText(conversation.title, 64),
    titleSource:
      conversation.titleSource === "manual" ? "manual" : "generated",
    preview:
      conversation.preview ||
      getMessageText(conversation.messages[conversation.messages.length - 1]) ||
      "Start a new conversation.",
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messageCount:
      typeof conversation.messageCount === "number"
        ? conversation.messageCount
        : conversation.messages.length,
    isPinned: Boolean(conversation.isPinned),
    messages: conversation.messages,
  } satisfies BespokeAIConversation;
}

function createConversationTopic(value: string) {
  const topic = value.replace(/\s+/g, " ").replace(/[?.!]+$/g, "").trim();
  if (!topic) return UNTITLED_CONVERSATION;

  return clampText(topic, 64);
}

function getMessageText(message?: BespokeAIUIMessage) {
  if (!message) return "";

  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim();
}

function sortConversations(conversations: BespokeAIConversation[]) {
  return [...conversations].sort((first, second) => {
    if (first.isPinned !== second.isPinned) return first.isPinned ? -1 : 1;

    return (
      new Date(second.updatedAt).getTime() -
      new Date(first.updatedAt).getTime()
    );
  });
}

function clampText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function createConversationId() {
  return globalThis.crypto?.randomUUID?.() ?? `bespoke-ai-${Date.now()}`;
}
