import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrowserFrameProps {
  /** Address shown in the frame's location bar. */
  url?: string;
  /** The rendered page surface (a product screenshot or a UI composition). */
  children: React.ReactNode;
  className?: string;
}

/**
 * A thin, calm browser chrome used to present a product surface with a
 * professional, engineered first impression. Purely presentational — the
 * children can be a real screenshot (`next/image`) or a composed UI.
 */
export function BrowserFrame({
  url = "bespoketech.com.ng",
  children,
  className,
}: BrowserFrameProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-ktf-gray-200 bg-white shadow-card",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-ktf-gray-100 bg-white px-3.5 py-3">
        <span className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-ktf-gray-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-ktf-gray-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-ktf-gray-200" />
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-ktf-gray-100 bg-ktf-surface px-3 py-1.5">
          <Lock className="h-3 w-3 shrink-0 text-ktf-gray-400" aria-hidden="true" />
          <span className="truncate text-[11px] font-medium text-ktf-gray-500">
            {url}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
