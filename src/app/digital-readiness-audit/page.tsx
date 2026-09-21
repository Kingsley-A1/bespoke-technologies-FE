import type { Metadata } from "next";
import { DigitalAuditExperience } from "@/features/digital-audits/audit-experience";
import { AUDIT_ORIGIN, WEBSITE_ORIGIN } from "@/lib/subdomain-seo";

export const metadata: Metadata = {
  title: "Bespoke Business Audit | How Ready Is Your Business for the Digital Revolution?",
  description:
    "Six sharp questions. A clear readiness score, a six-part breakdown, and the moves that matter next — from Bespoke Technologies.",
  alternates: { canonical: AUDIT_ORIGIN },
  openGraph: {
    type: "website",
    siteName: "Bespoke Business Audit",
    title: "Bespoke Business Audit | How Ready Is Your Business for the Digital Revolution?",
    description: "Six sharp questions. One clear readiness report.",
    url: AUDIT_ORIGIN,
  },
  twitter: {
    card: "summary_large_image",
    title: "Bespoke Business Audit | How Ready Is Your Business for the Digital Revolution?",
    description: "Six sharp questions. One clear readiness report.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function DigitalReadinessAuditPage() {
  const auditJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Bespoke Business Audit",
    url: AUDIT_ORIGIN,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    description:
      "A six-dimension business readiness assessment with a clear, shareable report.",
    provider: {
      "@type": "Organization",
      name: "Bespoke Technologies",
      url: WEBSITE_ORIGIN,
    },
    audience: {
      "@type": "BusinessAudience",
      audienceType: "Business leaders and teams assessing digital readiness",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(auditJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <DigitalAuditExperience />
    </>
  );
}
