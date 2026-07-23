import type { Metadata } from "next";
import { Container } from "@/components/layout";
import { PageHero } from "@/components/marketing/page-hero";
import { ProjectsGrid } from "@/components/marketing/projects-grid";
import { listPublishedPortfolioProjectsSafe } from "@/features/admin/portfolio/repository";
import { SITE_NAME } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Projects",
  description: `Explore the accomplished works of ${SITE_NAME} — web applications, mobile apps, and digital products built with precision and purpose.`,
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: `Our Projects — ${SITE_NAME}`,
    description:
      "From government portals to fashion platforms, explore the portfolio of engineering excellence we have delivered.",
    images: [
      {
        url: absoluteUrl("/icons/og.png"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Projects`,
      },
    ],
  },
};

export default async function ProjectsPage() {
  const projects = await listPublishedPortfolioProjectsSafe();
  const stats = [
    { value: String(projects.length) + "+", label: "Projects Delivered" },
    { value: String(projects.filter((p) => !p.comingSoon).length), label: "Live & Deployed" },
    { value: String(projects.filter((p) => p.comingSoon).length), label: "In Active Development" },
    { value: String(new Set(projects.map((p) => p.type)).size), label: "Platform Types Covered" },
  ] as const;
  return (
    <>
      <PageHero
        label="Projects"
        title="Products shipped with purpose."
        description="Explore production systems, customer experiences, and digital products engineered to solve real business problems."
        variant="projects"
        primaryAction={{ label: "View the Work", href: "#project-grid" }}
        secondaryAction={{ label: "Start a Project", href: "/contact" }}
      />

      <section className="border-b border-ktf-gray-200 bg-ktf-surface py-10">
        <Container size="lg">
          <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="border-l border-ktf-gray-300 pl-4">
                <dd className="text-h4 font-bold text-ktf-navy">{stat.value}</dd>
                <dt className="mt-1 text-caption uppercase tracking-widest text-ktf-gray-500">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* ── Projects grid ─────────────────────────────────────── */}
      <section id="project-grid" className="bg-ktf-white py-20 sm:py-28">
        <Container size="lg">
          <div className="mb-12">
            <h2 className="text-h2 font-bold text-ktf-navy mb-3">
              Our Portfolio
            </h2>
            <p className="text-body text-ktf-gray-600 leading-body max-w-2xl">
              Use the filters below to explore projects by platform type.
              Projects marked &quot;Coming Soon&quot; are currently in active
              development.
            </p>
          </div>

          <ProjectsGrid projects={projects} />
        </Container>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────── */}
      <section className="bg-ktf-navy py-20 sm:py-28">
        <Container size="md" className="text-center">
          <h2 className="text-h2 font-bold text-ktf-white mb-4">
            Ready to Build Something Exceptional?
          </h2>
          <p className="text-body-lg text-ktf-gray-400 leading-body mb-10 max-w-xl mx-auto">
            Your next project could be right here. Let&apos;s talk about what
            you&apos;re building.
          </p>
          <a
            href="/contact"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-ktf-blue px-8 text-body font-semibold text-white transition-colors duration-150 hover:bg-ktf-blue-deep"
          >
            Start a Project
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
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </Container>
      </section>
    </>
  );
}
