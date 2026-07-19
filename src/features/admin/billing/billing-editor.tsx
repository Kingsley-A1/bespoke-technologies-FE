"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CalendarClock, FileText, Plus, Save, Trash2 } from "lucide-react";
import { calculateDocumentTotals, calculateLine, formatMoney } from "./money";
import { inputClass, labelClass, primaryButtonClass, textareaClass } from "../components/admin-ui";
import type { BillingDocument, BillingDocumentType, BillingItem, Client, CompanySettings, CurrencyCode, Project, RecurrenceFrequency } from "../types";

const createItem = (): BillingItem => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  quantity: 1,
  rate: 0,
  discountRate: 0,
  taxRate: 0,
});

export function BillingEditor({ clients, projects, settings, initialDocument }: { clients: Client[]; projects: Project[]; settings: CompanySettings; initialDocument?: BillingDocument }) {
  const router = useRouter();
  const [type, setType] = useState<BillingDocumentType>(initialDocument?.type ?? "standard");
  const [clientId, setClientId] = useState(initialDocument?.clientId ?? clients[0]?.id ?? "");
  const [projectId, setProjectId] = useState(initialDocument?.projectId ?? "");
  const selectedClient = clients.find((client) => client.id === clientId);
  const [issueDate, setIssueDate] = useState(initialDocument?.issueDate ?? new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    if (initialDocument) return initialDocument.dueDate;
    const value = new Date();
    value.setDate(value.getDate() + settings.defaultPaymentTermsDays);
    return value.toISOString().slice(0, 10);
  });
  const [currency, setCurrency] = useState<CurrencyCode>(initialDocument?.currency ?? selectedClient?.currency ?? settings.defaultCurrency);
  const [items, setItems] = useState<BillingItem[]>(initialDocument?.items ?? [createItem()]);
  const [notes, setNotes] = useState(initialDocument?.notes ?? "Thank you for trusting Bespoke Technologies.");
  const [terms, setTerms] = useState(initialDocument?.terms ?? "Payment is due on or before the stated due date.");
  const [paymentInstructions, setPaymentInstructions] = useState(initialDocument?.paymentInstructions ?? settings.paymentInstructions);
  const [purchaseOrder, setPurchaseOrder] = useState(initialDocument?.purchaseOrder ?? "");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(initialDocument?.recurrence?.frequency ?? "monthly");
  const [nextRunDate, setNextRunDate] = useState(initialDocument?.recurrence?.nextRunDate ?? issueDate);
  const [autoIssue, setAutoIssue] = useState(initialDocument?.recurrence?.autoIssue ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const preview = useMemo(() => ({ id: "preview", items } as BillingDocument), [items]);
  const totals = calculateDocumentTotals(preview);
  const updateItem = (id: string, field: keyof BillingItem, value: string) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, [field]: ["quantity", "rate", "discountRate", "taxRate"].includes(field) ? Number(value) : value } : item));
  };

  async function saveDocument() {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(initialDocument ? `/admin/api/billing/${initialDocument.id}` : "/admin/api/billing", {
        method: initialDocument ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          clientId,
          projectId: projectId || undefined,
          issueDate,
          dueDate,
          currency,
          items,
          notes,
          terms,
          paymentInstructions,
          purchaseOrder,
          recurrence: type === "recurring" ? { frequency, startDate: issueDate, nextRunDate, autoIssue, state: "active" } : undefined,
        }),
      });
      const payload = await response.json() as { document?: BillingDocument; error?: string };
      if (!response.ok || !payload.document) throw new Error(payload.error || "The document could not be saved.");
      router.push(`/admin/billing/${payload.document.id}`);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The document could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(430px,0.95fr)]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><FileText className="h-5 w-5" /></span><div><h2 className="text-base font-bold text-slate-950">Document setup</h2><p className="mt-1 text-xs text-slate-500">Choose the client, document type, dates, and currency.</p></div></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label><span className={labelClass}>Document type</span><select className={inputClass} value={type} disabled={Boolean(initialDocument)} onChange={(event) => setType(event.target.value as BillingDocumentType)}><option value="standard">Standard invoice</option><option value="proforma">Proforma invoice</option><option value="recurring">Recurring template</option></select></label>
            <label><span className={labelClass}>Client</span><select className={inputClass} value={clientId} onChange={(event) => { const value = event.target.value; setClientId(value); setProjectId(""); const client = clients.find((candidate) => candidate.id === value); if (client) setCurrency(client.currency); }}><option value="">Choose client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
            <label><span className={labelClass}>Linked project</span><select className={inputClass} value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">No project</option>{projects.filter((project) => project.clientId === clientId).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
            <label><span className={labelClass}>Issue date</span><input className={inputClass} type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} /></label>
            <label><span className={labelClass}>Due date</span><input className={inputClass} type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
            <label><span className={labelClass}>Currency</span><select className={inputClass} value={currency} onChange={(event) => setCurrency(event.target.value as CurrencyCode)}><option>NGN</option><option>USD</option><option>GBP</option><option>EUR</option></select></label>
            <label><span className={labelClass}>Purchase order</span><input className={inputClass} value={purchaseOrder} onChange={(event) => setPurchaseOrder(event.target.value)} placeholder="Optional reference" /></label>
          </div>
          {type === "recurring" && <div className="mt-5 grid gap-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:grid-cols-3"><label><span className={labelClass}>Frequency</span><select className={inputClass} value={frequency} onChange={(event) => setFrequency(event.target.value as RecurrenceFrequency)}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></label><label><span className={labelClass}>Next run</span><input className={inputClass} type="date" value={nextRunDate} onChange={(event) => setNextRunDate(event.target.value)} /></label><label className="flex items-end"><span className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2 text-xs font-medium text-slate-700"><input type="checkbox" checked={autoIssue} onChange={(event) => setAutoIssue(event.target.checked)} /> Approve automatically; delivery is confirmed separately</span></label></div>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6"><div><h2 className="text-base font-bold text-slate-950">Services</h2><p className="mt-1 text-xs text-slate-500">Each line supports quantity, rate, discount, and tax.</p></div><button type="button" onClick={() => setItems((current) => [...current, createItem()])} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600"><Plus className="h-4 w-4" /> Add line</button></div>
          <div className="space-y-4 p-5 sm:p-6">
            {items.map((item, index) => <article key={item.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Service {index + 1}</p>{items.length > 1 && <button type="button" onClick={() => setItems((current) => current.filter((candidate) => candidate.id !== item.id))} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-700" aria-label={`Remove service ${index + 1}`}><Trash2 className="h-4 w-4" /></button>}</div><div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><label className="sm:col-span-2 xl:col-span-3"><span className={labelClass}>Service name</span><input className={inputClass} value={item.name} onChange={(event) => updateItem(item.id, "name", event.target.value)} /></label><label><span className={labelClass}>Quantity</span><input className={inputClass} type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(item.id, "quantity", event.target.value)} /></label><label><span className={labelClass}>Rate</span><input className={inputClass} type="number" min="0" step="0.01" value={item.rate} onChange={(event) => updateItem(item.id, "rate", event.target.value)} /></label><label><span className={labelClass}>Discount %</span><input className={inputClass} type="number" min="0" max="100" step="0.01" value={item.discountRate} onChange={(event) => updateItem(item.id, "discountRate", event.target.value)} /></label><label><span className={labelClass}>Tax %</span><input className={inputClass} type="number" min="0" max="100" step="0.01" value={item.taxRate} onChange={(event) => updateItem(item.id, "taxRate", event.target.value)} /></label><label className="sm:col-span-2 xl:col-span-6"><span className={labelClass}>Description</span><input className={inputClass} value={item.description} onChange={(event) => updateItem(item.id, "description", event.target.value)} /></label></div></article>)}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2"><label className="rounded-2xl border border-slate-200 bg-white p-5"><span className={labelClass}>Notes</span><textarea className={textareaClass} value={notes} onChange={(event) => setNotes(event.target.value)} /></label><label className="rounded-2xl border border-slate-200 bg-white p-5"><span className={labelClass}>Terms</span><textarea className={textareaClass} value={terms} onChange={(event) => setTerms(event.target.value)} /></label><label className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2"><span className={labelClass}>Payment instructions</span><textarea className={textareaClass} value={paymentInstructions} onChange={(event) => setPaymentInstructions(event.target.value)} placeholder="Add only verified company payment instructions." /></label></section>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button type="button" disabled={saving || !clientId || items.some((item) => !item.name.trim())} onClick={saveDocument} className={`${primaryButtonClass} h-11 px-5 text-sm`}><Save className="h-4 w-4" /> {saving ? "Saving…" : initialDocument ? "Save changes" : "Save draft"}</button>
      </div>

      <aside className="xl:sticky xl:top-28 xl:self-start">
        <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Live A4 preview</p><span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-500 shadow-sm"><CalendarClock className="h-3.5 w-3.5" /> Draft</span></div>
        <div className="aspect-[1/1.414] overflow-hidden bg-white shadow-[0_16px_50px_rgba(15,23,42,0.13)] ring-1 ring-slate-200">
          <div className="h-2 bg-ktf-blue" />
          <div className="flex h-[calc(100%-8px)] flex-col p-[7%] text-slate-900">
            <div className="flex items-start justify-between gap-6"><Image src="/brand/bespoke-technologies-logo.png" alt="Bespoke Technologies" width={340} height={112} className="h-auto w-[42%] object-contain object-left" /><div className="text-right"><p className="text-[8px] font-bold uppercase tracking-wider text-ktf-blue">Billing document</p><p className="mt-1 text-[24px] font-extrabold capitalize leading-none">{type === "standard" ? "Invoice" : type === "proforma" ? "Proforma" : "Recurring"}</p><p className="mt-3 text-[8px] font-bold text-slate-700">Number allocated on save</p><p className="mt-1 text-[8px] text-slate-500">Issued {issueDate}</p><p className="text-[8px] text-slate-500">Due {dueDate}</p></div></div>
            <div className="mt-[7%] grid grid-cols-2 gap-8 border-t border-slate-200 pt-[5%]"><div><p className="text-[7px] font-bold uppercase tracking-wider text-slate-500">From</p><p className="mt-2 text-[11px] font-bold">{settings.name}</p><p className="mt-1 text-[8px] leading-4 text-slate-500">{settings.email}<br />{settings.phone} · {settings.website}</p></div><div><p className="text-[7px] font-bold uppercase tracking-wider text-slate-500">Bill to</p><p className="mt-2 text-[11px] font-bold">{selectedClient?.name || "Choose a client"}</p><p className="mt-1 text-[8px] leading-4 text-slate-500">{selectedClient?.contacts.find((contact) => contact.isBilling)?.name}<br />{selectedClient?.email}<br />{selectedClient?.address}</p></div></div>
            <div className="mt-[5%]"><div className="grid grid-cols-[1fr_42px_74px_84px] border-y border-blue-200 bg-blue-50 px-2 py-2 text-[7px] font-bold uppercase tracking-wide text-blue-700"><span>Service description</span><span>Qty</span><span className="text-right">Rate</span><span className="text-right">Amount</span></div>{items.map((item) => <div key={item.id} className="grid grid-cols-[1fr_42px_74px_84px] border-b border-slate-100 px-2 py-2.5 text-[8px]"><span><strong className="block text-[9px]">{item.name || "Service name"}</strong><span className="mt-1 block text-[7px] text-slate-500">{item.description}</span></span><span>{item.quantity}</span><span className="text-right">{formatMoney(item.rate, currency)}</span><span className="text-right font-bold">{formatMoney(calculateLine(item).total, currency)}</span></div>)}</div>
            <div className="mt-[4%] grid grid-cols-2 gap-8"><div className="text-[7px] leading-4 text-slate-500"><p className="font-bold uppercase text-slate-600">Notes</p><p>{notes}</p><p className="mt-2 font-bold uppercase text-slate-600">Terms</p><p>{terms}</p></div><div className="text-[8px]"><div className="flex justify-between py-1.5 text-slate-500"><span>Subtotal</span><span>{formatMoney(totals.subtotal, currency)}</span></div>{totals.discount > 0 && <div className="flex justify-between py-1 text-slate-500"><span>Discount</span><span>-{formatMoney(totals.discount, currency)}</span></div>}{totals.tax > 0 && <div className="flex justify-between py-1 text-slate-500"><span>Tax</span><span>{formatMoney(totals.tax, currency)}</span></div>}<div className="mt-1 flex items-center justify-between bg-ktf-blue p-3 text-white"><span className="text-[7px] font-bold uppercase">Balance due</span><span className="text-[12px] font-extrabold">{formatMoney(totals.total, currency)}</span></div></div></div>
            <div className="mt-auto flex items-center justify-between border-t border-blue-200 pt-2 text-[6px] font-bold uppercase tracking-wide text-slate-500"><span>Engineering the solutions for this, and The Next Generations_</span><span>Page 1</span></div>
          </div>
        </div>
      </aside>
    </div>
  );
}
