import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Design System",
  description:
    "Bespoke Technologies living style guide — design tokens, colours, typography, and UI components.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
