import type { TeamMemberInput } from "./repository";
import type { TeamCardVariant, TeamGroup, TeamMemberStatus } from "../types";

const GROUPS = new Set<TeamGroup>(["leadership", "product", "engineering", "design", "operations", "partnerships"]);
const VARIANTS = new Set<TeamCardVariant>(["blueprint", "signal", "grid", "orbit"]);
const STATUSES = new Set<TeamMemberStatus>(["draft", "published", "archived"]);
export const TEAM_IMAGE_MIME = ["image/png", "image/jpeg", "image/webp"] as const;
export const TEAM_IMAGE_LIMIT = 5 * 1024 * 1024;

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function optionalUrl(form: FormData, key: string) {
  const value = text(form, key);
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function teamImageExtension(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  return "webp";
}

export function validateTeamPortrait(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || !value.size) return { file: undefined };
  if (!TEAM_IMAGE_MIME.includes(value.type as (typeof TEAM_IMAGE_MIME)[number])) {
    return { error: "Use a PNG, JPEG, or WebP portrait." };
  }
  if (value.size > TEAM_IMAGE_LIMIT) return { error: "The portrait exceeds 5 MB." };
  return { file: value };
}

export function parseTeamMemberForm(
  form: FormData,
  portrait: { key?: string; mime?: string },
): { input: TeamMemberInput } | { error: string } {
  const slug = text(form, "slug").toLowerCase();
  const fullName = text(form, "fullName");
  const roleTitle = text(form, "roleTitle");
  const teamGroup = text(form, "teamGroup") as TeamGroup;
  const shortBio = text(form, "shortBio");
  const portraitAlt = text(form, "portraitAlt");
  const cardVariant = text(form, "cardVariant") as TeamCardVariant;
  const status = text(form, "status") as TeamMemberStatus;
  const displayOrder = Number(text(form, "displayOrder") || 0);
  const specialties = text(form, "specialties").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 8);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return { error: "Use a lowercase, hyphenated profile slug." };
  if (fullName.length < 2 || fullName.length > 120) return { error: "Name must be between 2 and 120 characters." };
  if (roleTitle.length < 2 || roleTitle.length > 120) return { error: "Role must be between 2 and 120 characters." };
  if (!GROUPS.has(teamGroup)) return { error: "Choose a valid team group." };
  if (shortBio.length < 20 || shortBio.length > 420) return { error: "Bio must be between 20 and 420 characters." };
  if (!VARIANTS.has(cardVariant)) return { error: "Choose a valid card design." };
  if (!STATUSES.has(status)) return { error: "Choose a valid publishing state." };
  if (!Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 10000) return { error: "Display order must be between 0 and 10,000." };
  if (status === "published" && !portrait.key) return { error: "A portrait is required before publishing." };
  if (portrait.key && portraitAlt.length < 3) return { error: "Describe the portrait for accessibility." };

  const links = {
    linkedin: optionalUrl(form, "linkedin"),
    github: optionalUrl(form, "github"),
    website: optionalUrl(form, "website"),
  };
  for (const key of ["linkedin", "github", "website"]) {
    if (text(form, key) && !links[key as keyof typeof links]) return { error: `${key} must be a valid HTTP or HTTPS URL.` };
  }

  return {
    input: {
      slug,
      fullName,
      roleTitle,
      teamGroup,
      shortBio,
      specialties,
      location: text(form, "location") || undefined,
      links,
      portraitAlt,
      cardVariant,
      displayOrder,
      status,
      portraitKey: portrait.key,
      portraitMime: portrait.mime,
    },
  };
}

