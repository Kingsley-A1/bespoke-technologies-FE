"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
// clsx, not cn: tailwind-merge treats the custom text-caption size as a colour and drops it.
import { clsx } from "clsx";

interface NewsShareBarProps {
  title: string;
  url: string;
  className?: string;
}

/**
 * Article sharing. WhatsApp is first: its link preview reads the article's
 * Open Graph tags, so the cover appears as the share image.
 */
export function NewsShareBar({ title, url, className }: NewsShareBarProps) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const targets = [
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { label: "X", href: `https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodedUrl}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  async function nativeShare() {
    if (typeof navigator.share !== "function") return copy();
    try {
      await navigator.share({ title, url });
    } catch {
      // The reader dismissed the share sheet.
    }
  }

  const chip =
    "h-9 items-center gap-1.5 rounded-full border border-ktf-gray-200 bg-white px-3.5 text-caption font-semibold text-ktf-gray-700 transition-colors hover:border-ktf-gray-300 hover:text-ktf-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue";

  return (
    <div className={clsx("flex flex-wrap items-center gap-2", className)}>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title}\n\n${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 items-center gap-2 rounded-full bg-[#1fa855] px-4 text-caption font-semibold text-white transition-colors hover:bg-[#178a45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1fa855]"
      >
        <WhatsAppIcon className="h-4 w-4" /> Share on WhatsApp
      </a>
      {targets.map((target) => (
        <a key={target.label} href={target.href} target="_blank" rel="noopener noreferrer" className={clsx("hidden sm:inline-flex", chip)}>
          {target.label}
        </a>
      ))}
      <button type="button" onClick={() => void copy()} className={clsx("inline-flex", chip)} aria-live="polite">
        {copied ? (
          <Check className="h-3.5 w-3.5 text-ktf-success" aria-hidden="true" />
        ) : (
          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {copied ? "Link copied" : "Copy link"}
      </button>
      <button
        type="button"
        onClick={() => void nativeShare()}
        className={clsx("inline-flex sm:hidden", chip)}
        aria-label="More sharing options"
      >
        <Share2 className="h-3.5 w-3.5" aria-hidden="true" /> More
      </button>
    </div>
  );
}
