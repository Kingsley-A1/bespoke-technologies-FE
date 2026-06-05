import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsappFab } from "@/components/marketing/whatsapp-fab";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import {
  BRAND_ICON_SRC,
  CONTACT_EMAIL,
  SITE_DESCRIPTION,
  SITE_NAME,
  WHATSAPP_NUMBER,
} from "@/lib/constants";
import { absoluteUrl, SITE_ORIGIN } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_ORIGIN),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: BRAND_ICON_SRC, sizes: "512x512", type: "image/png" }],
    apple: [{ url: BRAND_ICON_SRC, sizes: "512x512", type: "image/png" }],
    shortcut: BRAND_ICON_SRC,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ktf-white text-ktf-obsidian">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <Header />
        <main className="flex flex-col flex-1">{children}</main>
        <Footer />
        <WhatsappFab />
        <InstallPrompt />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
