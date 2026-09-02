import { describe, expect, it } from "vitest";
import { TRUNCATION_MARKER, clampLines, wrapText, type TextMeasurer } from "./text-layout";

/** Every glyph is one unit wide, so `maxWidth` reads as a character count. */
const measurer: TextMeasurer = { widthOfTextAtSize: (text) => text.length };

describe("wrapText", () => {
  it("wraps on width without splitting words", () => {
    expect(wrapText("alpha beta gamma delta", measurer, 1, 12)).toEqual(["alpha beta", "gamma delta"]);
  });

  it("keeps the line breaks an author typed", () => {
    expect(wrapText("Bank: Sample\nAccount: 0000", measurer, 1, 40)).toEqual([
      "Bank: Sample",
      "Account: 0000",
    ]);
  });

  it("keeps a deliberate blank line between blocks", () => {
    expect(wrapText("First block\n\nSecond block", measurer, 1, 40)).toEqual([
      "First block",
      "",
      "Second block",
    ]);
  });

  it("handles carriage returns from pasted copy", () => {
    expect(wrapText("one\r\ntwo", measurer, 1, 40)).toEqual(["one", "two"]);
  });

  it("wraps each authored line independently", () => {
    expect(wrapText("alpha beta gamma\nshort", measurer, 1, 10)).toEqual(["alpha beta", "gamma", "short"]);
  });

  it("returns a single empty line for empty input", () => {
    expect(wrapText("", measurer, 1, 40)).toEqual([""]);
  });
});

describe("clampLines", () => {
  it("leaves content that fits completely untouched", () => {
    const lines = ["a", "b", "c"];
    expect(clampLines(lines, 40)).toEqual(lines);
  });

  it("marks the cut so a shortened document is never passed off as complete", () => {
    expect(clampLines(["a", "b", "c", "d"], 3)).toEqual(["a", "b", TRUNCATION_MARKER]);
  });
});
