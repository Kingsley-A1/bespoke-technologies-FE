export function HeroHeadline({ className }: { className?: string }) {
  return (
    <h1 id="home-hero-title" className={className}>
      <span className="sr-only">
        Launch secure, production-ready software your business can own.
      </span>

      <span aria-hidden="true" className="block text-ktf-navy">
        <span className="block">Launch secure,</span>
        <span className="block text-ktf-blue-deep">
          production-ready software
        </span>
        <span className="block">your business can own.</span>
      </span>
    </h1>
  );
}
