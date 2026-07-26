import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Link2, MessageSquareText, UserRoundCheck } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import {
  EmptyPanel,
  Panel,
  PanelHeader,
  StatusPill,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from "@/features/admin/components/admin-ui";
import { formatAdminDate } from "@/features/admin/billing/money";
import {
  getDigitalAuditAdminDetail,
  listDigitalAuditOwners,
} from "@/features/digital-audits/repository";
import {
  DIGITAL_AUDIT_QUESTIONS,
  DIGITAL_AUDIT_RECOMMENDATIONS,
} from "@/features/digital-audits/definition";
import { DigitalAuditAdminShareLink } from "@/features/digital-audits/share-actions";
import {
  addDigitalAuditNoteAction,
  convertDigitalAuditAction,
  manageDigitalAuditAction,
  regenerateDigitalAuditShareAction,
  revokeDigitalAuditShareAction,
} from "../actions";

export default async function DigitalAuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPermission("digital_audits.view");
  const { id } = await params;
  const [detail, owners] = await Promise.all([
    getDigitalAuditAdminDetail(id),
    listDigitalAuditOwners(),
  ]);
  if (!detail) notFound();
  const { audit, notes, events } = detail;

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title={audit.businessName}
          description={`${audit.industry} · ${audit.teamSize} people · started ${formatAdminDate(audit.startedAt)}`}
          action={<div className="flex gap-2"><StatusPill value={audit.status} /><StatusPill value={audit.managementState} /></div>}
        />
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Fact label="Progress" value={`${audit.progressCount}/6`} />
              <Fact label="Score" value={audit.overallScore === undefined ? "Incomplete" : `${audit.overallScore}/100`} />
              <Fact label="Tier" value={audit.tier || "Pending"} />
            </div>
            <div className="rounded-lg border border-slate-200 p-4 text-xs leading-5 text-slate-600">
              <p><strong className="text-slate-800">Email:</strong> {audit.email || "Not provided"}</p>
              <p><strong className="text-slate-800">Phone:</strong> {audit.phone || "Not provided"}</p>
              <p><strong className="text-slate-800">Follow-up:</strong> {audit.contactConsent ? "Permitted" : "Not permitted"}</p>
              <p><strong className="text-slate-800">Source:</strong> {audit.source}</p>
            </div>
            {audit.shareToken && (
              <div className="flex flex-wrap gap-2">
                <Link href={`/digital-readiness-audit/report/${audit.shareToken}`} target="_blank" className={secondaryButtonClass}>
                  View shared report <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <DigitalAuditAdminShareLink shareToken={audit.shareToken} className={secondaryButtonClass} />
              </div>
            )}
          </div>
          <form action={manageDigitalAuditAction} className="rounded-lg bg-slate-50 p-4">
            <input type="hidden" name="id" value={audit.id} />
            <label className={labelClass}>Management state</label>
            <select name="managementState" defaultValue={audit.managementState} className={inputClass}>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="contacted">Contacted</option>
              {audit.leadId && <option value="converted">Converted</option>}
              <option value="closed">Closed</option>
            </select>
            <label className={`${labelClass} mt-4`}>Owner</label>
            <select name="ownerUserId" defaultValue={audit.ownerUserId ?? ""} className={inputClass}>
              <option value="">Unassigned</option>
              {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.displayName}</option>)}
            </select>
            <button className={`${primaryButtonClass} mt-4`}>Save management state</button>
          </form>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel>
          <PanelHeader title="Assessment answers" description="The exact maturity choice saved for each versioned question." />
          <div className="divide-y divide-slate-100">
            {DIGITAL_AUDIT_QUESTIONS.map((question) => {
              const maturity = audit.answers[question.id];
              const answer = maturity === undefined ? undefined : question.options.find((option) => option.maturity === maturity);
              return (
                <article key={question.id} className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{question.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{question.prompt}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                      {maturity === undefined ? "Unanswered" : `${Math.round((maturity / 3) * 100)}/100`}
                    </span>
                  </div>
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
                    {answer?.label ?? "No answer saved."}
                  </p>
                </article>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Management actions" action={<UserRoundCheck className="h-4 w-4 text-blue-700" />} />
            <div className="space-y-3 p-5">
              {!audit.leadId ? (
                <form action={convertDigitalAuditAction}>
                  <input type="hidden" name="id" value={audit.id} />
                  <button
                    disabled={(!audit.email && !audit.phone) || !audit.contactConsent}
                    className={`${primaryButtonClass} w-full`}
                  >
                    Convert to sales lead
                  </button>
                  {(!audit.email && !audit.phone) && (
                    <p className="mt-2 text-[11px] text-amber-700">
                      Contact details are required for conversion.
                    </p>
                  )}
                  {(audit.email || audit.phone) && !audit.contactConsent && (
                    <p className="mt-2 text-[11px] text-amber-700">
                      This participant did not permit follow-up, so CRM conversion is disabled.
                    </p>
                  )}
                </form>
              ) : (
                <Link href="/admin/sales" className={`${secondaryButtonClass} w-full`}>View linked sales lead</Link>
              )}
              {audit.status === "completed" && (
                audit.shareToken ? (
                  <form action={revokeDigitalAuditShareAction}>
                    <input type="hidden" name="id" value={audit.id} />
                    <button className={`${secondaryButtonClass} w-full`}><Link2 className="h-3.5 w-3.5" /> Revoke share link</button>
                  </form>
                ) : (
                  <form action={regenerateDigitalAuditShareAction}>
                    <input type="hidden" name="id" value={audit.id} />
                    <button className={`${secondaryButtonClass} w-full`}><Link2 className="h-3.5 w-3.5" /> Generate new share link</button>
                  </form>
                )
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Internal notes" action={<MessageSquareText className="h-4 w-4 text-blue-700" />} />
            <form action={addDigitalAuditNoteAction} className="border-b border-slate-100 p-5">
              <input type="hidden" name="id" value={audit.id} />
              <textarea name="body" className={textareaClass} required placeholder="Add an internal follow-up note…" />
              <button className={`${primaryButtonClass} mt-3`}>Add note</button>
            </form>
            {notes.length === 0 ? (
              <EmptyPanel title="No notes yet" body="Add context for review and follow-up." />
            ) : (
              <div className="divide-y divide-slate-100">
                {notes.map((note) => (
                  <article key={note.id} className="p-5">
                    <p className="text-xs leading-5 text-slate-700">{note.body}</p>
                    <p className="mt-2 text-[11px] text-slate-400">{note.actorLabel} · {formatAdminDate(note.createdAt)}</p>
                  </article>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {audit.result && (
        <Panel>
          <PanelHeader title="Recommended priorities" description="Generated from the three lowest dimension scores." />
          <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-3">
            {audit.result.weakest.map((dimension) => {
              const recommendation = DIGITAL_AUDIT_RECOMMENDATIONS[dimension.id];
              return (
                <article key={dimension.id} className="rounded-lg border border-slate-200 p-4">
                  <p className="text-[11px] font-bold uppercase text-blue-700">{dimension.short} · {dimension.score}/100</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">{recommendation.title}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{recommendation.move}</p>
                </article>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel>
        <PanelHeader title="Audit lifecycle" description="Public lifecycle events; administrative changes remain in Activity." />
        <div className="divide-y divide-slate-100">
          {events.map((event) => (
            <div key={event.id} className="flex items-center justify-between gap-4 px-5 py-3 text-xs">
              <span className="font-semibold text-slate-700">{event.type.replaceAll(".", " ")}</span>
              <span className="text-slate-400">{formatAdminDate(event.createdAt)}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}
