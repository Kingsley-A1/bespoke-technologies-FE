import type { Metadata } from "next";
import { Container } from "@/components/layout";
import { Badge } from "@/components/ui";
import { CONTACT_EMAIL, SITE_DOMAIN, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `${SITE_NAME}'s Privacy Policy. We are committed to protecting your privacy. We do not collect, sell, or share personal data for advertising purposes.`,
  alternates: {
    canonical: "/privacy",
  },
  robots: { index: false, follow: true },
};

const LAST_UPDATED = "1 July 2025";

const sections = [
  {
    id: "overview",
    title: "1. Overview",
    content: `Bespoke Technologies ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we handle information in connection with your use of our website at ${SITE_DOMAIN} (the "Site").

We believe in minimal data collection, radical transparency, and treating your personal information with the respect it deserves. We do not sell your data. We do not use it for advertising. We do not share it with third parties for commercial purposes.`,
  },
  {
    id: "what-we-collect",
    title: "2. Information We Collect",
    content: `We collect only the minimum information necessary to operate the Site and respond to your enquiries:

Contact Form Submissions: When you complete our contact form, we collect your name, email address, and the content of your message. This information is submitted voluntarily and is used solely to respond to your enquiry.

Voluntarily Provided Information: If you contact us directly via email, WhatsApp, or phone, we may retain a record of that communication in order to respond to you and maintain accurate business records.

We do not collect:
• Browsing behaviour or page-view analytics
• Device fingerprints or unique identifiers
• Location data beyond what is inherent in your IP address (if any)
• Transaction data (no purchases are made on this Site)
• Sensitive personal data (health, financial, biometric, etc.)`,
  },
  {
    id: "no-tracking",
    title: "3. No Tracking or Analytics",
    content: `We do not use Google Analytics, Meta Pixel, Mixpanel, or any third-party behavioural analytics service on this Site. We do not place tracking cookies or use fingerprinting technologies to monitor how you use the Site.

Our hosting provider (Vercel) may collect basic server-side access logs (IP address, request URL, timestamp, response code) for infrastructure and security purposes. These logs are not used to build individual user profiles and are subject to Vercel's own privacy practices at vercel.com/legal/privacy-policy.`,
  },
  {
    id: "cookies",
    title: "4. Cookies",
    content: `We do not use tracking cookies, advertising cookies, or persistent session cookies for user profiling purposes.

The Site may use essential, functional cookies required for core website operation (for example, temporary session state for the contact form). These do not store personal identifying information and are deleted when your browser session ends.

You can configure your browser to refuse all cookies. Doing so may affect some functional aspects of the Site.`,
  },
  {
    id: "use-of-data",
    title: "5. How We Use Your Information",
    content: `Information you provide via the contact form is used exclusively to:

• Respond to your enquiry or project request.
• Maintain internal records of client communications.
• Comply with legal and regulatory obligations where required.

We do not use your personal information to send unsolicited marketing communications. If you contact us, we may follow up regarding your specific enquiry — but we will not add you to any mailing list without your explicit consent.`,
  },
  {
    id: "sharing",
    title: "6. Sharing of Information",
    content: `We do not sell, rent, or trade your personal information to any third party.

We may share your information only in the following limited circumstances:

Service Providers: We use a small number of trusted third-party services to operate our business (for example, our email hosting provider to receive contact form messages). These providers are contractually bound to use your data only as instructed by us.

Legal Requirements: We may disclose information if required to do so by law, court order, or government authority, or where we believe disclosure is necessary to protect our legal rights or the safety of our team or others.

Business Transfers: In the event of a merger, acquisition, or sale of all or substantially all of our assets, your information may be transferred as part of that transaction. We would notify you before your personal data is transferred and becomes subject to a different privacy policy.`,
  },
  {
    id: "data-retention",
    title: "7. Data Retention",
    content: `Contact form submissions are retained for as long as is necessary to fully respond to your enquiry and for a reasonable period thereafter to maintain accurate business records (typically no longer than 24 months).

You may request deletion of your data at any time by contacting us at ${CONTACT_EMAIL}. We will confirm receipt of your request and action it within 30 days.`,
  },
  {
    id: "international",
    title: "8. International Transfers",
    content: `Bespoke Technologies is based in Nigeria. Our website is hosted on Vercel's global edge network, which may route or store data in servers located in the European Union, United States, or other jurisdictions.

By submitting information through this Site, you acknowledge that your data may be processed in countries outside your country of residence. We take reasonable steps to ensure appropriate safeguards are in place for such transfers in accordance with applicable data protection laws.`,
  },
  {
    id: "your-rights",
    title: "9. Your Rights",
    content: `Depending on your jurisdiction, you may have the following rights with respect to your personal data:

• Right of Access: To request a copy of the personal data we hold about you.
• Right to Rectification: To request correction of inaccurate or incomplete data.
• Right to Erasure: To request deletion of your personal data ("right to be forgotten").
• Right to Restriction: To request that we restrict processing of your data in certain circumstances.
• Right to Object: To object to processing based on legitimate interests.
• Right to Portability: To receive your data in a structured, machine-readable format.

To exercise any of these rights, please contact us at ${CONTACT_EMAIL}. We will respond to all requests within 30 days.`,
  },
  {
    id: "children",
    title: "10. Children's Privacy",
    content: `This Site is not directed at children under the age of 13, and we do not knowingly collect personal data from children. If we become aware that a child under 13 has submitted personal information through our Site, we will promptly delete it.

If you are a parent or guardian and believe your child has provided us with personal information, please contact us at ${CONTACT_EMAIL}.`,
  },
  {
    id: "security",
    title: "11. Security",
    content: `We implement industry-standard technical and organisational measures to protect your personal information from unauthorised access, disclosure, alteration, or destruction. These include HTTPS encryption on all data in transit, restricted access controls, and regular security reviews.

However, no method of electronic transmission or storage is 100% secure. While we strive to protect your information, we cannot guarantee its absolute security. Any data transmission is at your own risk.`,
  },
  {
    id: "changes",
    title: "12. Changes to This Policy",
    content: `We may update this Privacy Policy periodically. We will indicate the date of the most recent revision at the top of this page. We encourage you to review this page regularly to stay informed about how we protect your information.

Material changes will be communicated via a notice on our Site homepage for a period of at least 30 days prior to the change taking effect.`,
  },
  {
    id: "contact-us",
    title: "13. Contact Us",
    content: `If you have any questions, concerns, or requests relating to this Privacy Policy or our data practices, please contact us:

Email: ${CONTACT_EMAIL}
Website: ${SITE_DOMAIN}/contact

We are committed to resolving any privacy concerns honestly and promptly.`,
  },
] as const;

