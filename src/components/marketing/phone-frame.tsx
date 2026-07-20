import { cn } from "@/lib/utils";

interface PhoneFrameProps {
  /** The screen content — an admin-set screenshot or a composed fallback UI. */
  children: React.ReactNode;
  className?: string;
  screenClassName?: string;
  /** Live project URL — when set, the whole frame becomes a link to it. */
  href?: string;
  /** Accessible name for the link. Required when `href` is set. */
  label?: string;
}

/**
 * A calm, modern phone chrome used to present product surfaces. Purely
 * presentational: a dark bezel, rounded screen, and a floating island —
 * no decorative noise so the screen content carries the story. When `href`
 * is provided the frame renders as a link to the live project.
 */
export function PhoneFrame({ children, className, screenClassName, href, label }: PhoneFrameProps) {
  const frameClassName = cn(
    "block rounded-[2.6rem] border border-ktf-gray-300/60 bg-ktf-obsidian p-[7px] shadow-2xl",
    href &&
      "outline-none focus-visible:ring-4 focus-visible:ring-ktf-blue/40 focus-visible:ring-offset-2",
    className,
  );

  const screen = (
    <div
      className={cn(
        "relative aspect-[9/19] overflow-hidden rounded-[2.2rem] bg-white",
        screenClassName,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-2.5 z-10 h-[17px] w-[70px] -translate-x-1/2 rounded-full bg-ktf-obsidian"
      />
      {children}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={frameClassName}
      >
        {screen}
      </a>
    );
  }

  return <div className={frameClassName}>{screen}</div>;
}
