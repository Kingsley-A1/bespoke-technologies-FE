import { ImageUp } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { PortfolioManager } from "@/features/admin/portfolio/portfolio-manager";
import { listPortfolioProjects } from "@/features/admin/portfolio/repository";
import { isR2Configured } from "@/lib/storage/r2";

export default async function AdminPortfolioPage() {
  await requireAdminPermission("projects.manage");
  const projects = await listPortfolioProjects();
  const storageReady = isR2Configured();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-lg border border-ktf-blue/15 bg-gradient-to-r from-blue-50 to-white p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ktf-blue-deep">Website portfolio</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-950">Finished work, ready to be discovered.</h2>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-600">Upload, edit, order, feature, or temporarily unpublish projects without changing delivery records.</p>
        </div>
        <ImageUp className="h-10 w-10 shrink-0 text-ktf-blue" strokeWidth={1.5} />
      </div>
      {!storageReady && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">Cloudflare R2 is not configured. Existing seeded projects can still be edited, but new image uploads require the R2 environment variables.</div>}
      <PortfolioManager projects={projects} />
    </div>
  );
}
