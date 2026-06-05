"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { BRAND_ICON_SRC, NAV_LINKS, SITE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const toggleMobile = () => setMobileOpen((prev) => !prev);
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="sticky top-0 z-100 border-b border-ktf-gray-200 bg-ktf-white shadow-xs">
        <nav
          className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2.5 font-bold tracking-tight text-ktf-obsidian transition-opacity hover:opacity-80"
            onClick={closeMobile}
          >
            <Image
              src={BRAND_ICON_SRC}
              alt="Bespoke Technologies logo"
              width={44}
              height={44}
              className="h-11 w-11 rounded-xl object-cover"
              priority
            />
            <span className="grid w-[6.25rem] shrink-0 grid-cols-1 justify-items-center leading-none sm:w-auto sm:flex sm:flex-row sm:items-baseline sm:gap-1.5">
              <span className="block w-full text-left text-[1.02rem] font-extrabold tracking-[-0.035em] text-ktf-blue sm:w-auto sm:text-xl sm:tracking-tight">
                BESPOKE
              </span>
              <span className="mt-0.5 block w-full text-left text-[0.5rem] font-extrabold tracking-[0.1em] text-ktf-obsidian sm:mt-0 sm:w-auto sm:text-xl sm:tracking-tight">
                TECHNOLOGIES
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center gap-1" role="list">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "relative px-3.5 py-2 text-sm font-medium rounded-lg transition-colors duration-150",
                      isActive
                        ? "text-ktf-blue"
                        : "text-ktf-gray-700 hover:text-ktf-obsidian hover:bg-ktf-surface",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="active-nav-indicator"
                        className="absolute inset-x-2 -bottom-4.25 h-0.5 bg-ktf-blue rounded-full"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/terms"
              className="text-sm text-ktf-gray-500 transition-colors hover:text-ktf-obsidian"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-ktf-gray-500 transition-colors hover:text-ktf-obsidian"
            >
              Privacy
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-ktf-blue px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-ktf-blue-deep active:bg-ktf-blue-pressed"
            >
              Get Started
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
              <motion.span
                animate={
                  mobileOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }
                }
                transition={{ duration: 0.2 }}
                className="block h-0.5 w-full bg-current origin-center"
              />
              <motion.span
                animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="block h-0.5 w-full bg-current"
              />
              <motion.span
                animate={
                  mobileOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }
                }
                transition={{ duration: 0.2 }}
                className="block h-0.5 w-full bg-current origin-center"
              />
            </div>
          </button>
        </nav>
      </header>

      {/* ── Mobile Navigation Overlay ─────────────────────────
          Rendered OUTSIDE <header> so the sticky z-100 stacking
          context does not clip the fixed panel over the page.     */}
      <AnimatePresence>
        {mobileOpen && !isDesktop && (
          <>
            {/* Frosted backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-9998 bg-ktf-obsidian/60 backdrop-blur-sm lg:hidden"
              onClick={closeMobile}
              aria-hidden="true"
            />

            {/* Sidebar Panel */}
            <motion.div
              id="mobile-nav"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 right-0 z-9999 flex w-4/5 max-w-xs flex-col border-l border-ktf-blue/20 bg-ktf-white [box-shadow:0_0_80px_rgba(0,0,0,0.35)] lg:hidden"
            >
              {/* Panel header — aligns with main navbar height */}
              <div className="flex h-16 shrink-0 items-center border-b border-ktf-gray-100 px-5">
                <Link
                  href="/"
                  onClick={closeMobile}
                  className="flex items-center gap-2.5"
                  aria-label={`${SITE_NAME} home`}
                >
                  <Image
                    src={BRAND_ICON_SRC}
                    alt="Bespoke Technologies logo"
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-lg object-cover"
                  />
                  <div className="flex flex-col leading-none">
                    <span className="text-overline font-extrabold tracking-[0.12em] text-ktf-blue uppercase">
                      Bespoke
                    </span>
                    <span className="text-overline font-extrabold tracking-[0.12em] text-ktf-obsidian uppercase">
                      Technologies
                    </span>
                  </div>
                </Link>
              </div>

              {/* Nav Links */}
              <nav className="flex-1 overflow-y-auto px-4 py-5">
                <ul className="flex flex-col gap-1" role="list">
                  {NAV_LINKS.map((link, i) => {
                    const isActive = pathname === link.href;
                    return (
                      <motion.li
                        key={link.href}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.04 * i, duration: 0.18 }}
                      >
                        <Link
                          href={link.href}
                          onClick={closeMobile}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] font-semibold transition-all duration-150",
                            isActive
                              ? "bg-ktf-blue text-white shadow-sm"
                              : "text-ktf-navy hover:text-ktf-blue hover:bg-ktf-blue/8",
                          )}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {link.label}
                          {isActive && (
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                          )}
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              {/* Footer */}
              <div className="shrink-0 border-t border-ktf-gray-100 px-4 pb-8 pt-4">
                <div className="mb-4 flex items-center justify-center gap-5">
                  <Link
                    href="/terms"
                    onClick={closeMobile}
                    className="text-sm font-medium text-ktf-blue/60 transition-colors hover:text-ktf-blue"
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
                    className="text-sm font-medium text-ktf-blue/60 transition-colors hover:text-ktf-blue"
                  >
                    Privacy
                  </Link>
                </div>
                <Link
                  href="/contact"
                  onClick={closeMobile}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-ktf-blue text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-ktf-blue-deep active:bg-ktf-blue-pressed"
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
