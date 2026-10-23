import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/features/admin/auth";
import { AdminAuthShell, AuthAlert, authLinkClass } from "@/features/admin/components/admin-auth-ui";
import { RecoverForm } from "./recover-form";

export const metadata = { title: "Admin account recovery" };

export default async function AdminRecoverPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getAdminSession()) redirect("/admin/security");
  const params = await searchParams;
  return (
    <AdminAuthShell
      title="Recover access"
      description="Lost your authenticator? Use one of your single-use recovery codes from Admin Security to set up a new one."
      footer={
        <p>
          Have your authenticator?{" "}
          <Link href="/admin/login" className={authLinkClass}>
            Sign in
          </Link>
        </p>
      }
    >
      {params.error === "expired" ? (
        <div className="mb-5">
          <AuthAlert tone="warning">That recovery session expired or was already used. Start again with another unused recovery code.</AuthAlert>
        </div>
      ) : null}
      <RecoverForm />
    </AdminAuthShell>
  );
}
