import type { ProjectType } from "@/types/portfolio";

/** The product word the headline names for each kind of delivered project. */
export function heroWordForProjectType(type?: ProjectType) {
  if (type === "mobile" || type === "ios" || type === "web+mobile") return "Mobile App";
  if (type === "desktop") return "Desktop App";
  return "Website";
}

/**
 * The hero promise. The product word is driven by the project currently on
 * stage in the phone carousel, so the headline and the device always agree.
 * The swap is a short CSS fade keyed on the word; no animation library.
 */
export function HeroHeadline({
  word,
  animate = false,
  className,
}: {
  word: string;
  /** False on first paint so the largest heading never fades in on load. */
  animate?: boolean;
  className?: string;
}) {
  return (
    <h1 id="home-hero-title" className={className}>
      <span className="sr-only">We do the engineering, you own the software.</span>
      <span aria-hidden="true" className="block text-balance text-ktf-navy">
        <span className="block whitespace-nowrap">We do the engineering,</span>
        <span className="block">
          you own the{" "}
          <span
            key={word}
            className={`${animate ? "ktf-word-swap " : ""}inline-block whitespace-nowrap text-ktf-blue-deep`}
          >
            {word}
          </span>
        </span>
      </span>
    </h1>
  );
}
