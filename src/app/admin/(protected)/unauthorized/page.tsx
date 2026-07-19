import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <section className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <ShieldX className="mx-auto h-10 w-10 text-rose-600" />
      <h2 className="mt-4 text-xl font-bold text-slate-950">This action is restricted</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">Your current admin role does not include this capability. The attempt has not changed any company data.</p>
      <Link href="/admin" className="mt-6 inline-flex h-10 items-center rounded-xl bg-ktf-blue px-4 text-sm font-semibold text-white">Return to overview</Link>
    </section>
  );
}
