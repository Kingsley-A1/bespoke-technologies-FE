"use client";

import { ImageOff } from "lucide-react";
import { newsMediaPath } from "../../content";

const SITE_HOST = "bespoketech.com.ng";

/** Approximates how WhatsApp renders the link preview for this article. */
export function WhatsAppPreview({
  title,
  description,
  shareAssetId,
}: {
  title: string;
  description: string;
  shareAssetId?: string;
}) {
  return (
    <div className="rounded-xl bg-[#d9fdd3] p-1.5 shadow-sm">
      <div className="overflow-hidden rounded-lg bg-[#c5ecc0]/60">
        {shareAssetId ? (
          // eslint-disable-next-line @next/next/no-img-element -- the exact 1200×630 file crawlers receive
          <img src={newsMediaPath(shareAssetId)} alt="" className="aspect-[1200/630] w-full object-cover" />
        ) : (
          <div className="flex aspect-[1200/630] w-full flex-col items-center justify-center gap-1 bg-slate-200 text-[11px] text-slate-500">
            <ImageOff className="h-4 w-4" /> No cover — the preview will use the generic site image
          </div>
        )}
        <div className="px-2.5 py-2">
          <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-900">{title || "Headline"}</p>
          <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-slate-600">{description || "Summary"}</p>
          <p className="mt-1 text-[11px] text-slate-500">{SITE_HOST}</p>
        </div>
      </div>
    </div>
  );
}

/** Approximates a Google search result snippet. */
export function SearchPreview({ title, description, slug }: { title: string; description: string; slug: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="truncate text-[11px] text-slate-600">
        www.{SITE_HOST} › news › {slug || "…"}
      </p>
      <p className="mt-1 line-clamp-1 text-[15px] leading-snug text-[#1a0dab]">{title || "Headline"} | Bespoke Technologies</p>
      <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-slate-600">
        {description || "Add a summary so search engines show a helpful description."}
      </p>
    </div>
  );
}
