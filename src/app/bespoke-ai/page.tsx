import type { Metadata } from "next";
import { BespokeAIPanel } from "@/components/ai";
import { absoluteUrl } from "@/lib/seo";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Bespoke AI",
  description:
    "Ask Bespoke AI about Bespoke Technologies services, projects, reviews, partnerships, and contact options.",
  openGraph: {
    images: [
      {
        url: absoluteUrl("/icons/og.png"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Bespoke AI`,
      },
    ],
  },
  twitter: {
    images: [absoluteUrl("/icons/og.png")],
  },
};

export default function BespokeAIPage() {
  return <BespokeAIPanel mode="page" />;
}
