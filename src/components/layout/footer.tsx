import Link from "next/link";
import Image from "next/image";
import { BRAND_ICON_SRC, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { NewsletterForm } from "./newsletter-form";

const FOOTER_LINKS = {
  company: [
    { label: "About", href: "/about" },
    { label: "Services", href: "/services" },
    { label: "Partnerships", href: "/partnerships" },
    { label: "Reviews", href: "/reviews" },
  ],
  resources: [
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
} as const;

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-linear-to-b from-ktf-navy to-ktf-obsidian text-ktf-gray-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="grid grid-cols-1 gap-8 py-10 sm:grid-cols-2 sm:py-12 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src={BRAND_ICON_SRC}
                alt="Bespoke Technologies logo"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-cover"
              />
              <span className="text-lg font-bold tracking-tight">
                <span className="text-ktf-blue">BESPOKE</span>{" "}
                <span className="text-white">TECHNOLOGIES</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-ktf-gray-500 max-w-xs">
              {SITE_TAGLINE}
            </p>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Company
            </h3>
            <ul className="mt-4 flex flex-col gap-3" role="list">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ktf-gray-500 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Resources
            </h3>
            <ul className="mt-4 flex flex-col gap-3" role="list">
              {FOOTER_LINKS.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ktf-gray-500 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Stay Updated
            </h3>
            <p className="mt-4 text-sm text-ktf-gray-500">
              Get the latest from Bespoke Technologies — directly in your inbox.
            </p>
            <NewsletterForm />
          </div>
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
