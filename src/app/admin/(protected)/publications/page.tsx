import { BookOpen, FileText, FlaskConical, Plus } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { listPublications } from "@/features/admin/publications/repository";
import { formatAdminDate, formatMoney } from "@/features/admin/billing/money";
import { EmptyPanel, Panel, PanelHeader, StatusPill } from "@/features/admin/components/admin-ui";
import { isR2Configured } from "@/lib/storage/r2";
import type { Publication, PublicationKind } from "@/features/admin/types";
import { PublicationUploader } from "./publication-uploader";
import { deletePublicationAction, setPublicationStatusAction } from "./actions";

const KIND_META: Record<PublicationKind, { label: string; icon: typeof BookOpen }> = {
  handover: { label: "Handover doc", icon: FileText },
  book: { label: "Book", icon: BookOpen },
  research: { label: "Research", icon: FlaskConical },
};

export default async function AdminPublicationsPage() {
  await requireAdminPermission("publications.manage");
  const publications = await listPublications();
  const storageReady = isR2Configured();

  return (
    <div className="space-y-6">
      {!storageReady && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <p className="font-semibold">Document storage is not configured.</p>
          <p className="mt-1 leading-5">
            Add the Cloudflare R2 environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
            R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME) to enable uploads.
          </p>
        </div>
      )}

      <Panel>
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-base font-bold text-slate-950">Add a publication</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Upload a handover document, book, or research paper with a cover and page count.
              </p>
            </div>
            <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 group-open:hidden">
              <Plus className="h-4 w-4" /> New
            </span>
          </summary>
          <div className="border-t border-slate-200">
            <PublicationUploader />
          </div>
        </details>
      </Panel>

      <Panel>
        <PanelHeader
          title="Publications"
          description="Everything uploaded to the public library and home page sections."
        />
        {publications.length === 0 ? (
          <EmptyPanel
            title="No publications yet"
            body="Upload your first handover document, book, or research paper to begin."
          />
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
            {publications.map((publication) => (
              <PublicationCard key={publication.id} publication={publication} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function PublicationCard({ publication }: { publication: Publication }) {
  const meta = KIND_META[publication.kind];
  const Icon = meta.icon;
  const priceLabel =
    publication.kind !== "book"
      ? null
      : publication.isFree
        ? "Free"
        : formatMoney(publication.priceAmount ?? 0, publication.priceCurrency);

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
          <Icon className="h-4 w-4 text-ktf-blue-deep" /> {meta.label}
        </span>
        <StatusPill value={publication.status} />
      </div>

      <p className="mt-3 text-sm font-bold leading-snug text-slate-900">{publication.title}</p>
      {publication.kind === "handover" && (publication.clientLabel || publication.projectLabel) && (
        <p className="mt-1 text-xs text-slate-500">
          {[publication.clientLabel, publication.projectLabel].filter(Boolean).join(" · ")}
        </p>
      )}
      <p className="mt-2 text-[11px] text-slate-400">
        {publication.pageCount ? `${publication.pageCount} pages · ` : ""}
        {priceLabel ? `${priceLabel} · ` : ""}
        Updated {formatAdminDate(publication.updatedAt)}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <a
          href={`/admin/api/publications/${publication.id}/file`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
        >
          View file
        </a>
        {publication.status !== "published" && (
          <form action={setPublicationStatusAction}>
            <input type="hidden" name="id" value={publication.id} />
            <input type="hidden" name="status" value="published" />
            <button className="inline-flex h-8 items-center rounded-lg bg-slate-950 px-2.5 text-[11px] font-semibold text-white">
              Publish
            </button>
          </form>
        )}
        {publication.status === "published" && (
          <form action={setPublicationStatusAction}>
            <input type="hidden" name="id" value={publication.id} />
            <input type="hidden" name="status" value="archived" />
            <button className="inline-flex h-8 items-center rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
              Archive
            </button>
          </form>
        )}
        <details className="ml-auto">
          <summary className="cursor-pointer text-[11px] font-semibold text-rose-700">Delete</summary>
          <form action={deletePublicationAction} className="mt-2">
            <input type="hidden" name="id" value={publication.id} />
            <button className="inline-flex h-8 items-center rounded-lg border border-rose-200 px-2.5 text-[11px] font-semibold text-rose-700">
              Confirm delete
            </button>
          </form>
        </details>
      </div>
    </article>
  );
}
