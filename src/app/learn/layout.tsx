import type { Metadata } from "next";
import { LearnPublicShell } from "@/features/learn/components/learn-public-shell";
import { LEARN_ORIGIN } from "@/lib/subdomain-seo";

export const metadata: Metadata = {
  metadataBase: new URL(LEARN_ORIGIN),
  title: {
    default: "Bespoke Learn",
    template: "%s | Bespoke Learn",
  },
  description: "Structured learning from Bespoke Technologies.",
  alternates: { canonical: "/" },
};

export default function LearnLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <LearnPublicShell>{children}</LearnPublicShell>;
}
