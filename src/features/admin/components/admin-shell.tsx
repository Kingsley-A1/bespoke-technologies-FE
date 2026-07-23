"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleDollarSign,
  FilePlus2,
  Inbox,
  Images,
  LayoutDashboard,
  Library,
  GraduationCap,
  LogOut,
  Menu,
  Search,
  Send,
  Settings,
  Star,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { roleLabel } from "../permissions";
import type { AdminRole } from "../types";
import { AdminLogo } from "./admin-logo";

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  founderOnly?: boolean;
  employeeVisible?: boolean;
}

const navigation: NavigationItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, employeeVisible: true },
  { label: "Coworker", href: "/admin/coworker", icon: Bot, employeeVisible: true },
  { label: "Sales", href: "/admin/sales", icon: BriefcaseBusiness },
  { label: "Clients", href: "/admin/clients", icon: Building2 },
  { label: "Projects", href: "/admin/projects", icon: UsersRound },
  { label: "Portfolio", href: "/admin/portfolio", icon: Images },
  { label: "Billing", href: "/admin/billing", icon: CircleDollarSign },
  { label: "Publications", href: "/admin/publications", icon: Library },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Inbox", href: "/admin/inbox", icon: Inbox },
  { label: "Outreach", href: "/admin/outreach", icon: Send },
  { label: "Team learning", href: "/admin/learning", icon: GraduationCap, employeeVisible: true },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Activity", href: "/admin/activity", icon: Activity, founderOnly: true },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

const pageMeta = [
  ["/admin/coworker", "Bespoke Coworker", "A private, role-aware view across your admin workspace."],
  ["/admin/billing/new", "Create invoice", "Build, save, review, and issue a client invoice."],
  ["/admin/billing/", "Billing invoice", "Review financial details, history, and payment state."],
  ["/admin/billing", "Billing", "Invoices, proformas, recurring schedules, and payments."],
  ["/admin/publications", "Publications", "Handover proof, books, and research for the public library."],
  ["/admin/portfolio", "Website portfolio", "Publish and maintain the finished projects shown on the website."],
  ["/admin/reviews", "Client reviews", "Verify, publish, and manage public client reviews."],
  ["/admin/sales", "Sales pipeline", "Move qualified opportunities towards signed work."],
  ["/admin/clients", "Clients", "One reliable view of every commercial relationship."],
  ["/admin/projects", "Project delivery", "Keep milestones, risks, and commitments visible."],
  ["/admin/inbox", "Admin inbox", "Triage new enquiries and operational follow-ups."],
  ["/admin/reports", "Reports", "Revenue, receivables, pipeline, and delivery health."],
  ["/admin/learning", "Team learning", "Structured development plans, progress, and certifications."],
  ["/admin/activity", "Activity and audit", "An attributable history of sensitive and operational actions."],
  ["/admin/settings", "Admin settings", "Company controls, access, sessions, and system health."],
  ["/admin", "Company overview", "A clear view of money, work, attention, and momentum."],
] as const;

export function AdminShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { displayName: string; email: string; role: AdminRole };
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = pageMeta.find(([path]) => (path === "/admin" ? pathname === path : pathname.startsWith(path))) ?? pageMeta.at(-1)!;
  const visibleNavigation = navigation.filter((item) => user.role === "employee" ? item.employeeVisible : (!item.founderOnly || user.role === "founder_admin"));

  return (
    <div className="min-h-screen bg-ktf-surface text-ktf-obsidian">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-[86px] items-center justify-between border-b border-slate-100 px-5">
          <AdminLogo />
          <button type="button" className="rounded-lg p-2 text-slate-500 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-4 pt-5">
          {user.role !== "employee" && <Link href="/admin/billing/new" onClick={() => setMobileOpen(false)} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-ktf-blue px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-ktf-blue-deep">
            <FilePlus2 className="h-4 w-4" /> Create invoice
          </Link>}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pt-6" aria-label="Admin navigation">
          {visibleNavigation.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                  active ? "bg-[#eaf3ff] text-[#075fcf]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                )}
              >
                <item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <form action="/admin/api/auth/logout" method="post">
            <button className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-950">
              <LogOut className="h-[18px] w-[18px]" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 backdrop-blur lg:ml-[248px]">
        <div className="flex min-h-[86px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-[-0.025em] text-slate-950">{meta[1]}</h1>
              <p className="mt-0.5 hidden truncate text-sm text-slate-500 sm:block">{meta[2]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/admin/search" className="hidden h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-500 xl:flex">
              <Search className="h-4 w-4" /> Search
              <span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px]">⌘ K</span>
            </Link>
            <div className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white pl-1.5 pr-2 sm:pr-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-[10px] font-bold text-white">BT</span>
              <span className="hidden max-w-36 text-left sm:block">
                <span className="block truncate text-[11px] font-semibold text-slate-800">{user.displayName}</span>
                <span className="block truncate text-[10px] text-slate-500">{roleLabel(user.role)}</span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 sm:block" />
            </div>
          </div>
        </div>
      </header>
      <main className="lg:ml-[248px]">
        <div className="mx-auto w-full max-w-[1540px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
