import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BESPOKE_AI_OPEN_HREF } from "@/lib/constants";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("next/dynamic", () => ({
  default: () =>
    function PanelStub({ mode }: { mode: string }) {
      return <div data-testid="bespoke-ai-panel" data-mode={mode} />;
    },
}));
vi.mock("./bespoke-ai-panel", () => ({ BespokeAIPanel: () => null }));

import { BespokeAILauncher } from "./bespoke-ai-launcher";

/** Clicks a link and reports whether the launcher claimed it, without letting jsdom navigate. */
function clickLink(text: string, init: MouseEventInit = {}) {
  let claimed = false;
  const record = (event: Event) => {
    claimed = event.defaultPrevented;
    event.preventDefault();
  };
  document.addEventListener("click", record);
  act(() => {
    screen.getByText(text).dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init }));
  });
  document.removeEventListener("click", record);
  return claimed;
}

function mockViewport(desktop: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: desktop && query.includes("min-width: 1024px"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

describe("BespokeAILauncher", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/");
    mockViewport(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the side panel in place when an Ask Bespoke AI link is clicked", () => {
    render(
      <>
        <a href={BESPOKE_AI_OPEN_HREF}>Ask Bespoke AI</a>
        <BespokeAILauncher />
      </>,
    );
    expect(screen.queryByTestId("bespoke-ai-panel")).not.toBeInTheDocument();

    expect(clickLink("Ask Bespoke AI")).toBe(true);
    expect(screen.getByTestId("bespoke-ai-panel")).toHaveAttribute("data-mode", "panel");
  });

  it("leaves modified clicks alone so the link can open in a new tab", () => {
    render(
      <>
        <a href={BESPOKE_AI_OPEN_HREF}>Ask Bespoke AI</a>
        <BespokeAILauncher />
      </>,
    );
    expect(clickLink("Ask Bespoke AI", { metaKey: true })).toBe(false);
    expect(screen.queryByTestId("bespoke-ai-panel")).not.toBeInTheDocument();
  });

  it("opens the mobile sheet when the page loads with ?ask=ai and cleans the address", () => {
    mockViewport(false);
    window.history.replaceState(null, "", "/?ask=ai&ref=old#top");

    render(<BespokeAILauncher />);

    expect(screen.getByRole("dialog", { name: "Bespoke AI" })).toBeInTheDocument();
    expect(screen.getByTestId("bespoke-ai-panel")).toHaveAttribute("data-mode", "sheet");
    expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe("/?ref=old#top");
  });

  it("does not intercept other links", () => {
    render(
      <>
        <a href="/contact">Contact</a>
        <BespokeAILauncher />
      </>,
    );
    expect(clickLink("Contact")).toBe(false);
    expect(screen.queryByTestId("bespoke-ai-panel")).not.toBeInTheDocument();
  });
});
