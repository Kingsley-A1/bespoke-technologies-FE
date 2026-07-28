"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BadgeCheck } from "lucide-react";
import { UploadLoading } from "@/features/admin/components/admin-loading";
import { inputClass, labelClass, primaryButtonClass } from "@/features/admin/components/admin-ui";
import type { BillingDocument, Project } from "@/features/admin/types";
import type { PortfolioProject } from "@/types/portfolio";

export function ProjectCompletionForm({
  project,
  documents,
  portfolio,
}: {
  project: Project;
  documents: BillingDocument[];
  portfolio: PortfolioProject[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setMessage("");
    const response = await fetch(`/admin/api/projects/${project.id}/completion`, { method: "POST", body: new FormData(event.currentTarget) });
    const body = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) return setMessage(body.error || "Completion details could not be saved.");
    setMessage("Completion record saved. Certificate readiness has been refreshed.");
    router.refresh();
  }
  return <details className="mt-4 rounded-lg border border-blue-100 bg-blue-50/50">
    <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-xs font-bold text-blue-800"><BadgeCheck className="h-4 w-4" /> Completion and ownership details</summary>
    <form onSubmit={submit} className="grid gap-3 border-t border-blue-100 p-4 sm:grid-cols-2">
      <label><span className={labelClass}>Project type</span><input className={inputClass} name="projectType" defaultValue={project.projectType || project.service} required /></label>
      <label><span className={labelClass}>Project start date</span><input className={inputClass} name="startDate" type="date" defaultValue={project.startDate} required /></label>
      <label><span className={labelClass}>Actual completion date</span><input className={inputClass} name="completedAt" type="date" defaultValue={project.completedAt} required /></label>
      <label><span className={labelClass}>Commercial mode</span><select className={inputClass} name="commercialMode" defaultValue={project.commercialMode}><option value="paid">Paid</option><option value="free">Free</option><option value="donation">Donation</option><option value="undisclosed">Undisclosed</option></select></label>
      <label><span className={labelClass}>Final invoice</span><select className={inputClass} name="finalInvoiceId" defaultValue={project.finalInvoiceId || ""}><option value="">No linked final invoice</option>{documents.filter(item => ["standard", "final"].includes(item.type) && item.status !== "voided").map(item => <option key={item.id} value={item.id}>{item.documentNumber} · {item.status}</option>)}</select></label>
      <label><span className={labelClass}>Public portfolio link</span><select className={inputClass} name="portfolioProjectId" defaultValue={project.portfolioProjectId || ""}><option value="">Not shown in portfolio</option>{portfolio.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label><span className={labelClass}>{project.projectLogoKey ? "Replace project logo" : "Project logo"}</span><input className={inputClass} name="projectLogo" type="file" accept="image/png,image/jpeg" /></label>
      <label className="sm:col-span-2"><span className={labelClass}>Certificate description</span><textarea className={`${inputClass} min-h-24 py-2`} name="description" minLength={20} maxLength={1000} defaultValue={project.summary} required /></label>
      <label className="sm:col-span-2"><span className={labelClass}>Project value wording (optional)</span><input className={inputClass} name="valueLabel" maxLength={120} defaultValue={project.valueLabel} placeholder="For example: But Jesus Paid It All." /></label>
      <label className="sm:col-span-2"><span className={labelClass}>Value note</span><input className={inputClass} name="valueNote" maxLength={240} defaultValue={project.valueNote} placeholder="Optional, e.g. Total includes approved tax and discounts." /></label>
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 sm:col-span-2"><input type="checkbox" name="showValuePublicly" defaultChecked={project.showValuePublicly} /> Allow the amount to appear on the public verification page</label>
      {pending && <div className="sm:col-span-2"><UploadLoading label="Saving project completion record" /></div>}
      {message && <p className={`text-xs font-semibold sm:col-span-2 ${message.startsWith("Completion") ? "text-emerald-700" : "text-rose-700"}`}>{message}</p>}
      <div className="sm:col-span-2"><button className={primaryButtonClass} disabled={pending}>Save completion record</button></div>
    </form>
  </details>;
}
