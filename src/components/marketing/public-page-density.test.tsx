import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({ alt = "", ...props }: {
    alt?: string;
    fill?: boolean;
    unoptimized?: boolean;
    [key: string]: unknown;
  }) => {
    const { fill, unoptimized, ...imageProps } = props;
    void fill;
    void unoptimized;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={alt} {...imageProps} />
    );
  },
}));

vi.mock("@/features/admin/team/repository", () => ({
  listPublishedTeamMembersSafe: async () => [
    {
      id: "member-1",
      slug: "sample-member",
      fullName: "Sample Member",
      roleTitle: "Engineer",
      teamGroup: "engineering",
      shortBio: "Builds dependable digital products.",
      specialties: [],
      links: {},
      portraitAlt: "Sample Member portrait",
      cardVariant: "blueprint",
      displayOrder: 1,
      status: "published",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
}));

vi.mock("@/features/admin/portfolio/repository", () => ({
  listPublishedPortfolioProjectsSafe: async () => [],
}));

vi.mock("@/features/admin/site-assets/repository", () => ({
  listSiteAssetsSafe: async () => ({}),
}));

vi.mock("@/components/marketing/hero-headline", () => ({
  HeroHeadline: ({ className }: { className?: string }) => (
    <h1 className={className}>Homepage promise</h1>
  ),
}));

vi.mock("@/components/marketing/hero-phone-showcase", () => ({
  HeroPhoneShowcase: () => <div>Project showcase</div>,
}));

vi.mock("@/components/marketing/motion-reveal", () => ({
  Reveal: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

import TeamPage from "@/app/team/page";
import { HomeHero } from "./home-hero";

describe("public page density", () => {
  it("keeps Team headings polished without oversized display type", async () => {
    render(await TeamPage());

    expect(screen.getByRole("heading", { level: 1 })).toHaveClass(
      "text-[2.25rem]",
      "sm:text-[3.5rem]",
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveClass("text-[1.375rem]");
    expect(screen.getByRole("heading", { level: 3 })).toHaveClass("text-[1.375rem]");
  });

  it("starts the homepage hero closer to the public header", async () => {
    const { container } = render(await HomeHero());
    const hero = container.querySelector("section[aria-labelledby='home-hero-title']");

    expect(hero).toHaveClass("pt-5", "sm:pt-6", "lg:pt-8");
  });
});
