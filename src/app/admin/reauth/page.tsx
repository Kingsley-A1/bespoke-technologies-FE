import { redirect } from "next/navigation";
import { getAdminSession } from "@/features/admin/auth";
import { CodeInput } from "@/features/admin/components/code-input";
import { AuthSubmitButton } from "@/features/admin/components/auth-submit-button";
import { AdminAuthShell, AuthAlert, AuthNote, authLinkClass, authPrimaryButtonClass } from "@/features/admin/components/admin-auth-ui";

export const metadata = { title: "Confirm it's you" };

export default async function ReauthenticatePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const { error } = await searchParams;
  return (
    <AdminAuthShell
      title="Confirm it's you"
      description="Sensitive actions need a sign-in from the last 15 minutes. Enter a fresh code to continue."
      footer={
        <form action="/admin/api/auth/logout" method="post">
          Not you?{" "}
          <button type="submit" className={authLinkClass}>
            Sign out
          </button>
        </form>
      }
    >
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold uppercase text-white">
          {session.email.charAt(0)}
        </span>
        <span className="min-w-0">
          <span className="block text-xs text-slate-500">Signed in as</span>
          <span className="block truncate text-sm font-medium text-slate-900">{session.email}</span>
        </span>
      </div>
      <form action="/admin/api/auth/reauth" method="post" className="space-y-5">
        <input type="hidden" name="email" value={session.email} />
        <CodeInput autoSubmit />
        {error ? <AuthAlert>That code was not accepted. Wait for a new one in your app and try again.</AuthAlert> : null}
        <AuthSubmitButton pendingLabel="Verifying…" className={authPrimaryButtonClass}>
          Verify and continue
        </AuthSubmitButton>
        <AuthNote>Protects exports, access changes, financial reversals, publishing and company settings.</AuthNote>
      </form>
    </AdminAuthShell>
  );
}
