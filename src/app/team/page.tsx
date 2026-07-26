import type { Metadata } from "next";
import Image from "next/image";
import { BriefcaseBusiness, Code2, ExternalLink, MapPin } from "lucide-react";
import { Container } from "@/components/layout";
import { listPublishedTeamMembersSafe } from "@/features/admin/team/repository";
import type { TeamCardVariant, TeamGroup, TeamMember } from "@/features/admin/types";

export const metadata: Metadata = {
  title: "Our Team",
  description: "Meet the people designing, engineering, and delivering Bespoke Technologies products.",
  alternates: { canonical: "https://team.bespoketech.com.ng/" },
};

export const dynamic = "force-dynamic";

const GROUP_LABELS: Record<TeamGroup, string> = {
  leadership: "Leadership",
  product: "Product",
  engineering: "Engineering",
  design: "Design",
  operations: "Operations",
  partnerships: "Partnerships",
};

const VARIANTS: Record<
  TeamCardVariant,
  { shell: string; accent: string; surface: string }
> = {
  blueprint: {
    shell: "border-blue-300/30 bg-[#081a31]",
    accent: "bg-blue-400",
    surface: "bg-[linear-gradient(rgba(96,165,250,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,.045)_1px,transparent_1px)] bg-[size:28px_28px]",
  },
  signal: {
    shell: "border-cyan-300/30 bg-[#071f28]",
    accent: "bg-cyan-300",
    surface: "bg-[radial-gradient(circle_at_85%_8%,rgba(34,211,238,.13),transparent_38%)]",
  },
  grid: {
    shell: "border-indigo-300/30 bg-[#11162b]",
    accent: "bg-indigo-300",
    surface: "bg-[linear-gradient(135deg,rgba(129,140,248,.09),transparent_45%)]",
  },
  orbit: {
    shell: "border-sky-300/30 bg-[#0b1725]",
    accent: "bg-sky-300",
    surface: "bg-[radial-gradient(circle_at_15%_88%,rgba(56,189,248,.13),transparent_42%)]",
  },
};

export default async function TeamPage() {
  const members = await listPublishedTeamMembersSafe();
  const groups = [...new Set(members.map((member) => member.teamGroup))];
  return <div className="overflow-hidden bg-[#050b14] text-white">
    <section className="relative border-b border-white/10 py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(10,132,255,.24),transparent_35%),linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:auto,52px_52px,52px_52px]" />
      <Container size="lg" className="relative">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-300">The Bespoke Team Index</p>
        <h1 className="mt-5 max-w-4xl text-[2.65rem] font-black leading-[0.98] tracking-[-0.055em] sm:text-7xl">Different disciplines.<span className="mt-2 block text-[#0a84ff]">One standard of craft.</span></h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-slate-300">Meet the people who turn ambitious ideas into dependable products, systems, and experiences.</p>
      </Container>
    </section>
    <Container size="lg" className="py-16 sm:py-24">
      {groups.map((group) => {
        const groupMembers = members.filter((member) => member.teamGroup === group);
        return <section key={group} className="mb-20 last:mb-0">
          <div className="mb-7 flex items-end justify-between border-b border-white/10 pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-300">Discipline</p><h2 className="mt-2 text-2xl font-extrabold">{GROUP_LABELS[group]}</h2></div><span className="font-mono text-xs text-slate-500">{String(groupMembers.length).padStart(2, "0")}</span></div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {groupMembers.map((member, index) => <TeamCard key={member.id} member={member} index={index} leadership={group === "leadership"} />)}
          </div>
        </section>;
      })}
      {!members.length && <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-16 text-center sm:px-6 sm:py-20"><p className="mx-auto max-w-lg text-lg font-semibold">The public team directory is being prepared.</p><p className="mt-2 text-sm text-slate-400">Published profiles will appear here.</p></div>}
    </Container>
  </div>;
}

function TeamCard({ member, index, leadership }: { member: TeamMember; index: number; leadership: boolean }) {
  const links = Object.entries(member.links).filter((entry): entry is [keyof TeamMember["links"], string] => Boolean(entry[1]));
  const variant = VARIANTS[member.cardVariant];
  return <article className={`group relative isolate overflow-hidden rounded-[1.4rem] border p-1 ${variant.shell} ${leadership && index === 0 ? "md:col-span-2" : ""}`}>
    <span aria-hidden="true" className={`absolute inset-y-10 left-0 w-0.5 ${variant.accent}`} />
    <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full border border-white/10 transition-transform duration-500 group-hover:scale-110" />
    <div className={`relative grid h-full min-h-[490px] overflow-hidden rounded-[1.15rem] bg-white/[0.035] p-5 sm:p-6 ${variant.surface}`}>
      <div className="relative min-h-[265px] overflow-hidden rounded-2xl bg-slate-800">
        <Image src={`/api/team-members/${member.id}/portrait`} alt={member.portraitAlt} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover grayscale-[.15] transition duration-700 group-hover:scale-[1.025] group-hover:grayscale-0" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-slate-950/50 px-3 py-1 font-mono text-[10px] uppercase tracking-wider backdrop-blur">BT-{member.slug.slice(0, 3).toUpperCase()}-{String(index + 1).padStart(2, "0")}</span>
      </div>
      <div className="pt-6"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-300">{member.roleTitle}</p><h3 className="mt-2 text-2xl font-extrabold tracking-[-0.035em]">{member.fullName}</h3>{member.location && <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400"><MapPin className="h-3.5 w-3.5" />{member.location}</p>}<p className="mt-4 text-sm leading-6 text-slate-300">{member.shortBio}</p>
        {member.specialties.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{member.specialties.map(item => <span key={item} className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold text-slate-300">{item}</span>)}</div>}
        {links.length > 0 && <div className="mt-5 flex gap-2">{links.map(([key, href]) => <a key={key} href={href} target="_blank" rel="noreferrer" aria-label={`${member.fullName} on ${key}`} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-slate-300 transition hover:border-blue-400 hover:text-white">{key === "linkedin" ? <BriefcaseBusiness className="h-4 w-4" /> : key === "github" ? <Code2 className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}</a>)}</div>}
      </div>
    </div>
  </article>;
}
