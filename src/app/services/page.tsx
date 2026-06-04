import { Button, Badge } from "@/components/ui";
import { TypingText } from "@/components/ui/typing-text";
import { Container } from "@/components/layout";
import { SERVICES, SITE_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Services — ${SITE_NAME}`,
  description:
    "End-to-end digital engineering services: web applications, mobile, cloud infrastructure, AI/ML, API platforms, and design systems.",
};

export default function ServicesPage() {
  return (
    <>
      {/* ── Page Hero ─────────────────────────────────────────── */}
      <section className="bg-ktf-navy py-16 sm:py-20">
        <Container size="lg" className="text-center">
          <Badge
            variant="outline"
            className="border-ktf-blue/40 text-ktf-blue bg-ktf-blue/10 mb-6"
          >
            What We Build
          </Badge>
          <h1 className="text-h1 font-bold leading-heading text-ktf-white max-w-3xl mx-auto mb-4">
            Full-Spectrum{" "}
            <TypingText text="Engineering" className="text-ktf-blue" /> Services
          </h1>
          <p className="text-body-lg text-ktf-gray-400 leading-body max-w-2xl mx-auto">
            Every service we offer is delivered with the same standard:
            production-grade code, rigorous testing, and a relentless focus on
            your outcome.
          </p>
        </Container>
      </section>

      {/* ── Services Detail Grid ──────────────────────────────── */}
      <section className="bg-ktf-white py-24 sm:py-32">
        <Container size="lg">
          <div className="flex flex-col gap-16">
            {SERVICES.map((service, index) => (
              <div
                key={service.id}
                id={service.id}
                className={`grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center ${
                  index % 2 === 1 ? "lg:[&>div:first-child]:order-2" : ""
                }`}
              >
                {/* Info */}
                <div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ktf-blue/10 text-ktf-blue text-h3 mb-6">
                    {service.icon}
                  </div>
                  <p className="text-overline font-semibold uppercase tracking-widest text-ktf-blue mb-2">
                    Service
                  </p>
                  <h2 className="text-h3 font-bold leading-heading text-ktf-navy mb-3">
                    {service.title}
                  </h2>
                  <p className="text-body-lg font-medium text-ktf-gray-700 mb-4">
                    {service.tagline}
                  </p>
                  <p className="text-body text-ktf-gray-600 leading-body mb-6">
                    {service.description}
                  </p>
                  <Button href="/contact" size="sm">
                    Discuss This Service
                  </Button>
                </div>

                {/* Features + Tech */}
                <div className="rounded-2xl border border-ktf-gray-200 bg-ktf-surface p-8">
                  <h3 className="text-body font-semibold text-ktf-navy mb-4 uppercase tracking-wide text-overline">
                    What&apos;s Included
                  </h3>
                  <ul className="flex flex-col gap-3 mb-8">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ktf-success/15 text-ktf-success text-caption"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                        <span className="text-body-sm text-ktf-gray-700 leading-body">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-ktf-gray-200 pt-6">
                    <p className="text-overline font-semibold uppercase tracking-widest text-ktf-gray-500 mb-3">
                      Technologies
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {service.tech.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-ktf-gray-300 bg-ktf-white px-3 py-1 text-caption font-medium text-ktf-gray-700"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-ktf-navy py-24">
        <Container size="md" className="text-center">
          <h2 className="text-h2 font-bold leading-heading text-ktf-white mb-4">
            Have a Project in Mind?
          </h2>
          <p className="text-body-lg text-ktf-gray-400 leading-body max-w-lg mx-auto mb-10">
            Tell us about your challenge and we&apos;ll propose the right
            solution — honestly and without overselling.
          </p>
          <Button size="lg" href="/contact">
            Start the Conversation
          </Button>
        </Container>
      </section>
    </>
  );
}
