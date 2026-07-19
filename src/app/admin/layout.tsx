import type { Metadata } from "next";
import { requireAdminRuntimeConfiguration } from "@/features/admin/db";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Bespoke Technologies Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  requireAdminRuntimeConfiguration();
  return children;
}
