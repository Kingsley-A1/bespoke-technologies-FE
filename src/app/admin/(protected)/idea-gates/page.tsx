import Link from "next/link";
import {
  CheckCircle2,
  CircleDot,
  Clock3,
  Download,
  Lightbulb,
  UserRoundCheck,
} from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { hasPermission } from "@/features/admin/permissions";
import {
  EmptyPanel,
  MetricCard,
  Panel,
  PanelHeader,
  StatusPill,
  inputClass,
} from "@/features/admin/components/admin-ui";
import { formatAdminDate } from "@/features/admin/billing/money";
import { IDEA_GATE_PATH, IDEA_GATE_QUESTIONS } from "@/features/idea-gate/definition";
import { getIdeaGateMetrics, listIdeaGates } from "@/features/idea-gate/repository";
import { IdeaGateAdminShareLink } from "@/features/idea-gate/share-actions";

const STATUS_FILTERS = [
  ["All", ""],
  ["Incomplete", "incomplete"],
  ["Completed", "completed"],
  ["Archived", "archived"],
] as const;

export default async function IdeaGatesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    management?: string;
    decision?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const session = await requireAdminPermission("idea_gates.view");
  const params = await searchParams;
  const status = params.status ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const [metrics, listing] = await Promise.all([
    getIdeaGateMetrics(),
    listIdeaGates({
      status: status || undefined,
      managementState: params.management || undefined,
      decision: params.decision || undefined,
      query: params.q,
      page,
    }),
  ]);
  const items = listing.items;
  const pageCount = Math.max(1, Math.ceil(listing.total / listing.pageSize));
  const queryString = (targetPage: number) => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (params.management) query.set("management", params.management);
    if (params.decision) query.set("decision", params.decision);
    if (params.q) query.set("q", params.q);
    query.set("page", String(targetPage));
    return `/admin/idea-gates?${query}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Ideas submitted"
          value={String(metrics.total)}
          detail="Context submitted"
          icon={Lightbulb}
        />
        <MetricCard
          label="Completed"
          value={String(metrics.completed)}
          detail={`${metrics.completionRate}% completion rate`}
          icon={CheckCircle2}
          tone="green"
        />
        <MetricCard
          label="Incomplete"
          value={String(metrics.incomplete)}
          detail="Started or in progress"
          icon={Clock3}
          tone="amber"
        />
        <MetricCard
          label="Green verdicts"
          value={String(metrics.green)}
          detail={`${metrics.amber} amber · ${metrics.red} red`}
          icon={CircleDot}
          tone="green"
        />
        <MetricCard
          label="Converted"
          value={String(metrics.converted)}
          detail="Linked to sales pipeline"
          icon={UserRoundCheck}
          tone="blue"
        />
      </div>

      <Panel>
        <PanelHeader
          title="Idea Execution Gates"
          description="Public assessments of ideas against the ten execution gates, with consent and CRM conversion kept explicit."
          action={
            hasPermission(session.role, "idea_gates.export") ? (
              <a
                href="/admin/api/idea-gates/export"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600"
              >
                <Download className="h-4 w-4" /> Export CSV
              </a>
            ) : undefined
          }
        />
        <div className="space-y-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map(([label, value]) => (
              <Link
                key={label}
                href={value ? `/admin/idea-gates?status=${value}` : "/admin/idea-gates"}
                className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${
                  status === value
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 text-slate-600"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <form className="flex flex-col gap-2 sm:flex-row">
            {status && <input type="hidden" name="status" value={status} />}
            <input
              name="q"
              defaultValue={params.q}
              className={inputClass}
              placeholder="Search idea, name, email or phone"
            />
            <select
              name="decision"
              defaultValue={params.decision}
              className={`${inputClass} sm:max-w-40`}
            >
              <option value="">All verdicts</option>
              <option value="green">Green</option>
              <option value="amber">Amber</option>
              <option value="red">Red</option>
            </select>
            <select
              name="management"
              defaultValue={params.management}
              className={`${inputClass} sm:max-w-48`}
            >
              <option value="">All management states</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
            </select>
            <button className="h-10 rounded-lg bg-slate-950 px-4 text-xs font-semibold text-white">
              Filter
            </button>
          </form>
        </div>

        {items.length === 0 ? (
          <EmptyPanel
            title="No matching assessments"
            body="New assessments appear once a visitor submits the idea context step."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Idea</th>
                  <th className="px-4 py-3 font-semibold">Progress</th>
                  <th className="px-4 py-3 font-semibold">Result</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Management</th>
                  <th className="px-5 py-3 font-semibold">Last activity</th>
                  <th className="px-5 py-3 font-semibold">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <Link
                        href={`/admin/idea-gates/${assessment.id}`}
                        className="font-bold text-slate-900 hover:text-blue-700"
                      >
                        {assessment.ideaTitle}
                      </Link>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {assessment.ideaStage} · {assessment.ownerRole}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill value={assessment.status} />
                      <p className="mt-1.5 text-[11px] text-slate-500">
                        {assessment.progressCount}/{IDEA_GATE_QUESTIONS.length} answered
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {assessment.totalScore === undefined ? (
                        <span className="text-slate-400">Pending</span>
                      ) : (
                        <>
                          <p className="font-bold text-slate-900">{assessment.totalScore}/20</p>
                          <p className="mt-1 text-[11px] capitalize text-slate-500">
                            {assessment.decision} · {assessment.gatesPassed}/10 passed
                          </p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="max-w-48 truncate text-slate-700">
                        {assessment.email || assessment.phone || "Not provided"}
                      </p>
                      <p
                        className={`mt-1 text-[11px] ${
                          assessment.contactConsent ? "text-emerald-700" : "text-slate-400"
                        }`}
                      >
                        {assessment.contactConsent
                          ? "Follow-up permitted"
                          : "No follow-up consent"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill value={assessment.managementState} />
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {formatAdminDate(assessment.lastActivityAt)}
                    </td>
                    <td className="px-5 py-4">
                      {assessment.shareToken ? (
                        <div className="flex items-center gap-2">
                          <Link
                            href={`${IDEA_GATE_PATH}/report/${assessment.shareToken}`}
                            target="_blank"
                            className="font-semibold text-blue-700 hover:text-blue-900"
                          >
                            View
                          </Link>
                          <IdeaGateAdminShareLink
                            shareToken={assessment.shareToken}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[11px] font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-700"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-400">
                          {assessment.status === "completed"
                            ? "Generate in record"
                            : "Available when complete"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
          <span>
            Page {page} of {pageCount} · {listing.total} records
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={queryString(page - 1)}
                className="rounded border border-slate-200 px-3 py-1.5 font-semibold"
              >
                Previous
              </Link>
            )}
            {page < pageCount && (
              <Link
                href={queryString(page + 1)}
                className="rounded border border-slate-200 px-3 py-1.5 font-semibold"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
