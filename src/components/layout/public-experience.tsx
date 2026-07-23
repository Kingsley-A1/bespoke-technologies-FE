"use client";

import { usePathname } from "next/navigation";
import { BespokeAILauncher } from "@/components/ai";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { Header } from "./header";
import { Footer } from "./footer";
import { PageTransition } from "./page-transition";

export function PublicExperience({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }
  if (pathname === "/bespoke-ai") {
    return <main className="flex min-h-dvh flex-col">{children}</main>;
  }
  // The Bespoke AI page is a focused, app-like workspace — the marketing
  // footer would compete with the composer, so it is hidden there.
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <BespokeAILauncher />
      <InstallPrompt />
      <ServiceWorkerRegistration />
    </>
  );
}
