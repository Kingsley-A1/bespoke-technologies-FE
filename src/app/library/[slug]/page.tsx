import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { ShareButton } from "@/components/ui/share-button";
import { getPublishedPublicationBySlugSafe } from "@/features/admin/publications/repository";
import { SITE_NAME } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const publication = await getPublishedPublicationBySlugSafe(slug);
  if (!publication) return { title: "Library" };

  const description = publication.summary ?? `A publication from the ${SITE_NAME} team.`;
  const base: Metadata = {
    title: publication.title,
    description,
    alternates: { canonical: `/library/${publication.slug}` },
  };

  // Books and research are public content — give shared links a real cover
  // card. Handover pages keep the default site metadata.
  if (publication.isDownloadable && publication.coverKey) {
    const ogImage = absoluteUrl(`/api/publications/${publication.id}/cover`);
    return {
      ...base,
      openGraph: {
        type: "article",
        title: `${publication.title} | ${SITE_NAME}`,
        description,
        images: [{ url: ogImage, alt: `Cover of ${publication.title}` }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${publication.title} | ${SITE_NAME}`,
        description,
        images: [ogImage],
      },
    };
  }
  return base;
}

export default async function PublicationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const publication = await getPublishedPublicationBySlugSafe(slug);
  if (!publication) notFound();

  const readable = publication.isDownloadable; // books + research only

  return (
    <section className="bg-ktf-surface py-8 sm:py-10">
      <Container size="lg">
        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-ktf-gray-500 transition hover:text-ktf-navy"
        >
          <ArrowLeft className="h-4 w-4" /> Back to library
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[320px_1fr] lg:gap-12">
          {/* Cover + metadata */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-xl border border-ktf-gray-200 bg-white shadow-card">
              <div className="relative aspect-[3/4] bg-ktf-navy">
                {publication.coverKey ? (
                  <Image
                    src={`/api/publications/${publication.id}/cover`}
                    alt={`Cover of ${publication.title}`}
                    fill
                    sizes="320px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/40">
                    <ShieldCheck className="h-12 w-12" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ktf-blue-deep">
                  {publication.kind === "handover"
                    ? "Client handover"
                    : publication.kind === "book"
                      ? "Book"
                      : "Research"}
                </p>
                <h1 className="mt-2 text-h5 font-bold leading-snug text-ktf-navy">
                  {publication.title}
                </h1>
                {publication.authorLabel && (
                  <p className="mt-1 text-body-sm text-ktf-gray-500">By {publication.authorLabel}</p>
                )}
                <dl className="mt-4 space-y-2 border-t border-ktf-gray-100 pt-4 text-caption">
                  {publication.pageCount ? (
                    <div className="flex justify-between">
                      <dt className="text-ktf-gray-500">Pages</dt>
                      <dd className="font-semibold text-ktf-navy">{publication.pageCount}</dd>
                    </div>
                  ) : null}
                  {publication.kind === "book" && (
                    <div className="flex justify-between">
                      <dt className="text-ktf-gray-500">Price</dt>
                      <dd className="font-semibold text-ktf-navy">
                        {publication.isFree ? "Free" : `${publication.priceCurrency} ${publication.priceAmount}`}
                      </dd>
                    </div>
                  )}
                  {publication.clientLabel && (
                    <div className="flex justify-between">
                      <dt className="text-ktf-gray-500">Client</dt>
                      <dd className="font-semibold text-ktf-navy">{publication.clientLabel}</dd>
                    </div>
                  )}
                </dl>

                {readable && (
                  <>
                    <a
                      href={`/library/${publication.slug}/file?download=1`}
                      className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-ktf-blue-deep text-body-sm font-semibold text-white transition hover:bg-ktf-blue-pressed"
                    >
                      <Download className="h-4 w-4" /> Download PDF
                    </a>
                    <ShareButton
                      title={`${publication.title} — ${SITE_NAME}`}
                      text={publication.summary}
                      url={`/library/${publication.slug}`}
                      className="mt-3 h-10 w-full justify-center rounded-lg border border-ktf-gray-200 text-body-sm"
                    >
                      Share this {publication.kind === "book" ? "book" : "paper"}
                    </ShareButton>
                  </>
                )}
              </div>
            </div>
          </aside>

          {/* Reader or locked notice */}
          <div className="min-w-0">
            {publication.summary && (
              <p className="mb-6 max-w-2xl text-body-lg leading-body text-ktf-gray-700">
                {publication.summary}
              </p>
            )}

            {readable ? (
              <div className="overflow-hidden rounded-xl border border-ktf-gray-200 bg-white shadow-card">
                <iframe
                  src={`/library/${publication.slug}/file`}
                  title={`${publication.title} reader`}
                  className="h-[75vh] w-full"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-ktf-gray-200 bg-white p-8 shadow-card sm:p-10">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ktf-navy text-white">
                  <Lock className="h-6 w-6" />
                </span>
                <h2 className="mt-5 text-h5 font-bold text-ktf-navy">
                  This handover document stays private to the client.
                </h2>
                <p className="mt-3 max-w-xl text-body leading-body text-ktf-gray-600">
                  We&apos;re showing this to demonstrate that every Bespoke project
                  is documented and handed to its owner. The document itself
                  belongs to
                  {publication.clientLabel ? ` ${publication.clientLabel}` : " the client"} and
                  is not available to read or download here.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-ktf-blue/20 bg-ktf-blue/5 px-3 py-1.5 text-caption font-semibold text-ktf-blue-deep">
                  <ShieldCheck className="h-4 w-4" /> Delivered to client
                </div>
                <div className="mt-8">
                  <Button href="/contact">Start a documented project</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
