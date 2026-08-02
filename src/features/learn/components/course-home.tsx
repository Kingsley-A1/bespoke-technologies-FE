import Link from "next/link";
import type { PublishedCourseDetail } from "../course-delivery";

type LessonProgress = { lessonId: string; state: "not_started" | "in_progress" | "completed" };

function flattenLessons(course: PublishedCourseDetail) {
  return course.modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id, moduleTitle: module.title })));
}

export function CourseHome({ course, progress, deniedReason }: { course: PublishedCourseDetail; progress: readonly LessonProgress[]; deniedReason?: "unavailable" | "sign_in_required" | "access_required" | "revoked" | "expired" }) {
  if (deniedReason) {
    return (
      <section className="mx-auto w-full max-w-2xl px-5 py-16 sm:px-8">
        <div className="rounded-xl border border-ktf-gray-200 bg-white p-7 sm:p-9">
          <p className="text-sm font-semibold text-ktf-blue">Bespoke Learn</p>
          <h1 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-ktf-navy">Course access is unavailable</h1>
          <p className="mt-4 leading-7 text-ktf-gray-700">{deniedReason === "revoked" ? "Your access to this course has been revoked." : deniedReason === "expired" ? "Your access to this course has expired." : "Your account does not currently have access to this course."}</p>
          <Link href={`/support?course=${encodeURIComponent(course.slug)}`} className="mt-6 inline-flex min-h-11 items-center rounded-md bg-ktf-blue px-4 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ktf-blue">Contact support</Link>
        </div>
      </section>
    );
  }

  const states = new Map(progress.map((item) => [item.lessonId, item.state]));
  const lessons = flattenLessons(course);
  const current = lessons.find((lesson) => states.get(lesson.id) === "in_progress") ?? lessons.find((lesson) => states.get(lesson.id) !== "completed");
  const nextLessonId = current ? lessons[lessons.findIndex((lesson) => lesson.id === current.id) + 1]?.id : undefined;
  const completedCount = lessons.filter((lesson) => states.get(lesson.id) === "completed").length;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ktf-blue">{course.title} · Version {course.versionNumber}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-ktf-navy sm:text-4xl">Your course</h1>
        <p className="mt-3 text-sm leading-6 text-ktf-gray-600">{completedCount} of {lessons.length} lessons complete</p>
      </div>

      {current ? (
        <section className="mt-8 rounded-xl border border-ktf-blue/25 bg-white p-6 shadow-card sm:p-7" aria-labelledby="continue-heading">
          <p className="text-sm font-semibold text-ktf-blue">Continue learning</p>
          <h2 id="continue-heading" className="mt-2 text-2xl font-bold tracking-[-0.03em] text-ktf-navy">{current.title}</h2>
          <p className="mt-2 text-sm leading-6 text-ktf-gray-700">{current.objective}</p>
          <Link href={`/courses/${course.slug}/lessons/${current.slug}`} className="mt-5 inline-flex min-h-12 items-center rounded-md bg-ktf-blue px-5 text-sm font-semibold text-white hover:bg-ktf-blue-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ktf-blue">Continue</Link>
        </section>
      ) : <p className="mt-8 rounded-lg border border-ktf-gray-200 bg-white p-6 text-sm text-ktf-gray-700">All configured lesson requirements are complete.</p>}

      <section className="mt-10" aria-labelledby="module-map-heading">
        <h2 id="module-map-heading" className="text-2xl font-bold tracking-[-0.03em] text-ktf-navy">Module map</h2>
        <div className="mt-5 space-y-4">
          {course.modules.map((module) => (
            <section key={module.id} className="rounded-lg border border-ktf-gray-200 bg-white p-5">
              <h3 className="font-semibold text-ktf-navy">{module.sortOrder + 1}. {module.title}</h3>
              <ol className="mt-4 space-y-3">
                {module.lessons.map((lesson) => {
                  const state = states.get(lesson.id) ?? "not_started";
                  const label = state === "completed" ? "Completed" : state === "in_progress" ? "In progress" : current?.id === lesson.id || nextLessonId === lesson.id ? "Next" : "Not started";
                  return <li key={lesson.id} className="flex items-center justify-between gap-4 rounded-md bg-ktf-surface px-4 py-3"><span><span className="block text-sm font-medium text-ktf-navy">{lesson.title}</span><span className="mt-1 block text-xs text-ktf-gray-600">{lesson.estimatedMinutes} minutes · {label}</span></span><span className="text-xs font-semibold text-ktf-gray-700">{label}</span></li>;
                })}
              </ol>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}
