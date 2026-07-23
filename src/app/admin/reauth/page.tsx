import { redirect } from "next/navigation";
import { KeyRound, ShieldAlert } from "lucide-react";
import { getAdminSession } from "@/features/admin/auth";
import { AdminLogo } from "@/features/admin/components/admin-logo";
import { CodeInput } from "@/features/admin/components/code-input";

export default async function ReauthenticatePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const { error } = await searchParams;
  return <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-5 py-12"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"><AdminLogo /><span className="mt-10 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><KeyRound className="h-6 w-6" /></span><h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-950">Confirm it is you</h1><p className="mt-2 text-sm leading-6 text-slate-500">Sensitive founder actions require a fresh six-digit verification. You are confirming <strong className="text-slate-700">{session.email}</strong>.</p><form action="/admin/api/auth/reauth" method="post" className="mt-7 space-y-5"><input type="hidden" name="email" value={session.email} /><CodeInput />{error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">The verification code was not accepted.</p>}<button className="h-11 w-full rounded-lg bg-slate-950 text-sm font-semibold text-white">Verify and continue</button></form><p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /> This confirmation protects exports, access changes, reversals, voids, and company settings.</p></div></div>;
}

