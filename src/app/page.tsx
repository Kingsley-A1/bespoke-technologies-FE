import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Bot,
  Braces,
  Check,
  Cloud,
  Globe,
  Palette,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { BespokeAIIcon } from "@/components/ai/bespoke-ai-icon";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { AnimatedStats } from "@/components/marketing/animated-stats";
import { HomeHero } from "@/components/marketing/home-hero";
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/marketing/motion-reveal";
import { DeliverySteps } from "@/components/marketing/delivery-steps";
import { ProjectCard } from "@/components/marketing/projects-grid";
import { BookCard, HandoverCard } from "@/components/marketing/publication-cards";
import { ShowcaseCarousel } from "@/components/marketing/showcase-carousel";
import { listPublishedPublicationsSafe } from "@/features/admin/publications/repository";
import {
  ENGAGEMENT_PATHS,
  PARTNERS,
  PRODUCT_OUTCOMES,
  PROJECTS,
  SERVICES,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from "@/lib/constants";

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
    className: "h-5 w-5",
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

export default async function HomePage() {
  const [handovers, books] = await Promise.all([
    listPublishedPublicationsSafe("handover"),
    listPublishedPublicationsSafe("book"),
  ]);
  const homeHandovers = handovers.slice(0, 3);
  const homeBooks = books.slice(0, 3);

  return (
    <>
      <HomeHero />

      <section
        aria-labelledby="home-showcase-title"
        className="bg-white py-16 sm:py-20"
      >
        <Container size="lg">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-overline font-bold uppercase tracking-[0.2em] text-ktf-blue-deep">
              In focus
            </p>
            <h2
              id="home-showcase-title"
              className="mt-3 text-h3 font-bold tracking-tight text-ktf-navy"
            >
              Built across every product surface.
            </h2>
            <p className="mt-3 text-body leading-body text-ktf-gray-600">
              Websites, mobile apps, AI, cloud, and business systems — delivered
              with the same production discipline.
            </p>
          </Reveal>

          <Reveal className="mx-auto mt-10 max-w-4xl" delay={0.06}>
            <ShowcaseCarousel />
          </Reveal>
        </Container>
      </section>

      <section className="relative overflow-hidden bg-ktf-surface py-20 sm:py-28">
        <Container size="lg">
          <Reveal className="max-w-3xl">
            <p className="text-overline font-bold uppercase tracking-[0.2em] text-ktf-blue-deep">
              Product outcome
            </p>
            <h2 className="mt-4 text-[2.2rem] font-bold leading-[1.08] tracking-[-0.04em] text-ktf-navy sm:text-h1">
              From product brief to production-ready.
            </h2>
            <p className="mt-5 max-w-2xl text-body-lg leading-body text-ktf-gray-600">
              One accountable team turns the right idea into a secure system
              your business can launch, operate, and own.
            </p>
          </Reveal>

          <div className="mt-12 overflow-hidden rounded-xl border border-ktf-gray-200 bg-white shadow-[0_12px_28px_-20px_rgba(11,31,58,0.3)]">
            <div className="grid lg:grid-cols-[0.84fr_1.16fr]">
              <Reveal className="border-b border-ktf-gray-200 bg-ktf-navy p-7 text-white sm:p-9 lg:border-r lg:border-b-0">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-md bg-white/10 text-ktf-blue">
                      <ShieldCheck className="h-6 w-6" />
                    </span>
                    <h3 className="mt-7 text-h3 font-bold leading-tight">
                      Built for launch.
                      <br />
                      Structured for ownership.
                    </h3>
                    <p className="mt-4 max-w-md text-body-sm leading-body text-ktf-gray-400">
                      Product judgment, UX, engineering, security, and
                      deployment move through one connected delivery system.
                    </p>
                  </div>

                  <div className="mt-10 border-t border-white/10 pt-5">
                    <p className="text-caption font-semibold uppercase tracking-[0.16em] text-ktf-gray-500">
                      Handover standard
                    </p>
                    <p className="mt-2 text-body-sm font-semibold text-white">
                      Codebase · Documentation · Deployment
                    </p>
                  </div>
                </div>
              </Reveal>

              <StaggerGroup className="divide-y divide-ktf-gray-200">
                {PRODUCT_OUTCOMES.map((outcome, index) => (
                  <StaggerItem key={outcome.id}>
                    <div className="group flex gap-5 p-6 sm:gap-7 sm:p-8">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ktf-blue/20 bg-ktf-blue/5 text-caption font-bold text-ktf-blue-deep">
                        0{index + 1}
                      </span>
                      <div>
                        <h3 className="text-h5 font-semibold text-ktf-navy">
                          {outcome.title}
                        </h3>
                        <p className="mt-2 max-w-xl text-body-sm leading-body text-ktf-gray-600">
                          {outcome.description}
                        </p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
          </div>

          <div className="mt-20 sm:mt-24">
            <Reveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-overline font-bold uppercase tracking-[0.2em] text-ktf-blue-deep">
                  How we work
                </p>
                <h2 className="mt-3 text-h2 font-bold tracking-tight text-ktf-navy">
                  Three steps. One route to production.
                </h2>
              </div>
              <Button variant="outline" href="/services">
                See Our Delivery Process
              </Button>
            </Reveal>

            <DeliverySteps />
          </div>
        </Container>
      </section>

      {homeHandovers.length > 0 && (
        <section className="bg-white py-20 sm:py-28">
          <Container size="lg">
            <Reveal className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-overline font-bold uppercase tracking-[0.2em] text-ktf-blue-deep">
                  Documented handovers
                </p>
                <h2 className="mt-4 text-h2 font-bold tracking-tight text-ktf-navy sm:text-h1">
                  We document every build and hand it to the owner.
                </h2>
                <p className="mt-5 max-w-2xl text-body-lg leading-body text-ktf-gray-600">
                  A preview of the handover guides we produce for completed
                  projects. The documents themselves stay private to each client.
                </p>
              </div>
              <Link
                href="/library"
                className="inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-ktf-blue-deep hover:text-ktf-blue-pressed"
              >
                View the library
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {homeHandovers.map((publication) => (
                <HandoverCard key={publication.id} publication={publication} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {homeBooks.length > 0 && (
        <section className="bg-ktf-surface py-20 sm:py-28">
          <Container size="lg">
            <Reveal className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-overline font-bold uppercase tracking-[0.2em] text-ktf-blue-deep">
                  Books
                </p>
                <h2 className="mt-4 text-h2 font-bold tracking-tight text-ktf-navy sm:text-h1">
                  Written by the Bespoke team.
                </h2>
                <p className="mt-5 max-w-2xl text-body-lg leading-body text-ktf-gray-600">
                  Practical books on building and shipping production software.
                  Preview and download from our library.
                </p>
              </div>
              <Link
                href="/library"
                className="inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-ktf-blue-deep hover:text-ktf-blue-pressed"
              >
                Browse all books
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {homeBooks.map((publication) => (
                <BookCard key={publication.id} publication={publication} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <section
        id="home-projects"
        className="relative overflow-hidden bg-white py-20 sm:py-28"
      >
        <Container size="lg">
          <Reveal className="max-w-2xl">
            <p className="text-overline font-bold uppercase tracking-[0.2em] text-ktf-blue-deep">
              Delivered work
            </p>
            <h2 className="mt-4 text-h2 font-bold tracking-tight text-ktf-navy sm:text-h1">
              Products shipped.
              <br />
              Problems solved.
            </h2>
            <p className="mt-4 max-w-xl text-body-lg leading-body text-ktf-gray-600">
              Explore customer experiences, business systems, and digital
              products built to move from idea to dependable operation.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 lg:gap-8">
            {homeProjects.map((project) => (
              <ProjectCard key={project.id} project={project} compact />
            ))}
          </div>

          <Reveal className="mt-12 flex justify-center">
            <Button
              size="lg"
              href="/projects"
              className="w-full bg-ktf-blue-deep hover:bg-ktf-blue-pressed sm:w-auto"
            >
              View All Projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Reveal>
        </Container>
      </section>

      <section className="bg-ktf-navy py-14 sm:py-16">
        <Container size="lg">
          <AnimatedStats />
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <Container size="lg">
          <Reveal className="max-w-3xl">
            <p className="text-overline font-bold uppercase tracking-[0.2em] text-ktf-blue-deep">
              Engineering capabilities
            </p>
            <h2 className="mt-4 text-h2 font-bold tracking-tight text-ktf-navy sm:text-h1">
              The disciplines required to ship the whole product.
            </h2>
            <p className="mt-5 max-w-2xl text-body-lg leading-body text-ktf-gray-600">
              Strategy, design, software engineering, cloud, and AI work as one
              delivery system instead of disconnected vendor handoffs.
            </p>
          </Reveal>

          <StaggerGroup className="mt-12 grid gap-px overflow-hidden rounded-xl border border-ktf-gray-200 bg-ktf-gray-200 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <StaggerItem key={service.id} className="h-full">
                <Link
                  href={`/services#${service.id}`}
                  className="group flex h-full min-h-[250px] flex-col bg-white p-6 transition-colors duration-200 hover:bg-ktf-blue/4 sm:p-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-md border border-ktf-blue/15 bg-ktf-blue/5 text-ktf-blue-deep transition-transform duration-200 group-hover:-translate-y-0.5">
                      <ServiceIcon id={service.id} />
                    </span>
                    <ArrowRight className="h-4 w-4 text-ktf-gray-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-ktf-blue-deep" />
                  </div>
                  <h3 className="mt-7 text-h5 font-semibold text-ktf-navy">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-body-sm leading-body text-ktf-gray-600">
                    {service.tagline}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-6 text-caption font-medium text-ktf-gray-500">
                    {service.tech.slice(0, 3).map((technology) => (
                      <span key={technology}>{technology}</span>
                    ))}
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <Container size="lg">
          <Reveal className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-overline font-bold uppercase tracking-[0.2em] text-ktf-blue-deep">
                Engagement paths
              </p>
              <h2 className="mt-4 text-h2 font-bold tracking-tight text-ktf-navy sm:text-h1">
                Choose the right way to build.
              </h2>
              <p className="mt-5 max-w-2xl text-body-lg leading-body text-ktf-gray-600">
                Start with the engagement that matches your product stage.
                Every path is scoped around outcomes, ownership, and a clear
                route to production.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="/contact">
                Discuss Your Product
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button href="/services" variant="outline">
                Compare Services
              </Button>
            </div>
          </Reveal>

          <StaggerGroup className="mt-12 grid border-y border-ktf-gray-200 lg:grid-cols-3">
            {ENGAGEMENT_PATHS.map((engagement, index) => (
              <StaggerItem key={engagement.id} className="h-full">
                <article
                  className={`flex h-full flex-col py-8 lg:px-8 ${
                    index > 0
                      ? "border-t border-ktf-gray-200 lg:border-t-0 lg:border-l"
                      : ""
                  }`}
                >
                  <span className="text-caption font-bold text-ktf-blue-deep">
                    0{index + 1}
                  </span>
                  <h3 className="mt-4 text-h4 font-semibold text-ktf-navy">
                    {engagement.title}
                  </h3>
                  <p className="mt-3 text-body-sm leading-body text-ktf-gray-600">
                    {engagement.description}
                  </p>
                  <dl className="mt-8 space-y-4">
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-ktf-gray-500">
                        Best for
                      </dt>
                      <dd className="mt-1 text-body-sm font-medium text-ktf-navy">
                        {engagement.bestFor}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-ktf-gray-500">
                        Typical path
                      </dt>
                      <dd className="mt-1 text-body-sm font-medium text-ktf-navy">
                        {engagement.path}
                      </dd>
                    </div>
                  </dl>
                  <Link
                    href="/contact"
                    className="mt-8 inline-flex min-h-11 items-center gap-2 text-body-sm font-semibold text-ktf-blue-deep hover:text-ktf-blue-pressed"
                  >
                    Scope this engagement
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </section>

      <section className="border-y border-ktf-gray-200 bg-ktf-surface py-14">
        <Container size="lg">
          <p className="text-center text-caption font-semibold uppercase tracking-[0.18em] text-ktf-gray-500">
            Built on dependable technology
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-3 sm:gap-x-4">
            {PARTNERS.map((partner) => (
              <span
                key={partner.name}
                className="rounded-md border border-ktf-gray-200 bg-white px-4 py-2 text-body-sm font-semibold text-ktf-gray-500 shadow-xs transition-colors hover:text-ktf-navy"
              >
                {partner.name}
              </span>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-white py-20 sm:py-24">
        <Container size="lg">
          <div className="grid gap-10 lg:grid-cols-[0.62fr_1.38fr] lg:items-center">
            <Reveal>
              <p className="text-overline font-bold uppercase tracking-[0.2em] text-ktf-blue-deep">
                The team
              </p>
              <h2 className="mt-4 text-h2 font-bold tracking-tight text-ktf-navy">
                The people accountable for the product.
              </h2>
              <p className="mt-4 text-body leading-body text-ktf-gray-600">
                A focused engineering and product team working across strategy,
                experience, systems, and launch.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Direct communication",
                  "Production-minded decisions",
                  "Clear ownership from start to handover",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-body-sm font-medium text-ktf-navy"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ktf-success/10 text-ktf-success">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="relative overflow-hidden rounded-xl border border-ktf-gray-200 shadow-xl">
                <Image
                  src="/Team/team.png"
                  alt="The Bespoke Technologies product and engineering team"
                  width={1200}
                  height={600}
                  className="aspect-[2/1] w-full object-cover"
                />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <section className="relative overflow-hidden bg-ktf-navy py-20 sm:py-24">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(10,132,255,0.2),transparent_34%),radial-gradient(circle_at_20%_100%,rgba(145,110,255,0.1),transparent_30%)]"
        />
        <Container size="md" className="relative text-center">
          <Reveal>
            <h2 className="text-h2 font-bold tracking-tight text-white sm:text-h1">
              Ready to move from idea to production?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-body-lg leading-body text-ktf-gray-400">
              Bring the product vision, business problem, or existing system.
              We will help define the clearest route to a secure, launch-ready
              product.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                href="/contact"
                className="bg-white text-ktf-navy hover:bg-ktf-gray-100"
              >
                Contact Us
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                href="/bespoke-ai"
                className="border-white/25 text-white hover:border-white/40 hover:bg-white/10"
              >
                <BespokeAIIcon className="mr-2 h-4 w-4 text-white" inverse />
                Ask Bespoke AI
              </Button>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
