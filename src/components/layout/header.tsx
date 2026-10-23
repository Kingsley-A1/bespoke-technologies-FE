"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Sparkles } from "lucide-react";
import {
  BRAND_ICON_SRC,
  NAV_GROUPS,
  SITE_NAME,
  WHATSAPP_INQUIRY_MESSAGE,
  WHATSAPP_NUMBER,
} from "@/lib/constants";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { isNavGroupActive, MegaNavItem, NAV_ICONS } from "@/components/layout/nav-mega-menu";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks";


export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // A hairline shadow appears once the page scrolls. Stored as a data
  // attribute so scrolling never re-renders the header.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const update = () => {
      header.dataset.scrolled = window.scrollY > 4 ? "true" : "false";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // While the Bespoke AI side panel is docked the desktop menus are hidden for
  // room, so the menu button (and this overlay) also serve wide screens then.
  const [menuWhileDocked, setMenuWhileDocked] = useState(false);
  const toggleMobile = () => {
    setMenuWhileDocked(document.body.classList.contains("bespoke-ai-side-panel-open"));
    setMobileOpen((prev) => !prev);
  };
  const closeMobile = () => setMobileOpen(false);

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    WHATSAPP_INQUIRY_MESSAGE,
  )}`;

  return (
    <>
      <header
        ref={headerRef}
        data-scrolled="false"
        className="sticky top-0 z-100 border-b border-ktf-gray-200/70 bg-ktf-white/90 backdrop-blur-xl transition-shadow duration-200 data-[scrolled=true]:shadow-[0_1px_12px_rgba(11,31,58,0.08)]"
      >
        <nav
          className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5 rounded-xl font-bold tracking-tight text-ktf-obsidian transition-opacity hover:opacity-85"
            onClick={closeMobile}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-ktf-blue/15 bg-white shadow-xs">
              <Image
                src={BRAND_ICON_SRC}
                alt="Bespoke Technologies logo"
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg object-cover"
                priority
              />
            </span>
            <span className="grid w-[6.25rem] shrink-0 grid-cols-1 justify-items-center leading-none sm:w-auto sm:flex sm:flex-row sm:items-baseline sm:gap-1.5">
              <span className="block w-full text-left text-[1.02rem] font-extrabold text-ktf-blue sm:w-auto sm:text-xl">
                BESPOKE
              </span>
              <span className="mt-0.5 block w-full text-left text-[0.5rem] font-extrabold tracking-[0.1em] text-ktf-obsidian sm:mt-0 sm:w-auto sm:text-xl sm:tracking-tight">
                TECHNOLOGIES
              </span>
            </span>
          </Link>

          {/* Desktop Navigation — four grouped menus, as on Stripe and Vercel */}
          <ul className="ml-8 mr-auto hidden items-center gap-0.5 lg:flex" role="list">
            {NAV_GROUPS.map((group) => (
              <MegaNavItem key={group.label} group={group} isActive={isNavGroupActive(group, pathname)} />
            ))}
          </ul>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/bespoke-ai"
              className="hidden h-9 items-center justify-center whitespace-nowrap rounded-full border border-ktf-gray-200 bg-white px-4 text-sm font-medium text-ktf-obsidian xl:inline-flex transition-colors duration-150 hover:border-ktf-gray-300 hover:bg-ktf-surface"
            >
              Ask Bespoke AI
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full bg-ktf-obsidian px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-ktf-charcoal"
            >
              Contact Us
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={toggleMobile}
            className="lg:hidden relative z-10000 flex h-10 w-10 items-center justify-center rounded-lg text-ktf-gray-700 transition-colors hover:bg-ktf-surface"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <div className="flex w-5 flex-col gap-1.25">
              <span
                className={cn(
                  "block h-0.5 w-full origin-center bg-current transition-transform duration-200",
                  mobileOpen && "translate-y-[7px] rotate-45",
                )}
              />
              <span className={cn("block h-0.5 w-full bg-current transition-opacity duration-150", mobileOpen && "opacity-0")} />
              <span
                className={cn(
                  "block h-0.5 w-full origin-center bg-current transition-transform duration-200",
                  mobileOpen && "-translate-y-[7px] -rotate-45",
                )}
              />
            </div>
          </button>
        </nav>
      </header>

      {/* ── Mobile Navigation Overlay ─────────────────────────
          Rendered OUTSIDE <header> so the sticky z-100 stacking
          context does not clip the fixed panel over the page.     */}
      {mobileOpen && (!isDesktop || menuWhileDocked) && (
          <>
            {/* Frosted backdrop */}
            <div
              data-mobile-nav-backdrop="true"
              className="ktf-fade-in fixed inset-0 z-9998 bg-ktf-obsidian/60 backdrop-blur-sm lg:hidden"
              onClick={closeMobile}
              aria-hidden="true"
            />

            {/* Sidebar Panel */}
            <div
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="ktf-slide-in-right fixed inset-y-0 right-0 z-9999 flex w-4/5 max-w-xs flex-col border-l border-ktf-blue/20 bg-ktf-white [box-shadow:0_0_80px_rgba(0,0,0,0.35)] lg:hidden"
            >
              {/* Panel header — branded band */}
              <div className="relative shrink-0 overflow-hidden border-b border-ktf-gray-100 bg-gradient-to-br from-ktf-blue/10 via-white to-white px-5 pb-5 pt-5">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-10 -right-8 h-32 w-32 rounded-full bg-ktf-blue/10 blur-2xl"
                />
                <Link
                  href="/"
                  onClick={closeMobile}
                  className="relative flex items-center gap-3"
                  aria-label={`${SITE_NAME} home`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-ktf-blue/15 bg-white shadow-xs">
                    <Image
                      src={BRAND_ICON_SRC}
                      alt="Bespoke Technologies logo"
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-md object-cover"
                    />
                  </span>
                  <div className="flex flex-col leading-none">
                    <span className="text-sm font-extrabold tracking-tight text-ktf-blue uppercase">
                      Bespoke
                    </span>
                    <span className="mt-1 text-sm font-extrabold tracking-tight text-ktf-obsidian uppercase">
                      Technologies
                    </span>
                  </div>
                </Link>
                <p className="relative mt-3 text-caption font-medium text-ktf-gray-600">
                  Idea to production-ready product — built to own.
                </p>
              </div>

              {/* Nav Links — the same groups as the desktop menus */}
              <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Mobile navigation">
                {NAV_GROUPS.map((group, groupIndex) => (
                  <section
                    key={group.label}
                    className={groupIndex > 0 ? "mt-4 border-t border-ktf-gray-100 pt-4" : undefined}
                    aria-label={group.label}
                  >
                    <p className="px-2.5 text-overline font-semibold uppercase tracking-[0.14em] text-ktf-gray-500">
                      {group.label}
                    </p>
                    <ul className="mt-1.5 flex flex-col gap-0.5" role="list">
                      {group.items.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = NAV_ICONS[link.href] ?? Sparkles;
                        return (
                          <li key={link.href}>
                            <Link
                              href={link.href}
                              onClick={closeMobile}
                              className={cn(
                                "group/nav flex items-center gap-3 rounded-md px-2.5 py-2 text-[15px] font-medium transition-colors duration-150",
                                isActive
                                  ? "bg-ktf-blue/8 text-ktf-navy"
                                  : "text-ktf-gray-700 hover:bg-ktf-surface hover:text-ktf-navy",
                              )}
                              aria-current={isActive ? "page" : undefined}
                            >
                              <span
                                className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors duration-150",
                                  isActive
                                    ? "border-transparent bg-ktf-blue text-white"
                                    : "border-ktf-gray-200 bg-white text-ktf-gray-500 group-hover/nav:border-ktf-blue/30 group-hover/nav:text-ktf-blue",
                                )}
                              >
                                <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                              </span>
                              <span className="flex-1">{link.label}</span>
                              <ArrowUpRight
                                className={cn(
                                  "h-4 w-4 shrink-0 transition-all duration-150",
                                  isActive
                                    ? "text-ktf-blue-deep opacity-100"
                                    : "text-ktf-gray-400 opacity-0 group-hover/nav:opacity-100",
                                )}
                                aria-hidden="true"
                              />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </nav>

              {/* Footer */}
              <div className="shrink-0 border-t border-ktf-gray-100 px-4 pb-8 pt-4">
                <div className="grid grid-cols-2 gap-2.5">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={closeMobile}
                    className="flex h-12 items-center justify-center gap-2 rounded-lg bg-[#25d366] text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                  >
                    <WhatsAppIcon className="h-[18px] w-[18px]" />
                    WhatsApp
                  </a>
                  <Link
                    href="/contact"
                    onClick={closeMobile}
                    className="flex h-12 items-center justify-center rounded-lg bg-ktf-blue text-sm font-semibold text-white transition-colors duration-150 hover:bg-ktf-blue-deep active:bg-ktf-blue-pressed"
                  >
                    Contact Us
                  </Link>
                </div>
                <div className="mt-4 flex items-center justify-center gap-5">
                  <Link
                    href="/terms"
                    onClick={closeMobile}
                    className="text-caption font-medium text-ktf-gray-500 transition-colors hover:text-ktf-blue"
                  >
                    Terms
                  </Link>
                  <span
                    className="h-3 w-px bg-ktf-gray-200"
                    aria-hidden="true"
                  />
                  <Link
                    href="/privacy"
                    onClick={closeMobile}
                    className="text-caption font-medium text-ktf-gray-500 transition-colors hover:text-ktf-blue"
                  >
                    Privacy
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
    </>
  );
}
