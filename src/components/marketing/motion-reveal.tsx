import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealStyle = CSSProperties & {
  "--ktf-reveal-delay"?: string;
  "--ktf-reveal-y"?: string;
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 18,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const style: RevealStyle = {
    "--ktf-reveal-delay": `${delay}s`,
    "--ktf-reveal-y": `${y}px`,
  };

  return (
    <div className={cn("ktf-reveal", className)} style={style}>
      {children}
    </div>
  );
}

export function StaggerGroup({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const style: RevealStyle = {
    "--ktf-reveal-delay": `${delay}s`,
  };

  return (
    <div className={cn("ktf-stagger", className)} style={style}>
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("min-w-0", className)}>{children}</div>;
}
