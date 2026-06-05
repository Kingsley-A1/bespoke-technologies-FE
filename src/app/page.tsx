import Image from "next/image";
import { Bot, Braces, Cloud, Globe, Palette, Smartphone } from "lucide-react";
import { Button } from "@/components/ui";
import { Container } from "@/components/layout";
import { HeroHeadline } from "@/components/marketing/hero-headline";
import { DeliveryConsole } from "@/components/marketing/delivery-console";
import { ProjectCard } from "@/components/marketing/projects-grid";
import {
  STATS,
  SERVICES,
  VALUES,
  TESTIMONIALS,
  PARTNERS,
  PROJECTS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} | ${SITE_TAGLINE}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
};

const homeProjects = PROJECTS.filter((project) => !project.comingSoon).slice(
  0,
  6,
);

interface ServiceIconProps {
  id: (typeof SERVICES)[number]["id"];
}

function ServiceIcon({ id }: ServiceIconProps) {
  const iconProps = {
    "aria-hidden": true,
    className: "h-6 w-6",
    strokeWidth: 1.9,
  } as const;

  switch (id) {
    case "web":
      return <Globe {...iconProps} />;
    case "mobile":
      return <Smartphone {...iconProps} />;
    case "cloud":
      return <Cloud {...iconProps} />;
    case "ai":
      return <Bot {...iconProps} />;
    case "api":
      return <Braces {...iconProps} />;
    case "design":
      return <Palette {...iconProps} />;
  }
}

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="home-hero-title"
        className="relative overflow-hidden border-b border-ktf-gray-200 bg-ktf-white pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24"
      >
        {/* Vercel-style line grid: visible structure without visual weight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(11,31,58,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,31,58,0.035) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "linear-gradient(to bottom, black 0%, black 62%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 62%, transparent 100%)",
          }}
        />

        {/* Fine blue guide lines for the hero focal area */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-[0.22]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(10,132,255,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,132,255,0.045) 1px, transparent 1px)",
            backgroundSize: "112px 112px",
            maskImage:
              "linear-gradient(to bottom, black 0%, transparent 82%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, transparent 82%)",
          }}
        />

        <Container size="xl" className="relative">
          <div
            id="delivery-system"
            className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(400px,0.82fr)] lg:items-start lg:gap-16"
          >
            {/* ── Left: Copy column ── */}
            <div className="max-w-2xl">

              {/* Eyebrow: live availability signal */}
              <div className="mb-8">
                <span className="inline-flex items-center gap-2.5 rounded-full border border-ktf-success/30 bg-ktf-success/8 px-4 py-1.5 text-caption font-semibold text-ktf-success">
                  <span
                    aria-hidden="true"
                    className="relative flex h-2 w-2 shrink-0"
                  >
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ktf-success opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-ktf-success" />
                  </span>
                  Accepting new projects · 3–4 week delivery
                </span>
              </div>

              {/* Headline — rotates through product category */}
              <HeroHeadline className="text-h2 font-bold leading-[1.06] tracking-tight sm:text-display lg:text-[4.25rem]" />

              {/* Sub-copy */}
              <p className="mt-6 max-w-lg text-balance text-body-lg leading-body text-ktf-gray-600 sm:mt-7">
                From strategy to launch, we design, build, and ship
                production-grade digital products with the discipline and craft
                serious businesses demand.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  href="/contact"
                  className="w-full bg-ktf-blue-deep hover:bg-ktf-blue-pressed sm:w-auto"
                >
                  Start a Project
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className="ml-2 h-4 w-4 shrink-0"
                  >
                    <path
                      fill="currentColor"
                      d="M8.9 3.2 13.6 8l-4.7 4.8-1.1-1.1 2.7-2.8H2.4V7.1h8.1L7.8 4.3z"
                    />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  href="/projects"
                  className="w-full border-ktf-gray-300 text-ktf-navy hover:border-ktf-gray-400 hover:bg-ktf-surface sm:w-auto"
                >
                  See Delivered Work
                </Button>
              </div>

              {/* Social proof strip — always visible */}
              <div
                aria-label="Client satisfaction summary"
                className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2.5 sm:mt-9"
              >
                <div className="flex items-center gap-1.5">
                  <span className="flex gap-0.5" aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <svg
                        key={i}
                        viewBox="0 0 16 16"
                        className="h-3.5 w-3.5 fill-ktf-warning"
                        aria-hidden="true"
                      >
                        <path d="M8 1.1l1.75 3.55 3.92.57-2.84 2.77.67 3.9L8 9.77l-3.5 1.13.67-3.9L2.33 5.22l3.92-.57z" />
                      </svg>
                    ))}
                  </span>
                  <span className="text-body-sm font-semibold text-ktf-navy">
                    5.0
                  </span>
                  <span className="text-body-sm text-ktf-gray-500">
                    · rated by every client
                  </span>
                </div>

                <span
                  aria-hidden="true"
                  className="hidden h-4 w-px bg-ktf-gray-200 sm:block"
                />

                <span className="text-body-sm text-ktf-gray-500">
                  <strong className="font-semibold text-ktf-navy">14+</strong>{" "}
                  projects shipped
                </span>

                <span
                  aria-hidden="true"
                  className="hidden h-4 w-px bg-ktf-gray-200 sm:block"
                />

                <span className="text-body-sm text-ktf-gray-500">
                  <strong className="font-semibold text-ktf-navy">99%</strong>{" "}
                  client satisfaction
                </span>
              </div>

              {/* Process signature — single line, confident */}
              <p className="mt-5 text-body-sm text-ktf-gray-400">
                Strategy · UX · Build · Launch · Handover — full ownership, start to finish.
              </p>
            </div>

            {/* ── Right: Delivery console (desktop) ── */}
            <DeliveryConsole className="hidden lg:block" />
          </div>

          {/* ── Mobile: Console below copy ── */}
          <div className="mt-10 lg:hidden">
            <DeliveryConsole />
          </div>
        </Container>
      </section>
      {/* ── Accomplished Works ───────────────────────────────── */}
      <section
        id="home-projects"
        className="relative overflow-hidden bg-white py-24 sm:py-32"
      >
        {/* Straight-line grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.28]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(10,132,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(10,132,255,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "linear-gradient(to bottom, black 0%, black 58%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 58%, transparent 100%)",
          }}
        />

        <Container size="lg" className="relative">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <p className="text-overline font-bold uppercase tracking-[0.2em] mb-3 text-ktf-blue">
                Our Projects
              </p>
              <h2 className="text-h2 sm:text-h1 font-bold leading-display text-ktf-navy">
                Accomplished
                <br />
                <span className="text-ktf-blue">Works.</span>
              </h2>
              <p className="mt-4 text-body-lg text-ktf-gray-600 leading-body max-w-md">
                Products shipped. Startups launched. Problems solved. This is
                what engineering excellence looks like.
              </p>
            </div>
            <Button
              href="/projects"
              variant="outline"
              className="border-ktf-blue/30 text-ktf-blue hover:bg-ktf-blue/10 hover:border-ktf-blue/50 shrink-0"
            >
              View Full Projects →
            </Button>
          </div>
        </Container>

        <Container size="lg">
          <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 lg:gap-8">
            {homeProjects.map((project) => (
              <ProjectCard key={project.id} project={project} compact />
            ))}
          </div>
        </Container>
      </section>
      {/* ── Stats Strip ──────────────────────────────────────── */}{" "}
      <section className="bg-ktf-navy py-16">
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
      {/* ── Services Overview ─────────────────────────────────── */}
      <section className="bg-ktf-white py-24 sm:py-32">
        <Container size="lg">
          <div className="text-center mb-16">
            <p className="text-overline font-semibold uppercase tracking-widest text-ktf-blue mb-3">
              Our Expertise
            </p>
            <h2 className="text-h2 font-bold leading-heading text-ktf-navy">
              Full-Spectrum Digital Engineering
            </h2>
            <p className="mt-4 text-body-lg text-ktf-gray-600 max-w-xl mx-auto">
              From concept to deployment, we cover every layer of the modern
              technology stack.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
                <a
                  key={service.id}
                  href={`/services#${service.id}`}
                  className="group block rounded-2xl border border-ktf-blue-300 bg-ktf-surface p-8 transition-all duration-200 hover:border-ktf-blue/40 hover:shadow-card-hover"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-ktf-blue/10 text-ktf-blue">
                    <ServiceIcon id={service.id} />
                  </div>
                  <h3 className="text-h5 font-semibold text-ktf-navy mb-2">
                    {service.title}
                  </h3>
                  <p className="text-body-sm text-ktf-gray-600 leading-body mb-4">
                    {service.tagline}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {service.tech.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-ktf-gray-200 px-3 py-0.5 text-caption font-medium text-ktf-gray-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </a>
              ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="outline" href="/services">
              View All Services
            </Button>
          </div>
        </Container>
      </section>
      {/* ── Why Bespoke Technologies ─────────────────────────── */}
      <section className="bg-ktf-surface py-24 sm:py-32">
        <Container size="lg">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-overline font-semibold uppercase tracking-widest text-ktf-blue mb-3">
                Why Bespoke Technologies
              </p>
              <h2 className="text-h2 font-bold leading-heading text-ktf-navy mb-6">
                Built on Principle. Delivered with Precision.
              </h2>
              <p className="text-body-lg text-ktf-gray-600 leading-body mb-8">
                We are not a vendor. We are a partner. Every engagement starts
                with understanding your vision and ends with software that
                lasts.
              </p>
              <Button href="/about">Learn About Our Values</Button>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {VALUES.slice(0, 4).map((value) => (
                <div
                  key={value.id}
                  className="rounded-xl border border-ktf-gray-200 bg-ktf-white p-6"
                >
                  <div className="text-h4 mb-3">{value.icon}</div>
                  <h3 className="text-h5 font-semibold text-ktf-navy mb-1">
                    {value.title}
                  </h3>
                  <p className="text-body-sm text-ktf-gray-600 leading-body">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
      {/* ── Partners ─────────────────────────────────────────── */}
      <section className="bg-ktf-white py-20">
        <Container size="lg">
          <p className="text-center text-body-sm font-medium uppercase tracking-widest text-ktf-gray-400 mb-10">
            Trusted by &amp; built on world-class technology
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
            {PARTNERS.map((partner) => (
              <span
                key={partner.name}
                className="text-h5 font-semibold text-ktf-gray-400 transition-colors duration-150 hover:text-ktf-gray-600"
              >
                {partner.name}
              </span>
            ))}
          </div>
        </Container>
      </section>
      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="bg-ktf-surface py-24 sm:py-32">
        <Container size="lg">
          <div className="text-center mb-16">
            <p className="text-overline font-semibold uppercase tracking-widest text-ktf-blue mb-3">
              Client Stories
            </p>
            <h2 className="text-h2 font-bold leading-heading text-ktf-navy">
              What Our Clients Say
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.author}
                className="flex flex-col rounded-2xl border border-ktf-gray-200 bg-ktf-white p-6 shadow-card"
              >
                <div
                  className="flex gap-1 mb-4"
                  aria-label={`${t.rating} out of 5 stars`}
                >
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i} className="text-ktf-warning text-body-sm">
                      ★
                    </span>
                  ))}
                </div>
                <blockquote className="flex-1 text-body-sm text-ktf-gray-700 leading-body mb-6">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ktf-blue text-caption font-bold text-ktf-white">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-body-sm font-semibold text-ktf-navy">
                      {t.author}
                    </p>
                    <p className="text-caption text-ktf-gray-500">
                      {t.role}, {t.company}
                    </p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="outline" href="/reviews">
              Read All Reviews
            </Button>
          </div>
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
      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-ktf-navy py-24 sm:py-32">
        <Container size="md" className="text-center">
          <h2 className="text-h2 font-bold leading-heading text-ktf-white mb-4">
            Ready to Build Something Exceptional?
          </h2>
          <p className="text-body-lg text-ktf-gray-400 leading-body max-w-xl mx-auto mb-10">
            Let&apos;s discuss your project. Our team is ready to transform your
            vision into a production-grade reality.
          </p>
          <Button size="lg" href="/contact">
            Get in Touch
          </Button>
        </Container>
      </section>
    </>
  );
}
