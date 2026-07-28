import { redirect } from "next/navigation";
import { CheckCircle2, Database, KeyRound, ServerCog, ShieldCheck, type LucideIcon } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { formatAdminDate, formatMoney } from "@/features/admin/billing/money";
import { isAdminDatabaseConfigured } from "@/features/admin/db";
import {
  inputClass,
  labelClass,
  Panel,
  PanelHeader,
  primaryButtonClass,
  StatusPill,
  textareaClass,
} from "@/features/admin/components/admin-ui";
import { getAdminSnapshot } from "@/features/admin/repository";
import { listSiteAssetsSafe, SITE_ASSET_KEYS, type SiteAssetKey } from "@/features/admin/site-assets/repository";
import { listPublishedPortfolioProjectsSafe } from "@/features/admin/portfolio/repository";
import { isR2Configured } from "@/lib/storage/r2";
import { resolveApprovalAction, updateSettingsAction } from "../actions";
import { HeroAssetManager } from "./hero-asset-manager";

export default async function SettingsPage() {
  const session = await requireAdminPermission("dashboard.view");
  if (session.role === "employee") redirect("/admin/unauthorized");
  const snapshot = await getAdminSnapshot();
  const founder = session.role === "founder_admin";
  const siteAssets = founder ? await listSiteAssetsSafe() : {};
  const projects = founder ? await listPublishedPortfolioProjectsSafe() : [];
  const configuredHeroSlots = SITE_ASSET_KEYS.filter((key) => Boolean(siteAssets[key]));
  const defaultHeroProjectIds = {
    "hero-phone-1": "luminary-college",
    "hero-phone-2": "maxit-autos",
    "hero-phone-3": "down-below",
  } as const;
  const defaultHeroAssets = SITE_ASSET_KEYS.reduce<Partial<Record<SiteAssetKey, { src: string; alt: string; name: string }>>>((assets, key) => {
    const project = projects.find((entry) => entry.id === defaultHeroProjectIds[key]);
    if (project) {
      assets[key] = {
        src: project.image,
        alt: `${project.name} project logo`,
        name: project.name,
      };
    }
    return assets;
  }, {});

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HealthCard icon={Database} label="Operational database" ready={isAdminDatabaseConfigured()} detail={isAdminDatabaseConfigured() ? "CockroachDB is configured" : "Awaiting DATABASE_URL"} />
        <HealthCard icon={KeyRound} label="Access verifier" ready={Boolean(process.env.ADMIN_FOUNDER_TOTP_SECRET && process.env.ADMIN_MANAGER_TOTP_SECRET)} detail={process.env.ADMIN_FOUNDER_TOTP_SECRET ? "Rotating code configured" : "Configure TOTP secrets"} />
        <HealthCard icon={ShieldCheck} label="Enrollment bootstrap" ready={process.env.ADMIN_ALLOW_BOOTSTRAP !== "true"} detail={process.env.ADMIN_ALLOW_BOOTSTRAP === "true" ? "One-time enrollment open" : "Disabled — fail-closed"} />
        <HealthCard icon={ServerCog} label="Recurring scheduler" ready={Boolean(process.env.ADMIN_CRON_SECRET)} detail={process.env.ADMIN_CRON_SECRET ? "Protected job endpoint ready" : "Add ADMIN_CRON_SECRET"} />
      </section>

      <Panel>
        <PanelHeader title="Verified company identity" description="Only approved facts flow into issued invoices." />
        {founder ? (
          <form action={updateSettingsAction} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <label><span className={labelClass}>Company name</span><input className={inputClass} name="name" defaultValue={snapshot.settings.name} required /></label>
            <label><span className={labelClass}>Registration number</span><input className={inputClass} name="registrationNumber" defaultValue={snapshot.settings.registrationNumber} required /></label>
            <label><span className={labelClass}>Website</span><input className={inputClass} name="website" defaultValue={snapshot.settings.website} required /></label>
            <label><span className={labelClass}>Email</span><input className={inputClass} name="email" type="email" defaultValue={snapshot.settings.email} required /></label>
            <label><span className={labelClass}>Phone</span><input className={inputClass} name="phone" defaultValue={snapshot.settings.phone} required /></label>
            <label><span className={labelClass}>Address</span><input className={inputClass} name="address" defaultValue={snapshot.settings.address} /></label>
            <label className="sm:col-span-2"><span className={labelClass}>Public motto</span><input className={inputClass} name="motto" defaultValue={snapshot.settings.motto} required /></label>
            <label><span className={labelClass}>Default currency</span><select className={inputClass} name="defaultCurrency" defaultValue={snapshot.settings.defaultCurrency}><option>NGN</option><option>USD</option><option>GBP</option><option>EUR</option></select></label>
            <label><span className={labelClass}>Default payment terms</span><input className={inputClass} name="defaultPaymentTermsDays" type="number" min="0" max="365" defaultValue={snapshot.settings.defaultPaymentTermsDays} /></label>
            <label><span className={labelClass}>Manager approval threshold</span><input className={inputClass} name="invoiceApprovalThreshold" type="number" min="0" defaultValue={snapshot.settings.invoiceApprovalThreshold} /></label>
            <label><span className={labelClass}>Certificate signatory</span><input className={inputClass} name="ceoName" defaultValue={snapshot.settings.ceoName} required /></label>
            <label><span className={labelClass}>Signatory title</span><input className={inputClass} name="ceoTitle" defaultValue={snapshot.settings.ceoTitle} required /></label>
            <label className="sm:col-span-2"><span className={labelClass}>Verified payment instructions</span><textarea className={textareaClass} name="paymentInstructions" defaultValue={snapshot.settings.paymentInstructions} placeholder="Include payment details and the approved third-party infrastructure notice." /><span className="mt-1 block text-[11px] leading-4 text-slate-500">Editable default applied to new invoices. Existing invoice snapshots remain unchanged.</span></label>
            <label className="sm:col-span-2"><span className={labelClass}>Change reason</span><input className={inputClass} name="reason" placeholder="Why are these controlled settings changing?" required /></label>
            <div className="sm:col-span-2"><button className={primaryButtonClass}>Save controlled settings</button></div>
          </form>
        ) : (
          <dl className="grid gap-5 p-5 text-sm sm:grid-cols-2 sm:p-6">
            <div><dt className="text-xs text-slate-400">Company</dt><dd className="mt-1 font-semibold">{snapshot.settings.name}</dd></div>
            <div><dt className="text-xs text-slate-400">Registration</dt><dd className="mt-1 font-semibold">{snapshot.settings.registrationNumber}</dd></div>
            <div><dt className="text-xs text-slate-400">Website</dt><dd className="mt-1 font-semibold">{snapshot.settings.website}</dd></div>
            <div><dt className="text-xs text-slate-400">Approval threshold</dt><dd className="mt-1 font-semibold">{formatMoney(snapshot.settings.invoiceApprovalThreshold)}</dd></div>
          </dl>
        )}
      </Panel>

      {founder ? (
        <Panel>
          <PanelHeader title="Homepage hero screens" description="Published project logos are used by default. Replace any one with a portrait screenshot when the project needs a richer preview." />
          <HeroAssetManager configured={configuredHeroSlots} defaultAssets={defaultHeroAssets} storageReady={isR2Configured()} />
        </Panel>
      ) : null}

      {founder ? (
        <Panel>
          <PanelHeader title="Founder approval queue" description="Review exceptional requests with a recorded outcome." />
          <div className="divide-y divide-slate-100">
            {snapshot.approvals.map((approval) => (
              <article key={approval.id} className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
                <div>
                  <p className="text-sm font-bold text-slate-900">{approval.action.replaceAll(".", " ")}</p>
                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{approval.reason}</p>
                  <p className="mt-2 text-[11px] text-slate-400">Created {formatAdminDate(approval.createdAt)} · {approval.entityType}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusPill value={approval.state} />
                  {approval.state === "pending" ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <form action={resolveApprovalAction} className="flex gap-2"><input type="hidden" name="id" value={approval.id} /><input type="hidden" name="resolution" value="approved" /><input className={inputClass} name="note" placeholder="Approval reason" required /><button className="h-10 rounded-lg bg-slate-950 px-3 text-[11px] font-semibold text-white">Approve</button></form>
                      <form action={resolveApprovalAction} className="flex gap-2"><input type="hidden" name="id" value={approval.id} /><input type="hidden" name="resolution" value="rejected" /><input className={inputClass} name="note" placeholder="Rejection reason" required /><button className="h-10 rounded-lg border border-slate-200 px-3 text-[11px] font-semibold text-slate-600">Reject</button></form>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function HealthCard({ icon: Icon, label, ready, detail }: { icon: LucideIcon; label: string; ready: boolean; detail: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${ready ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}><Icon className="h-5 w-5" /></span>
        {ready ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <span className="h-2 w-2 rounded-full bg-amber-500" />}
      </div>
      <p className="mt-4 text-sm font-bold text-slate-900">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}
