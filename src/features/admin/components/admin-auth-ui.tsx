import { AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminLogo } from "./admin-logo";

/**
 * Shared look for the signed-out Admin pages (sign in, register, recover,
 * replace authenticator, confirm identity): the logo, one white card with a
 * clear title and the form, and the secondary links underneath.
 */

export const authLabelClass = "mb-1.5 block text-[13px] font-medium text-slate-800";

export const authInputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-ktf-blue focus:ring-3 focus:ring-ktf-blue/15";

export const authPrimaryButtonClass =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue disabled:cursor-not-allowed disabled:opacity-50";

export const authLinkClass = "font-medium text-ktf-blue-deep underline-offset-4 hover:underline";

export function AdminAuthShell({
  title,
  description,
  aside,
  footer,
  wide = false,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  /** Shown at the top right, e.g. a cancel link. */
  aside?: React.ReactNode;
  /** Secondary links under the card. */
  footer?: React.ReactNode;
  /** A wider card for the authenticator QR step. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-5 sm:h-20 sm:px-8">
        <AdminLogo href="/" />
        {aside}
      </header>
      <main className="flex flex-1 justify-center px-5 pb-12 pt-6 sm:items-center sm:px-6 sm:pt-0">
        <div className={cn("w-full", wide ? "max-w-[480px]" : "max-w-[420px]")}>
          <div className="sm:rounded-2xl sm:border sm:border-slate-200 sm:p-8 sm:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-20px_rgba(15,23,42,0.16)]">
            <h1 className="text-[1.5rem] font-semibold leading-tight tracking-[-0.025em] text-slate-950">{title}</h1>
            {description ? <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p> : null}
            <div className="mt-7">{children}</div>
          </div>
          {footer ? <div className="mt-8 space-y-2 border-t border-slate-100 pt-6 sm:border-0 sm:pt-0 text-center text-[13px] leading-5 text-slate-600">{footer}</div> : null}
        </div>
      </main>
      <footer className="shrink-0 px-5 pb-6 text-center text-xs text-slate-500">
        Bespoke Technologies Admin. Access is limited to named, approved staff.
      </footer>
    </div>
  );
}

export function AuthAlert({ tone = "error", children }: { tone?: "error" | "warning"; children: React.ReactNode }) {
  const Icon = tone === "error" ? AlertCircle : AlertTriangle;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[13px] leading-5",
        tone === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-900",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

/** A quiet one-line note under a form, e.g. what a recovery code can and cannot do. */
export function AuthNote({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-5 text-slate-500">{children}</p>;
}
