import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Download,
  FileText,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { ShareButton } from "@/components/ui/share-button";
import type { CurrencyCode, Publication, PublicationCardVariant } from "@/features/admin/types";
import { cn } from "@/lib/utils";

function coverSrc(id: string) {
  return `/api/publications/${id}/cover`;
}

function formatPrice(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "NGN" ? 0 : 2,
  }).format(amount);
}

/* ── Handover: cover-forward, locked proof. No read/download. ───────────── */

export function HandoverCard({ publication }: { publication: Publication }) {
  return (
    <Link
      href={`/library/${publication.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-ktf-gray-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-ktf-navy">
        {publication.coverKey ? (
          <Image
            src={coverSrc(publication.id)}
            alt={`Cover of ${publication.title}`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover opacity-90"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <FileText className="h-10 w-10 text-white/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ktf-navy/70 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-ktf-navy">
          <ShieldCheck className="h-3 w-3 text-ktf-blue-deep" /> Delivered to client
        </span>
        <span className="absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-ktf-navy">
          <Lock className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-body-sm font-bold leading-snug text-ktf-navy">{publication.title}</p>
        {(publication.clientLabel || publication.projectLabel) && (
          <p className="mt-1.5 text-caption text-ktf-gray-500">
            {[publication.clientLabel, publication.projectLabel].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="mt-4 flex items-center justify-between border-t border-ktf-gray-100 pt-3 text-caption font-medium text-ktf-gray-500">
          {publication.pageCount ? `${publication.pageCount}-page handover` : "Handover document"}
          <span className="inline-flex items-center gap-1 font-semibold text-ktf-blue-deep">
            Preview <ArrowRight className="h-3 w-3" />
          </span>
        </p>
      </div>
    </Link>
  );
}

/* ── Book: unconventional, per-variant styled card with price. ──────────── */

const BOOK_VARIANTS: Record<
  PublicationCardVariant,
  { spine: string; tint: string; badge: string; label: string }
> = {
  standard: {
    spine: "bg-ktf-blue-deep",
    tint: "from-ktf-blue/10",
    badge: "bg-ktf-blue/10 text-ktf-blue-deep",
    label: "Book",
  },
  "field-guide": {
    spine: "bg-emerald-600",
    tint: "from-emerald-500/10",
    badge: "bg-emerald-500/10 text-emerald-700",
    label: "Field guide",
  },
  playbook: {
    spine: "bg-ktf-gold",
    tint: "from-ktf-gold/15",
    badge: "bg-ktf-gold/15 text-amber-700",
    label: "Playbook",
  },
  "deep-dive": {
    spine: "bg-ktf-navy",
    tint: "from-ktf-navy/12",
    badge: "bg-ktf-navy/10 text-ktf-navy",
    label: "Deep dive",
  },
};

export function BookCard({ publication }: { publication: Publication }) {
  const variant = BOOK_VARIANTS[publication.cardVariant] ?? BOOK_VARIANTS.standard;
  const price = publication.isFree
    ? "Free"
    : formatPrice(publication.priceAmount ?? 0, publication.priceCurrency);

  return (
    <article className="group flex overflow-hidden rounded-xl border border-ktf-gray-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:shadow-card">
      {/* Book spine */}
      <div className={cn("w-2.5 shrink-0", variant.spine)} aria-hidden="true" />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className={cn("relative aspect-[16/10] overflow-hidden bg-gradient-to-br to-white", variant.tint)}>
          {publication.coverKey ? (
            <Image
              src={coverSrc(publication.id)}
              alt={`Cover of ${publication.title}`}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen className="h-9 w-9 text-ktf-navy/30" />
            </div>
          )}
          <span className={cn("absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]", variant.badge)}>
            {variant.label}
          </span>
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ktf-navy shadow-xs">
            {price}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="text-body-sm font-bold leading-snug text-ktf-navy">{publication.title}</p>
          {publication.authorLabel && (
            <p className="mt-1 text-caption text-ktf-gray-500">By {publication.authorLabel}</p>
          )}
          {publication.summary && (
            <p className="mt-2 line-clamp-2 text-caption leading-relaxed text-ktf-gray-600">
              {publication.summary}
            </p>
          )}
          <div className="mt-4 flex items-center gap-2 border-t border-ktf-gray-100 pt-3">
            <Link
              href={`/library/${publication.slug}`}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-ktf-blue-deep text-caption font-semibold text-white transition hover:bg-ktf-blue-pressed"
            >
              <BookOpen className="h-3.5 w-3.5" /> Read
            </Link>
            <a
              href={`/library/${publication.slug}/file?download=1`}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-ktf-gray-300 px-3 text-caption font-semibold text-ktf-navy transition hover:border-ktf-blue/40 hover:bg-ktf-blue/5"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
            <ShareButton
              title={`${publication.title} — Bespoke Technologies`}
              text={publication.summary}
              url={`/library/${publication.slug}`}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-ktf-gray-300 px-2.5 hover:border-ktf-blue/40 hover:bg-ktf-blue/5"
            >
              <span className="sr-only">Share</span>
            </ShareButton>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ── Research: paper aesthetic with monospace meta. ─────────────────────── */

export function ResearchCard({ publication }: { publication: Publication }) {
  return (
    <article className="group flex flex-col rounded-xl border border-ktf-gray-200 bg-white p-6 shadow-xs transition hover:-translate-y-0.5 hover:shadow-card">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-ktf-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-ktf-blue-deep" /> Research
        </span>
        {publication.pageCount ? <span>{publication.pageCount}pp</span> : null}
      </div>

      <div className="my-4 h-px bg-ktf-gray-100" />

      <p className="text-body font-bold leading-snug tracking-tight text-ktf-navy">
        {publication.title}
      </p>
      {publication.authorLabel && (
        <p className="mt-1.5 font-mono text-caption text-ktf-gray-500">{publication.authorLabel}</p>
      )}
      {publication.summary && (
        <p className="mt-3 line-clamp-3 text-caption leading-relaxed text-ktf-gray-600">
          {publication.summary}
        </p>
      )}

      <div className="mt-5 flex items-center gap-2 border-t border-ktf-gray-100 pt-4">
        <Link
          href={`/library/${publication.slug}`}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-ktf-navy bg-ktf-navy text-caption font-semibold text-white transition hover:bg-ktf-obsidian"
        >
          Read paper
        </Link>
        <a
          href={`/library/${publication.slug}/file?download=1`}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-ktf-gray-300 px-3 text-caption font-semibold text-ktf-navy transition hover:border-ktf-blue/40 hover:bg-ktf-blue/5"
        >
          <Download className="h-3.5 w-3.5" /> PDF
        </a>
        <ShareButton
          title={`${publication.title} — Bespoke Technologies`}
          text={publication.summary}
          url={`/library/${publication.slug}`}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-ktf-gray-300 px-2.5 hover:border-ktf-blue/40 hover:bg-ktf-blue/5"
        >
          <span className="sr-only">Share</span>
        </ShareButton>
      </div>
    </article>
  );
}
