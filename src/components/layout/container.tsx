import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "main";
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

const sizeMap: Record<string, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  "2xl": "max-w-[1440px]",
  full: "max-w-full",
};

export function Container({
  children,
  className,
  as: Tag = "div",
  size = "xl",
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto box-border w-full px-4 sm:px-6 lg:px-8",
        sizeMap[size],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
