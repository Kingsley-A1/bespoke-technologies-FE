import Link from "next/link";
import { redirect } from "next/navigation";
import { CodeInput } from "@/features/admin/components/code-input";
import { AuthSubmitButton } from "@/features/admin/components/auth-submit-button";
import {
  AdminAuthShell,
  AuthAlert,
  authInputClass,
  authLabelClass,
  authLinkClass,
  authPrimaryButtonClass,
} from "@/features/admin/components/admin-auth-ui";
import { getAdminSession } from "@/features/admin/auth";

export const metadata = { title: "Admin sign in" };

const ERROR_MESSAGES: Record<string, string> = {
  locked: "Too many attempts. Sign-in is locked for 15 minutes; try again after that.",
  unavailable: "Sign-in is temporarily unavailable. Please try again in a moment.",
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; email?: string }> }) {
  if (await getAdminSession()) redirect("/admin");
  const { error, email = "" } = await searchParams;
  return (
    <AdminAuthShell
      title="Sign in to Admin"
      description="Use your work email and the current code from your authenticator app."
      footer={
        <>
          <p>
            Lost your authenticator?{" "}
            <Link href="/admin/recover" className={authLinkClass}>
              Recover access
            </Link>
          </p>
          <p>
            New to Admin?{" "}
            <Link href="/admin/register" className={authLinkClass}>
              Register your authenticator
            </Link>
          </p>
        </>
      }
    >
      <form action="/admin/api/auth/login" method="post" className="space-y-5">
        <label className="block">
          <span className={authLabelClass}>Work email</span>
          <input
            name="email"
            type="email"
            autoComplete="username"
            required
            defaultValue={email}
            className={authInputClass}
            placeholder="name@bespoketech.com.ng"
          />
        </label>
        <CodeInput autoSubmit />
        {error ? <AuthAlert>{ERROR_MESSAGES[error] ?? "That email and code did not match. Check both and try again."}</AuthAlert> : null}
        <AuthSubmitButton pendingLabel="Signing in…" className={authPrimaryButtonClass}>
          Sign in
        </AuthSubmitButton>
      </form>
    </AdminAuthShell>
  );
}