export default function PrivacyPage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="bg-ktf-navy py-20 sm:py-28">
        <Container size="md" className="text-center">
          <Badge
            variant="outline"
            className="border-ktf-blue/40 text-ktf-blue bg-ktf-blue/10 mb-6"
          >
            Legal
          </Badge>
          <h1 className="text-h1 font-bold leading-heading text-ktf-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-body text-ktf-gray-400 leading-body">
            Last updated:{" "}
            <time dateTime="2025-07-01" className="font-medium text-ktf-silver">
              {LAST_UPDATED}
            </time>
          </p>
        </Container>
      </section>

      {/* ── Content ───────────────────────────────────────────── */}
      <section className="bg-ktf-white py-20 sm:py-28">
        <Container size="md">
          {/* Commitment card */}
          <div className="mb-14 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: "🔒",
                title: "No data selling",
                desc: "We never sell or rent your personal information.",
              },
              {
                icon: "🚫",
                title: "No tracking",
                desc: "No analytics, cookies, or behavioural profiling.",
              },
              {
                icon: "✉",
                title: "No spam",
                desc: "We only respond to your enquiry — nothing else.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-ktf-gray-200 bg-ktf-surface p-6 flex flex-col gap-2 text-center"
              >
                <span className="text-3xl" aria-hidden="true">
                  {item.icon}
                </span>
                <p className="text-body-sm font-bold text-ktf-navy">
                  {item.title}
                </p>
                <p className="text-caption text-ktf-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Table of contents */}
          <nav
            className="mb-16 rounded-2xl border border-ktf-gray-200 bg-ktf-surface p-8"
            aria-label="Table of contents"
          >
            <h2 className="text-body font-semibold text-ktf-navy uppercase tracking-widest text-overline mb-5">
              Contents
            </h2>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-body-sm text-ktf-blue hover:text-ktf-blue-deep transition-colors"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Sections */}
          <div className="space-y-14">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24"
              >
                <h2 className="text-h3 font-bold text-ktf-navy mb-4">
                  {section.title}
                </h2>
                <div>
                  {section.content.split("\n\n").map((para, i) => (
                    <p
                      key={i}
                      className="text-body text-ktf-gray-700 leading-body mb-4 last:mb-0 whitespace-pre-line"
                    >
                      {para}
                    </p>
                  ))}
                </div>
                <div className="mt-8 h-px bg-ktf-gray-200" aria-hidden="true" />
              </section>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-16 rounded-2xl border border-ktf-gray-200 bg-ktf-surface p-8 text-center">
            <p className="text-body-sm text-ktf-gray-600 leading-body">
              This Privacy Policy applies to {SITE_NAME} and is effective from{" "}
              <strong className="text-ktf-navy">1 July 2025</strong>. For
              questions, contact us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-ktf-blue hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
