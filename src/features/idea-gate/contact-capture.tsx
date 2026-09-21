"use client";

import { useState } from "react";
import { ArrowRight, CircleCheck, LoaderCircle, Mail } from "lucide-react";

/**
 * Shown on the report only to the person who completed it. The result is
 * already theirs — this exchanges nothing for access, it just offers to email
 * the report and to open a conversation with Bespoke Technologies.
 */
export function IdeaGateContactCapture({ assessmentId }: { assessmentId: string }) {
  const [form, setForm] = useState({
    contactName: "",
    email: "",
    phone: "",
    contactConsent: false,
  });
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!form.email.trim() && !form.phone.trim()) {
      setState("error");
      setMessage("Add an email address or a phone number.");
      return;
    }
    setState("saving");
    try {
      const response = await fetch(`/api/idea-gates/${assessmentId}/contact`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: form.contactName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          contactConsent: form.contactConsent,
          shareIdeaTitle: true,
          sendReport: Boolean(form.email.trim()),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        emailed?: boolean;
        message?: string;
      };
      if (!response.ok) throw new Error(payload.message || "Your details could not be saved.");
      setState("saved");
      setMessage(
        payload.emailed
          ? "Sent. The report is on its way to your inbox."
          : "Saved. Keep this page link — it is your copy of the report.",
      );
    } catch (caught) {
      setState("error");
      setMessage(
        caught instanceof Error ? caught.message : "Your details could not be saved.",
      );
    }
  }

  if (state === "saved") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 print:hidden">
        <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">{message}</p>
          <p className="mt-1 text-xs leading-5 text-emerald-800">
            {form.contactConsent
              ? "Bespoke Technologies may reach out about this idea."
              : "We will not contact you about this idea unless you ask us to."}
          </p>
        </div>
      </div>
    );
  }

  const fieldClass =
    "h-11 w-full rounded-xl border border-ktf-gray-300 bg-white px-4 text-sm outline-none focus:border-ktf-blue focus:ring-2 focus:ring-ktf-blue/15";

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-ktf-gray-200 bg-white p-5 shadow-sm sm:p-6 print:hidden"
    >
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-ktf-blue" />
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ktf-gray-600">
          Send this report to yourself
        </h2>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ktf-gray-600">
        Optional. Your result is already saved at this link — this just puts a copy in your
        inbox and lets us reply if you want help executing it.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-ktf-navy">Name</span>
          <input
            value={form.contactName}
            maxLength={160}
            onChange={(event) =>
              setForm((current) => ({ ...current, contactName: event.target.value }))
            }
            className={fieldClass}
            placeholder="Your name"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-ktf-navy">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            className={fieldClass}
            placeholder="you@company.com"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-ktf-navy">
            WhatsApp or phone
          </span>
          <input
            value={form.phone}
            maxLength={40}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
            className={fieldClass}
            placeholder="+234…"
          />
        </label>
      </div>
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-ktf-gray-700">
        <input
          type="checkbox"
          checked={form.contactConsent}
          onChange={(event) =>
            setForm((current) => ({ ...current, contactConsent: event.target.checked }))
          }
          className="mt-0.5 h-4 w-4 rounded border-ktf-gray-300 accent-ktf-blue"
        />
        <span>
          Bespoke Technologies may contact me about this idea and how to execute it.
        </span>
      </label>
      {message && state === "error" && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700"
        >
          {message}
        </p>
      )}
      <button
        disabled={state === "saving"}
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ktf-blue px-6 text-sm font-semibold text-white transition hover:bg-ktf-blue-deep disabled:opacity-60"
      >
        {state === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        Send me the report
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
