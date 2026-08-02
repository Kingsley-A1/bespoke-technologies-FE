import { describe, expect, it } from "vitest";
import { learnCanonicalUrl } from "./metadata";

describe("learnCanonicalUrl", () => {
  it("keeps public Learn canonicals on the Learn hostname", () => {
    expect(learnCanonicalUrl("/courses")).toBe("https://learn.bespoketech.com.ng/courses");
  });

  it("does not expose the internal /learn route prefix", () => {
    expect(learnCanonicalUrl("/")).toBe("https://learn.bespoketech.com.ng/");
  });
});
