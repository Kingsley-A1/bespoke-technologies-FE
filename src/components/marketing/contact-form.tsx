"use client";

import { useState } from "react";
import Script from "next/script";
import { Button, Input, Textarea, Select } from "@/components/ui";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: { reset: (widget?: string) => void };
  }
}

type ContactSubject = "project_enquiry" | "partnership" | "general" | "support";

interface FormState {
  name: string;
  email: string;
  company: string;
  subject: ContactSubject | "";
  message: string;
  website: string; // honeypot — never shown to users
}

const subjectOptions: { value: ContactSubject; label: string }[] = [
  { value: "project_enquiry", label: "Project Enquiry" },
  { value: "partnership", label: "Partnership" },
  { value: "general", label: "General Enquiry" },
  { value: "support", label: "Support" },
];

const initialState: FormState = {
  name: "",
  email: "",
  company: "",
  subject: "",
  message: "",
  website: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!form.email.trim()) {
      next.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Please enter a valid email address.";
    }
    if (!form.subject) next.subject = "Please select a subject.";
    if (!form.message.trim()) {
      next.message = "Message is required.";
    } else if (form.message.trim().length < 20) {
      next.message = "Message must be at least 20 characters.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    // Honeypot check — bots fill the hidden website field
    if (form.website) return;

    // Cloudflare Turnstile token, injected by the widget into the form
    const turnstileToken = TURNSTILE_SITE_KEY
      ? (
          e.currentTarget.querySelector(
            '[name="cf-turnstile-response"]',
          ) as HTMLInputElement | null
        )?.value ?? ""
      : "";

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setStatus("error");
      setErrorMessage("Please complete the verification and try again.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          company: form.company.trim() || undefined,
          subject: form.subject,
          message: form.message.trim(),
          website: form.website,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.message ?? "Something went wrong. Please try again.",
        );
      }

      setStatus("success");
      setForm(initialState);
      window.turnstile?.reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      window.turnstile?.reset();
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-ktf-success/30 bg-ktf-success/5 p-10 text-center">
        <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-ktf-success/15">
          <span className="text-h3 text-ktf-success" aria-hidden="true">
            ✓
          </span>
        </div>
        <h3 className="text-h5 font-semibold text-ktf-navy mb-2">
          Message Sent!
        </h3>
        <p className="text-body-sm text-ktf-gray-600 leading-body mb-6">
          Thank you for reaching out. We typically respond within one business
          day.
        </p>
        <Button variant="outline" size="sm" onClick={() => setStatus("idle")}>
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Contact form">
      {/* Honeypot field — visually hidden from real users */}
      <div className="absolute -left-2499.75 -top-2499.75" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input
          type="text"
          id="website"
          name="website"
          value={form.website}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Full Name"
            name="name"
            id="contact-name"
            placeholder="Jane Smith"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            required
            autoComplete="name"
          />
          <Input
            label="Email Address"
            name="email"
            id="contact-email"
            type="email"
            placeholder="jane@company.com"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            required
            autoComplete="email"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Company (optional)"
            name="company"
            id="contact-company"
            placeholder="Acme Corp"
            value={form.company}
            onChange={handleChange}
            autoComplete="organization"
          />
          <Select
            label="Subject"
            name="subject"
            id="contact-subject"
            value={form.subject}
            onChange={handleChange}
            error={errors.subject}
            required
            placeholder="Select a subject…"
            options={subjectOptions}
          />
        </div>

        <Textarea
          label="Message"
          name="message"
          id="contact-message"
          placeholder="Tell us about your project or enquiry…"
          value={form.message}
          onChange={handleChange}
          error={errors.message}
          rows={6}
          required
        />

        {TURNSTILE_SITE_KEY && (
          <>
            <Script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js"
              strategy="lazyOnload"
            />
            <div
              className="cf-turnstile"
              data-sitekey={TURNSTILE_SITE_KEY}
              data-theme="light"
              data-size="flexible"
            />
          </>
        )}

        {status === "error" && (
          <p
            role="alert"
            className="rounded-lg border border-ktf-error/30 bg-ktf-error/5 px-4 py-3 text-body-sm text-ktf-error"
          >
            {errorMessage}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          isLoading={status === "loading"}
          disabled={status === "loading"}
          className="w-full sm:w-auto"
        >
          {status === "loading" ? "Sending…" : "Send Message"}
        </Button>
      </div>
    </form>
  );
}
