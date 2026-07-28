/**
 * Authoritative Bespoke Technologies identity.
 *
 * Official documents take a point-in-time snapshot of these approved defaults
 * through `company_settings`. Asset and verification locations are consumed
 * directly because they are deployment concerns rather than client data.
 */
export const COMPANY_IDENTITY = {
  registeredName: "Bespoke Technologies",
  registrationNumber: "9582429",
  website: "https://www.bespoketech.com.ng",
  phone: "08088071657",
  email: "support@bespoketech.com.ng",
  ceoName: "Kingsley Maduabuchi",
  ceoTitle: "Founder & CEO",
  motto: "Engineering the solutions for this, and The Next Generations_",
  logoPath: "/brand/bespoke-technologies-logo.png",
  iconPath: "/icons/bespoke-technologies-icon.png",
  signaturePath: "/ceo-signature.png",
  verificationOrigin: "https://verify.bespoketech.com.ng",
} as const;

export const THIRD_PARTY_INFRASTRUCTURE_NOTICE =
  "Third-party infrastructure and external services—including database, email, hosting, storage, domains, payment gateways, and similar providers—may require separate or additional payment later, depending on usage, plan limits, exchange rates, or provider pricing. These charges are not waived by a zero-balance or pro-bono invoice unless the governing project agreement explicitly states otherwise.";

export function publicAssetFilePath(assetPath: string) {
  return assetPath.replace(/^\/+/, "");
}

export function documentVerificationUrl(documentId: string) {
  return `${COMPANY_IDENTITY.verificationOrigin}/${encodeURIComponent(documentId.trim().toUpperCase())}`;
}
