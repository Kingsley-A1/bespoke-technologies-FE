"use client";

import { useCallback, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Building2,
  ChevronDown,
  ClipboardCheck,
  FolderGit2,
  Handshake,
  Layers,
  Lightbulb,
  Mail,
  Newspaper,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { BESPOKE_AI_OPEN_HREF, type NavGroup } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** One icon per destination, shared by the desktop menus and the mobile menu. */
export const NAV_ICONS: Record<string, LucideIcon> = {
  "/services": Layers,
  [BESPOKE_AI_OPEN_HREF]: Sparkles,
  "/digital-readiness-audit": ClipboardCheck,
  "/idea-execution-gate": Lightbulb,
  "/projects": FolderGit2,
  "/reviews": Star,
  "/news": Newspaper,
  "/library": BookOpen,
  "/about": Building2,
  "https://team.bespoketech.com.ng/": Users,
  "/partnerships": Handshake,
  "/contact": Mail,
};

/** A group is active when the current page is any of its internal destinations. */
export function isNavGroupActive(group: NavGroup, pathname: string) {
  return group.items.some(
    (item) => item.href.startsWith("/") && (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );
}

interface MegaNavItemProps {
  group: NavGroup;
  isActive: boolean;
}

/**
 * Hover/focus menu for one navigation group — a calm white card of real,
 * described links. The group label itself still navigates to its main page.
 */
export function MegaNavItem({ group, isActive }: MegaNavItemProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const panelId = useId();

  const openNow = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  }, []);

  const closeSoon = useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  }, []);

  return (
    <li
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onFocus={openNow}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <Link
        href={group.href}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        className={cn(
          "inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-colors duration-150",
          isActive || open
            ? "bg-ktf-gray-100 text-ktf-obsidian"
            : "text-ktf-gray-700 hover:bg-ktf-gray-100 hover:text-ktf-obsidian",
        )}
      >
        {group.label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-ktf-gray-500 transition-transform duration-150", open && "rotate-180")}
          aria-hidden="true"
        />
      </Link>

      {open && (
        <div id={panelId} className="ktf-menu-in absolute left-0 top-full z-50 pt-2">
          <ul className="w-[320px] rounded-xl border border-ktf-gray-200 bg-white p-1.5 shadow-[0_18px_40px_-18px_rgba(11,31,58,0.28)]">
            {group.items.map((item) => {
              const Icon = NAV_ICONS[item.href] ?? Sparkles;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="group/item flex items-start gap-3 rounded-lg p-2.5 transition-colors duration-100 hover:bg-ktf-surface"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-ktf-gray-200 bg-white text-ktf-gray-600 transition-colors duration-100 group-hover/item:border-ktf-blue/30 group-hover/item:text-ktf-blue-deep">
                      <Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ktf-obsidian">{item.label}</span>
                      <span className="mt-0.5 block text-caption leading-snug text-ktf-gray-500">{item.description}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
}
