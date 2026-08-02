import Image from "next/image";
import Link from "next/link";

export function LearnPublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-ktf-white text-ktf-obsidian">
      <a href="#learn-main" className="sr-only rounded-md bg-ktf-navy px-4 py-3 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">Skip to main content</a>
      <header className="border-b border-ktf-gray-200 bg-white">
        <nav className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8" aria-label="Bespoke Learn navigation">
          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-md text-ktf-navy outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ktf-blue">
            <Image src="/learn/brand/bespoke-learn-mark.png" alt="" width={42} height={32} className="h-8 w-auto" priority />
            <span className="text-base font-semibold tracking-[-0.02em]">Bespoke Learn</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-4">
            <Link href="/courses" className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-ktf-gray-700 hover:text-ktf-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">Courses</Link>
            <Link href="/support" className="hidden min-h-11 items-center rounded-md px-3 text-sm font-medium text-ktf-gray-700 hover:text-ktf-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue sm:inline-flex">Support</Link>
            <Link href="/sign-in" className="inline-flex min-h-11 items-center rounded-md bg-ktf-blue px-4 text-sm font-semibold text-white hover:bg-ktf-blue-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">Sign in</Link>
          </div>
        </nav>
      </header>
      <main id="learn-main" className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t border-ktf-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 text-sm text-ktf-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Learning from Bespoke Technologies.</p>
          <div className="flex items-center gap-4">
            <Link href="/support" className="rounded-sm hover:text-ktf-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">Support</Link>
            <a href="https://bespoketech.com.ng/privacy" className="rounded-sm hover:text-ktf-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">Privacy</a>
            <a href="https://bespoketech.com.ng/terms" className="rounded-sm hover:text-ktf-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ktf-blue">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
