"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Save, Trash2 } from "lucide-react";
import { LoadingSpinner } from "../components/admin-loading";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass, textareaClass } from "../components/admin-ui";
import { calculateDocumentTotals, calculateLine, formatMoney } from "./money";
import type { BillingDocument, BillingDocumentType, BillingItem, Client, CompanySettings, CurrencyCode, InvoiceDraft, Project, RecurrenceFrequency } from "../types";

const NEW_VALUE = "__new__";

const createItem = (): BillingItem => ({
  id: crypto.randomUUID(), name: "", description: "", quantity: 1, rate: 0, discountRate: 0, taxRate: 0,
});

function draftString(draft: InvoiceDraft | undefined, key: string, fallback = "") {
  const value = draft?.payload[key];
  return typeof value === "string" ? value : fallback;
}

function draftBoolean(draft: InvoiceDraft | undefined, key: string, fallback = false) {
  const value = draft?.payload[key];
  return typeof value === "boolean" ? value : fallback;
}

function draftItems(draft?: InvoiceDraft) {
  const value = draft?.payload.items;
  return Array.isArray(value) && value.length ? value as BillingItem[] : [createItem()];
}

export function BillingEditor({ clients, projects, settings, initialDocument, initialDraft }: {
  clients: Client[];
  projects: Project[];
  settings: CompanySettings;
  initialDocument?: BillingDocument;
  initialDraft?: InvoiceDraft;
}) {
  const router = useRouter();
  const initialType = draftString(initialDraft, "type", initialDocument?.type ?? "standard") as BillingDocumentType;
  const [type, setType] = useState<BillingDocumentType>(initialType);
  const [clientChoice, setClientChoice] = useState(draftString(initialDraft, "clientChoice", initialDocument?.clientId ?? clients[0]?.id ?? ""));
  const [newClientName, setNewClientName] = useState(draftString(initialDraft, "newClientName"));
  const [projectChoice, setProjectChoice] = useState(draftString(initialDraft, "projectChoice", initialDocument?.projectId ?? ""));
  const [newProjectName, setNewProjectName] = useState(draftString(initialDraft, "newProjectName"));
  const selectedClient = clients.find((client) => client.id === clientChoice);
  const issueDefault = initialDocument?.issueDate ?? new Date().toISOString().slice(0, 10);
  const [issueDate, setIssueDate] = useState(draftString(initialDraft, "issueDate", issueDefault));
  const [dueDate, setDueDate] = useState(draftString(initialDraft, "dueDate", (() => {
    if (initialDocument) return initialDocument.dueDate;
    const value = new Date(); value.setDate(value.getDate() + settings.defaultPaymentTermsDays); return value.toISOString().slice(0, 10);
  })()));
  const [currency, setCurrency] = useState<CurrencyCode>(draftString(initialDraft, "currency", initialDocument?.currency ?? selectedClient?.currency ?? settings.defaultCurrency) as CurrencyCode);
  const [items, setItems] = useState<BillingItem[]>(initialDocument?.items ?? draftItems(initialDraft));
  const [notes, setNotes] = useState(draftString(initialDraft, "notes", initialDocument?.notes ?? "Thank you for trusting Bespoke Technologies."));
  const [terms, setTerms] = useState(draftString(initialDraft, "terms", initialDocument?.terms ?? "Payment is due on or before the stated due date."));
  const [paymentInstructions, setPaymentInstructions] = useState(draftString(initialDraft, "paymentInstructions", initialDocument?.paymentInstructions ?? settings.paymentInstructions));
  const [purchaseOrder, setPurchaseOrder] = useState(draftString(initialDraft, "purchaseOrder", initialDocument?.purchaseOrder ?? ""));
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(draftString(initialDraft, "frequency", initialDocument?.recurrence?.frequency ?? "monthly") as RecurrenceFrequency);
  const [nextRunDate, setNextRunDate] = useState(draftString(initialDraft, "nextRunDate", initialDocument?.recurrence?.nextRunDate ?? issueDefault));
  const [autoIssue, setAutoIssue] = useState(draftBoolean(initialDraft, "autoIssue", initialDocument?.recurrence?.autoIssue ?? false));
  const [saving, setSaving] = useState<"draft" | "invoice" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(initialDraft ? "Recovered saved invoice draft." : "");

  const availableProjects = projects.filter((project) => project.clientId === clientChoice);
  const preview = useMemo(() => ({ id: "preview", items } as BillingDocument), [items]);
  const totals = calculateDocumentTotals(preview);
  const previewClientName = clientChoice === NEW_VALUE ? newClientName : selectedClient?.name;

  function payload() {
    return { type, clientChoice, newClientName, projectChoice, newProjectName, issueDate, dueDate, currency, items, notes, terms, paymentInstructions, purchaseOrder, frequency, nextRunDate, autoIssue };
  }

  function updateItem(id: string, field: keyof BillingItem, value: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: ["quantity", "rate", "discountRate", "taxRate"].includes(field) ? Number(value) : value } : item));
  }

  async function saveIncompleteDraft() {
    setSaving("draft"); setError(""); setNotice("");
    try {
      const response = await fetch("/admin/api/billing/drafts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: initialDraft?.id, title: previewClientName ? `Invoice for ${previewClientName}` : "Untitled invoice", payload: payload() }),
      });
      const data = await response.json() as { draft?: InvoiceDraft; error?: string };
      if (!response.ok || !data.draft) throw new Error(data.error || "The invoice draft could not be saved.");
      setNotice("Draft saved. You can safely continue later from Billing.");
      if (!initialDraft) router.replace(`/admin/billing/new?draft=${data.draft.id}`);
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The invoice draft could not be saved."); }
    finally { setSaving(null); }
  }

  async function saveInvoice() {
    setSaving("invoice"); setError(""); setNotice("");
    try {
      const response = await fetch(initialDocument ? `/admin/api/billing/${initialDocument.id}` : "/admin/api/billing", {
        method: initialDocument ? "PUT" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          clientId: clientChoice !== NEW_VALUE ? clientChoice : undefined,
          clientName: clientChoice === NEW_VALUE ? newClientName : undefined,
          projectId: projectChoice && projectChoice !== NEW_VALUE ? projectChoice : undefined,
          projectName: projectChoice === NEW_VALUE ? newProjectName : undefined,
          issueDate, dueDate, currency, items, notes, terms, paymentInstructions, purchaseOrder,
          recurrence: type === "recurring" ? { frequency, startDate: issueDate, nextRunDate, autoIssue, state: "active" } : undefined,
        }),
      });
      const data = await response.json() as { document?: BillingDocument; error?: string };
      if (!response.ok || !data.document) throw new Error(data.error || "The invoice could not be saved.");
      if (initialDraft) await fetch(`/admin/api/billing/drafts/${initialDraft.id}`, { method: "DELETE" }).catch(() => undefined);
      router.push(`/admin/billing/${data.document.id}`); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The invoice could not be saved."); }
    finally { setSaving(null); }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(430px,0.95fr)]">
      <div className="space-y-5">
        <section className="rounded-lg border border-ktf-gray-200 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ktf-blue/10 text-ktf-blue"><FileText className="h-5 w-5" /></span><div><h2 className="text-base font-bold text-ktf-navy">Invoice setup</h2><p className="mt-1 text-xs text-ktf-gray-500">Choose an existing record or create a lightweight client and project while invoicing.</p></div></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label><span className={labelClass}>Invoice type</span><select className={inputClass} value={type} disabled={Boolean(initialDocument)} onChange={(event) => setType(event.target.value as BillingDocumentType)}><option value="standard">Standard invoice</option><option value="proforma">Proforma invoice</option><option value="recurring">Recurring invoice template</option></select></label>
            <label><span className={labelClass}>Client</span><select className={inputClass} value={clientChoice} onChange={(event) => { const value = event.target.value; setClientChoice(value); setProjectChoice(""); const client = clients.find((item) => item.id === value); if (client) setCurrency(client.currency); }}><option value="">Choose client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}<option value={NEW_VALUE}>+ Enter a new client</option></select></label>
            {clientChoice === NEW_VALUE && <label className="sm:col-span-2"><span className={labelClass}>New client name</span><input className={inputClass} value={newClientName} onChange={(event) => setNewClientName(event.target.value)} placeholder="Client or company name" /></label>}
            <label><span className={labelClass}>Project</span><select className={inputClass} value={projectChoice} onChange={(event) => setProjectChoice(event.target.value)} disabled={!clientChoice}><option value="">No project</option>{availableProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}<option value={NEW_VALUE}>+ Enter a new project</option></select></label>
            {projectChoice === NEW_VALUE && <label><span className={labelClass}>New project name</span><input className={inputClass} value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} placeholder="Project name" /></label>}
            <label><span className={labelClass}>Issue date</span><input className={inputClass} type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} /></label>
            <label><span className={labelClass}>Due date</span><input className={inputClass} type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
            <label><span className={labelClass}>Currency</span><select className={inputClass} value={currency} onChange={(event) => setCurrency(event.target.value as CurrencyCode)}><option>NGN</option><option>USD</option><option>GBP</option><option>EUR</option></select></label>
            <label><span className={labelClass}>Purchase order</span><input className={inputClass} value={purchaseOrder} onChange={(event) => setPurchaseOrder(event.target.value)} placeholder="Optional reference" /></label>
          </div>
          {type === "recurring" && <div className="mt-5 grid gap-4 rounded-lg border border-ktf-blue/15 bg-ktf-blue/5 p-4 sm:grid-cols-3"><label><span className={labelClass}>Frequency</span><select className={inputClass} value={frequency} onChange={(event) => setFrequency(event.target.value as RecurrenceFrequency)}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></label><label><span className={labelClass}>Next run</span><input className={inputClass} type="date" value={nextRunDate} onChange={(event) => setNextRunDate(event.target.value)} /></label><label className="flex items-end"><span className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-ktf-blue/15 bg-white px-3 py-2 text-xs font-medium text-ktf-gray-700"><input type="checkbox" checked={autoIssue} onChange={(event) => setAutoIssue(event.target.checked)} /> Approve automatically</span></label></div>}
        </section>

        <section className="rounded-lg border border-ktf-gray-200 bg-white shadow-card">
          <div className="flex items-center justify-between border-b border-ktf-gray-200 px-5 py-4 sm:px-6"><div><h2 className="text-base font-bold text-ktf-navy">Invoice items</h2><p className="mt-1 text-xs text-ktf-gray-500">Quantity, rate, discount, and tax stay visible.</p></div><button type="button" onClick={() => setItems((current) => [...current, createItem()])} className={secondaryButtonClass}><Plus className="h-4 w-4" /> Add item</button></div>
          <div className="space-y-4 p-5 sm:p-6">{items.map((item, index) => <div key={item.id} className="rounded-lg border border-ktf-gray-200 p-4"><div className="grid gap-3 sm:grid-cols-2"><label><span className={labelClass}>Item {index + 1}</span><input className={inputClass} value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} placeholder="Service name" /></label><label><span className={labelClass}>Description</span><input className={inputClass} value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} /></label></div><div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5"><label><span className={labelClass}>Quantity</span><input className={inputClass} type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", e.target.value)} /></label><label><span className={labelClass}>Rate</span><input className={inputClass} type="number" min="0" value={item.rate} onChange={(e) => updateItem(item.id, "rate", e.target.value)} /></label><label><span className={labelClass}>Discount %</span><input className={inputClass} type="number" min="0" max="100" value={item.discountRate} onChange={(e) => updateItem(item.id, "discountRate", e.target.value)} /></label><label><span className={labelClass}>Tax %</span><input className={inputClass} type="number" min="0" max="100" value={item.taxRate} onChange={(e) => updateItem(item.id, "taxRate", e.target.value)} /></label><div><span className={labelClass}>Total</span><div className="flex h-10 items-center justify-between rounded-lg bg-ktf-surface px-3 text-xs font-bold text-ktf-navy">{formatMoney(calculateLine(item).total, currency)}{items.length > 1 && <button type="button" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} aria-label={`Remove item ${index + 1}`} className="text-ktf-error"><Trash2 className="h-4 w-4" /></button>}</div></div></div></div>)}</div>
        </section>

        <section className="grid gap-4 rounded-lg border border-ktf-gray-200 bg-white p-5 shadow-card sm:p-6"><label><span className={labelClass}>Notes</span><textarea className={textareaClass} value={notes} onChange={(e) => setNotes(e.target.value)} /></label><label><span className={labelClass}>Terms</span><textarea className={textareaClass} value={terms} onChange={(e) => setTerms(e.target.value)} /></label><label><span className={labelClass}>Payment instructions</span><textarea className={textareaClass} value={paymentInstructions} onChange={(e) => setPaymentInstructions(e.target.value)} /></label></section>

        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">{notice}</p>}
        <div className="flex flex-wrap gap-3"><button type="button" onClick={saveIncompleteDraft} disabled={Boolean(saving) || Boolean(initialDocument)} className={secondaryButtonClass}>{saving === "draft" ? <><LoadingSpinner /> Saving draft…</> : <><Save className="h-4 w-4" /> Save incomplete draft</>}</button><button type="button" onClick={saveInvoice} disabled={Boolean(saving)} className={primaryButtonClass}>{saving === "invoice" ? <><LoadingSpinner /> Saving invoice…</> : <><Save className="h-4 w-4" /> {initialDocument ? "Update invoice" : "Save complete invoice"}</>}</button></div>
      </div>

      <aside className="xl:sticky xl:top-28 xl:self-start">
        <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.12em] text-ktf-gray-500">Live invoice preview</p><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">Draft</span></div>
        <div className="aspect-[1/1.414] overflow-hidden bg-white shadow-[0_16px_50px_rgba(15,23,42,0.13)] ring-1 ring-ktf-gray-200">
          <div className="h-2 bg-ktf-blue" /><div className="flex h-[calc(100%-8px)] flex-col p-[7%] text-slate-900">
            <div className="flex items-start justify-between gap-6"><Image src="/brand/bespoke-technologies-logo.png" alt="Bespoke Technologies" width={340} height={112} className="h-auto w-[42%] object-contain object-left" /><div className="text-right"><p className="text-[8px] font-bold uppercase tracking-wider text-ktf-blue">Billing invoice</p><p className="mt-1 text-[24px] font-extrabold capitalize leading-none">{type === "standard" ? "Invoice" : type === "proforma" ? "Proforma" : "Recurring"}</p><p className="mt-3 text-[8px] font-bold text-slate-700">Number allocated on complete save</p><p className="mt-1 text-[8px] text-slate-500">Issued {issueDate}</p><p className="text-[8px] text-slate-500">Due {dueDate}</p></div></div>
            <div className="mt-[7%] grid grid-cols-2 gap-8 border-t border-slate-200 pt-[5%]"><div><p className="text-[7px] font-bold uppercase tracking-wider text-slate-500">From</p><p className="mt-2 text-[11px] font-bold">{settings.name}</p><p className="mt-1 text-[8px] leading-4 text-slate-500">{settings.email}<br />{settings.phone} · {settings.website}</p></div><div><p className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Bill to</p><p className="mt-2 text-[11px] font-bold">{previewClientName || "Choose a client"}</p><p className="mt-1 text-[8px] leading-4 text-slate-500">{selectedClient?.contacts.find((contact) => contact.isBilling)?.name}<br />{selectedClient?.email}<br />{selectedClient?.address}</p></div></div>
            <div className="mt-[5%]"><div className="grid grid-cols-[1fr_42px_74px_84px] border-y border-blue-200 bg-blue-50 px-2 py-2 text-[7px] font-bold uppercase tracking-wide text-blue-700"><span>Invoice item</span><span>Qty</span><span className="text-right">Rate</span><span className="text-right">Amount</span></div>{items.map((item) => <div key={item.id} className="grid grid-cols-[1fr_42px_74px_84px] border-b border-slate-100 px-2 py-2.5 text-[8px]"><span><strong className="block text-[9px]">{item.name || "Service name"}</strong><span className="mt-1 block text-[7px] text-slate-500">{item.description}</span></span><span>{item.quantity}</span><span className="text-right">{formatMoney(item.rate, currency)}</span><span className="text-right font-bold">{formatMoney(calculateLine(item).total, currency)}</span></div>)}</div>
            <div className="mt-[4%] grid grid-cols-2 gap-8"><div className="text-[7px] leading-4 text-slate-500"><p className="font-bold uppercase text-slate-600">Notes</p><p>{notes}</p><p className="mt-2 font-bold uppercase text-slate-600">Terms</p><p>{terms}</p></div><div className="text-[8px]"><div className="flex justify-between py-1.5 text-slate-500"><span>Subtotal</span><span>{formatMoney(totals.subtotal, currency)}</span></div>{totals.discount > 0 && <div className="flex justify-between py-1 text-slate-500"><span>Discount</span><span>-{formatMoney(totals.discount, currency)}</span></div>}{totals.tax > 0 && <div className="flex justify-between py-1 text-slate-500"><span>Tax</span><span>{formatMoney(totals.tax, currency)}</span></div>}<div className="mt-1 flex items-center justify-between bg-ktf-blue p-3 text-white"><span className="text-[7px] font-bold uppercase">Balance due</span><span className="text-[12px] font-extrabold">{formatMoney(totals.total, currency)}</span></div></div></div>
            <div className="mt-auto flex items-center justify-between border-t border-blue-200 pt-2 text-[6px] font-bold uppercase tracking-wide text-slate-500"><span>Engineering the solutions for this, and The Next Generations_</span><span>Page 1</span></div>
          </div>
        </div>
      </aside>
    </div>
  );
}
