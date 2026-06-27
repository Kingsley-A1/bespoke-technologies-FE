"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { PROJECTS, type ProjectType } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ── Type meta ──────────────────────────────────────────────────────────────

type FilterOption = "all" | ProjectType;

interface TypeMeta {
  label: string;
  badge: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: React.ReactNode;
}

const TYPE_META: Record<ProjectType, TypeMeta> = {
  web: {
    label: "Web",
    badge: "Web App",
    bgClass: "bg-ktf-blue/10",
    textClass: "text-ktf-blue",
    borderClass: "border-ktf-blue/30",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
      </svg>
    ),
  },
  mobile: {
    label: "Mobile",
    badge: "Mobile App",
    bgClass: "bg-purple-500/10",
    textClass: "text-purple-400",
    borderClass: "border-purple-400/30",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <circle cx="12" cy="18" r="1" />
      </svg>
    ),
  },
  ios: {
    label: "iOS",
    badge: "iOS App",
    bgClass: "bg-slate-500/10",
    textClass: "text-slate-400",
    borderClass: "border-slate-400/30",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="9" y1="7" x2="15" y2="7" />
        <circle cx="12" cy="18" r="1" />
      </svg>
    ),
  },
  desktop: {
    label: "Desktop",
    badge: "Desktop App",
    bgClass: "bg-orange-500/10",
    textClass: "text-orange-400",
    borderClass: "border-orange-400/30",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  "web+mobile": {
    label: "Web + Mobile",
    badge: "Web + Mobile",
    bgClass: "bg-teal-500/10",
    textClass: "text-teal-400",
    borderClass: "border-teal-400/30",
    icon: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="7" width="10" height="14" rx="1" />
        <rect x="14" y="3" width="8" height="18" rx="1" />
      </svg>
    ),
  },
};

const FILTERS: { id: FilterOption; label: string }[] = [
  { id: "all", label: "All Projects" },
  { id: "web", label: "Web" },
  { id: "mobile", label: "Mobile" },
  { id: "ios", label: "iOS" },
  { id: "desktop", label: "Desktop" },
  { id: "web+mobile", label: "Web + Mobile" },
];

// ── Project Card ───────────────────────────────────────────────────────────

