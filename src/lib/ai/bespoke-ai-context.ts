import {
  CONTACT_EMAIL,
  NAV_LINKS,
  PARTNERS,
  PARTNERSHIP_TIERS,
  PHONE_DISPLAY,
  PROJECTS,
  SERVICES,
  SITE_CREED,
  SITE_DESCRIPTION,
  SITE_DOMAIN,
  SITE_NAME,
  SITE_TAGLINE,
  SOCIAL_HANDLE,
  STATS,
  TESTIMONIALS,
  WHATSAPP_NUMBER,
} from "@/lib/constants";

export const BESPOKE_AI_APPROVED_PATHS = [
  "/",
  "/services",
  "/projects",
  "/about",
  "/partnerships",
  "/partnerships/tiers",
  "/reviews",
  "/contact",
  "/terms",
  "/privacy",
] as const;

export type BespokeAIApprovedPath = (typeof BESPOKE_AI_APPROVED_PATHS)[number];

export function isBespokeAIApprovedPath(
  path: string,
): path is BespokeAIApprovedPath {
  return BESPOKE_AI_APPROVED_PATHS.includes(path as BespokeAIApprovedPath);
}

export function getBespokeAIContext() {
  const nav = NAV_LINKS.map((link) => `${link.label}: ${link.href}`).join("; ");
  const services = SERVICES.map(
    (service) =>
      `${service.title} (${service.id}): ${service.tagline}. ${service.description}`,
  ).join("\n");
  const projects = PROJECTS.map((project) =>
    [
      project.name,
      `type=${project.type}`,
      `category=${project.category}`,
      `year=${project.year}`,
      `featured=${project.featured}`,
      `comingSoon=${project.comingSoon}`,
      `tags=${project.tags.join(", ")}`,
      `liveUrl=${project.liveUrl ?? "not public yet"}`,
      project.description,
    ].join(" | "),
  ).join("\n");
  const testimonials = TESTIMONIALS.map(
    (item) =>
      `${item.author}, ${item.role} at ${item.company}: "${item.quote}"`,
  ).join("\n");
  const partners = PARTNERS.map(
    (partner) => `${partner.name} (${partner.tier}): ${partner.description}`,
  ).join("\n");
  const tiers = PARTNERSHIP_TIERS.map(
    (tier) => `${tier.name}: ${tier.description}`,
  ).join("\n");
  const stats = STATS.map((stat) => `${stat.value} ${stat.label}`).join("; ");

  return [
    `Company: ${SITE_NAME}`,
    `Website: ${SITE_DOMAIN}`,
    `Public motto: ${SITE_TAGLINE}`,
    `Internal creed: ${SITE_CREED}`,
    `Description: ${SITE_DESCRIPTION}`,
    `Phone/WhatsApp display: ${PHONE_DISPLAY}`,
    `WhatsApp international number: ${WHATSAPP_NUMBER}`,
    `Email: ${CONTACT_EMAIL}`,
    `Social: ${SOCIAL_HANDLE}`,
    `Routes: ${nav}`,
    `Stats from local constants: ${stats}`,
    `Services:\n${services}`,
    `Projects:\n${projects}`,
    `Testimonials:\n${testimonials}`,
    `Partners:\n${partners}`,
    `Partnership tiers:\n${tiers}`,
  ].join("\n\n");
}
