"use client";

import { Send, Square } from "lucide-react";
import { useState } from "react";
import { Button, Textarea } from "@/components/ui";

type BespokeAIInputProps = {
  disabled?: boolean;
  isStreaming?: boolean;
  onSubmit: (message: string) => void;
  onStop: () => void;
};

export function BespokeAIInput({
  disabled,
  isStreaming,
  onSubmit,
  onStop,
}: BespokeAIInputProps) {
  const [input, setInput] = useState("");

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const nextMessage = input.trim();
        if (!nextMessage || disabled || isStreaming) return;
        onSubmit(nextMessage);
        setInput("");
      }}
    >
      <Textarea
        value={input}
        onChange={(event) => setInput(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        rows={1}
        placeholder="Ask about services, projects, reviews, or contact..."
        className="min-h-11 resize-none"
        disabled={disabled}
        aria-label="Message Bespoke AI"
      />
      {isStreaming ? (
        <Button
          type="button"
          variant="outline"
          size="md"
          className="h-11 w-11 shrink-0 px-0"
          onClick={onStop}
          aria-label="Stop response"
        >
          <Square className="h-4 w-4" aria-hidden="true" />
        </Button>
      ) : (
        <Button
          type="submit"
          size="md"
          className="h-11 w-11 shrink-0 px-0"
          disabled={disabled || !input.trim()}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
    </form>
  );
}
