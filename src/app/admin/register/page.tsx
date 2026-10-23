import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/features/admin/auth";
import { AdminAuthShell, authLinkClass } from "@/features/admin/components/admin-auth-ui";
import { RegisterFlow } from "./register-flow";

export const metadata = { title: "Admin registration" };

export default async function AdminRegisterPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  if (await getAdminSession()) redirect("/admin");
  const email = (await searchParams).email ?? "";

  return (
    <AdminAuthShell
      title="Register your authenticator"
      description="For approved Bespoke Technologies staff. You need the registration code shared with you privately."
      footer={
        <p>
          Already registered?{" "}
          <Link href="/admin/login" className={authLinkClass}>
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterFlow defaultEmail={email} />
    </AdminAuthShell>
  );
}
