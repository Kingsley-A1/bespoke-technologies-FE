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
  title: `${SITE_NAME} - ${SITE_TAGLINE}`,
  description: SITE_DESCRIPTION,
};

const heroMetrics = [
  { value: "14+", label: "Projects delivered" },
  { value: "99%", label: "Client satisfaction" },
  { value: "2+", label: "Years delivering" },
] as const;

const homeProjects = PROJECTS.filter((project) => !project.comingSoon).slice(
  0,
  6,
);

const heroFlowLinks = [
  { label: "Delivery system", href: "#delivery-system" },
  { label: "Projects", href: "#home-projects" },
  { label: "Start", href: "/contact" },
] as const;

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

function FlowArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 shrink-0"
    >
      <path
        fill="currentColor"
        d="M8.9 3.2 13.6 8l-4.7 4.8-1.1-1.1 2.7-2.8H2.4V7.1h8.1L7.8 4.3z"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="home-hero-title"
        className="relative overflow-hidden border-b border-ktf-gray-200 bg-linear-to-b from-ktf-surface via-ktf-white to-ktf-white pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-20"
      >
        {/* Subtle neutral grid, fading into the white content band */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #0b1f3a 1px, transparent 1px), linear-gradient(to bottom, #0b1f3a 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />

        <Container size="xl" className="relative">
          <svg
            aria-hidden="true"
            viewBox="0 0 140 260"
            className="pointer-events-none absolute left-[48%] top-12 hidden h-64 w-36 text-ktf-blue/35 lg:block"
          >
            <path
              d="M14 38 C72 34 80 80 126 78"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="4 6"
            />
            <path
              d="M118 72 128 78 116 84"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M125 146 C78 150 76 204 18 210"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="4 6"
            />
            <path
              d="M27 202 16 210 29 216"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div
            id="delivery-system"
            className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.9fr)] lg:items-start lg:gap-12"
          >
            <div className="max-w-2xl lg:pt-1">
              <HeroHeadline className="text-h2 font-bold leading-[1.08] tracking-tight text-ktf-navy sm:text-display lg:text-[4rem]" />

              <p className="mt-5 max-w-xl text-balance text-body-lg leading-tight text-ktf-gray-700 sm:mt-6 sm:text-h5">
                Websites, apps, SaaS, and AI systems built to make your business
                look ready.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  href="/contact"
                  className="w-full bg-ktf-blue-deep hover:bg-ktf-blue-pressed sm:w-auto"
                >
                  Start a Project
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

              <nav
                aria-label="Hero delivery flow"
                className="mt-5 sm:mt-6"
              >
                <ol className="grid max-w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                  <li className="min-w-0">
                    <span className="inline-flex max-w-full items-center rounded-full border border-ktf-gray-200 bg-white px-3 py-1.5 text-caption font-semibold text-ktf-navy shadow-xs">
                      Value
                    </span>
                  </li>
                  {heroFlowLinks.map((link) => (
                    <li
                      key={link.href}
                      className="inline-flex min-w-0 items-center gap-1.5 text-ktf-blue-deep"
                    >
                      <FlowArrowIcon />
                      <a
                        href={link.href}
                        className="inline-flex max-w-full items-center whitespace-nowrap rounded-full border border-ktf-blue/20 bg-white px-3 py-1.5 text-caption font-semibold text-ktf-blue-deep shadow-xs transition-colors hover:border-ktf-blue/50 hover:bg-ktf-blue/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>

              <p className="mt-4 text-body-sm font-medium text-ktf-gray-500">
                Strategy, UX, build, launch, handover.
              </p>

              {/* Compact proof — keeps the strongest trust signal above the fold on mobile */}
              <div className="mt-8 rounded-2xl border border-ktf-gray-200 bg-white p-4 shadow-xs lg:hidden">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-caption font-bold uppercase tracking-widest text-ktf-gray-500">
                    Proof of delivery
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-ktf-success/30 bg-ktf-success/10 px-2 py-0.5 text-caption font-semibold text-ktf-success">
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-ktf-success"
                    />
                    Live work
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-3">
                  {heroMetrics.map((metric) => (
                    <div key={metric.label}>
                      <dt className="sr-only">{metric.label}</dt>
                      <dd>
                        <span className="block text-h5 font-bold leading-none text-ktf-navy">
                          {metric.value}
                        </span>
                        <span className="mt-1 block text-[11px] leading-tight text-ktf-gray-500">
                          {metric.label}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <DeliveryConsole className="hidden lg:block" />
          </div>
        </Container>
      </section>
      {/* ── Accomplished Works ───────────────────────────────── */}
      <section
        id="home-projects"
        className="relative overflow-hidden bg-white py-24 sm:py-32"
      >
        {/* Blue dot grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #0a84ff 1px, transparent 0)",
            backgroundSize: "32px 32px",
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
