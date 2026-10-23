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
import { SectionHeading } from "@/components/marketing/section-heading";
import { ProjectCard } from "@/components/marketing/projects-grid";
import { BookCard, HandoverCard } from "@/components/marketing/publication-cards";
import { listPublishedPublicationsSafe } from "@/features/admin/publications/repository";
import { listPublishedPortfolioProjectsSafe } from "@/features/admin/portfolio/repository";
import { NewsCard } from "@/features/news/components/news-cards";
import { listLatestNewsSafe } from "@/features/news/repository";
import {
  BESPOKE_AI_OPEN_HREF,
  ENGAGEMENT_PATHS,
  PARTNERS,
  PRODUCT_OUTCOMES,
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
  const [handovers, books, projects, latestNews] = await Promise.all([
    listPublishedPublicationsSafe("handover"),
    listPublishedPublicationsSafe("book"),
    listPublishedPortfolioProjectsSafe(),
    listLatestNewsSafe(3),
  ]);
  const homeHandovers = handovers.slice(0, 3);
  const homeBooks = books.slice(0, 3);
  const homeProjects = projects.filter((project) => !project.comingSoon).slice(0, 6);

  return (
    <>
      <HomeHero />

      {/* What we build — the capability grid comes first, as Stripe leads with its products. */}
      <section aria-labelledby="home-capabilities" className="bg-white py-20 sm:py-28">
        <Container size="lg">
          <SectionHeading
            id="home-capabilities"
            title="Everything a product needs to ship."
            lead="Strategy, design, engineering, cloud and AI from one accountable team."
            action={
              <Button href="/services" variant="outline" className="rounded-full">
                Explore services
              </Button>
            }
          />

          <StaggerGroup className="mt-12 grid gap-px overflow-hidden rounded-xl border border-ktf-gray-200 bg-ktf-gray-200 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <StaggerItem key={service.id} className="h-full">
                <Link
                  href={`/services#${service.id}`}
                  className="group flex h-full flex-col sm:min-h-[230px] bg-white p-6 transition-colors duration-200 hover:bg-ktf-surface sm:p-7"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-ktf-gray-200 bg-white text-ktf-navy transition-colors duration-200 group-hover:border-ktf-blue/30 group-hover:text-ktf-blue-deep">
                      <ServiceIcon id={service.id} />
                    </span>
                    <ArrowRight className="h-4 w-4 text-ktf-gray-400 transition-all duration-200 group-hover:translate-x-1 group-hover:text-ktf-blue-deep" />
                  </div>
                  <h3 className="mt-7 text-h5 font-semibold tracking-[-0.02em] text-ktf-obsidian">{service.title}</h3>
                  <p className="mt-2 text-body-sm leading-body text-ktf-gray-600">{service.tagline}</p>
                  <p className="mt-auto pt-6 text-[12px] tabular-nums text-ktf-gray-500">{service.tech.slice(0, 3).join(" · ")}</p>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </section>

      <section id="home-projects" aria-labelledby="home-projects-title" className="border-t border-ktf-gray-200 bg-ktf-surface py-20 sm:py-28">
        <Container size="lg">
          <SectionHeading
            id="home-projects-title"
            title="Products shipped. Problems solved."
            lead="A selection of the products we have delivered."
            action={
              <Button href="/projects" variant="outline" className="rounded-full bg-white">
                View all projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            }
          />

          <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 lg:gap-8">
            {homeProjects.map((project) => (
              <ProjectCard key={project.id} project={project} compact />
            ))}
          </div>
        </Container>
      </section>

      <section aria-labelledby="home-process" className="bg-white py-20 sm:py-28">
        <Container size="lg">
          <SectionHeading
            id="home-process"
            title="From product brief to production-ready."
            lead="One team from the first decision to the handover."
          />

          <div className="mt-12 overflow-hidden rounded-xl border border-ktf-gray-200 bg-white">
            <div className="grid lg:grid-cols-[0.84fr_1.16fr]">
              <Reveal className="border-b border-ktf-gray-200 bg-ktf-navy p-7 text-white sm:p-9 lg:border-r lg:border-b-0">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-md bg-white/10 text-ktf-blue">
                      <ShieldCheck className="h-6 w-6" />
                    </span>
                    <h3 className="mt-7 text-h3 font-semibold leading-tight tracking-[-0.03em]">
                      Built for launch.
                      <br />
                      Structured for ownership.
                    </h3>
                    <p className="mt-4 max-w-md text-body-sm leading-body text-ktf-gray-400">
                      Product judgment, UX, engineering, security, and deployment move through one connected delivery
                      system.
                    </p>
                  </div>

                  <div className="mt-10 border-t border-white/10 pt-5">
                    <p className="text-caption font-semibold uppercase tracking-[0.16em] text-ktf-gray-500">Handover standard</p>
                    <p className="mt-2 text-body-sm font-semibold text-white">Codebase · Documentation · Deployment</p>
                  </div>
                </div>
              </Reveal>

              <StaggerGroup className="divide-y divide-ktf-gray-200">
                {PRODUCT_OUTCOMES.map((outcome, index) => (
                  <StaggerItem key={outcome.id}>
                    <div className="group flex gap-5 p-6 sm:gap-7 sm:p-8">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ktf-gray-200 text-caption tabular-nums font-medium text-ktf-gray-600">
                        0{index + 1}
                      </span>
                      <div>
                        <h3 className="text-h5 font-semibold tracking-[-0.02em] text-ktf-obsidian">{outcome.title}</h3>
                        <p className="mt-2 max-w-xl text-body-sm leading-body text-ktf-gray-600">{outcome.description}</p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </div>
          </div>

          <div className="mt-20 sm:mt-24">
            <SectionHeading
              title="Three steps."
              lead="One route to production."
              action={
                <Button variant="outline" href="/services" className="rounded-full">
                  See our delivery process
                </Button>
              }
            />
            <DeliverySteps />
          </div>
        </Container>
      </section>

      <section className="bg-ktf-navy py-14 sm:py-16">
        <Container size="lg">
          <AnimatedStats />
        </Container>
      </section>

      <section aria-labelledby="home-engagements" className="bg-white py-20 sm:py-28">
        <Container size="lg">
          <SectionHeading
            id="home-engagements"
            title="Choose the right way to build."
            lead="Each path is scoped around outcomes and ownership."
            action={
              <>
                <Button href="/contact" className="rounded-full">
                  Discuss your product
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button href="/services" variant="outline" className="rounded-full">
                  Compare services
                </Button>
              </>
            }
          />

          <StaggerGroup className="mt-12 grid border-y border-ktf-gray-200 lg:grid-cols-3">
            {ENGAGEMENT_PATHS.map((engagement, index) => (
              <StaggerItem key={engagement.id} className="h-full">
                <article
                  className={`flex h-full flex-col py-8 lg:px-8 ${
                    index > 0 ? "border-t border-ktf-gray-200 lg:border-t-0 lg:border-l" : ""
                  }`}
                >
                  <span className="text-caption tabular-nums font-medium text-ktf-gray-500">0{index + 1}</span>
                  <h3 className="mt-4 text-h4 font-semibold tracking-[-0.025em] text-ktf-obsidian">{engagement.title}</h3>
                  <p className="mt-3 text-body-sm leading-body text-ktf-gray-600">{engagement.description}</p>
                  <dl className="mt-8 space-y-4">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ktf-gray-500">Best for</dt>
                      <dd className="mt-1 text-body-sm font-medium text-ktf-navy">{engagement.bestFor}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ktf-gray-500">Typical path</dt>
                      <dd className="mt-1 text-body-sm font-medium text-ktf-navy">{engagement.path}</dd>
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

      <section aria-labelledby="home-team" className="border-t border-ktf-gray-200 bg-ktf-surface py-20 sm:py-24">
        <Container size="lg">
          <div className="grid gap-10 lg:grid-cols-[0.62fr_1.38fr] lg:items-center">
            <Reveal>
              <h2 id="home-team" className="text-[1.6rem] font-semibold leading-[1.18] tracking-[-0.035em] text-ktf-obsidian sm:text-[2rem]">
                The people accountable for the product.
              </h2>
              <p className="mt-4 text-body leading-body text-ktf-gray-600">
                A focused engineering and product team working across strategy, experience, systems and launch.
              </p>
              <ul className="mt-7 space-y-3">
                {["Direct communication", "Production-minded decisions", "Clear ownership from start to handover"].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-3 text-body-sm font-medium text-ktf-navy">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ktf-success/10 text-ktf-success">
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </span>
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="relative overflow-hidden rounded-xl border border-ktf-gray-200">
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

      {latestNews.length > 0 && (
        <section aria-labelledby="home-news" className="bg-white py-20 sm:py-28">
          <Container size="lg">
            <SectionHeading
              id="home-news"
              title="What's new at Bespoke."
              lead="Announcements, product updates and project notes."
              action={
                <Button href="/news" variant="outline" className="rounded-full">
                  See all news
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              }
            />
            <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestNews.map((post) => (
                <li key={post.id}>
                  <NewsCard post={post} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {homeHandovers.length > 0 && (
        <section aria-labelledby="home-handovers" className="border-t border-ktf-gray-200 bg-white py-20 sm:py-28">
          <Container size="lg">
            <SectionHeading
              id="home-handovers"
              title="Every build is documented and handed over."
              lead="These are previews; the documents stay private to each client."
              action={
                <Button href="/library" variant="outline" className="rounded-full">
                  View the library
                </Button>
              }
            />
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {homeHandovers.map((publication) => (
                <HandoverCard key={publication.id} publication={publication} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {homeBooks.length > 0 && (
        <section aria-labelledby="home-books" className="border-t border-ktf-gray-200 bg-ktf-surface py-20 sm:py-28">
          <Container size="lg">
            <SectionHeading
              id="home-books"
              title="Written by the Bespoke team."
              lead="Practical books on shipping production software."
              action={
                <Button href="/library" variant="outline" className="rounded-full bg-white">
                  Browse all books
                </Button>
              }
            />
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {homeBooks.map((publication) => (
                <BookCard key={publication.id} publication={publication} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <section className="border-t border-ktf-gray-200 bg-white py-12">
        <Container size="lg">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
            <p className="text-caption font-medium text-ktf-gray-500">Built on dependable technology</p>
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3" role="list">
              {PARTNERS.map((partner) => (
                <li key={partner.name} className="text-body-sm font-semibold text-ktf-gray-500">
                  {partner.name}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section className="relative overflow-hidden bg-ktf-navy py-20 sm:py-24">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(10,132,255,0.2),transparent_34%),radial-gradient(circle_at_20%_100%,rgba(145,110,255,0.1),transparent_30%)]"
        />
        <Container size="lg" className="relative">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <SectionHeading
              tone="dark"
              title="Ready to move from idea to production?"
              lead="Tell us what you are building."
            />
            <Reveal className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button size="lg" href="/contact" className="rounded-full bg-white text-ktf-navy hover:bg-ktf-gray-100">
                Contact us
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                href={BESPOKE_AI_OPEN_HREF}
                className="rounded-full border-white/25 text-white hover:border-white/40 hover:bg-white/10"
              >
                <BespokeAIIcon className="mr-2 h-4 w-4 text-white" inverse />
                Ask Bespoke AI
              </Button>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
