import type { AdminPermission, AdminRole } from "./types";

const managerPermissions: AdminPermission[] = [
  "dashboard.view",
  "crm.manage",
  "projects.manage",
  "billing.manage",
  "billing.issue",
  "payments.record",
  "reports.view",
  "digital_audits.view",
  "digital_audits.manage",
  "publications.manage",
  "reviews.manage",
  "learning.view",
  "learning.manage",
  "learn.manage",
  "team.manage",
  "certificates.manage",
];

const employeePermissions: AdminPermission[] = [
  "dashboard.view",
  "work.view",
  "learning.view",
];

const founderPermissions: AdminPermission[] = [
  ...managerPermissions,
  "learn.publish",
  "payments.reverse",
  "billing.void",
  "audit.view",
  "users.manage",
  "settings.manage",
  "exports.all",
  "digital_audits.export",
  "approvals.resolve",
  "certificates.issue",
  "certificates.revoke",
];

export const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<AdminPermission>> = {
  admin_manager: new Set(managerPermissions),
  founder_admin: new Set(founderPermissions),
  employee: new Set(employeePermissions),
};

export function hasPermission(role: AdminRole, permission: AdminPermission) {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function roleLabel(role: AdminRole) {
  if (role === "founder_admin") return "Founder Admin";
  if (role === "admin_manager") return "Admin Manager";
  return "Employee";
}
