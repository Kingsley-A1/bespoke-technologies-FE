import Image from "next/image";
import Link from "next/link";

export function LearnHome({ publishedCourseCount }: { publishedCourseCount: number }) {
  const hasPublishedCourses = publishedCourseCount > 0;

  return (
    <>
      <section className="border-b border-ktf-gray-200 bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] lg:items-center lg:gap-16">
          <div>
            <Image src="/learn/brand/bespoke-learn-lockup.png" alt="Bespoke Learn" width={1070} height={680} className="h-auto w-52 max-w-full sm:w-64" priority />
            <p className="mt-10 text-sm font-semibold uppercase tracking-[0.16em] text-ktf-blue">Learning by Bespoke Technologies</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.045em] text-ktf-navy sm:text-5xl">Practical technology learning, structured for real work.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-ktf-gray-600 sm:text-lg">Clear explanations, deliberate practice and thoughtful reflection—designed to help people develop useful technology capability.</p>
            <div className="mt-8">
              <Link href="/courses" className="inline-flex min-h-12 items-center justify-center rounded-md bg-ktf-blue px-5 text-sm font-semibold text-white hover:bg-ktf-blue-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ktf-blue">
                {hasPublishedCourses ? "Explore courses" : "View course catalogue"}
              </Link>
            </div>
          </div>
          <aside className="border-l-2 border-ktf-blue bg-ktf-surface p-7 sm:p-9" aria-label="Catalogue status">
            <p className="text-sm font-semibold text-ktf-blue">Catalogue status</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-ktf-navy">{hasPublishedCourses ? "Reviewed courses are available" : "Courses are reviewed before they appear"}</h2>
            <p className="mt-3 leading-7 text-ktf-gray-600">{hasPublishedCourses ? "Browse the current catalogue to see the learning opportunities that are ready to begin." : "There are no reviewed courses available yet. The platform is ready for a reviewed course to be published."}</p>
          </aside>
        </div>
      </section>
      <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8 sm:py-20" aria-labelledby="learn-approach-title">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ktf-blue">The learning approach</p>
        <h2 id="learn-approach-title" className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] text-ktf-navy">Orient. Explain. Demonstrate. Do. Reflect.</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ktf-gray-600">Every course is designed as a focused sequence, with meaningful learner action and feedback where it helps understanding.</p>
      </section>
    </>
  );
}
