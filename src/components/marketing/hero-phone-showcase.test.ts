import { describe, expect, it } from "vitest";
import {
  logicalSlideIndex,
  SLIDE_ROTATE_INTERVAL_MS,
  SCREEN_REVEAL_DELAY_MS,
  SCREEN_REVEAL_DURATION_MS,
} from "./hero-phone-showcase";

describe("hero phone circular rotation", () => {
  it("maps cloned edge slides back to the real circular project indexes", () => {
    expect(logicalSlideIndex(0, 4)).toBe(3);
    expect(logicalSlideIndex(1, 4)).toBe(0);
    expect(logicalSlideIndex(4, 4)).toBe(3);
    expect(logicalSlideIndex(5, 4)).toBe(0);
  });

  it("reveals the product screen before advancing to the next project", () => {
    expect(SCREEN_REVEAL_DELAY_MS).toBeGreaterThanOrEqual(1000);
    expect(
      SCREEN_REVEAL_DELAY_MS + SCREEN_REVEAL_DURATION_MS,
    ).toBeLessThan(SLIDE_ROTATE_INTERVAL_MS);
    expect(SLIDE_ROTATE_INTERVAL_MS).toBeGreaterThanOrEqual(3000);
    expect(SLIDE_ROTATE_INTERVAL_MS).toBeLessThanOrEqual(5000);
  });
});
