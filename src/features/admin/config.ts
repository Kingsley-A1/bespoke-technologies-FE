import type { AdminUser, CompanySettings, CompanySnapshot } from "./types";
import { COMPANY_IDENTITY, THIRD_PARTY_INFRASTRUCTURE_NOTICE } from "@/lib/company";

/**
 * Stable identities for the two configured admin roles. These UUIDs are used
 * when synchronising the env-driven admin users into the database.
 */
export const FOUNDER_ID = "00000000-0000-4000-8000-000000000001";
export const MANAGER_ID = "00000000-0000-4000-8000-000000000002";

/**
 * Real company profile. The authoritative record lives in the `company_settings`
 * table (seeded by migration 002); this constant is only a safe fallback used
 * when a settings row cannot be read.
 */
export const COMPANY_SETTINGS: CompanySettings = {
  name: COMPANY_IDENTITY.registeredName,
  website: COMPANY_IDENTITY.website,
  phone: COMPANY_IDENTITY.phone,
  email: COMPANY_IDENTITY.email,
  registrationNumber: COMPANY_IDENTITY.registrationNumber,
  motto: COMPANY_IDENTITY.motto,
  address: "",
  defaultCurrency: "NGN",
  defaultPaymentTermsDays: 14,
  paymentInstructions: THIRD_PARTY_INFRASTRUCTURE_NOTICE,
  invoiceApprovalThreshold: 1_000_000,
  ceoName: COMPANY_IDENTITY.ceoName,
  ceoTitle: COMPANY_IDENTITY.ceoTitle,
  updatedAt: "2026-07-16T08:00:00.000Z",
};

export function officialCompanySnapshot(
  settings: CompanySettings,
): CompanySnapshot & { ceoName: string; ceoTitle: string } {
  return {
    name: settings.name,
    website: settings.website,
    phone: settings.phone,
    email: settings.email,
    registrationNumber: settings.registrationNumber,
    motto: settings.motto,
    address: settings.address,
    ceoName: settings.ceoName,
    ceoTitle: settings.ceoTitle,
  };
}

/**
 * The two admin identities, sourced entirely from environment configuration.
 * Enrollment is derived from the presence of a configured TOTP secret.
 */
export function configuredAdminUsers(): AdminUser[] {
  return [
    {
      id: FOUNDER_ID,
      email: process.env.ADMIN_FOUNDER_EMAIL?.trim().toLowerCase() || "founder@bespoketech.com.ng",
      displayName: process.env.ADMIN_FOUNDER_NAME?.trim() || "Founder Admin",
      role: "founder_admin",
      state: "active",
      enrolledAt: process.env.ADMIN_FOUNDER_TOTP_SECRET ? "2026-07-16T08:00:00.000Z" : undefined,
    },
    {
      id: MANAGER_ID,
      email: process.env.ADMIN_MANAGER_EMAIL?.trim().toLowerCase() || "manager@bespoketech.com.ng",
      displayName: process.env.ADMIN_MANAGER_NAME?.trim() || "Admin Manager",
      role: "admin_manager",
      state: "active",
      enrolledAt: process.env.ADMIN_MANAGER_TOTP_SECRET ? "2026-07-16T08:00:00.000Z" : undefined,
    },
  ];
}
