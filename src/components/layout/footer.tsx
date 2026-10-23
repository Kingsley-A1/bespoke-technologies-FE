import Link from "next/link";
import Image from "next/image";
import { BRAND_ICON_SRC, CONTACT_EMAIL, NAV_GROUPS, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

/**
 * Site footer — a complete, scannable sitemap built from the same groups as
 * the header, so every public page is one click from anywhere.
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-linear-to-b from-ktf-navy to-ktf-obsidian text-ktf-gray-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:grid-cols-4 lg:grid-cols-[1.7fr_repeat(4,1fr)] lg:gap-x-8 lg:py-16">
          {/* Brand and newsletter */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1 lg:pr-6">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src={BRAND_ICON_SRC}
                alt="Bespoke Technologies logo"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-cover"
              />
              <span className="whitespace-nowrap text-base font-bold tracking-tight">
                <span className="text-ktf-blue">BESPOKE</span>{" "}
                <span className="text-white">TECHNOLOGIES</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ktf-gray-500">{SITE_TAGLINE}</p>
            {/* A real follow path; there is no email list yet, so no signup form that would discard addresses. */}
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href="/news"
                className="inline-flex h-9 items-center rounded-full bg-white px-4 text-sm font-medium text-ktf-obsidian transition-colors hover:bg-ktf-gray-200"
              >
                Follow What&apos;s New
              </Link>
              <a
                href="/news/feed.xml"
                className="inline-flex h-9 items-center rounded-full border border-white/15 px-4 text-sm font-medium text-ktf-gray-400 transition-colors hover:border-white/30 hover:text-white"
              >
                RSS feed
              </a>
            </div>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-5 inline-block text-sm text-ktf-gray-500 transition-colors hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>
          </div>

          {NAV_GROUPS.map((group) => (
            <nav key={group.label} aria-label={group.label}>
              <h3 className="text-sm font-medium text-white">{group.label}</h3>
              <ul className="mt-4 flex flex-col gap-3" role="list">
                {group.items.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-ktf-gray-500 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-ktf-gray-800" />
      </div>

      <div className="w-full overflow-hidden px-4 pt-3 sm:px-6 lg:px-8">
        <p
          aria-hidden="true"
          className="select-none text-center text-[clamp(4.5rem,18vw,18rem)] font-bold uppercase leading-none tracking-normal text-white/[0.095]"
        >
          BESPOKE
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 py-4 sm:flex-row">
          <p className="text-xs text-ktf-gray-600">
            &copy; {currentYear} {SITE_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="text-xs text-ktf-gray-600 transition-colors hover:text-ktf-gray-400"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-ktf-gray-600 transition-colors hover:text-ktf-gray-400"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
