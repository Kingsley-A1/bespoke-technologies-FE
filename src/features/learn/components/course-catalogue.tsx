import Link from "next/link";
import type { PublishedCourseSummary } from "../repository";

export function CourseCatalogue({ courses, query = "" }: { courses: readonly PublishedCourseSummary[]; query?: string }) {
  return (
    <section aria-labelledby="course-catalogue-title" className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-ktf-blue">Bespoke Learn</p>
        <h1 id="course-catalogue-title" className="mt-3 text-3xl font-bold tracking-[-0.035em] text-ktf-navy sm:text-4xl">Courses</h1>
        <p className="mt-3 text-base leading-7 text-ktf-gray-600">Structured learning designed for practical technology capability.</p>
      </div>
      <form className="mt-7 flex max-w-xl gap-2" role="search">
        <label className="sr-only" htmlFor="course-search">Search reviewed courses</label>
        <input id="course-search" name="q" type="search" defaultValue={query} placeholder="Search reviewed courses" className="min-h-11 min-w-0 flex-1 rounded-md border border-ktf-gray-300 bg-white px-3 text-sm text-ktf-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue" />
        <button type="submit" className="inline-flex min-h-11 items-center rounded-md border border-ktf-blue/30 px-4 text-sm font-semibold text-ktf-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">Search</button>
      </form>
      {courses.length === 0 ? (
        <div className="mt-10 max-w-2xl rounded-xl border border-dashed border-ktf-gray-300 bg-white p-7 sm:p-9">
          <h2 className="text-lg font-semibold text-ktf-navy">Reviewed courses will appear here</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-ktf-gray-600">{query ? "No reviewed course matches that search yet." : "Bespoke Learn is preparing its first reviewed learning experience. There are no courses to start yet."}</p>
        </div>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2" aria-label="Published courses">
          {courses.map((course) => (
            <li key={course.versionId}>
              <Link href={`/courses/${course.slug}`} className="block rounded-xl border border-ktf-gray-200 bg-white p-6 transition hover:border-ktf-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ktf-blue">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ktf-blue">Version {course.versionNumber}</p>
                <h2 className="mt-3 text-xl font-semibold text-ktf-navy">{course.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ktf-gray-600">{course.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
