import type { CertificateOwnerKind } from "../types";

const PROJECT_TYPE_LABELS: Record<string, string> = {
  web: "Web",
  web_app: "Web Application",
  "web application": "Web Application",
  mobile: "Mobile Application",
  mobile_app: "Mobile Application",
  ios: "iOS Application",
  android: "Android Application",
  desktop: "Desktop Application",
  desktop_app: "Desktop Application",
  "web+mobile": "Web & Mobile Applications",
  saas: "SaaS Platform",
  saas_platform: "SaaS Platform",
  ai: "AI System",
  ai_system: "AI System",
};

const OWNER_KIND_LABELS: Record<CertificateOwnerKind, string> = {
  company: "ORGANIZATION / ENTITY",
  contact: "INDIVIDUAL / CONTACT",
  other: "NAMED LEGAL OWNER",
};

export function projectTypeDisplayLabel(value: string) {
  const clean = value.trim();
  const mapped = PROJECT_TYPE_LABELS[clean.toLowerCase()];
  if (mapped) return mapped;
  return clean
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function certificateOwnerKindLabel(kind: CertificateOwnerKind) {
  return OWNER_KIND_LABELS[kind];
}
