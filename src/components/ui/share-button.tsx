"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  /** Share sheet title (used by the native share dialog). */
  title: string;
  /** Short share text shown alongside the link. */
  text?: string;
  /** Absolute or site-relative URL to share. */
  url: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * One-tap sharing: opens the native share sheet where available (mobile,
 * WhatsApp targets included) and falls back to copying the link with clear
 * "Copied" feedback everywhere else.
 */
export function ShareButton({ title, text, url, className, children }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const absoluteUrl = url.startsWith("http")
      ? url
      : `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url: absoluteUrl });
        return;
      } catch {
        // Dismissed or unsupported target — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — nothing further to do.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      className={cn(
        "inline-flex items-center gap-1.5 text-caption font-semibold text-ktf-gray-500 transition-colors hover:text-ktf-blue-deep",
        className,
      )}
      aria-label={copied ? "Link copied" : `Share: ${title}`}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-ktf-success" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
          {children ?? "Share"}
        </>
      )}
    </button>
  );
}
