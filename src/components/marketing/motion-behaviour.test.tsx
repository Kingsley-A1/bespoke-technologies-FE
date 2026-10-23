import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CountUp, parseCountValue } from "./count-up";
import { StaggerGroup } from "./stagger-group";

class MockObserver {
  static instances: MockObserver[] = [];
  constructor(public callback: IntersectionObserverCallback) {
    MockObserver.instances.push(this);
  }
  observe() {}
  disconnect() {}
}

function setMotionPreference(reduce: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce }) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  vi.restoreAllMocks();
  MockObserver.instances = [];
});

describe("StaggerGroup", () => {
  it("leaves groups that are on screen at load completely still", () => {
    setMotionPreference(false);
    vi.stubGlobal("IntersectionObserver", MockObserver);
    render(<StaggerGroup className="grid">x</StaggerGroup>);
    expect(screen.getByText("x").closest(".ktf-stagger")).toHaveAttribute("data-reveal", "static");
  });

  it("reveals a below-the-fold group once, when it scrolls into view", () => {
    setMotionPreference(false);
    vi.stubGlobal("IntersectionObserver", MockObserver);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: 5000 } as DOMRect);
    render(<StaggerGroup>y</StaggerGroup>);
    const group = screen.getByText("y").closest(".ktf-stagger")!;
    expect(group).toHaveAttribute("data-reveal", "pending");
    act(() => MockObserver.instances[0].callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(group).toHaveAttribute("data-reveal", "shown");
  });

  it("never hides content for visitors who prefer reduced motion", () => {
    setMotionPreference(true);
    vi.stubGlobal("IntersectionObserver", MockObserver);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: 5000 } as DOMRect);
    render(<StaggerGroup>z</StaggerGroup>);
    expect(screen.getByText("z").closest(".ktf-stagger")).toHaveAttribute("data-reveal", "static");
  });
});

describe("CountUp", () => {
  it("parses plain numbers with a suffix and rejects ranges", () => {
    expect(parseCountValue("18+")).toEqual({ target: 18, suffix: "+" });
    expect(parseCountValue("99%")).toEqual({ target: 99, suffix: "%" });
    expect(parseCountValue("3–4 Wks")).toBeNull();
  });

  it("always exposes the real value to assistive technology", () => {
    setMotionPreference(false);
    vi.stubGlobal("IntersectionObserver", MockObserver);
    render(<CountUp value="18+" />);
    expect(screen.getAllByText("18+")[0]).toHaveClass("sr-only");
  });
});
