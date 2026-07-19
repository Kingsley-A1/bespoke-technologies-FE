import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/marketing/motion-reveal";
import {
  BookCard,
  HandoverCard,
  ResearchCard,
} from "@/components/marketing/publication-cards";
import { listPublishedPublicationsSafe } from "@/features/admin/publications/repository";
import { SITE_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Library",
  description: `Handover documentation, books, and research from the ${SITE_NAME} team.`,
  alternates: { canonical: "/library" },
};

export default async function LibraryPage() {
  const [handovers, books, research] = await Promise.all([
    listPublishedPublicationsSafe("handover"),
    listPublishedPublicationsSafe("book"),
    listPublishedPublicationsSafe("research"),
  ]);
  const isEmpty = handovers.length === 0 && books.length === 0 && research.length === 0;

  return (
    <>
      <section className="relative overflow-hidden border-b border-ktf-gray-200 bg-white py-10 sm:py-12 lg:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(10,132,255,0.08),transparent_60%)]"
        />
        <Container size="lg" className="relative">
          <Reveal className="max-w-3xl">
            <p className="text-overline font-bold uppercase tracking-[0.2em] text-ktf-blue-deep">
              Library
            </p>
            <h1 className="mt-5 text-[2.45rem] font-bold leading-[1.08] tracking-[-0.04em] text-ktf-navy sm:text-h1 lg:text-[3.4rem]">
              What we build, documented and shared.
            </h1>
            <p className="mt-6 max-w-2xl text-body-lg leading-body text-ktf-gray-600">
              Every project ends with a documented handover to its owner. Alongside
              that, our team publishes books and research on how we engineer
              production software.
            </p>
          </Reveal>
        </Container>
      </section>

      {isEmpty ? (
        <section className="bg-ktf-surface py-24 sm:py-32">
          <Container size="md" className="text-center">
            <h2 className="text-h4 font-bold text-ktf-navy">The library is being prepared.</h2>
            <p className="mx-auto mt-4 max-w-lg text-body leading-body text-ktf-gray-600">
              Handover documentation, books, and research from the team will appear
              here shortly.
            </p>
          </Container>
        </section>
      ) : (
        <>
          {handovers.length > 0 && (
            <LibrarySection
              id="handover"
              eyebrow="Client handovers"
              title="We document every build — and hand it to the owner."
              lede="A preview of the handover guides we produce for completed projects. The documents themselves stay private to each client."
              surface
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {handovers.map((publication) => (
                  <HandoverCard key={publication.id} publication={publication} />
                ))}
              </div>
            </LibrarySection>
          )}

          {books.length > 0 && (
            <LibrarySection
              id="books"
              eyebrow="Books"
              title="Written by the Bespoke team."
              lede="Practical books on building and shipping production software. Preview and download — free unless marked otherwise."
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {books.map((publication) => (
                  <BookCard key={publication.id} publication={publication} />
                ))}
              </div>
            </LibrarySection>
          )}

          {research.length > 0 && (
            <LibrarySection
              id="research"
              eyebrow="Research"
              title="How we think about the work."
              lede="Research and technical notes from the team. Read online or download the PDF."
              surface
            >
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {research.map((publication) => (
                  <ResearchCard key={publication.id} publication={publication} />
                ))}
              </div>
            </LibrarySection>
          )}
        </>
      )}
    </>
  );
}

function LibrarySection({
  id,
  eyebrow,
  title,
  lede,
  surface,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  lede: string;
  surface?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`${surface ? "bg-ktf-surface" : "bg-white"} scroll-mt-20 py-20 sm:py-24`}>
      <Container size="lg">
        <Reveal className="max-w-3xl">
          <p className="text-overline font-bold uppercase tracking-[0.2em] text-ktf-blue-deep">
            {eyebrow}
          </p>
          <h2 className="mt-4 text-h2 font-bold tracking-tight text-ktf-navy sm:text-h1">
            {title}
          </h2>
          <p className="mt-5 max-w-2xl text-body-lg leading-body text-ktf-gray-600">{lede}</p>
        </Reveal>
        <div className="mt-12">{children}</div>
      </Container>
    </section>
  );
}
