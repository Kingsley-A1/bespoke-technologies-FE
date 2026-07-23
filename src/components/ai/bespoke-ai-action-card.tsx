"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Mail, MessageCircle, Phone, ShieldCheck, Sparkles } from "lucide-react";
import type { BespokeAIActionResult } from "@/lib/ai/bespoke-ai-types";

export function BespokeAIActionCard({ result }: { result: BespokeAIActionResult }) {
  if (result.type === "internal-link") {
    return <ActionShell eyebrow="Suggested next step" icon={<ArrowUpRight />} title={result.label}><p className="text-sm leading-6 text-slate-600">{result.reason}</p><ActionLink href={result.path}>Open page</ActionLink></ActionShell>;
  }

  if (result.type === "contact") {
    return (
      <ActionShell eyebrow="Contact" icon={<MessageCircle />} title="Talk to Bespoke Technologies">
        <p className="text-sm leading-6 text-slate-600">{result.message}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <CompactAction href={result.whatsappUrl} icon={<MessageCircle />}>WhatsApp</CompactAction>
          <CompactAction href={`tel:${result.phone}`} icon={<Phone />}>Call</CompactAction>
          <CompactAction href={`mailto:${result.email}`} icon={<Mail />}>Email</CompactAction>
        </div>
      </ActionShell>
    );
  }

  if (result.type === "project-list" || result.type === "project-recommendations") {
    return (
      <ActionShell eyebrow="Relevant work" icon={<BriefcaseBusiness />} title={result.type === "project-list" ? result.label : "Project references for your idea"}>
        {result.type === "project-recommendations" ? <p className="mb-3 text-xs leading-5 text-slate-500">Matched to: {result.need}</p> : null}
        <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {result.projects.map((project) => (
            <article key={project.id} className="group px-3.5 py-3 transition-colors hover:bg-[#f8fbff]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-bold text-slate-950">{project.name}</h4>
                  <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500">{project.category} · {project.year}</p>
                </div>
                <Link href={project.path} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-white hover:text-ktf-blue" aria-label={`Open ${project.name}`}><ArrowUpRight className="h-3.5 w-3.5" /></Link>
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{project.reason ?? project.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {project.tags.slice(0, 2).map((tag) => <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{tag}</span>)}
                {project.comingSoon ? <span className="text-[10px] font-semibold text-amber-700">Coming soon</span> : null}
                {project.liveUrl ? <a href={project.liveUrl} target="_blank" rel="noreferrer" className="ml-auto text-[11px] font-bold text-ktf-blue hover:text-ktf-blue-deep">View live</a> : null}
              </div>
            </article>
          ))}
        </div>
        <ActionLink href="/projects">Open projects</ActionLink>
      </ActionShell>
    );
  }

  if (result.type === "reviews") {
    return (
      <ActionShell eyebrow="Client proof" icon={<ShieldCheck />} title="What clients say">
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white px-3.5">
          {result.testimonials.map((item) => <blockquote key={`${item.author}-${item.company}`} className="py-3"><p className="line-clamp-2 text-xs leading-5 text-slate-600">“{item.quote}”</p><footer className="mt-1 text-[11px] font-bold text-slate-900">{item.author} · {item.company}</footer></blockquote>)}
        </div>
        <ActionLink href={result.path}>{result.label}</ActionLink>
      </ActionShell>
    );
  }

  return (
    <ActionShell eyebrow="Suggested capabilities" icon={<Sparkles />} title="A practical service fit">
      <p className="mb-3 text-xs leading-5 text-slate-500">For: {result.need}</p>
      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white px-3.5">
        {result.services.map((service) => <article key={service.id} className="py-3"><div className="flex items-center justify-between gap-3"><h4 className="text-sm font-bold text-slate-950">{service.title}</h4><Link href={service.path} className="text-[11px] font-bold text-ktf-blue">Explore</Link></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{service.tagline}. {service.description}</p></article>)}
      </div>
      <ActionLink href={result.recommendedAction.path}>{result.recommendedAction.label}</ActionLink>
    </ActionShell>
  );
}

function ActionShell({ children, eyebrow, icon, title }: { children: ReactNode; eyebrow: string; icon: ReactNode; title: string }) {
  return (
    <section className="mt-3 rounded-lg border border-slate-200 bg-[#fbfdff] p-3.5 shadow-[0_12px_32px_-26px_rgba(15,38,71,0.5)]">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ktf-blue/8 text-ktf-blue [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{eyebrow}</p><h3 className="truncate text-sm font-bold text-slate-950">{title}</h3></div>
      </div>
      {children}
    </section>
  );
}

function ActionLink({ children, href }: { children: ReactNode; href: string }) {
  return <Link href={href} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-ktf-blue px-3 text-xs font-bold text-white transition hover:bg-ktf-blue-deep">{children}<ArrowRight className="h-3.5 w-3.5" /></Link>;
}

function CompactAction({ children, href, icon }: { children: ReactNode; href: string; icon: ReactNode }) {
  const external = href.startsWith("http");
  return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:border-ktf-blue/30 hover:text-ktf-blue [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}{children}</a>;
}
