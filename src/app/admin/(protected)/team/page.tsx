import { UsersRound } from "lucide-react";
import { requireAdminPermission } from "@/features/admin/access";
import { TeamManager } from "@/features/admin/team/team-manager";
import { listTeamMembers } from "@/features/admin/team/repository";
import { isR2Configured } from "@/lib/storage/r2";

export default async function AdminTeamPage() {
  await requireAdminPermission("team.manage");
  const members = await listTeamMembers();
  return <div className="space-y-6">
    <section className="flex items-center justify-between gap-5 rounded-xl border border-ktf-blue/15 bg-gradient-to-br from-slate-950 via-ktf-navy to-ktf-blue-deep p-6 text-white">
      <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-200">Public identity</p><h2 className="mt-2 text-2xl font-extrabold">The people behind the work.</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-blue-100">Publish concise, consented team profiles with a shared system and an individual visual signature.</p></div><UsersRound className="h-10 w-10 shrink-0 text-blue-200" />
    </section>
    {!isR2Configured() && <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">Cloudflare R2 is not configured. Draft metadata can be prepared, but portraits are required before publishing.</p>}
    <TeamManager members={members} />
  </div>;
}

