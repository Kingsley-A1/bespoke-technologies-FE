"use client";

import { useActionState, useRef, useState } from "react";
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
    });
  }

  function update(name: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((prev) => ({ ...prev, [name]: e.target.value }));
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
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
        <input id="signOffName" name="signOffName" required defaultValue={defaultSignOff} className={inputClass} />
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
        {pending ? "Sending…" : "Send email"}
      </button>
    </form>
  );
}
