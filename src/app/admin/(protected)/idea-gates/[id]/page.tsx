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
  IDEA_GATE_DECISIONS,
  IDEA_GATE_PATH,
  IDEA_GATE_QUESTIONS,
} from "@/features/idea-gate/definition";
import {
  getIdeaGateAdminDetail,
  listIdeaGateOwners,
} from "@/features/idea-gate/repository";
import { IdeaGateAdminShareLink } from "@/features/idea-gate/share-actions";
import {
  addIdeaGateNoteAction,
  convertIdeaGateAction,
  manageIdeaGateAction,
  regenerateIdeaGateShareAction,
  revokeIdeaGateShareAction,
} from "../actions";

export default async function IdeaGateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPermission("idea_gates.view");
  const { id } = await params;
  const [detail, owners] = await Promise.all([
    getIdeaGateAdminDetail(id),
    listIdeaGateOwners(),
  ]);
  if (!detail) notFound();
  const { assessment, notes, events } = detail;
  const decision = assessment.result
    ? IDEA_GATE_DECISIONS[assessment.result.decision]
    : undefined;

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader
          title={assessment.ideaTitle}
          description={`${assessment.ideaStage} · ${assessment.ownerRole} · started ${formatAdminDate(assessment.startedAt)}`}
          action={
            <div className="flex gap-2">
              <StatusPill value={assessment.status} />
              <StatusPill value={assessment.managementState} />
            </div>
          }
        />
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Fact
                label="Progress"
                value={`${assessment.progressCount}/${IDEA_GATE_QUESTIONS.length}`}
              />
              <Fact
                label="Score"
                value={
                  assessment.totalScore === undefined
                    ? "Incomplete"
                    : `${assessment.totalScore}/20`
                }
              />
              <Fact label="Verdict" value={decision?.label ?? "Pending"} />
            </div>
            <div className="rounded-lg border border-slate-200 p-4 text-xs leading-5 text-slate-600">
              <p className="mb-3 text-slate-700">{assessment.ideaSummary}</p>
              <p>
                <strong className="text-slate-800">Contact:</strong>{" "}
                {assessment.contactName || "Not provided"}
              </p>
              <p>
                <strong className="text-slate-800">Email:</strong>{" "}
                {assessment.email || "Not provided"}
              </p>
              <p>
                <strong className="text-slate-800">Phone:</strong>{" "}
                {assessment.phone || "Not provided"}
              </p>
              <p>
                <strong className="text-slate-800">Follow-up:</strong>{" "}
                {assessment.contactConsent ? "Permitted" : "Not permitted"}
              </p>
              <p>
                <strong className="text-slate-800">Source:</strong> {assessment.source}
              </p>
              <p>
                <strong className="text-slate-800">Analysis:</strong>{" "}
                {assessment.analysis?.source === "assisted"
                  ? "Framework score, AI-written narrative"
                  : "Framework only"}
              </p>
            </div>
            {assessment.shareToken && (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`${IDEA_GATE_PATH}/report/${assessment.shareToken}`}
                  target="_blank"
                  className={secondaryButtonClass}
                >
                  View shared report <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <IdeaGateAdminShareLink
                  shareToken={assessment.shareToken}
                  className={secondaryButtonClass}
                />
              </div>
            )}
          </div>
          <form action={manageIdeaGateAction} className="rounded-lg bg-slate-50 p-4">
            <input type="hidden" name="id" value={assessment.id} />
            <label className={labelClass}>Management state</label>
            <select
              name="managementState"
              defaultValue={assessment.managementState}
              className={inputClass}
            >
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="contacted">Contacted</option>
              {assessment.leadId && <option value="converted">Converted</option>}
              <option value="closed">Closed</option>
            </select>
            <label className={`${labelClass} mt-4`}>Owner</label>
            <select
              name="ownerUserId"
              defaultValue={assessment.ownerUserId ?? ""}
              className={inputClass}
            >
              <option value="">Unassigned</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.displayName}
                </option>
              ))}
            </select>
            <button className={`${primaryButtonClass} mt-4`}>Save management state</button>
          </form>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Panel>
          <PanelHeader
            title="Gate answers"
            description="The exact evidence level saved for each versioned gate, with the notes written by the submitter."
          />
          <div className="divide-y divide-slate-100">
            {IDEA_GATE_QUESTIONS.map((gate) => {
              const answer = assessment.answers[gate.id];
              return (
                <article key={gate.id} className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {gate.number}. {gate.label}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{gate.question}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                      {answer === undefined ? "Unanswered" : `${answer.score}/2`}
                    </span>
                  </div>
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
                    {answer === undefined
                      ? "No answer saved."
                      : gate.options[answer.optionIndex]?.label}
                  </p>
                  {answer?.evidence && (
                    <p className="mt-2 border-l-2 border-slate-200 pl-3 text-xs leading-5 text-slate-500">
                      {answer.evidence}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title="Management actions"
              action={<UserRoundCheck className="h-4 w-4 text-blue-700" />}
            />
            <div className="space-y-3 p-5">
              {!assessment.leadId ? (
                <form action={convertIdeaGateAction}>
                  <input type="hidden" name="id" value={assessment.id} />
                  <button
                    disabled={
                      (!assessment.email && !assessment.phone) || !assessment.contactConsent
                    }
                    className={`${primaryButtonClass} w-full`}
                  >
                    Convert to sales lead
                  </button>
                  {!assessment.email && !assessment.phone && (
                    <p className="mt-2 text-[11px] text-amber-700">
                      Contact details are required for conversion.
                    </p>
                  )}
                  {(assessment.email || assessment.phone) && !assessment.contactConsent && (
                    <p className="mt-2 text-[11px] text-amber-700">
                      This submitter did not permit follow-up, so CRM conversion is disabled.
                    </p>
                  )}
                </form>
              ) : (
                <Link href="/admin/sales" className={`${secondaryButtonClass} w-full`}>
                  View linked sales lead
                </Link>
              )}
              {assessment.status === "completed" &&
                (assessment.shareToken ? (
                  <form action={revokeIdeaGateShareAction}>
                    <input type="hidden" name="id" value={assessment.id} />
                    <button className={`${secondaryButtonClass} w-full`}>
                      <Link2 className="h-3.5 w-3.5" /> Revoke share link
                    </button>
                  </form>
                ) : (
                  <form action={regenerateIdeaGateShareAction}>
                    <input type="hidden" name="id" value={assessment.id} />
                    <button className={`${secondaryButtonClass} w-full`}>
                      <Link2 className="h-3.5 w-3.5" /> Generate new share link
                    </button>
                  </form>
                ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Internal notes"
              action={<MessageSquareText className="h-4 w-4 text-blue-700" />}
            />
            <form action={addIdeaGateNoteAction} className="border-b border-slate-100 p-5">
              <input type="hidden" name="id" value={assessment.id} />
              <textarea
                name="body"
                className={textareaClass}
                required
                placeholder="Add an internal follow-up note…"
              />
              <button className={`${primaryButtonClass} mt-3`}>Add note</button>
            </form>
            {notes.length === 0 ? (
              <EmptyPanel title="No notes yet" body="Add context for review and follow-up." />
            ) : (
              <div className="divide-y divide-slate-100">
                {notes.map((note) => (
                  <article key={note.id} className="p-5">
                    <p className="text-xs leading-5 text-slate-700">{note.body}</p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      {note.actorLabel} · {formatAdminDate(note.createdAt)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {assessment.analysis && (
        <Panel>
          <PanelHeader
            title="Generated analysis"
            description="Written from the gate answers. The score and verdict come from the framework only."
          />
          <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-3">
            <AnalysisBlock title="Summary" items={[assessment.analysis.summary]} />
            <AnalysisBlock title="Key risks" items={assessment.analysis.risks} />
            <AnalysisBlock title="Next actions" items={assessment.analysis.nextActions} />
          </div>
        </Panel>
      )}

      <Panel>
        <PanelHeader
          title="Assessment lifecycle"
          description="Public lifecycle events; administrative changes remain in Activity."
        />
        <div className="divide-y divide-slate-100">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between gap-4 px-5 py-3 text-xs"
            >
              <span className="font-semibold text-slate-700">
                {event.type.replaceAll(".", " ")}
              </span>
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
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function AnalysisBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <p className="text-[11px] font-bold uppercase text-blue-700">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="text-xs leading-5 text-slate-600">
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
