import type { Metadata } from "next";
import { Container } from "@/components/layout";
import { Badge } from "@/components/ui";
import { CONTACT_EMAIL, SITE_DOMAIN, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Terms of Service — ${SITE_NAME}`,
  description: `Read the Terms of Service for ${SITE_NAME}. Understand your rights and responsibilities when using our website and services.`,
  robots: { index: true, follow: false },
};

const LAST_UPDATED = "1 July 2025";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing or using the Bespoke Technologies website (the "Site") at ${SITE_DOMAIN}, you confirm that you have read, understood, and agree to be bound by these Terms of Service ("Terms"). If you are accessing the Site on behalf of an organisation, you warrant that you have the authority to bind that organisation to these Terms.

If you do not agree with any part of these Terms, you must discontinue your use of the Site immediately.`,
  },
  {
    id: "services",
    title: "2. Description of Services",
    content: `Bespoke Technologies ("we", "our", "us") provides engineering, software development, and technology consulting services to businesses and individuals globally. The Site serves as an informational and contact platform for prospective and existing clients.

Any engagement for specific services will be governed by a separate, written service agreement executed between Bespoke Technologies and the client. These Terms do not constitute a service agreement or create any obligation to provide services.`,
  },
  {
    id: "use",
    title: "3. Acceptable Use",
    content: `You agree to use the Site only for lawful purposes and in a manner that does not infringe the rights of any third party. You must not:

• Transmit unsolicited commercial communications (spam) through any contact form or channel on the Site.
• Attempt to gain unauthorised access to any part of the Site or its underlying infrastructure.
• Use automated tools (bots, scrapers, crawlers) to extract data from the Site without prior written consent.
• Introduce malware, viruses, or any other malicious code.
• Impersonate Bespoke Technologies or any of its personnel.
• Use the Site in any manner that could damage, disable, or impair its normal operation.

We reserve the right to terminate or restrict your access to the Site at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.`,
  },
  {
    id: "ip",
    title: "4. Intellectual Property",
    content: `All content on this Site — including but not limited to text, graphics, logos, icons, images, design systems, code, and trade names — is the exclusive intellectual property of Bespoke Technologies or its licensors and is protected by applicable intellectual property laws.

Nothing in these Terms grants you any licence or right to use our intellectual property without prior written permission. The "Bespoke Technologies" name, "BT" mark, and associated logos may not be used in any way that implies endorsement or affiliation without our express written consent.

You may share links to our Site content for personal, non-commercial purposes, provided that you do not misrepresent us or our services.`,
  },
  {
    id: "content",
    title: "5. Third-Party Links and Content",
    content: `The Site may contain links to third-party websites or resources for informational purposes. We do not endorse, control, or assume responsibility for any third-party content, products, or services. Accessing third-party links is entirely at your own risk, and we encourage you to review the terms and privacy policies of any third-party sites you visit.`,
  },
  {
    id: "disclaimers",
    title: "6. Disclaimers and Warranties",
    content: `The Site and all content are provided on an "as is" and "as available" basis without any warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.

We make reasonable efforts to ensure the accuracy and currency of information on the Site but do not warrant that the Site will be error-free, uninterrupted, secure, or free from viruses or other harmful components. Any reliance you place on information from the Site is strictly at your own risk.`,
  },
  {
    id: "liability",
    title: "7. Limitation of Liability",
    content: `To the maximum extent permitted by applicable law, Bespoke Technologies and its directors, employees, contractors, and affiliates shall not be liable for any indirect, incidental, special, punitive, or consequential damages arising from or related to your use of, or inability to use, the Site — even if we have been advised of the possibility of such damages.

Our total aggregate liability for any claims arising under or related to these Terms shall not exceed the greater of (i) the amount paid by you to us in the preceding three months, or (ii) one hundred dollars (USD $100).

Some jurisdictions do not allow the exclusion or limitation of liability for certain types of damages, and the above limitations may not apply to you.`,
  },
  {
    id: "changes",
    title: "8. Changes to These Terms",
    content: `We reserve the right to modify these Terms at any time. We will indicate the date of the last update at the top of this page. Changes take effect immediately upon publication. Your continued use of the Site after any such changes constitutes your acceptance of the new Terms.

We encourage you to review these Terms periodically to stay informed about our practices.`,
  },
  {
    id: "governing",
    title: "9. Governing Law and Jurisdiction",
    content: `These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, without regard to conflict of law principles. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts of Nigeria.

If you are accessing the Site from outside Nigeria, you are responsible for compliance with local laws applicable to your use of the Site.`,
  },
  {
    id: "contact",
    title: "10. Contact Information",
    content: `If you have any questions about these Terms of Service, please contact us:

Email: ${CONTACT_EMAIL}
Website: ${SITE_DOMAIN}/contact

We will endeavour to respond to all enquiries within two business days.`,
  },
] as const;

export default function TermsPage() {
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
            Terms of Service
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
          {/* Intro */}
          <div className="mb-14 rounded-2xl border border-ktf-blue/20 bg-ktf-blue/5 p-8">
            <p className="text-body text-ktf-gray-700 leading-body">
              These Terms of Service govern your use of the {SITE_NAME} website.
              Please read them carefully before using our platform. By
              continuing to use this Site, you agree to be bound by these Terms.
            </p>
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
                <div className="prose-legal">
                  {section.content.split("\n\n").map((para, i) => (
                    <p
                      key={i}
                      className="text-body text-ktf-gray-700 leading-body mb-4 last:mb-0"
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
              These Terms of Service are effective from{" "}
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
