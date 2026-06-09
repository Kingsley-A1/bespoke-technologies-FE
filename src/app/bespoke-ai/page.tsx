import type { Metadata } from "next";
import { BespokeAIPanel } from "@/components/ai";

export const metadata: Metadata = {
  title: "Bespoke AI",
  description:
    "Ask Bespoke AI about Bespoke Technologies services, projects, reviews, partnerships, and contact options.",
};

export default function BespokeAIPage() {
  return <BespokeAIPanel mode="page" />;
}
