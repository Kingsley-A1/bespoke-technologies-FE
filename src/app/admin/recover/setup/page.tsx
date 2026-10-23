import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { AdminAuthShell } from "@/features/admin/components/admin-auth-ui";
import { getAdminRecoverySetup } from "@/features/admin/auth";
import { RecoverySetupFlow } from "./recovery-setup-flow";

export const metadata = { title: "Replace admin authenticator" };

export default async function RecoverySetupPage() {
  const setup = await getAdminRecoverySetup();
  if (!setup) redirect("/admin/recover?error=expired");
  const qrDataUrl = await QRCode.toDataURL(setup.otpauthUri, {
    width: 240,
    margin: 1,
    color: { dark: "#0b1f3a", light: "#ffffff" },
  });
  return (
    <AdminAuthShell
      wide
      title="Set up a new authenticator"
      description={
        <>
          Your recovery code has been used. Add a new authenticator for{" "}
          <strong className="break-all font-medium text-slate-900">{setup.email}</strong> before this session ends.
        </>
      }
      aside={
        <Link href="/admin/recover" className="rounded-full px-3 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-200/60 hover:text-slate-950">
          Cancel
        </Link>
      }
    >
      <RecoverySetupFlow {...setup} qrDataUrl={qrDataUrl} />
    </AdminAuthShell>
  );
}
