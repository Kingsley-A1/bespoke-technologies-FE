import Link from "next/link";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { AdminLogo } from "@/features/admin/components/admin-logo";
import { CodeInput } from "@/features/admin/components/code-input";
import { AuthSubmitButton } from "@/features/admin/components/auth-submit-button";
import { getAdminSession } from "@/features/admin/auth";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; email?: string }> }) {
  if (await getAdminSession()) redirect("/admin");
  const { error, email = "" } = await searchParams;
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1fr_0.82fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(120% 90% at 20% 0%, black 0%, transparent 65%)",
            WebkitMaskImage: "radial-gradient(120% 90% at 20% 0%, black 0%, transparent 65%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-1/3 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(10,132,255,0.16),transparent_60%)]"
        />
        <div className="relative inline-flex w-fit rounded-md bg-white px-4 py-2"><AdminLogo /></div>
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-semibold text-blue-400">Bespoke operating system</p>
          <h1 className="mt-4 text-5xl font-extrabold leading-[1.06] tracking-[-0.05em]">Control the work. Protect the standard.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">Billing, clients, delivery, and company oversight in one secure internal workspace.</p>
          <dl className="mt-10 grid max-w-md grid-cols-3 divide-x divide-white/10 border-y border-white/10">
            {[
              ["2FA", "Authenticator-backed"],
              ["Named", "No shared accounts"],
              ["Audited", "Every sensitive action"],
            ].map(([value, label]) => (
              <div key={label} className="px-4 py-4 first:pl-0">
                <dt className="text-sm font-bold text-white">{value}</dt>
                <dd className="mt-1 text-[11px] leading-4 text-slate-400">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="relative text-xs uppercase tracking-[0.18em] text-slate-500">For Honor and For Excellence.</p>
      </section>
      <section className="flex items-center justify-center bg-[#f7f9fc] px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden"><AdminLogo /></div>
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-ktf-blue"><LockKeyhole className="h-5 w-5" /></span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-slate-950">Secure admin access</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Use your named Bespoke Technologies team identity and the current 6-digit code from your authenticator.</p>
          <form action="/admin/api/auth/login" method="post" className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-slate-800">Work email</span>
              <input name="email" type="email" autoComplete="username" required defaultValue={email} className="h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 text-sm text-slate-950 shadow-xs outline-none transition focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/15" placeholder="name@bespoketech.com.ng" />
            </label>
            <CodeInput />
            {error && (
              <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700">
                {error === "locked" ? "Access is temporarily locked after repeated attempts. Wait 15 minutes and try again." : "The identity or code could not be verified."}
              </p>
            )}
            <AuthSubmitButton pendingLabel="Verifying access…" className="h-11 w-full rounded-md bg-ktf-blue text-sm font-semibold text-white shadow-sm transition hover:bg-ktf-blue-deep">Continue securely</AuthSubmitButton>
          </form>
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
            <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> Confidential data is limited to approved named staff.</p>
            <Link href="/admin/register" className="shrink-0 text-xs font-semibold text-ktf-blue hover:text-ktf-blue-deep">
              First device? Register
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
