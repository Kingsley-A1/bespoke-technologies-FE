"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
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
import { cn } from "@/lib/utils";

type BespokeAIActionCardProps = {
  result: BespokeAIActionResult;
};

export function BespokeAIActionCard({ result }: BespokeAIActionCardProps) {
  if (result.type === "internal-link") {
    return (
      <ActionShell
        eyebrow="Page action"
        icon={<ArrowUpRight aria-hidden="true" />}
        title={result.label}
      >
        <p className="text-sm leading-relaxed text-ktf-gray-700">
          {result.reason}
        </p>
        <ActionLink href={result.path}>Open page</ActionLink>
      </ActionShell>
    );
  }

  if (result.type === "contact") {
    return (
      <ActionShell
        eyebrow="Contact"
        icon={<MessageCircle aria-hidden="true" />}
        title="Contact Bespoke Technologies"
      >
        <p className="text-sm leading-relaxed text-ktf-gray-700">
          {result.message}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <ExternalAction href={result.whatsappUrl} icon={<MessageCircle />}>
            WhatsApp
          </ExternalAction>
          <ExternalAction href={`tel:${result.phone}`} icon={<Phone />}>
            {result.phone}
          </ExternalAction>
          <ExternalAction href={`mailto:${result.email}`} icon={<Mail />}>
            Email
          </ExternalAction>
        </div>
        <ActionLink href={result.contactPath}>Open contact page</ActionLink>
      </ActionShell>
    );
  }

  if (
    result.type === "project-list" ||
    result.type === "project-recommendations"
  ) {
    return (
      <ActionShell
        eyebrow="Projects"
        icon={<BriefcaseBusiness aria-hidden="true" />}
        title={
          result.type === "project-list"
            ? result.label
            : "Recommended project examples"
        }
      >
        {result.type === "project-recommendations" ? (
          <p className="text-sm leading-relaxed text-ktf-gray-700">
            Matched to: {result.need}
          </p>
        ) : null}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {result.projects.map((project) => (
            <article
              key={project.id}
              className="rounded-lg border border-ktf-gray-200 bg-white p-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-bold text-ktf-obsidian">
                    {project.name}
                  </h4>
                  <p className="mt-1 text-xs font-semibold text-ktf-blue">
                    {project.category} · {project.year}
                  </p>
                </div>
                {project.comingSoon ? (
                  <span className="shrink-0 rounded-full bg-ktf-warning/10 px-2.5 py-1 text-[11px] font-bold text-ktf-gray-800">
                    Coming soon
                  </span>
                ) : null}
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ktf-gray-700">
                {project.reason ?? project.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {project.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-ktf-surface px-2.5 py-1 text-[11px] font-semibold text-ktf-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <InlineLink href={project.path}>Open case study</InlineLink>
                {project.liveUrl ? (
                  <a
                    className="inline-flex min-h-9 items-center gap-1.5 text-sm font-bold text-ktf-blue hover:text-ktf-blue-deep"
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Live project
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : null}
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
      <ActionShell
        eyebrow="Proof"
        icon={<ShieldCheck aria-hidden="true" />}
        title="Client review highlights"
      >
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {result.testimonials.map((item) => (
            <blockquote
              key={`${item.author}-${item.company}`}
              className="rounded-lg border border-ktf-gray-200 bg-white p-3 shadow-xs"
            >
              <p className="line-clamp-3 text-sm leading-relaxed text-ktf-gray-700">
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="mt-2 text-xs font-bold text-ktf-obsidian">
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
    <ActionShell
      eyebrow="Services"
      icon={<Sparkles aria-hidden="true" />}
      title="Relevant Bespoke services"
    >
      <p className="text-sm leading-relaxed text-ktf-gray-700">
        For: {result.need}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {result.services.map((service) => (
          <article
            key={service.id}
            className="rounded-lg border border-ktf-gray-200 bg-white p-3 shadow-xs"
          >
            <h4 className="text-sm font-bold text-ktf-obsidian">
              {service.title}
            </h4>
            <p className="mt-1 text-xs font-semibold text-ktf-blue">
              {service.tagline}
            </p>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ktf-gray-700">
              {service.description}
            </p>
            <InlineLink href={service.path}>Open service</InlineLink>
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
  eyebrow,
  icon,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-ktf-gray-200 bg-ktf-surface shadow-sm">
      <div className="border-b border-ktf-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ktf-blue/15 bg-ktf-blue/8 text-ktf-blue [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ktf-gray-500">
              {eyebrow}
            </p>
            <h3 className="truncate text-sm font-bold text-ktf-obsidian">
              {title}
            </h3>
          </div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ActionLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link
      href={href}
      className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-ktf-blue px-4 text-sm font-bold text-white transition-colors hover:bg-ktf-blue-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
    >
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}

function InlineLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link
      href={href}
      className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-bold text-ktf-blue hover:text-ktf-blue-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  );
}

function ExternalAction({
  children,
  href,
  icon,
}: {
  children: ReactNode;
  href: string;
  icon: ReactNode;
}) {
  const isExternal = href.startsWith("http");

  return (
    <a
      className={cn(
        "flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ktf-gray-200 bg-white px-3 text-sm font-bold text-ktf-navy transition-colors hover:border-ktf-blue/40 hover:text-ktf-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue [&>svg]:h-4 [&>svg]:w-4",
      )}
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
    >
      {icon}
      <span className="truncate">{children}</span>
    </a>
  );
}
