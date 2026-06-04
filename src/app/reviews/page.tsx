import { Button, Badge } from "@/components/ui";
import { TypingText } from "@/components/ui/typing-text";
import { Container } from "@/components/layout";
import { TESTIMONIALS, STATS, SITE_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Reviews — ${SITE_NAME}`,
  description: `Read what clients say about working with ${SITE_NAME}. Real feedback from real projects.`,
};

export default function ReviewsPage() {
  const averageRating =
    TESTIMONIALS.reduce((sum, t) => sum + t.rating, 0) / TESTIMONIALS.length;

  return (
    <>
      {/* ── Page Hero ─────────────────────────────────────────── */}
      <section className="bg-ktf-navy py-16 sm:py-20">
        <Container size="lg" className="text-center">
          <Badge
            variant="outline"
            className="border-ktf-blue/40 text-ktf-blue bg-ktf-blue/10 mb-6"
          >
            Client Reviews
          </Badge>
          <h1 className="text-h1 font-bold leading-heading text-ktf-white max-w-3xl mx-auto mb-4">
            Words from Those{" "}
            <TypingText text="We Serve" className="text-ktf-blue" />
          </h1>
          <p className="text-body-lg text-ktf-gray-400 leading-body max-w-2xl mx-auto">
            Our reputation is built on results. Here is what our clients say
            about working with Bespoke Technologies.
          </p>
        </Container>
      </section>

      {/* ── Rating Summary ───────────────────────────────────── */}
      <section className="bg-ktf-obsidian py-16">
        <Container size="lg">
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            <div className="text-center">
              <dt className="text-body-sm font-medium text-ktf-gray-500 uppercase tracking-widest">
                Average Rating
              </dt>
              <dd className="mt-2 text-h2 font-bold text-ktf-white leading-none">
                {averageRating.toFixed(1)}/5
              </dd>
            </div>
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

      {/* ── Reviews Grid ─────────────────────────────────────── */}
      <section className="bg-ktf-surface py-24 sm:py-32">
        <Container size="lg">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {TESTIMONIALS.map((testimonial) => (
              <figure
                key={testimonial.author}
                className="flex flex-col rounded-2xl border border-ktf-gray-200 bg-ktf-white p-8 shadow-card"
              >
                {/* Stars */}
                <div
                  className="flex gap-1 mb-6"
                  aria-label={`${testimonial.rating} out of 5 stars`}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-body ${
                        i < testimonial.rating
                          ? "text-ktf-warning"
                          : "text-ktf-gray-300"
                      }`}
                      aria-hidden="true"
                    >
                      ★
                    </span>
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="flex-1 mb-8">
                  <p className="text-body text-ktf-gray-700 leading-body">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                </blockquote>

                {/* Author */}
                <figcaption className="flex items-center gap-4 border-t border-ktf-gray-100 pt-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ktf-blue text-body-sm font-bold text-ktf-white">
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="text-body font-semibold text-ktf-navy">
                      {testimonial.author}
                    </p>
                    <p className="text-body-sm text-ktf-gray-500">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-ktf-navy py-24">
        <Container size="md" className="text-center">
          <h2 className="text-h2 font-bold leading-heading text-ktf-white mb-4">
            Ready to Add Your Story?
          </h2>
          <p className="text-body-lg text-ktf-gray-400 leading-body max-w-lg mx-auto mb-10">
            Join our growing list of satisfied clients. Let&apos;s build
            something you&apos;ll be proud to talk about.
          </p>
          <Button size="lg" href="/contact">
            Start Your Project
          </Button>
        </Container>
      </section>
    </>
  );
}
