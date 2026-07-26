import { describe, expect, it } from "vitest";
import { parseTeamMemberForm } from "./validation";

function validForm() {
  const form = new FormData();
  form.set("slug", "ada-engineer");
  form.set("fullName", "Ada Engineer");
  form.set("roleTitle", "Senior Engineer");
  form.set("teamGroup", "engineering");
  form.set("shortBio", "Ada builds dependable systems and thoughtful digital products for growing organisations.");
  form.set("portraitAlt", "Portrait of Ada Engineer");
  form.set("cardVariant", "grid");
  form.set("status", "published");
  form.set("displayOrder", "2");
  form.set("specialties", "Architecture, Cloud, Reliability");
  form.set("linkedin", "https://www.linkedin.com/in/ada");
  return form;
}

describe("team member validation", () => {
  it("normalises a publishable public profile", () => {
    const result = parseTeamMemberForm(validForm(), { key: "team/ada.webp", mime: "image/webp" });
    expect("input" in result && result.input).toMatchObject({
      slug: "ada-engineer",
      teamGroup: "engineering",
      specialties: ["Architecture", "Cloud", "Reliability"],
      status: "published",
    });
  });

  it("does not publish a profile without a portrait", () => {
    const result = parseTeamMemberForm(validForm(), {});
    expect(result).toEqual({ error: "A portrait is required before publishing." });
  });
});

