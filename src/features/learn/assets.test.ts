import { describe, expect, it } from "vitest";
import { validateLearnAssetMetadata } from "./assets";

describe("Learn asset metadata", () => {
  it("blocks a meaningful image from publication when alternative text is missing", () => {
    expect(validateLearnAssetMetadata({
      filename: "diagram.png",
      mimeType: "image/png",
      byteSize: 1200,
      decorative: false,
    })).toMatchObject({ valid: false, errors: [expect.stringMatching(/alternative text/i)] });
  });

  it("accepts an accessible protected download with stable delivery metadata", () => {
    expect(validateLearnAssetMetadata({
      filename: "worksheet.pdf",
      mimeType: "application/pdf",
      byteSize: 1200,
      decorative: false,
    })).toEqual({ valid: true, errors: [] });
  });
});
