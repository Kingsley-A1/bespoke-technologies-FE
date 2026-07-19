import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Design System",
  description:
    "Bespoke Technologies living style guide — design tokens, colours, typography, and UI components.",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * The design-system showcase is an internal reference. It is available during
 * local development but is not exposed on the production site.
 */
export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
