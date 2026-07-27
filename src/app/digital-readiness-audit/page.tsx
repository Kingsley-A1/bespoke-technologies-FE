import type { Metadata } from "next";
import { DigitalAuditExperience } from "@/features/digital-audits/audit-experience";
import { AUDIT_ORIGIN, WEBSITE_ORIGIN } from "@/lib/subdomain-seo";

export const metadata: Metadata = {
  title: "Bespoke Digital Readiness Audit | Free Six-Dimension Assessment",
  description:
    "Assess six practical dimensions of digital readiness and receive a clear, shareable report from Bespoke Technologies.",
  alternates: { canonical: AUDIT_ORIGIN },
  openGraph: {
    type: "website",
    siteName: "Bespoke Digital Readiness Audit",
    title: "Bespoke Digital Readiness Audit | Free Six-Dimension Assessment",
    description: "Six focused questions. One clear digital readiness report.",
    url: AUDIT_ORIGIN,
    images: [
      {
        url: `${WEBSITE_ORIGIN}/icons/og.png`,
        width: 1200,
        height: 630,
        alt: "Bespoke Digital Readiness Audit",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bespoke Digital Readiness Audit | Free Six-Dimension Assessment",
    description: "Six focused questions. One clear digital readiness report.",
    images: [`${WEBSITE_ORIGIN}/icons/og.png`],
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
    name: "Bespoke Digital Readiness Audit",
    url: AUDIT_ORIGIN,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    description:
      "A six-dimension digital readiness assessment with a clear, shareable report.",
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
