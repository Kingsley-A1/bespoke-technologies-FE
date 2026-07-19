import type { AdminUser, CompanySettings } from "./types";

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
  name: "Bespoke Technologies",
  website: "www.bespoketech.com.ng",
  phone: "08088071657",
  email: "bespoketech01@gmail.com",
  registrationNumber: "9582429",
  motto: "Engineering the solutions for this, and The Next Generations_",
  address: "",
  defaultCurrency: "NGN",
  defaultPaymentTermsDays: 14,
  paymentInstructions: "",
  invoiceApprovalThreshold: 1_000_000,
  updatedAt: "2026-07-16T08:00:00.000Z",
};

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
