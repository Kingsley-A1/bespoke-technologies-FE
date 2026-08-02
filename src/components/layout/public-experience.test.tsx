import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ value: "/learn/courses" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
}));

vi.mock("@/components/ai", () => ({
  BespokeAILauncher: () => <div data-testid="company-chat" />,
}));
vi.mock("@/components/pwa/install-prompt", () => ({
  InstallPrompt: () => <div data-testid="install-prompt" />,
}));
vi.mock("@/components/pwa/service-worker-registration", () => ({
  ServiceWorkerRegistration: () => <div data-testid="service-worker" />,
}));
vi.mock("./header", () => ({
  Header: () => <header aria-label="Company navigation" />,
}));
vi.mock("./footer", () => ({
  Footer: () => <footer>Company footer</footer>,
}));
vi.mock("./page-transition", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { PublicExperience } from "./public-experience";

describe("PublicExperience", () => {
  it("keeps internal Learn routes out of the company public shell", () => {
    pathname.value = "/learn/courses";
    render(<PublicExperience><div>Learn catalogue</div></PublicExperience>);

    expect(screen.getByText("Learn catalogue")).toBeVisible();
    expect(screen.queryByLabelText("Company navigation")).not.toBeInTheDocument();
    expect(screen.queryByText("Company footer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("company-chat")).not.toBeInTheDocument();
    expect(screen.queryByTestId("install-prompt")).not.toBeInTheDocument();
  });

  it("keeps source paths on the Learn hostname out of the company public shell", () => {
    pathname.value = "/";
    render(<PublicExperience isLearnHost><div>Learn home</div></PublicExperience>);

    expect(screen.getByText("Learn home")).toBeVisible();
    expect(screen.queryByLabelText("Company navigation")).not.toBeInTheDocument();
  });
});
