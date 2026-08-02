import type { Metadata } from "next";
import { headers } from "next/headers";
import { PublicExperience } from "@/components/layout/public-experience";
import {
  BRAND_ICON_SRC,
  CONTACT_EMAIL,
  SITE_DESCRIPTION,
  SITE_NAME,
  WHATSAPP_NUMBER,
} from "@/lib/constants";
import { absoluteUrl, SITE_ORIGIN } from "@/lib/seo";
import { LEARN_HOSTNAME } from "@/lib/subdomain-seo";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_ORIGIN),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: BRAND_ICON_SRC, sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
    ],
    apple: [{ url: BRAND_ICON_SRC, sizes: "512x512", type: "image/png" }],
    shortcut: BRAND_ICON_SRC,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: absoluteUrl("/icons/og.png"),
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/icons/og.png")],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_ORIGIN,
  logo: absoluteUrl(BRAND_ICON_SRC),
  description: SITE_DESCRIPTION,
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: CONTACT_EMAIL,
      telephone: `+${WHATSAPP_NUMBER}`,
      availableLanguage: ["en"],
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const hostname = requestHeaders.get("host")?.split(":")[0]?.toLowerCase();
  const isLearnHost = hostname === LEARN_HOSTNAME;
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-ktf-white text-ktf-obsidian">
        {!isLearnHost && <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />}
        <PublicExperience isLearnHost={isLearnHost}>{children}</PublicExperience>
      </body>
    </html>
  );
}
