import type { Metadata } from "next";
import {
  IDEA_GATE_PATH,
  IDEA_GATE_PRODUCT_NAME,
  IDEA_GATE_TAGLINE,
} from "@/features/idea-gate/definition";
import { IdeaGateExperience } from "@/features/idea-gate/gate-experience";
import { absoluteUrl } from "@/lib/seo";
import { WEBSITE_ORIGIN } from "@/lib/subdomain-seo";

const TITLE = `${IDEA_GATE_PRODUCT_NAME} | ${IDEA_GATE_TAGLINE}`;
const DESCRIPTION =
  "Test your idea against ten execution gates. Get a score out of 20, a Green, Amber or Red verdict, the risks, a recommended first version and the first thing to build — from Bespoke Technologies.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl(IDEA_GATE_PATH) },
  openGraph: {
    type: "website",
    siteName: IDEA_GATE_PRODUCT_NAME,
    title: TITLE,
    description: "Ten execution gates. A score out of 20. One clear verdict.",
    url: absoluteUrl(IDEA_GATE_PATH),
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: "Ten execution gates. A score out of 20. One clear verdict.",
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

export default function IdeaExecutionGatePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: IDEA_GATE_PRODUCT_NAME,
    alternateName: IDEA_GATE_TAGLINE,
    url: absoluteUrl(IDEA_GATE_PATH),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    isAccessibleForFree: true,
    description: DESCRIPTION,
    provider: {
      "@type": "Organization",
      name: "Bespoke Technologies",
      url: WEBSITE_ORIGIN,
    },
    audience: {
      "@type": "Audience",
      audienceType: "Founders, product leads and teams deciding whether to build an idea",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <IdeaGateExperience />
    </>
  );
}
