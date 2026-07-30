import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getAdminSession } from "@/features/admin/auth";
import { AdminLogo } from "@/features/admin/components/admin-logo";
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
    <div className="grid min-h-screen bg-white lg:grid-cols-[1fr_0.82fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(120% 90% at 20% 0%, black 0%, transparent 65%)",
            WebkitMaskImage: "radial-gradient(120% 90% at 20% 0%, black 0%, transparent 65%)",
          }}
        />
        <div className="relative inline-flex w-fit rounded-md bg-white px-4 py-2"><AdminLogo /></div>
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-semibold text-blue-400">Controlled emergency access</p>
          <h1 className="mt-4 text-5xl font-extrabold leading-[1.06] tracking-[-0.05em]">Recover the identity, not a shortcut.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
            A recovery code is single-use and can only replace a lost authenticator. It never grants direct access to company data.
          </p>
        </div>
        <p className="relative text-xs uppercase tracking-[0.18em] text-slate-500">For Honor and For Excellence.</p>
      </section>
      <section className="flex items-center justify-center bg-[#f7f9fc] px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden"><AdminLogo /></div>
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-amber-50 text-amber-700"><ShieldAlert className="h-5 w-5" /></span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-slate-950">Lost your authenticator?</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Use one of the offline recovery codes generated from Admin Security.</p>
          {params.error === "expired" && (
            <p role="alert" className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
              That recovery session expired or is no longer available. Use another unused recovery code to start again.
            </p>
          )}
          <div className="mt-8"><RecoverForm /></div>
          <p className="mt-6 border-t border-slate-200 pt-5 text-xs text-slate-500">
            Have your authenticator?{" "}
            <Link href="/admin/login" className="font-semibold text-ktf-blue hover:text-ktf-blue-deep">Return to sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
