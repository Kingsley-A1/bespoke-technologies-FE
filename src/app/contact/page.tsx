import { Badge } from "@/components/ui";
import { TypingText } from "@/components/ui/typing-text";
import { Container } from "@/components/layout";
import { ContactForm } from "@/components/marketing/contact-form";
import {
  CONTACT_EMAIL,
  PHONE_NUMBER,
  PHONE_DISPLAY,
  SITE_DOMAIN,
  SITE_NAME,
  SITE_URL,
  WHATSAPP_NUMBER,
  WHATSAPP_INQUIRY_MESSAGE,
} from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${SITE_NAME}. Tell us about your project and we'll respond within one business day.`,
  alternates: {
    canonical: "/contact",
  },
};

const contactDetails = [
  {
    icon: "✉",
    label: "Email",
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
  },
  {
    icon: "🌐",
    label: "Website",
    value: SITE_DOMAIN,
    href: SITE_URL,
  },
];

export default function ContactPage() {
  return (
    <>
      {/* ── Page Hero ─────────────────────────────────────────── */}
      <section className="bg-ktf-navy py-16 sm:py-20">
        <Container size="lg" className="text-center">
          <Badge
            variant="outline"
            className="border-ktf-blue/40 text-ktf-blue bg-ktf-blue/10 mb-6"
          >
            Get in Touch
          </Badge>
          <h1 className="text-h1 font-bold leading-heading text-ktf-white max-w-3xl mx-auto mb-4">
            Let&apos;s Talk About{" "}
            <TypingText text="Your Project" className="text-ktf-blue" />
          </h1>
          <p className="text-body-lg text-ktf-gray-400 leading-body max-w-2xl mx-auto">
            Whether you have a clear brief or an early idea, we&apos;re here to
            listen, advise, and help you build something exceptional.
          </p>
        </Container>
      </section>

      {/* ── Contact Split ─────────────────────────────────────── */}
      <section className="bg-ktf-white py-24 sm:py-32">
        <Container size="lg">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_420px] lg:items-start">
            {/* Form column */}
            <div>
              <h2 className="text-h3 font-bold leading-heading text-ktf-navy mb-2">
                Send Us a Message
              </h2>
              <p className="text-body text-ktf-gray-600 leading-body mb-8">
                Fill out the form below and a member of our team will respond
                within one business day.
              </p>

              {/* ── Instant contact row ─────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_INQUIRY_MESSAGE)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-2xl border border-[#25d366]/30 bg-[#25d366]/5 px-5 py-4 transition-all duration-200 hover:border-[#25d366]/60 hover:bg-[#25d366]/10 hover:shadow-lg"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25d366] shadow-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill="#ffffff"
                      aria-hidden="true"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-caption font-semibold uppercase tracking-widest text-ktf-gray-500 mb-0.5">
                      WhatsApp
                    </p>
                    <p className="text-body-sm font-semibold text-ktf-navy group-hover:text-[#25d366] transition-colors">
                      Chat with us instantly
                    </p>
                  </div>
                </a>

                {/* Phone */}
                <a
                  href={`tel:${PHONE_NUMBER}`}
                  className="group flex items-center gap-4 rounded-2xl border border-ktf-blue/20 bg-ktf-blue/5 px-5 py-4 transition-all duration-200 hover:border-ktf-blue/40 hover:bg-ktf-blue/10 hover:shadow-lg"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ktf-blue shadow-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .93h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-caption font-semibold uppercase tracking-widest text-ktf-gray-500 mb-0.5">
                      Phone
                    </p>
                    <p className="text-body-sm font-semibold text-ktf-navy group-hover:text-ktf-blue transition-colors">
                      {PHONE_DISPLAY}
                    </p>
                  </div>
                </a>
              </div>

              <div className="flex items-center gap-3 mb-8">
                <div className="flex-1 h-px bg-ktf-gray-200" />
                <span className="text-caption text-ktf-gray-400 uppercase tracking-widest">
                  or send a message
                </span>
                <div className="flex-1 h-px bg-ktf-gray-200" />
              </div>

              <ContactForm />
            </div>

            {/* Info column */}
            <aside className="flex flex-col gap-8">
              {/* Contact details */}
              <div className="rounded-2xl border border-ktf-gray-200 bg-ktf-surface p-8">
                <h3 className="text-body font-semibold text-ktf-navy uppercase tracking-wide text-overline mb-6">
                  Contact Information
                </h3>
                <ul className="flex flex-col gap-5">
                  {contactDetails.map((detail) => (
                    <li key={detail.label} className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ktf-blue/10 text-body">
                        {detail.icon}
                      </div>
                      <div>
                        <p className="text-caption font-semibold uppercase tracking-widest text-ktf-gray-500 mb-0.5">
                          {detail.label}
                        </p>
                        <a
                          href={detail.href}
                          className="text-body-sm text-ktf-navy hover:text-ktf-blue transition-colors duration-150"
                        >
                          {detail.value}
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Response time */}
              <div className="rounded-2xl border border-ktf-gray-200 bg-ktf-surface p-8">
                <h3 className="text-body font-semibold text-ktf-navy uppercase tracking-wide text-overline mb-4">
                  What to Expect
                </h3>
                <ul className="flex flex-col gap-4">
                  {[
                    { step: "01", label: "You send the form" },
                    {
                      step: "02",
                      label: "We review & respond within 1 business day",
                    },
                    { step: "03", label: "We schedule a discovery call" },
                    { step: "04", label: "We agree on scope & begin" },
                  ].map((item) => (
                    <li key={item.step} className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ktf-blue/10 text-caption font-bold text-ktf-blue">
                        {item.step}
                      </span>
                      <span className="text-body-sm text-ktf-gray-700">
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Promise */}
              <div className="rounded-2xl border border-ktf-blue/20 bg-ktf-blue/5 p-6">
                <p className="text-body-sm text-ktf-gray-700 leading-body">
                  <strong className="text-ktf-navy">Our promise:</strong> We
                  respond to every message honestly. If we&apos;re not the right
                  fit for your project, we&apos;ll tell you — and we may even
                  know who is.
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
