"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";

/**
 * Hides the marketing footer on the Bespoke AI page so it reads as a
 * full-screen, app-like surface.
 */
export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === "/bespoke-ai") return null;
  return <Footer />;
}
