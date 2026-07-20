"use client";

import { useCallback, useId, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  BookOpen,
  CalendarCheck2,
  ChevronDown,
  FileSearch,
  FolderGit2,
  Layers,
  LockKeyhole,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MegaMenuItem {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
}

interface MegaMenu {
  items: MegaMenuItem[];
}

/**
 * Hover/focus sub-navigation cards for selected top-level destinations —
 * the Stripe pattern: a calm white card of scannable, real links.
 * Only destinations with genuinely useful sub-items get a menu.
 */
export const NAV_MENUS: Record<string, MegaMenu> = {
  "/services": {
    items: [
      {
        icon: Layers,
        label: "Service catalog",
        description: "Everything we design, engineer, and launch",
        href: "/services#service-catalog",
      },
      {
        icon: Sparkles,
        label: "Bespoke AI",
        description: "Scope your product with our AI",
        href: "/bespoke-ai",
      },
      {
        icon: CalendarCheck2,
        label: "Contact us",
        description: "Start a build conversation",
        href: "/contact",
      },
    ],
  },
  "/projects": {
    items: [
      {
        icon: FolderGit2,
        label: "Delivered work",
        description: "Live products we have shipped",
        href: "/projects",
      },
      {
        icon: LockKeyhole,
        label: "Client handovers",
        description: "Documented delivery proof",
        href: "/library#handover",
      },
      {
        icon: Star,
        label: "Reviews",
        description: "What clients say about the work",
        href: "/reviews",
      },
    ],
  },
  "/library": {
    items: [
      {
        icon: BookOpen,
        label: "Books",
        description: "Written by the Bespoke team",
        href: "/library#books",
      },
      {
        icon: FileSearch,
        label: "Research",
        description: "Technical notes and papers",
        href: "/library#research",
      },
      {
        icon: LockKeyhole,
        label: "Client handovers",
        description: "Preview delivery documentation",
        href: "/library#handover",
      },
    ],
  },
};

interface MegaNavItemProps {
  href: string;
  label: string;
  isActive: boolean;
  menu: MegaMenu;
}

export function MegaNavItem({ href, label, isActive, menu }: MegaNavItemProps) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const panelId = useId();
  const reduceMotion = useReducedMotion();

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
        href={href}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        className={cn(
          "relative inline-flex items-center gap-1 py-2 text-[13px] font-semibold transition-colors duration-150 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-ktf-blue after:transition-transform after:duration-150",
          isActive
            ? "text-ktf-blue after:scale-x-100"
            : "text-ktf-gray-700 hover:text-ktf-obsidian",
        )}
        aria-current={isActive ? "page" : undefined}
      >
        {label}
        <ChevronDown
          className={cn(
            "h-3 w-3 text-ktf-gray-400 transition-transform duration-150",
            open && "rotate-180 text-ktf-blue",
          )}
          aria-hidden="true"
        />
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3"
          >
            <div className="w-[300px] rounded-xl border border-ktf-gray-200 bg-white p-1.5 shadow-2xl">
              {menu.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group/item flex items-start gap-3 rounded-lg p-2.5 transition-colors duration-100 hover:bg-ktf-surface"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-ktf-blue/15 bg-ktf-surface text-ktf-blue-deep transition-colors duration-100 group-hover/item:border-transparent group-hover/item:bg-ktf-blue group-hover/item:text-white">
                    <item.icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-ktf-navy">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-caption leading-tight text-ktf-gray-500">
                      {item.description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
