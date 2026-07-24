import { describe, expect, it } from "vitest";
import {
  circularWindow,
  logicalMobileIndex,
} from "./hero-phone-showcase";

describe("hero phone circular rotation", () => {
  it("always fills a desktop trio by wrapping to earlier projects", () => {
    expect(circularWindow(["A", "B", "C", "D"], 3, 3)).toEqual([
      "D",
      "A",
      "B",
    ]);
    expect(circularWindow(["A", "B"], 1, 3)).toEqual(["B", "A", "B"]);
    expect(circularWindow(["A"], 0, 3)).toEqual(["A", "A", "A"]);
  });

  it("maps cloned mobile edges back to the real circular project indexes", () => {
    expect(logicalMobileIndex(0, 4)).toBe(3);
    expect(logicalMobileIndex(1, 4)).toBe(0);
    expect(logicalMobileIndex(4, 4)).toBe(3);
    expect(logicalMobileIndex(5, 4)).toBe(0);
  });
});
