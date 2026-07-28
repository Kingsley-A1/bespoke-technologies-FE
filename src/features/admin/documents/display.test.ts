import { describe, expect, it } from "vitest";
import { certificateOwnerKindLabel, projectTypeDisplayLabel } from "./display";

describe("official document display labels", () => {
  it.each([
    ["web", "Web"],
    ["web_app", "Web Application"],
    ["mobile_app", "Mobile Application"],
    ["saas", "SaaS Platform"],
    ["ai_system", "AI System"],
  ])("maps %s to %s", (value, label) => {
    expect(projectTypeDisplayLabel(value)).toBe(label);
  });

  it("uses an inclusive legal-owner classification", () => {
    expect(certificateOwnerKindLabel("company")).toBe("ORGANIZATION / ENTITY");
  });
});
