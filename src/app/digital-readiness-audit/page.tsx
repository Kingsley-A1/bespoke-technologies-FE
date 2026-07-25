import type { Metadata } from "next";
import { DigitalAuditExperience } from "@/features/digital-audits/audit-experience";

export const metadata: Metadata = {
  title: "Digital Readiness Audit",
  description:
    "Assess six practical dimensions of digital readiness and receive a clear, shareable report from Bespoke Technologies.",
  alternates: { canonical: "/digital-readiness-audit" },
  openGraph: {
    title: "Bespoke Digital Readiness Audit",
    description: "Six focused questions. One clear digital readiness report.",
    url: "/digital-readiness-audit",
  },
};

export default function DigitalReadinessAuditPage() {
  return <DigitalAuditExperience />;
}
