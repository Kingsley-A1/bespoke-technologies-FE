import type { Metadata } from "next";
import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { Container } from "@/components/layout";
import {
  PARTNERSHIP_TIERS,
  PHONE_DISPLAY,
  PHONE_NUMBER,
  SITE_NAME,
  WHATSAPP_NUMBER,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: `Partnership Tiers — ${SITE_NAME}`,
  description:
    "Explore Bespoke Technologies' three partnership tiers in full detail — Strategic B2B revenue-sharing, Co-development, and Technology integration. Clear terms, real value.",
  openGraph: {
    title: `Partnership Tiers — ${SITE_NAME}`,
    description: `Three ways to partner with ${SITE_NAME} — each built on genuine mutual value, clear terms, and real outcomes.`,
  },
};

// ── Per-tier detail content ──────────────────────────────────────────────────

const TIER_DETAIL = {
  strategic: {
    badge: "Revenue-Sharing Alliance",
    headline: "You Win. We Win. Together.",
    colour: "text-ktf-blue",
    accentBg: "bg-ktf-blue/8",
    accentBorder: "border-ktf-blue/25",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    intro: `The Strategic Partnership is a formal B2B revenue-sharing arrangement built on a simple principle: mutual financial incentive. When you refer a client to Bespoke Technologies and we deliver the project, we pay you 10% of the gross project revenue. When we refer an opportunity your way and you deliver it, you pay us 10% of yours. Both parties have skin in the game — which means both parties are fully invested in the outcome.`,
    howItWorks: [
      {
        step: "01",
        title: "You refer a client to Bespoke Technologies",
        body: "You identify a business that needs engineering services and introduce them to Bespoke Technologies. The referral is registered and assigned to you under your active partnership agreement.",
      },
      {
        step: "02",
        title: "Bespoke Technologies scopes and delivers the project",
        body: "Our engineering team engages the referred client, produces a formal Statement of Work, and delivers the project to specification. You are kept informed on progress at key milestones.",
      },
      {
        step: "03",
        title: "10% revenue share is issued to you",
        body: "Within 30 calendar days of project payment being received by Bespoke Technologies, we issue 10% of the gross project value to you — no deductions, fully documented.",
      },
      {
        step: "04",
        title: "We send opportunities your way too",
        body: "When we identify projects or clients that are better suited to your capabilities, we refer them to you — and receive 10% of the revenue you earn from that engagement in return.",
      },
    ],
    terms: [
      "Both parties must sign a formal Strategic Partnership Agreement before any referral is made or accepted.",
      "The 10% revenue share applies to the gross project value, calculated before taxes or platform fees.",
      "Revenue share payments are disbursed within 30 calendar days of confirmed full or milestone payment receipt.",
      "A referral qualifies only when the referred client signs a formal Statement of Work (SOW) with the receiving party.",
      "The minimum initial partnership term is 12 months, renewable annually by written mutual agreement.",
      "Either party may dissolve the agreement with 90 days' written notice; in-flight projects continue until completion.",
      "Revenue share is calculated per project and is non-cumulative unless separately negotiated in a project addendum.",
      "Confidentiality and non-solicitation obligations apply during the term and for 24 months following dissolution.",
      "Each party is solely responsible for their own tax obligations arising from revenue share income.",
      "Disputes are first addressed through good-faith mediation before any external legal process.",
    ],
    waMessage:
      "Hello%20Bespoke%20Technologies%2C%20I%20am%20interested%20in%20the%20Strategic%20Partnership%20tier%20(B2B%20Revenue-Sharing).%20Please%20could%20we%20discuss%20the%20terms%20and%20next%20steps%3F",
  },
  "co-development": {
    badge: "Joint Engineering & Go-to-Market",
    headline: "Build Great Things Together.",
    colour: "text-ktf-success",
    accentBg: "bg-ktf-success/8",
    accentBorder: "border-ktf-success/25",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    intro: `The Co-development Partnership creates a deep technical alliance between Bespoke Technologies' engineering team and your organisation. We collaborate on building products, platforms, and market-facing solutions together — aligning technical roadmaps, sharing resources, and executing joint go-to-market strategies. This tier is designed for businesses who want a genuine engineering partner embedded in their product journey, not a transactional outsourcing relationship.`,
    howItWorks: [
      {
        step: "01",
        title: "Define the joint project scope",
        body: "Together, we identify what we will co-build — a product, platform, feature set, or market initiative — and produce a shared roadmap with clear ownership, timelines, and success metrics.",
      },
      {
        step: "02",
        title: "Bespoke Technologies engineers integrate into your workflow",
        body: "Our engineers work alongside yours (or lead independently where agreed), embedded in your development cycle with access to shared repositories, sprint cadences, and communication channels.",
      },
      {
        step: "03",
        title: "Joint go-to-market execution",
        body: "We collaborate on client pitches, co-branded case studies, and joint marketing campaigns — reaching each other's audiences and amplifying the impact of what we build together.",
      },
      {
        step: "04",
        title: "Ongoing alignment and partnership reviews",
        body: "Regular cadence calls (weekly or bi-weekly) keep both teams aligned. Semi-annual partnership reviews evaluate outcomes, adjust scope, and plan the next phase.",
      },
    ],
    terms: [
      "A Co-development Agreement must be signed before any joint engineering or go-to-market activity commences.",
      "Intellectual property (IP) ownership for co-created assets defaults to a 50/50 split unless otherwise agreed in a project addendum.",
      "Each party is responsible for their own team costs, tooling licences, and operating expenses unless jointly budgeted.",
      "Joint marketing materials, case studies, and press releases require written consent from both parties before publication.",
      "Revenue sharing on jointly delivered client projects, where applicable, is defined per-project in signed addendums.",
      "Early access to new Bespoke Technologies solutions, design systems, and internal tooling is granted as a standing benefit.",
      "Either party may exit with 60 days' written notice; a mutually agreed handover plan must be in place before exit.",
      "Projects in active delivery at the time of notice continue under the original terms until completion.",
      "Confidentiality obligations covering shared technology, client data, and business strategy are binding for 36 months post-exit.",
    ],
    waMessage:
      "Hello%20Bespoke%20Technologies%2C%20I%20am%20interested%20in%20the%20Co-development%20Partnership%20tier.%20I%20would%20like%20to%20explore%20a%20joint%20engineering%20collaboration.%20Please%20could%20we%20discuss%20further%3F",
  },
  technology: {
    badge: "Technology Integration & Ecosystem",
    headline: "Your Tools. Our Builds. Real Adoption.",
    colour: "text-ktf-gold",
    accentBg: "bg-ktf-gold/8",
    accentBorder: "border-ktf-gold/25",
    icon: (
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    intro: `The Technology Partnership is built for technology providers, developer platforms, and infrastructure companies who want their products embedded in what Bespoke Technologies builds for clients. We integrate your APIs, SDKs, and infrastructure into applicable client projects, provide verified technical feedback through quarterly reviews, and represent your brand to a growing network of engineers and decision-makers.`,
    howItWorks: [
      {
        step: "01",
        title: "We evaluate your technology",
        body: "Bespoke Technologies' engineering team assesses your API, SDK, or platform for fit against our current and upcoming client project stack. Where a fit exists, we begin integration planning.",
      },
      {
        step: "02",
        title: "Your technology ships in client projects",
        body: "When we build applicable client solutions, your platform is integrated — giving you real-world adoption, usage data, and developer exposure at the point of delivery.",
      },
      {
        step: "03",
        title: "Co-branding and documented attribution",
        body: "Where your technology is meaningfully used, your brand is attributed in delivered solutions, case studies, and relevant documentation — extending your ecosystem presence.",
      },
      {
        step: "04",
        title: "Quarterly business reviews",
        body: "We meet every quarter to review integration metrics, share developer feedback, discuss roadmap alignment, and identify deeper collaboration opportunities.",
      },
    ],
    terms: [
      "Technology partners must provide current API/SDK access and maintain up-to-date, developer-facing documentation.",
      "Bespoke Technologies integrates partner technology at its own engineering discretion, based on project-by-project suitability assessments.",
      "Co-branding and attribution are provided only on solutions where the technology is meaningfully and visibly used.",
      "A dedicated technical point of contact must be maintained by the technology partner for integration support queries.",
      "Attendance or participation in quarterly business reviews is required to maintain active Technology Partner status.",
      "Partners may offer platform credits, extended API limits, or developer incentives at their discretion for integration volume.",
      "This tier does not include revenue sharing unless separately negotiated via a signed project addendum.",
      "Bespoke Technologies does not guarantee minimum integration volume or client adoption of any specific technology partner.",
      "Either party may exit the partnership with 30 days' written notice; any in-flight integrations continue to completion.",
    ],
    waMessage:
      "Hello%20Bespoke%20Technologies%2C%20I%20am%20interested%20in%20the%20Technology%20Partnership%20tier.%20I%20would%20like%20to%20explore%20technical%20integration%20and%20ecosystem%20collaboration.%20Please%20could%20we%20discuss%20further%3F",
  },
} satisfies Record<
  string,
  {
    badge: string;
    headline: string;
    colour: string;
    accentBg: string;
    accentBorder: string;
    icon: React.ReactNode;
    intro: string;
    howItWorks: { step: string; title: string; body: string }[];
    terms: string[];
    waMessage: string;
  }
>;

// ── Page ────────────────────────────────────────────────────────────────────

export default function PartnershipTiersPage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="bg-ktf-navy py-16 sm:py-20">
        <Container size="lg" className="text-center">
          <Badge
            variant="outline"
            className="border-ktf-blue/40 text-ktf-blue bg-ktf-blue/10 mb-6"
          >
            Partnership Tiers
          </Badge>
          <h1 className="text-h1 font-bold leading-heading text-ktf-white max-w-3xl mx-auto mb-4">
            The Full Terms. No Ambiguity.
          </h1>
          <p className="text-body-lg text-ktf-gray-400 leading-body max-w-2xl mx-auto mb-8">
            Every Bespoke Technologies partnership tier is built on clarity,
            fairness, and genuine mutual value. Read the terms, understand what
            you get, and reach out when you&apos;re ready.
          </p>
          {/* Jump links */}
          <nav
            aria-label="Jump to partnership tier"
            className="flex flex-wrap justify-center gap-3"
          >
            {PARTNERSHIP_TIERS.map((tier) => (
              <Link
                key={tier.id}
                href={`#${tier.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-ktf-blue/30 bg-ktf-blue/10 px-4 py-1.5 text-sm font-semibold text-ktf-blue transition-colors hover:bg-ktf-blue/20"
              >
                {tier.name}
              </Link>
            ))}
          </nav>
        </Container>
      </section>

      {/* ── Tier Sections ─────────────────────────────────────── */}
      {PARTNERSHIP_TIERS.map((tier, i) => {
        const detail = TIER_DETAIL[tier.id as keyof typeof TIER_DETAIL];
        const isAlt = i % 2 !== 0;

        const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${detail.waMessage}`;

        return (
          <section
            key={tier.id}
            id={tier.id}
            className={`py-20 sm:py-28 scroll-mt-20 ${isAlt ? "bg-ktf-surface" : "bg-ktf-white"}`}
          >
            <Container size="lg">
              {/* Section header */}
              <div className="mb-12 max-w-3xl">
                <span
                  className={`mb-3 inline-flex items-center gap-2 text-overline font-semibold uppercase tracking-widest ${detail.colour}`}
                >
                  {detail.icon}
                  {detail.badge}
                </span>
                <h2 className="text-h2 font-bold leading-heading text-ktf-navy mb-4">
                  {tier.name} Partnership
                  <span className={`block text-h3 ${detail.colour}`}>
                    {detail.headline}
                  </span>
                </h2>
                <p className="text-body-lg text-ktf-gray-600 leading-body">
                  {detail.intro}
                </p>
              </div>

              {/* Two-column: How it works + Terms */}
              <div className="grid gap-12 lg:grid-cols-2">
                {/* How it works */}
                <div>
                  <h3 className="text-h5 font-bold text-ktf-navy mb-6">
                    How It Works
                  </h3>
                  <ol className="flex flex-col gap-6">
                    {detail.howItWorks.map((item) => (
                      <li key={item.step} className="flex gap-4">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${detail.accentBg} ${detail.colour} border ${detail.accentBorder}`}
                          aria-hidden="true"
                        >
                          {item.step}
                        </span>
                        <div>
                          <p className="text-body font-semibold text-ktf-navy mb-1">
                            {item.title}
                          </p>
                          <p className="text-body-sm text-ktf-gray-600 leading-body">
                            {item.body}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Terms */}
                <div>
                  <h3 className="text-h5 font-bold text-ktf-navy mb-6">
                    Partnership Terms
                  </h3>
                  <ul className="flex flex-col gap-3.5">
                    {detail.terms.map((term, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${detail.accentBg} ${detail.colour} border ${detail.accentBorder}`}
                          aria-hidden="true"
                        >
                          {idx + 1}
                        </span>
                        <span className="text-body-sm text-ktf-gray-700 leading-body">
                          {term}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* What you get (benefits list) */}
              <div
                className={`mt-12 rounded-2xl border p-8 ${detail.accentBorder} ${isAlt ? "bg-ktf-white" : "bg-ktf-surface"}`}
              >
                <h3 className="text-h5 font-bold text-ktf-navy mb-5">
                  What&apos;s Included
                </h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-overline font-bold ${detail.accentBg} ${detail.colour}`}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      <span className="text-body-sm text-ktf-gray-700 leading-body">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA — Call + WhatsApp */}
              <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <p className="text-body font-semibold text-ktf-navy">
                  Interested in the {tier.name} tier?
                </p>
                <div className="flex flex-wrap gap-3">
                  {/* Call button */}
                  <a
                    href={`tel:${PHONE_NUMBER}`}
                    className="inline-flex h-11 items-center gap-2.5 rounded-xl bg-ktf-blue px-5 text-sm font-semibold text-white transition-colors hover:bg-ktf-blue-deep active:bg-ktf-blue-pressed"
                  >
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
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012.18 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 7.9a16 16 0 006.29 6.29l1.26-1.26a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
                    </svg>
                    Call {PHONE_DISPLAY}
                  </a>

                  {/* WhatsApp button */}
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-2.5 rounded-xl bg-[#25D366] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp Us
                  </a>
                </div>
              </div>
            </Container>
          </section>
        );
      })}

      {/* ── Bottom CTA ────────────────────────────────────────── */}
      <section className="bg-ktf-navy py-20 sm:py-28">
        <Container size="md" className="text-center">
          <p className="text-overline font-semibold uppercase tracking-widest text-ktf-blue mb-3">
            Not Sure Which Tier?
          </p>
          <h2 className="text-h2 font-bold leading-heading text-ktf-white mb-4">
            Let&apos;s Talk It Through
          </h2>
          <p className="text-body-lg text-ktf-gray-400 leading-body max-w-xl mx-auto mb-10">
            Every great partnership starts with a conversation. Tell us what you
            are building or pursuing, and we will tell you which tier makes the
            most sense for both sides.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={`tel:${PHONE_NUMBER}`}
              className="inline-flex h-13 items-center gap-2.5 rounded-xl bg-ktf-blue px-7 text-body font-semibold text-white transition-colors hover:bg-ktf-blue-deep"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.68A2 2 0 012.18 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 7.9a16 16 0 006.29 6.29l1.26-1.26a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
              </svg>
              Call {PHONE_DISPLAY}
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello%20Bespoke%20Technologies%2C%20I%20would%20like%20to%20enquire%20about%20a%20partnership.%20Please%20could%20you%20help%20me%20choose%20the%20right%20tier%3F`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-13 items-center gap-2.5 rounded-xl bg-[#25D366] px-7 text-body font-semibold text-white transition-opacity hover:opacity-90"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp Us
            </a>
            <Link
              href="/contact"
              className="inline-flex h-13 items-center gap-2 rounded-xl border border-ktf-blue/40 bg-transparent px-7 text-body font-semibold text-ktf-blue transition-colors hover:bg-ktf-blue/10"
            >
              Send a Message
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
