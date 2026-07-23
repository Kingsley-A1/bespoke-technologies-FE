"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { Send } from "lucide-react";
import { LoadingSpinner } from "@/features/admin/components/admin-loading";
import { inputClass, labelClass, primaryButtonClass } from "@/features/admin/components/admin-ui";
import { sendAdminEmailAction, type ComposeResult } from "./actions";

interface TemplateOption {
  key: string;
  label: string;
  description: string;
  defaults: {
    subject: string;
    heading: string;
    body: string;
    ctaLabel?: string;
    ctaUrl?: string;
  };
}

interface SenderOption {
  key: string;
  label: string;
  address: string;
}

interface ComposeFormProps {
  templates: TemplateOption[];
  senders: SenderOption[];
  defaultSignOff: string;
}

export function ComposeForm({ templates, senders, defaultSignOff }: ComposeFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [templateKey, setTemplateKey] = useState(templates[0]?.key ?? "blank");
  const [fields, setFields] = useState({
    subject: templates[0]?.defaults.subject ?? "",
    heading: templates[0]?.defaults.heading ?? "",
    body: templates[0]?.defaults.body ?? "",
    ctaLabel: templates[0]?.defaults.ctaLabel ?? "",
    ctaUrl: templates[0]?.defaults.ctaUrl ?? "",
    signOffName: defaultSignOff,
  });

  const [state, formAction, pending] = useActionState<ComposeResult | null, FormData>(
    async (prev, formData) => {
      const result = await sendAdminEmailAction(prev, formData);
      if (result.ok) formRef.current?.reset();
      return result;
    },
    null,
  );

  function applyTemplate(key: string) {
    setTemplateKey(key);
    const template = templates.find((item) => item.key === key);
    if (!template) return;
    setFields({
      subject: template.defaults.subject,
      heading: template.defaults.heading,
      body: template.defaults.body,
      ctaLabel: template.defaults.ctaLabel ?? "",
      ctaUrl: template.defaults.ctaUrl ?? "",
      signOffName: fields.signOffName,
    });
  }

  function update(name: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((prev) => ({ ...prev, [name]: e.target.value }));
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.86fr)_minmax(420px,1.14fr)]">
    <form ref={formRef} action={formAction} className="space-y-5 rounded-lg border border-ktf-gray-200 bg-white p-5 sm:p-6">
      <input type="hidden" name="templateKey" value={templateKey} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="template">Template</label>
          <select
            id="template"
            className={inputClass}
            value={templateKey}
            onChange={(e) => applyTemplate(e.target.value)}
          >
            {templates.map((template) => (
              <option key={template.key} value={template.key}>{template.label}</option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {templates.find((t) => t.key === templateKey)?.description}
          </p>
        </div>

        <div>
          <label className={labelClass} htmlFor="senderKey">Send as</label>
          <select id="senderKey" name="senderKey" className={inputClass} defaultValue={senders[0]?.key}>
            {senders.map((sender) => (
              <option key={sender.key} value={sender.key}>{sender.label} ({sender.address})</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="to">Recipient email</label>
        <input id="to" name="to" type="email" required placeholder="client@company.com" className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="subject">Subject</label>
        <input id="subject" name="subject" required value={fields.subject} onChange={update("subject")} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="heading">Heading (shown at the top of the email)</label>
        <input id="heading" name="heading" required value={fields.heading} onChange={update("heading")} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="body">Message</label>
        <textarea
          id="body"
          name="body"
          required
          rows={10}
          value={fields.body}
          onChange={update("body")}
          placeholder="Write your message. Separate paragraphs with a blank line."
          className={`${inputClass} h-auto py-2.5 leading-6`}
        />
        <p className="mt-1.5 text-[11px] text-slate-500">Separate paragraphs with a blank line. Sign-off is added automatically.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="ctaLabel">Button label (optional)</label>
          <input id="ctaLabel" name="ctaLabel" value={fields.ctaLabel} onChange={update("ctaLabel")} placeholder="Book a call" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="ctaUrl">Button URL (optional)</label>
          <input id="ctaUrl" name="ctaUrl" type="url" value={fields.ctaUrl} onChange={update("ctaUrl")} placeholder="https://www.bespoketech.com.ng/contact" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="signOffName">Sign-off name</label>
        <input id="signOffName" name="signOffName" required value={fields.signOffName} onChange={update("signOffName")} className={inputClass} />
      </div>

      {state && (
        <p
          role="status"
          className={
            state.ok
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          }
        >
          {state.message}
        </p>
      )}

      <button type="submit" className={primaryButtonClass} disabled={pending}>
        {pending ? <><LoadingSpinner /> Sending…</> : <><Send className="h-4 w-4" /> Send email</>}
      </button>
    </form>
    <aside className="overflow-hidden rounded-lg border border-ktf-gray-200 bg-[#f6f8fb] shadow-card xl:sticky xl:top-28" aria-label="Live email preview">
      <div className="flex items-center justify-between border-b border-ktf-gray-200 bg-white px-4 py-3">
        <div><p className="text-xs font-bold text-ktf-navy">Live inbox preview</p><p className="mt-0.5 max-w-[300px] truncate text-[10px] text-ktf-gray-500">{fields.subject || "Email subject"}</p></div>
        <span className="rounded-full bg-ktf-blue/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-ktf-blue">Updates live</span>
      </div>
      <div className="p-3 sm:p-5">
        <div className="mx-auto max-w-[760px] bg-white shadow-sm">
          <div className="h-1 bg-ktf-blue" />
          <div className="border-b border-ktf-gray-200 px-6 py-5"><Image src="/brand/bespoke-technologies-logo.png" alt="Bespoke Technologies" width={210} height={70} className="h-auto w-[190px] max-w-[64%]" /></div>
          <div className="px-6 py-7 sm:px-8">
            <h2 className="text-xl font-bold tracking-[-0.02em] text-ktf-navy">{fields.heading || "Email heading"}</h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-ktf-gray-800">
              {(fields.body || "Your message will appear here as you type.").split(/\n{2,}/).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>)}
            </div>
            {fields.ctaLabel && fields.ctaUrl && <span className="mt-5 inline-flex h-10 items-center rounded-lg bg-ktf-blue-deep px-5 text-xs font-semibold text-white">{fields.ctaLabel}</span>}
            <p className="mt-6 text-sm leading-6 text-ktf-gray-800">Warm regards,<br />{fields.signOffName}<br /><span className="text-ktf-gray-600">Bespoke Technologies</span></p>
          </div>
          <div className="border-t border-ktf-gray-200 bg-ktf-surface px-6 py-5 text-[10px] leading-5 text-ktf-gray-500">Bespoke Technologies · Engineering the solutions for this, and The Next Generations_<br />www.bespoketech.com.ng</div>
        </div>
      </div>
    </aside>
    </div>
  );
}
