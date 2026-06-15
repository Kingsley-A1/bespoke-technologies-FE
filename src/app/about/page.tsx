import { Button } from "@/components/ui";
import { Container } from "@/components/layout";
import { PageHero } from "@/components/marketing/page-hero";
import {
  SITE_CREED,
  SITE_NAME,
  SITE_TAGLINE,
  VALUES,
  STATS,
} from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: `Learn about ${SITE_NAME} — our mission, values, and the principles that drive engineering excellence.`,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    images: [
      {
        url: absoluteUrl("/icons/og.png"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — About`,
      },
    ],
  },
  twitter: {
    images: [absoluteUrl("/icons/og.png")],
  },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        label="About"
        title="Principled engineering. Accountable delivery."
        description="We combine product judgment, design discipline, and production engineering to build systems our clients can confidently own."
        variant="about"
        primaryAction={{ label: "Our Standards", href: "#our-mission" }}
        secondaryAction={{ label: "Work With Us", href: "/contact" }}
      />

      {/* ── Mission ──────────────────────────────────────────── */}
      <section id="our-mission" className="bg-ktf-white py-24 sm:py-32">
        <Container size="lg">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-overline font-semibold uppercase tracking-widest text-ktf-blue mb-3">
                Our Mission
              </p>
              <h2 className="text-h2 font-bold leading-heading text-ktf-navy mb-6">
                {SITE_TAGLINE}
              </h2>
              <p className="text-body-lg text-ktf-gray-600 leading-body mb-4">
                We exist to close the gap between vision and reality. Too many
                great ideas fail because of poor execution. We are here to
                ensure that does not happen to our clients.
              </p>
              <p className="text-body text-ktf-gray-600 leading-body mb-8">
                From early-stage startups defining their product to enterprises
                modernising their platforms, we bring the same level of rigour,
                honesty, and engineering excellence to every engagement.
              </p>
              <Button href="/contact">Work With Us</Button>
            </div>

            {/* Story Card */}
            <div className="rounded-2xl border border-ktf-gray-200 bg-ktf-surface p-10">
              <p className="text-overline font-semibold uppercase tracking-widest text-ktf-gray-500 mb-4">
                Our Story
              </p>
              <p className="text-body text-ktf-gray-700 leading-body mb-4">
                Bespoke Technologies began as a personal commitment: a pledge
                that every line of code written would be purposeful, every
                design decision intentional, and every product shipped with
                pride.
              </p>
              <p className="text-body text-ktf-gray-700 leading-body mb-4">
                That commitment grew into a practice, and the practice into a
                foundation — one defined not just by what we build, but by how
                we build it and who we build it for.
              </p>
              <p className="text-body text-ktf-gray-700 leading-body">
                Today, we are a focused team of engineers and designers driven
                by a clear creed:{" "}
                <strong className="text-ktf-navy">{SITE_CREED}</strong>
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Stats Strip ──────────────────────────────────────── */}
      <section className="bg-ktf-obsidian py-16">
        <Container size="lg">
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="text-body-sm font-medium text-ktf-gray-500 uppercase tracking-widest">
                  {stat.label}
                </dt>
                <dd className="mt-2 text-h2 font-bold text-ktf-white leading-none">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* ── Values ───────────────────────────────────────────── */}
      <section className="bg-ktf-surface py-24 sm:py-32">
        <Container size="lg">
          <div className="text-center mb-16">
            <p className="text-overline font-semibold uppercase tracking-widest text-ktf-blue mb-3">
              Core Values
            </p>
            <h2 className="text-h2 font-bold leading-heading text-ktf-navy">
              The Principles That Guide Us
            </h2>
            <p className="mt-4 text-body-lg text-ktf-gray-600 max-w-xl mx-auto">
              These are not aspirations. They are the standards we hold
              ourselves to on every project, every day.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((value) => (
              <div
                key={value.id}
                className="rounded-2xl border border-ktf-gray-200 bg-ktf-white p-8 shadow-card"
              >
                <div className="text-h3 mb-4">{value.icon}</div>
                <h3 className="text-h5 font-semibold text-ktf-navy mb-2">
                  {value.title}
                </h3>
                <p className="text-body-sm text-ktf-gray-600 leading-body">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-ktf-navy py-24">
        <Container size="md" className="text-center">
          <h2 className="text-h2 font-bold leading-heading text-ktf-white mb-4">
            Ready to Build Together?
          </h2>
          <p className="text-body-lg text-ktf-gray-400 leading-body max-w-lg mx-auto mb-10">
            Whether you have a clear brief or an early-stage idea, we would love
            to hear from you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" href="/contact">
              Get in Touch
            </Button>
            <Button
              size="lg"
              variant="outline"
              href="/services"
              className="border-ktf-gray-600 text-ktf-white hover:bg-ktf-white/10 hover:border-ktf-gray-400"
            >
              View Services
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
