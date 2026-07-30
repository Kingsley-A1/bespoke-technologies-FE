import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { KeyRound } from "lucide-react";
import { AdminLogo } from "@/features/admin/components/admin-logo";
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
    <div className="min-h-screen bg-[#f7f9fc] px-5 py-10 sm:px-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="flex items-center justify-between gap-4">
          <AdminLogo />
          <Link href="/admin/recover" className="text-xs font-semibold text-slate-500 hover:text-ktf-blue">Cancel recovery</Link>
        </div>
        <div className="mt-10 rounded-lg border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-ktf-blue"><KeyRound className="h-5 w-5" /></span>
          <h1 className="mt-5 text-2xl font-extrabold tracking-[-0.035em] text-slate-950">Replace your authenticator</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">The recovery code has been consumed. Confirm a new app before this restricted session expires.</p>
          <div className="mt-7">
            <RecoverySetupFlow {...setup} qrDataUrl={qrDataUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}
