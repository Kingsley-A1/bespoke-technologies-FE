/**
 * Bespoke Technologies — Shared TypeScript Types
 *
 * These interfaces correspond to the NestJS backend OpenAPI DTOs.
 * Keep in sync with backend contract definitions.
 */

// ---- Auth ----
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "superadmin" | "admin" | "member" | "viewer";

// ---- Tenant ----
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  plan: string;
}

// ---- Billing ----
export interface BillingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  features: string[];
}

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: "active" | "trialing" | "past_due" | "canceled";
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

// ---- Partners (CMS) ----
export interface Partner {
  id: string;
  name: string;
  imageUrl: string;
  websiteLink: string;
  shortDescription: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerDto {
  name: string;
  imageUrl: string;
  websiteLink: string;
  shortDescription: string;
}

// ---- Works (CMS) ----
export interface Work {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  projectLink: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkDto {
  name: string;
  imageUrl: string;
  description: string;
  projectLink: string;
}

// ---- API Response Wrappers ----
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
