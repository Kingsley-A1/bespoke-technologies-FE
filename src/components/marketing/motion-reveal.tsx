import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export { StaggerGroup } from "./stagger-group";

/**
 * Layout wrapper kept for existing call sites. Headings and copy are never
 * animated or hidden — readable text should be readable the moment it is on
 * screen — so this renders a plain container. `delay` and `y` are accepted
 * for compatibility and ignored.
 */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return <div className={className}>{children}</div>;
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("min-w-0", className)}>{children}</div>;
}
