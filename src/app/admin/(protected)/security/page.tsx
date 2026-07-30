import { KeyRound, ShieldCheck } from "lucide-react";
import { requireAdminSession } from "@/features/admin/access";
import { getAdminSecurityOverview, listAdminSessions } from "@/features/admin/auth";
import { SecurityManager } from "@/features/admin/security/security-manager";

export default async function AdminSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ recovered?: string }>;
}) {
  const session = await requireAdminSession();
  const [overview, sessions, params] = await Promise.all([
    getAdminSecurityOverview(session.userId),
    listAdminSessions(session.userId),
    searchParams,
  ]);

  return (
    <div className="space-y-7">
      <section className="max-w-3xl">
        <p className="flex items-center gap-2 text-sm font-semibold text-ktf-blue">
          <ShieldCheck className="h-4 w-4" /> Identity security
        </p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.035em] text-slate-950 sm:text-3xl">
          Authenticator and recovery
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Change your authenticator safely, keep single-use emergency codes offline, and remove sessions you no longer trust.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
          <KeyRound className="h-4 w-4" /> Recovery never opens the admin workspace directly. It can only replace the authenticator.
        </div>
      </section>
      <SecurityManager
        currentSessionId={session.id}
        sessions={sessions}
        authenticatorConfirmedAt={overview.authenticatorConfirmedAt}
        recoveryCodesRemaining={overview.recoveryCodesRemaining}
        events={overview.events}
        recovered={params.recovered === "1"}
      />
    </div>
  );
}
