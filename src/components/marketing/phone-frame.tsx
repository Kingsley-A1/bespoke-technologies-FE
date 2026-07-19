import { cn } from "@/lib/utils";

interface PhoneFrameProps {
  /** The screen content — an admin-set screenshot or a composed fallback UI. */
  children: React.ReactNode;
  className?: string;
  screenClassName?: string;
}

/**
 * A calm, modern phone chrome used to present product surfaces. Purely
 * presentational: a dark bezel, rounded screen, and a floating island —
 * no decorative noise so the screen content carries the story.
 */
export function PhoneFrame({ children, className, screenClassName }: PhoneFrameProps) {
  return (
    <div
      className={cn(
        "rounded-[2.6rem] border border-ktf-gray-300/60 bg-ktf-obsidian p-[7px] shadow-2xl",
        className,
      )}
    >
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
    </div>
  );
}
