import { Award } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { calculateDocumentTotals } from "@/features/admin/billing/money";
import { CertificateManager } from "@/features/admin/certificates/certificate-manager";
import { certificateReadiness, listOwnershipCertificates } from "@/features/admin/certificates/repository";
import { listPortfolioProjects } from "@/features/admin/portfolio/repository";
import { getAdminSnapshot } from "@/features/admin/repository";

export default async function CertificatesPage() {
  const session = await requireAdminPermission("certificates.manage");
  const [snapshot, certificates, portfolio] = await Promise.all([
    getAdminSnapshot(),
    listOwnershipCertificates(),
    listPortfolioProjects(),
  ]);
  const activeCertificates = certificates.filter(item => item.status !== "revoked");
  const activeProjectIds = new Set(activeCertificates.flatMap(item => item.projectId ? [item.projectId] : []));
  const activePortfolioIds = new Set(activeCertificates.flatMap(item => item.portfolioProjectId ? [item.portfolioProjectId] : []));
  const linkedPortfolioIds = new Set(snapshot.projects.flatMap(project => project.portfolioProjectId ? [project.portfolioProjectId] : []));
  const deliveryProjects = snapshot.projects.map(project => {
    const readiness = certificateReadiness(project, snapshot.documents);
    const client = snapshot.clients.find(candidate => candidate.id === project.clientId);
    const totals = readiness.invoice ? calculateDocumentTotals(readiness.invoice, snapshot.payments) : undefined;
    const unavailableReason = activeProjectIds.has(project.id)
      ? "Active certificate already exists"
      : readiness.ready
        ? undefined
        : readiness.missing.join(", ");
    return {
      id: project.id,
      source: "delivery" as const,
      name: project.name,
      clientName: client?.name || "Client",
      clientEmail: client?.email || "",
      clientAddress: client?.address || "",
      commercialMode: project.commercialMode,
      amount: project.commercialMode === "free" ? 0 : totals?.total || (project.commercialMode === "donation" ? project.commercialValue : undefined),
      currency: readiness.invoice?.currency || project.currency,
      available: !unavailableReason,
      unavailableReason,
    };
  });
  const portfolioProjects = portfolio.map(project => {
    const localLogo = project.imageUrl?.startsWith("/") && /\.(png|jpe?g)$/i.test(project.imageUrl);
    const unavailableReason = activePortfolioIds.has(project.id)
      ? "Active certificate already exists"
      : linkedPortfolioIds.has(project.id)
        ? "Managed through its delivery project"
        : project.comingSoon
          ? "Project is still marked coming soon"
          : !project.imageKey && !localLogo
            ? "Project logo is required"
            : undefined;
    return {
      id: project.id,
      source: "portfolio" as const,
      name: project.name,
      clientName: "",
      clientEmail: "",
      clientAddress: "",
      commercialMode: "undisclosed",
      currency: snapshot.settings.defaultCurrency,
      portfolioYear: project.year,
      available: !unavailableReason,
      unavailableReason,
    };
  });
  const certificateProjects = [...deliveryProjects, ...portfolioProjects];
  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-xl bg-slate-950 p-6 text-white sm:p-8"><div className="absolute -right-12 -top-20 h-52 w-52 rounded-full border border-blue-400/20" /><div className="relative flex items-center justify-between gap-5"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">Project completion evidence</p><h2 className="mt-2 text-2xl font-extrabold">Ownership certificates</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-300">Prepare, founder-issue, deliver, verify, and revoke immutable project ownership records.</p></div><Award className="h-10 w-10 shrink-0 text-blue-300" /></div></section>
    <CertificateManager projects={certificateProjects} certificates={certificates} canIssue={session.role === "founder_admin"} />
  </div>;
}