export function ProjectCard({
  project,
  compact = false,
}: {
  project: (typeof PROJECTS)[number];
  compact?: boolean;
}) {
  const meta = TYPE_META[project.type];
  const visibleTags = compact ? project.tags.slice(0, 2) : project.tags;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      className="group relative flex flex-col overflow-hidden rounded-md border border-ktf-gray-200 bg-ktf-white shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-ktf-blue/25 hover:shadow-md"
    >
      {/* Project image */}
      <div
        className={cn(
          "relative w-full overflow-hidden bg-ktf-surface",
          compact ? "aspect-[4/3] sm:aspect-video" : "aspect-video",
        )}
      >
        <Image
          src={project.image}
          alt={project.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={
            compact
              ? "(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          }
        />

        {/* Coming Soon overlay */}
        {project.comingSoon && (
          <div className="absolute inset-0 flex items-center justify-center bg-ktf-obsidian/70 backdrop-blur-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ktf-gold/40 bg-ktf-obsidian/80 px-4 py-1.5 text-caption font-semibold uppercase tracking-widest text-ktf-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-ktf-gold animate-pulse" />
              Coming Soon
            </span>
          </div>
        )}

        {/* Year badge */}
        <div className="absolute top-3 left-3">
          <span className="rounded-lg bg-ktf-obsidian/70 backdrop-blur-sm px-2.5 py-1 text-caption font-medium text-white">
            {project.year}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div
        className={cn(
          "flex flex-1 flex-col border-t border-ktf-gray-200",
          compact ? "p-3 sm:p-6" : "p-6",
        )}
      >
        {/* Type + Category */}
        <div
          className={cn(
            "mb-3 flex gap-2",
            compact
              ? "flex-col items-start gap-1.5 sm:flex-row sm:items-center"
              : "items-center",
          )}
        >
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border font-semibold",
              compact
                ? "px-2 py-0.5 text-[10px] sm:px-2.5 sm:py-1 sm:text-caption"
                : "px-2.5 py-1 text-caption",
              meta.bgClass,
              meta.textClass,
              meta.borderClass,
            )}
          >
            {meta.icon}
            {meta.badge}
          </span>
          <span
            className={cn(
              "line-clamp-1 text-ktf-gray-500",
              compact ? "text-[10px] sm:text-caption" : "text-caption",
            )}
          >
            {project.category}
          </span>
        </div>

        <h3
          className={cn(
            "mb-3 line-clamp-2 font-bold leading-snug text-ktf-navy",
            compact ? "text-[13px] sm:text-body-lg" : "text-body-lg",
          )}
        >
          {project.name}
        </h3>
        <div className="h-px w-full bg-ktf-blue/25 mb-3" aria-hidden="true" />
        <p
          className={cn(
            "flex-1 leading-body text-ktf-gray-600",
            compact
              ? "line-clamp-2 text-[11px] sm:line-clamp-3 sm:text-body-sm"
              : "line-clamp-3 text-body-sm",
          )}
        >
          {project.description}
        </p>

        {/* Tags */}
        <div
          className={cn(
            "mt-4 mb-5 flex-wrap gap-1.5",
            compact ? "hidden sm:flex" : "flex",
          )}
        >
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-ktf-surface border border-ktf-gray-200 px-2 py-0.5 text-caption text-ktf-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Live link */}
        {project.liveUrl && !project.comingSoon ? (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${project.name} live project`}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg bg-ktf-blue font-semibold text-white transition-colors duration-150 hover:bg-ktf-blue-deep active:bg-ktf-blue-pressed",
              compact
                ? "mt-4 px-3 py-2 text-caption sm:mt-0 sm:px-5 sm:py-2.5 sm:text-body-sm"
                : "px-5 py-2.5 text-body-sm",
            )}
          >
            <span className={compact ? "hidden sm:inline" : ""}>
              View Live Project
            </span>
            {compact && <span className="sm:hidden">Live</span>}
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        ) : (
          <div
            className={cn(
              "inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-ktf-gray-200 bg-ktf-surface font-medium text-ktf-gray-500",
              compact
                ? "mt-4 px-3 py-2 text-caption sm:mt-0 sm:px-5 sm:py-2.5 sm:text-body-sm"
                : "px-5 py-2.5 text-body-sm",
            )}
          >
            {project.comingSoon ? "In Development" : "Preview Unavailable"}
          </div>
        )}
      </div>
    </motion.article>
  );
}

// ── Main grid with filters ─────────────────────────────────────────────────

export function ProjectsGrid() {
  const [active, setActive] = useState<FilterOption>("all");

  const filtered = useMemo(
    () =>
      active === "all" ? PROJECTS : PROJECTS.filter((p) => p.type === active),
    [active],
  );

  return (
    <div>
      {/* Filter tabs */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div
          role="tablist"
          aria-label="Filter projects by type"
          className="flex gap-2 w-max sm:w-auto sm:flex-wrap"
        >
          {FILTERS.map((f) => {
            const isActive = f.id === active;
            const count =
              f.id === "all"
                ? PROJECTS.length
                : PROJECTS.filter((p) => p.type === f.id).length;

            if (count === 0 && f.id !== "all") return null;

            return (
              <button
                key={f.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(f.id)}
                className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-body-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? "bg-ktf-blue text-white shadow-md"
                    : "bg-ktf-surface border border-ktf-gray-200 text-ktf-gray-700 hover:border-ktf-blue/40 hover:text-ktf-navy"
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-overline font-bold leading-none ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-ktf-gray-200 text-ktf-gray-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <p className="mt-6 mb-8 text-body-sm text-ktf-gray-500">
        Showing{" "}
        <span className="font-semibold text-ktf-navy">{filtered.length}</span>{" "}
        project{filtered.length !== 1 ? "s" : ""}
        {active !== "all" && (
          <>
            {" "}
            in{" "}
            <span className="font-semibold text-ktf-navy">
              {FILTERS.find((f) => f.id === active)?.label}
            </span>
          </>
        )}
      </p>

      {/* Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-24 text-center"
        >
          <p className="text-h3 mb-2">No projects found</p>
          <p className="text-body text-ktf-gray-500">
            We don&apos;t have any {active} projects listed yet — check back
            soon.
          </p>
        </motion.div>
      )}
    </div>
  );
}
