import Link from "next/link";
import type { AccessDecision } from "../entitlements";
import type { PublishedCourseDetail } from "../course-delivery";

function primaryAction(course: PublishedCourseDetail, access: AccessDecision) {
  if (access.allowed) {
    return {
      href: `/courses/${course.slug}/learn`,
      label: access.mode === "preview" ? "Start preview" : "Continue course",
    };
  }
  if (access.reason === "sign_in_required") return { href: "/sign-in", label: "Sign in" };
  if (access.reason === "access_required" || access.reason === "revoked" || access.reason === "expired") {
    return { href: `/support?course=${encodeURIComponent(course.slug)}`, label: "Request access" };
  }
  return { href: "/courses", label: "View courses" };
}

export function CourseDetail({ course, access }: { course: PublishedCourseDetail; access: AccessDecision }) {
  const action = primaryAction(course, access);
  const structuredData = JSON.stringify({ "@context": "https://schema.org", "@type": "Course", name: course.title, description: course.summary, provider: { "@type": "Organization", name: "Bespoke Technologies", url: "https://www.bespoketech.com.ng" } }).replace(/</g, "\\u003c");
  return (
    <article className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ktf-blue">Bespoke Learn · Version {course.versionNumber}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-[-0.045em] text-ktf-navy sm:text-5xl">{course.title}</h1>
          <p className="mt-5 max-w-2xl break-words text-lg leading-8 text-ktf-gray-700">{course.summary}</p>
          <Link href={action.href} className="mt-7 inline-flex min-h-12 items-center justify-center rounded-md bg-ktf-blue px-5 text-sm font-semibold text-white hover:bg-ktf-blue-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ktf-blue">{action.label}</Link>
          {!access.allowed && access.reason !== "unavailable" && <p className="mt-3 text-sm leading-6 text-ktf-gray-600">{access.reason === "sign_in_required" ? "Sign in to check your access." : "Access is managed individually for this course."}</p>}
        </div>
        <aside className="rounded-xl border border-ktf-gray-200 bg-white p-5 text-sm leading-6 text-ktf-gray-700">
          <h2 className="font-semibold text-ktf-navy">Course details</h2>
          <dl className="mt-4 space-y-3">
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-ktf-gray-500">Version</dt><dd>Version {course.versionNumber}</dd></div>
            {course.reviewedAt && <div><dt className="text-xs font-semibold uppercase tracking-wide text-ktf-gray-500">Reviewed</dt><dd>{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(course.reviewedAt))}</dd></div>}
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-ktf-gray-500">Authors</dt><dd>{course.authors.map((author) => author.displayName).join(", ") || "To be confirmed"}</dd></div>
            {course.commitment && <div><dt className="text-xs font-semibold uppercase tracking-wide text-ktf-gray-500">Commitment</dt><dd>{course.commitment}</dd></div>}
            {course.formats.length > 0 && <div><dt className="text-xs font-semibold uppercase tracking-wide text-ktf-gray-500">Formats</dt><dd>{course.formats.join(", ")}</dd></div>}
          </dl>
        </aside>
      </div>

      <section className="mt-14 max-w-3xl" aria-labelledby="course-description">
        <h2 id="course-description" className="text-2xl font-bold tracking-[-0.03em] text-ktf-navy">About this course</h2>
        <p className="mt-4 break-words whitespace-pre-wrap leading-7 text-ktf-gray-700">{course.description}</p>
      </section>

      {(course.outcomes.length > 0 || course.audience || course.prerequisites.length > 0) && <section className="mt-14 grid max-w-4xl gap-6 sm:grid-cols-2" aria-label="Course suitability and outcomes">
        {course.outcomes.length > 0 && <div className="rounded-lg border border-ktf-gray-200 bg-white p-5"><h2 className="text-xl font-bold tracking-[-0.02em] text-ktf-navy">What you will work toward</h2><ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-ktf-gray-700">{course.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul></div>}
        <div className="rounded-lg border border-ktf-gray-200 bg-white p-5">
          {course.audience && <div><h2 className="text-xl font-bold tracking-[-0.02em] text-ktf-navy">Who it is for</h2><p className="mt-3 text-sm leading-6 text-ktf-gray-700">{course.audience}</p></div>}
          {course.prerequisites.length > 0 && <div className={course.audience ? "mt-6" : ""}><h2 className="text-xl font-bold tracking-[-0.02em] text-ktf-navy">Before you begin</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ktf-gray-700">{course.prerequisites.map((prerequisite) => <li key={prerequisite}>{prerequisite}</li>)}</ul></div>}
        </div>
      </section>}

      <section className="mt-14 max-w-3xl" aria-labelledby="course-outline">
        <h2 id="course-outline" className="text-2xl font-bold tracking-[-0.03em] text-ktf-navy">Module outline</h2>
        <ol className="mt-5 space-y-3">
          {course.modules.map((module) => (
            <li key={module.id} className="rounded-lg border border-ktf-gray-200 bg-white p-5">
              <h3 className="font-semibold text-ktf-navy">{module.sortOrder + 1}. {module.title}</h3>
              {module.summary && <p className="mt-2 text-sm leading-6 text-ktf-gray-600">{module.summary}</p>}
              <p className="mt-3 text-sm text-ktf-gray-600">{module.lessons.length} {module.lessons.length === 1 ? "lesson" : "lessons"}</p>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
