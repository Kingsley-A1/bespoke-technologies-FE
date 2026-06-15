import { Button } from "@/components/ui";
import { Container } from "@/components/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { PARTNERS, PARTNERSHIP_TIERS, SITE_NAME } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partnerships",
  description: `Partner with ${SITE_NAME}. Three tiers of collaboration — strategic, technology, and community — built on mutual value.`,
  alternates: {
    canonical: "/partnerships",
  },
};

export default function PartnershipsPage() {
  return (
    <>
      <PageHero
        label="Partnerships"
        title="Build stronger product ecosystems together."
        description="Create more value through referrals, co-development, technology collaboration, and partnerships with clear mutual responsibility."
        variant="partnerships"
        primaryAction={{
          label: "Explore Partnership Paths",
          href: "#partnership-options",
        }}
        secondaryAction={{ label: "Talk to Us", href: "/contact" }}
      />

      {/* ── Current Partners ──────────────────────────────────── */}
      <section className="bg-ktf-white py-20">
        <Container size="lg">
          <div className="text-center mb-12">
            <p className="text-overline font-semibold uppercase tracking-widest text-ktf-blue mb-3">
              Current Partners
            </p>
            <h2 className="text-h3 font-bold leading-heading text-ktf-navy">
              Those Who Share Our Standards
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PARTNERS.map((partner) => (
              <Link
                key={partner.id}
                href={partner.websiteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-4 rounded-2xl border border-ktf-gray-200 bg-ktf-white p-7 text-center shadow-card transition-all hover:border-ktf-blue/30 hover:shadow-lg"
              >
                {/* Logo */}
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ktf-surface">
                  <Image
                    src={partner.logo}
                    alt={`${partner.name} logo`}
                    width={40}
                    height={40}
                    className="object-contain"
                    unoptimized
                  />
                </div>

                {/* ID only */}
                <div className="flex flex-col gap-1">
                  <p className="text-caption font-semibold uppercase tracking-widest text-ktf-gray-400">
                    {partner.id}
                  </p>
                </div>

                {/* Tier badge */}
                <span
                  className={`rounded-full px-3 py-1 text-caption font-semibold ${
                    partner.tier === "strategic"
                      ? "bg-ktf-blue/10 text-ktf-blue"
                      : partner.tier === "technology"
                        ? "bg-ktf-success/10 text-ktf-success"
                        : "bg-ktf-gray-100 text-ktf-gray-600"
                  }`}
                >
                  {partner.tier.charAt(0).toUpperCase() + partner.tier.slice(1)}
                </span>

                {/* Description */}
                <p className="text-caption text-ktf-gray-600 leading-relaxed">
                  {partner.description}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Partnership Tiers ─────────────────────────────────── */}
      <section
        id="partnership-options"
        className="bg-ktf-surface py-24 sm:py-32"
      >
        <Container size="lg">
          <div className="text-center mb-16">
            <p className="text-overline font-semibold uppercase tracking-widest text-ktf-blue mb-3">
              Partnership Tiers
            </p>
            <h2 className="text-h2 font-bold leading-heading text-ktf-navy mb-4">
              Find Your Level of Collaboration
            </h2>
            <p className="text-body-lg text-ktf-gray-600 max-w-xl mx-auto">
              Each tier is designed to deliver meaningful mutual value — not
              just a logo placement.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {PARTNERSHIP_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-2xl border p-8 ${
                  tier.highlighted
                    ? "border-ktf-blue bg-ktf-navy text-ktf-white shadow-xl"
                    : "border-ktf-gray-200 bg-ktf-white shadow-card"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-ktf-blue px-4 py-1 text-caption font-semibold text-ktf-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p
                    className={`text-overline font-semibold uppercase tracking-widest mb-2 ${
                      tier.highlighted ? "text-ktf-blue" : "text-ktf-blue"
                    }`}
                  >
                    {tier.name} Partner
                  </p>
                  <p
                    className={`text-body-sm leading-body ${
                      tier.highlighted
                        ? "text-ktf-gray-400"
                        : "text-ktf-gray-600"
                    }`}
                  >
                    {tier.description}
                  </p>
                </div>

                <ul className="flex flex-col gap-3 flex-1 mb-8">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-caption ${
                          tier.highlighted
                            ? "bg-ktf-blue/30 text-ktf-blue"
                            : "bg-ktf-success/15 text-ktf-success"
                        }`}
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                      <span
                        className={`text-body-sm leading-body ${
                          tier.highlighted
                            ? "text-ktf-gray-300"
                            : "text-ktf-gray-700"
                        }`}
                      >
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  href={`/partnerships/tiers#${tier.id}`}
                  variant={tier.highlighted ? "primary" : "outline"}
                  className={
                    !tier.highlighted
                      ? "border-ktf-gray-300 text-ktf-navy hover:bg-ktf-surface"
                      : ""
                  }
                >
                  Apply for {tier.name} Tier
                </Button>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Why Partner ──────────────────────────────────────── */}
      <section className="bg-ktf-white py-24">
        <Container size="md" className="text-center">
          <p className="text-overline font-semibold uppercase tracking-widest text-ktf-blue mb-3">
            Why Partner with Bespoke Technologies
          </p>
          <h2 className="text-h2 font-bold leading-heading text-ktf-navy mb-6">
            More than a Logo on a Page
          </h2>
          <p className="text-body-lg text-ktf-gray-600 leading-body max-w-2xl mx-auto mb-4">
            We take partnerships seriously. When your brand is associated with
            ours, we make certain you benefit from that association in
            measurable ways — through co-created content, joint initiatives, and
            genuine promotion.
          </p>
          <p className="text-body text-ktf-gray-600 leading-body max-w-2xl mx-auto mb-10">
            If you believe in what we are building and want to grow alongside a
            principled engineering practice, we would love to talk.
          </p>
          <Button size="lg" href="/contact">
            Enquire About Partnering
          </Button>
        </Container>
      </section>

      {/* ── The Powers Behind the Engine ──────────────────── */}
      <section className="bg-ktf-surface py-20 sm:py-24">
        <Container size="lg">
          <div className="text-center mb-10">
            <p className="text-overline font-semibold uppercase tracking-widest text-ktf-blue mb-3">
              Our Team
            </p>
            <h2 className="text-h2 font-bold leading-heading text-ktf-navy">
              The Powers Behind the Engine
            </h2>
          </div>
          <div className="relative overflow-hidden rounded-2xl shadow-xl">
            <Image
              src="/Team/team.png"
              alt="The Bespoke Technologies team - The Powers Behind the Engine"
              width={1200}
              height={600}
              className="w-full object-cover"
            />
          </div>
        </Container>
      </section>
    </>
  );
}
