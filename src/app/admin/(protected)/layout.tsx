import { AdminShell } from "@/features/admin/components/admin-shell";
import { requireAdminSession } from "@/features/admin/access";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  return (
    <AdminShell user={{ displayName: session.displayName, email: session.email, role: session.role }}>
      {children}
    </AdminShell>
  );
}

