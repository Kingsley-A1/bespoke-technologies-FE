"use client";

import { useCallback, useEffect, useState } from "react";
import type { BespokeAIUIMessage } from "@/lib/ai/bespoke-ai-types";

export type BespokeAIConversation = {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  messages: BespokeAIUIMessage[];
};

const STORAGE_KEY = "bespoke-ai-conversations:v1";
const MAX_CONVERSATIONS = 24;
const UNTITLED_CONVERSATION = "New conversation";

export function useBespokeAIConversations() {
  const [conversationState, setConversationState] = useState(() =>
    createInitialConversationState(),
  );
  const { activeConversationId, conversations } = conversationState;

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(conversations.slice(0, MAX_CONVERSATIONS)),
    );
  }, [conversations]);

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId,
  );

  const startNewConversation = useCallback(() => {
    const conversation = createConversation();

    setConversationState((current) => ({
      activeConversationId: conversation.id,
      conversations: [conversation, ...current.conversations].slice(
        0,
        MAX_CONVERSATIONS,
      ),
    }));
  }, []);

  const selectConversation = useCallback((conversationId: string) => {
    setConversationState((current) => ({
      ...current,
      activeConversationId: conversationId,
    }));
  }, []);

  const deleteConversation = useCallback(
    (conversationId: string) => {
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
    },
    [],
  );

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
          messages,
          previousTitle: existingConversation?.title,
          updatedAt: now,
        });
        const otherConversations = current.conversations.filter(
          (conversation) => conversation.id !== conversationId,
        );

        return {
          ...current,
          conversations: [nextConversation, ...otherConversations]
            .sort(
              (first, second) =>
                new Date(second.updatedAt).getTime() -
                new Date(first.updatedAt).getTime(),
            )
            .slice(0, MAX_CONVERSATIONS),
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
    selectConversation,
    startNewConversation,
    updateConversationMessages,
  };
}

function createInitialConversationState() {
  const storedConversations = readStoredConversations();
  const conversations =
    storedConversations.length > 0
      ? storedConversations
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
    preview: "Start a new Bespoke AI conversation.",
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
    messages: [],
  } satisfies BespokeAIConversation;
}

function buildConversationFromMessages({
  conversationId,
  createdAt,
  messages,
  previousTitle,
  updatedAt,
}: {
  conversationId: string;
  createdAt: string;
  messages: BespokeAIUIMessage[];
  previousTitle?: string;
  updatedAt: string;
}) {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const latestMessage = messages[messages.length - 1];
  const title =
    getMessageText(firstUserMessage) ||
    (previousTitle && previousTitle !== UNTITLED_CONVERSATION
      ? previousTitle
      : UNTITLED_CONVERSATION);
  const preview =
    getMessageText(latestMessage) || "Start a new Bespoke AI conversation.";

  return {
    id: conversationId,
    title: clampText(title, 54),
    preview: clampText(preview, 82),
    createdAt,
    updatedAt,
    messageCount: messages.length,
    messages,
  } satisfies BespokeAIConversation;
}

function readStoredConversations() {
  try {
    if (typeof window === "undefined") return [];

    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return [];

    const parsedValue = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) return [];

    return parsedValue.filter(isStoredConversation).slice(0, MAX_CONVERSATIONS);
  } catch {
    return [];
  }
}

function isStoredConversation(
  value: unknown,
): value is BespokeAIConversation {
  if (!value || typeof value !== "object") return false;

  const conversation = value as Partial<BespokeAIConversation>;
  return Boolean(
    conversation.id &&
      conversation.title &&
      conversation.createdAt &&
      conversation.updatedAt &&
      Array.isArray(conversation.messages),
  );
}

function getMessageText(message?: BespokeAIUIMessage) {
  if (!message) return "";

  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim();
}

function clampText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function createConversationId() {
  return globalThis.crypto?.randomUUID?.() ?? `bespoke-ai-${Date.now()}`;
}
