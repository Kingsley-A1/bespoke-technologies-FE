"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ExternalLink,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { BespokeAIActionResult } from "@/lib/ai/bespoke-ai-types";

type BespokeAIActionCardProps = {
  result: BespokeAIActionResult;
};

export function BespokeAIActionCard({ result }: BespokeAIActionCardProps) {
  if (result.type === "internal-link") {
    return (
      <ActionShell icon={<ArrowUpRight aria-hidden="true" />} title={result.label}>
        <p className="text-sm leading-relaxed text-ktf-gray-700">{result.reason}</p>
        <ActionLink href={result.path}>Open page</ActionLink>
      </ActionShell>
    );
  }

  if (result.type === "contact") {
    return (
      <ActionShell icon={<MessageCircle aria-hidden="true" />} title="Contact Bespoke Technologies">
        <p className="text-sm leading-relaxed text-ktf-gray-700">{result.message}</p>
        <div className="mt-3 grid gap-2 text-sm">
          <a className="flex min-h-11 items-center gap-2 rounded-md border border-ktf-gray-200 px-3 font-medium text-ktf-navy hover:border-ktf-blue/40 hover:text-ktf-blue" href={result.whatsappUrl} target="_blank" rel="noreferrer">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </a>
          <a className="flex min-h-11 items-center gap-2 rounded-md border border-ktf-gray-200 px-3 font-medium text-ktf-navy hover:border-ktf-blue/40 hover:text-ktf-blue" href={`tel:${result.phone}`}>
            <Phone className="h-4 w-4" aria-hidden="true" />
            {result.phone}
          </a>
          <a className="flex min-h-11 items-center gap-2 rounded-md border border-ktf-gray-200 px-3 font-medium text-ktf-navy hover:border-ktf-blue/40 hover:text-ktf-blue" href={`mailto:${result.email}`}>
            <Mail className="h-4 w-4" aria-hidden="true" />
            {result.email}
          </a>
        </div>
        <ActionLink href={result.contactPath}>Open contact page</ActionLink>
      </ActionShell>
    );
  }

  if (result.type === "project-list" || result.type === "project-recommendations") {
    return (
      <ActionShell
        icon={<BriefcaseBusiness aria-hidden="true" />}
        title={result.type === "project-list" ? result.label : "Recommended project examples"}
      >
        <div className="mt-3 grid gap-3">
          {result.projects.map((project) => (
            <article key={project.id} className="rounded-md border border-ktf-gray-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-ktf-obsidian">{project.name}</h4>
                  <p className="mt-1 text-xs font-medium text-ktf-blue">{project.category} · {project.year}</p>
                </div>
                {project.comingSoon ? (
                  <span className="rounded-md bg-ktf-warning/10 px-2 py-1 text-[11px] font-semibold text-ktf-gray-800">
                    Coming soon
                  </span>
                ) : null}
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ktf-gray-700">
                {project.reason ?? project.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {project.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-md bg-ktf-surface px-2 py-1 text-[11px] font-medium text-ktf-gray-700">
                    {tag}
                  </span>
                ))}
              </div>
              {project.liveUrl ? (
                <a className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-ktf-blue hover:text-ktf-blue-deep" href={project.liveUrl} target="_blank" rel="noreferrer">
                  View live project
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ) : null}
            </article>
          ))}
        </div>
        <ActionLink href="/projects">Open projects</ActionLink>
      </ActionShell>
    );
  }

  if (result.type === "reviews") {
    return (
      <ActionShell icon={<ShieldCheck aria-hidden="true" />} title="Client review highlights">
        <div className="mt-3 grid gap-3">
          {result.testimonials.map((item) => (
            <blockquote key={`${item.author}-${item.company}`} className="rounded-md border border-ktf-gray-200 bg-white p-3">
              <p className="line-clamp-3 text-sm leading-relaxed text-ktf-gray-700">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="mt-2 text-xs font-semibold text-ktf-obsidian">
                {item.author}, {item.role}
              </footer>
            </blockquote>
          ))}
        </div>
        <ActionLink href={result.path}>{result.label}</ActionLink>
      </ActionShell>
    );
  }

  return (
    <ActionShell icon={<Sparkles aria-hidden="true" />} title="Relevant Bespoke services">
      <p className="text-sm leading-relaxed text-ktf-gray-700">For: {result.need}</p>
      <div className="mt-3 grid gap-3">
        {result.services.map((service) => (
          <article key={service.id} className="rounded-md border border-ktf-gray-200 bg-white p-3">
            <h4 className="text-sm font-semibold text-ktf-obsidian">{service.title}</h4>
            <p className="mt-1 text-xs font-medium text-ktf-blue">{service.tagline}</p>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ktf-gray-700">{service.description}</p>
          </article>
        ))}
      </div>
      <ActionLink href={result.recommendedAction.path}>
        {result.recommendedAction.label}
      </ActionLink>
    </ActionShell>
  );
}

function ActionShell({
  children,
  icon,
  title,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="mt-3 rounded-lg border border-ktf-blue/15 bg-ktf-surface p-4 shadow-xs">
      <div className="flex items-center gap-2 text-ktf-obsidian">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ktf-blue text-white [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ActionLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="mt-3 inline-flex min-h-11 items-center justify-center rounded-md bg-ktf-blue px-4 text-sm font-semibold text-white transition-colors hover:bg-ktf-blue-deep"
    >
      {children}
    </Link>
  );
}
