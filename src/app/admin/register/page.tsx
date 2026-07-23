import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { AdminLogo } from "@/features/admin/components/admin-logo";
import { getAdminSession } from "@/features/admin/auth";
import { RegisterFlow } from "./register-flow";

export const metadata = { title: "Admin registration" };

export default async function AdminRegisterPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  if (await getAdminSession()) redirect("/admin");
  const email = (await searchParams).email ?? "";

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
        <div className="relative inline-flex w-fit rounded-md bg-white px-4 py-2">
          <AdminLogo />
        </div>
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-semibold text-blue-400">One-time enrollment</p>
          <h1 className="mt-4 text-5xl font-extrabold leading-[1.06] tracking-[-0.05em]">
            One code to register. One app to sign in.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
            Verify your identity with the private registration code, scan the QR
            with your authenticator, and every future sign-in requires your
            rotating 6-digit code.
          </p>
        </div>
        <p className="relative text-xs uppercase tracking-[0.18em] text-slate-500">
          For Honor and For Excellence.
        </p>
      </section>

      <section className="flex items-center justify-center bg-[#f7f9fc] px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <AdminLogo />
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50 text-ktf-blue">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-slate-950">
            Register your authenticator
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            For pre-authorized Bespoke Technologies team identities only.
          </p>
          <div className="mt-8">
            <RegisterFlow defaultEmail={email} />
          </div>
          <p className="mt-6 text-xs text-slate-500">
            Already enrolled?{" "}
            <Link href="/admin/login" className="font-semibold text-ktf-blue hover:text-ktf-blue-deep">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
