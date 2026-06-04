/**
 * Bespoke Technologies — Button Component
 *
 * Production-grade button with Bespoke Technologies design system variants.
 * Renders as <a> via Next.js Link when `href` is provided.
 */

import { type ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  /** When provided, renders as a Next.js <Link> instead of <button> */
  href?: string;
}

const variantStyles: Record<string, string> = {
  primary:
    "bg-ktf-blue text-white hover:bg-ktf-blue-deep active:bg-ktf-blue-pressed focus-visible:ring-2 focus-visible:ring-ktf-blue/40",
  secondary:
    "bg-white text-ktf-obsidian border border-ktf-gray-300 hover:bg-ktf-surface active:bg-ktf-gray-200",
  ghost:
    "bg-transparent text-ktf-blue hover:bg-ktf-blue/8 active:bg-ktf-blue/12",
  outline:
    "bg-transparent border border-ktf-gray-300 text-ktf-navy hover:bg-ktf-surface hover:border-ktf-gray-400 active:bg-ktf-gray-200",
};

const sizeStyles: Record<string, string> = {
  sm: "h-8 px-3 text-sm rounded-md",
  md: "h-10 px-5 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      href,
      ...props
    },
    ref,
  ) => {
    const classes = cn(
      "inline-flex items-center justify-center font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
      variantStyles[variant],
      sizeStyles[size],
      className,
    );

    if (href) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
