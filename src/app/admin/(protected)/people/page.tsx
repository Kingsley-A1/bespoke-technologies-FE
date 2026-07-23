import { redirect } from "next/navigation";
import { ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { listAdminSessions } from "@/features/admin/auth";
import { formatAdminDate } from "@/features/admin/billing/money";
import { SubmitButton } from "@/features/admin/components/admin-loading";
import {
  inputClass,
  labelClass,
  Panel,
  PanelHeader,
  primaryButtonClass,
  StatusPill,
} from "@/features/admin/components/admin-ui";
import { getAdminSnapshot } from "@/features/admin/repository";
import { createEmployeeAction, revokeSessionAction, setUserStateAction } from "../actions";

export default async function PeopleAndAccessPage() {
  const session = await requireAdminPermission("dashboard.view");
  if (session.role === "employee") redirect("/admin/unauthorized");
  const founder = session.role === "founder_admin";
  const [snapshot, sessions] = await Promise.all([
    getAdminSnapshot(),
    founder ? listAdminSessions() : listAdminSessions(session.userId),
  ]);
  const currentTime = Date.parse(session.lastSeenAt);

  return (
    <div className="space-y-7">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold text-ktf-blue">Identity and accountability</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em] text-slate-950 sm:text-3xl">People and access</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Create named employee identities, control access state, and review trusted sessions from one disciplined workspace.</p>
      </section>

      {founder ? (
        <Panel>
          <PanelHeader title="Register an employee" description="The employee receives a single-use authenticator enrollment link. No password is created." action={<UserPlus className="h-4 w-4 text-ktf-blue" />} />
          <form action={createEmployeeAction} className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)_auto] lg:items-end">
            <label className="min-w-0">
              <span className={labelClass}>Employee name</span>
              <input className={inputClass} name="displayName" placeholder="Full name" required />
            </label>
            <label className="min-w-0">
              <span className={labelClass}>Company email</span>
              <span className="flex min-w-0">
                <input className={`${inputClass} min-w-0 flex-1 rounded-r-none`} name="emailName" placeholder="employee.name" required />
                <span className="inline-flex h-10 shrink-0 items-center rounded-r-lg border border-l-0 border-ktf-gray-200 bg-white px-2.5 text-[10px] text-ktf-gray-500 sm:px-3 sm:text-[11px]">@bespoketech.com.ng</span>
              </span>
            </label>
            <SubmitButton className={`${primaryButtonClass} w-full lg:w-auto`} pendingLabel="Creating…">Create and invite</SubmitButton>
            <p className="text-[11px] leading-5 text-ktf-gray-500 lg:col-span-3">Access remains employee-only until a founder changes the role through the existing permission system.</p>
          </form>
        </Panel>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <PanelHeader title="Team identities" description={`${snapshot.users.length} named people in the admin system.`} action={<UsersRound className="h-4 w-4 text-ktf-blue" />} />
          <div className="divide-y divide-slate-100">
            {snapshot.users.map((user) => (
              <article key={user.id} className="space-y-4 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{user.displayName}</p>
                    <p className="mt-1 break-all text-xs text-slate-500">{user.email}</p>
                  </div>
                  <StatusPill value={user.state} />
                </div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-[11px] leading-5 text-slate-400">{user.role.replaceAll("_", " ")} · Last login {formatAdminDate(user.lastLoginAt)}</p>
                  {founder && user.id !== session.userId ? (
                    <details className="w-full sm:w-64">
                      <summary className="cursor-pointer text-right text-[11px] font-semibold text-slate-600">Change access</summary>
                      <form action={setUserStateAction} className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <input type="hidden" name="id" value={user.id} />
                        <input type="hidden" name="state" value={user.state === "suspended" ? "active" : "suspended"} />
                        <input className={inputClass} name="reason" placeholder="Required reason" required />
                        <button className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700">{user.state === "suspended" ? "Reactivate identity" : "Suspend identity"}</button>
                      </form>
                    </details>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Active sessions" description="Review and revoke devices that are no longer trusted." action={<ShieldCheck className="h-4 w-4 text-emerald-600" />} />
          <div className="divide-y divide-slate-100">
            {sessions.map((item) => {
              const active = !item.revokedAt && Date.parse(item.expiresAt) > currentTime;
              return (
                <article key={item.id} className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{item.displayName}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{item.role.replaceAll("_", " ")} · Last seen {formatAdminDate(item.lastSeenAt)}</p>
                    </div>
                    <StatusPill value={item.revokedAt ? "revoked" : active ? "active" : "expired"} />
                  </div>
                  {founder && active && item.id !== session.id ? (
                    <details>
                      <summary className="cursor-pointer text-[11px] font-semibold text-rose-700">Revoke this session</summary>
                      <form action={revokeSessionAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input type="hidden" name="id" value={item.id} />
                        <input className={`${inputClass} min-w-0 flex-1`} name="reason" placeholder="Required reason" required />
                        <button className="h-10 shrink-0 rounded-lg border border-rose-200 bg-white px-3 text-[11px] font-semibold text-rose-700">Confirm revoke</button>
                      </form>
                    </details>
                  ) : null}
                </article>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
