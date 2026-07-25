import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  RefreshCcw,
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
import {
  getDigitalAuditMetrics,
  listDigitalAudits,
} from "@/features/digital-audits/repository";

const STATUS_FILTERS = [
  ["All", ""],
  ["Incomplete", "incomplete"],
  ["Completed", "completed"],
  ["Archived", "archived"],
] as const;

export default async function DigitalAuditsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    management?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const session = await requireAdminPermission("digital_audits.view");
  const params = await searchParams;
  const status = params.status ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const [metrics, listing] = await Promise.all([
    getDigitalAuditMetrics(),
    listDigitalAudits({
      status: status || undefined,
      managementState: params.management || undefined,
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
    if (params.q) query.set("q", params.q);
    query.set("page", String(targetPage));
    return `/admin/digital-audits?${query}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Started" value={String(metrics.total)} detail="Context submitted" icon={ClipboardList} />
        <MetricCard label="Completed" value={String(metrics.completed)} detail={`${metrics.completionRate}% completion rate`} icon={CheckCircle2} tone="green" />
        <MetricCard label="Incomplete" value={String(metrics.incomplete)} detail="Started or in progress" icon={Clock3} tone="amber" />
        <MetricCard label="Stale" value={String(metrics.stale)} detail="No activity for 72 hours" icon={RefreshCcw} tone="rose" />
        <MetricCard label="Converted" value={String(metrics.converted)} detail="Linked to sales pipeline" icon={UserRoundCheck} tone="blue" />
      </div>

      <Panel>
        <PanelHeader
          title="Digital Audits"
          description="Completed and incomplete readiness assessments, with contact consent and CRM conversion kept explicit."
          action={
            hasPermission(session.role, "digital_audits.export") ? (
              <a href="/admin/api/digital-audits/export" className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600">
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
                href={value ? `/admin/digital-audits?status=${value}` : "/admin/digital-audits"}
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
            <input name="q" defaultValue={params.q} className={inputClass} placeholder="Search business, email or phone" />
            <select name="management" defaultValue={params.management} className={`${inputClass} sm:max-w-48`}>
              <option value="">All management states</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="contacted">Contacted</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
            </select>
            <button className="h-10 rounded-lg bg-slate-950 px-4 text-xs font-semibold text-white">Filter</button>
          </form>
        </div>

        {items.length === 0 ? (
          <EmptyPanel title="No matching digital audits" body="New assessments appear after the visitor submits the business context step." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Business</th>
                  <th className="px-4 py-3 font-semibold">Progress</th>
                  <th className="px-4 py-3 font-semibold">Result</th>
                  <th className="px-4 py-3 font-semibold">Contact</th>
                  <th className="px-4 py-3 font-semibold">Management</th>
                  <th className="px-5 py-3 font-semibold">Last activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((audit) => (
                  <tr key={audit.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <Link href={`/admin/digital-audits/${audit.id}`} className="font-bold text-slate-900 hover:text-blue-700">
                        {audit.businessName}
                      </Link>
                      <p className="mt-1 text-[11px] text-slate-500">{audit.industry} · {audit.teamSize}</p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill value={audit.status} />
                      <p className="mt-1.5 text-[11px] text-slate-500">{audit.progressCount}/6 answered</p>
                    </td>
                    <td className="px-4 py-4">
                      {audit.overallScore === undefined ? (
                        <span className="text-slate-400">Pending</span>
                      ) : (
                        <>
                          <p className="font-bold text-slate-900">{audit.overallScore}/100</p>
                          <p className="mt-1 text-[11px] text-slate-500">{audit.tier}</p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="max-w-48 truncate text-slate-700">{audit.email || audit.phone || "Not provided"}</p>
                      <p className={`mt-1 text-[11px] ${audit.contactConsent ? "text-emerald-700" : "text-slate-400"}`}>
                        {audit.contactConsent ? "Follow-up permitted" : "No follow-up consent"}
                      </p>
                    </td>
                    <td className="px-4 py-4"><StatusPill value={audit.managementState} /></td>
                    <td className="px-5 py-4 text-slate-500">{formatAdminDate(audit.lastActivityAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
          <span>Page {page} of {pageCount} · {listing.total} records</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={queryString(page - 1)} className="rounded border border-slate-200 px-3 py-1.5 font-semibold">Previous</Link>}
            {page < pageCount && <Link href={queryString(page + 1)} className="rounded border border-slate-200 px-3 py-1.5 font-semibold">Next</Link>}
          </div>
        </div>
      </Panel>
    </div>
  );
}
