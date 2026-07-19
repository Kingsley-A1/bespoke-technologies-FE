import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { adminQuery, requireAdminRuntimeConfiguration } from "./db";
import { configuredAdminUsers } from "./config";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateTotpSecret,
  totpProvisioningUri,
} from "./crypto";
import { generateTotp } from "./totp";
import type { AdminRole, AdminSession, AdminUser } from "./types";

const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Secure-bt_admin_session" : "bt_admin_session";
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

interface PersistedSession extends AdminSession {
  tokenHash: string;
  networkHash: string;
  userAgent: string;
}

type LoginOutcome = "success" | "failure" | "locked";

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") throw new Error("ADMIN_SESSION_SECRET is required.");
  return "bespoke-admin-local-development-session-secret";
}

function codePepper() {
  const secret = process.env.ADMIN_CODE_PEPPER;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") throw new Error("ADMIN_CODE_PEPPER is required.");
  return "bespoke-admin-local-development-code-pepper";
}

function hmac(value: string, secret = sessionSecret()) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function requestNetwork(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function networkHash(request: Request) {
  return hmac(requestNetwork(request), codePepper());
}

function identityHash(email: string) {
  return hmac(email.trim().toLowerCase(), codePepper());
}

function tokenHash(token: string) {
  return hmac(token);
}

function encodeSession(sessionId: string) {
  const signature = hmac(sessionId);
  return `${sessionId}.${signature}`;
}

function decodeSession(token?: string) {
  if (!token) return null;
  const [sessionId, signature] = token.split(".");
  if (!sessionId || !signature || !safeEqual(signature, hmac(sessionId))) return null;
  return { sessionId, tokenHash: tokenHash(token) };
}

function configuredTotpSecret(role: AdminRole) {
  return role === "founder_admin" ? process.env.ADMIN_FOUNDER_TOTP_SECRET : process.env.ADMIN_MANAGER_TOTP_SECRET;
}

function configuredRecoveryHashes(role: AdminRole) {
  const value = role === "founder_admin"
    ? process.env.ADMIN_FOUNDER_RECOVERY_HASHES
    : process.env.ADMIN_MANAGER_RECOVERY_HASHES;
  return (value ?? "").split(",").map((hash) => hash.trim()).filter(Boolean);
}

function configuredBootstrapCode(role: AdminRole) {
  const configured = role === "founder_admin" ? process.env.ADMIN_FOUNDER_BOOTSTRAP_CODE : process.env.ADMIN_MANAGER_BOOTSTRAP_CODE;
  return configured ?? "";
}

export async function syncConfiguredAdminUsers() {
  const configured = configuredAdminUsers();
  for (const user of configured) {
    await adminQuery(
      `INSERT INTO admin_users (id, email, display_name, role, state, enrolled_at)
       VALUES ($1, $2, $3, $4, 'active', $5)
       ON CONFLICT (email) DO UPDATE SET display_name = excluded.display_name, role = excluded.role, updated_at = now()`,
      [user.id, user.email, user.displayName, user.role, user.enrolledAt ?? null],
    );
    for (const hash of configuredRecoveryHashes(user.role)) {
      await adminQuery(
        `INSERT INTO admin_authenticators (user_id, authenticator_type, secret_hash)
         VALUES ($1, 'recovery', $2) ON CONFLICT (user_id, authenticator_type, secret_hash) DO NOTHING`,
        [user.id, hash],
      );
    }
  }
  const result = await adminQuery<{
    id: string;
    email: string;
    display_name: string;
    role: AdminRole;
    state: AdminUser["state"];
    enrolled_at: Date | string | null;
    last_login_at: Date | string | null;
  }>(
    "SELECT id, email, display_name, role, state, enrolled_at, last_login_at FROM admin_users WHERE email IN ($1, $2)",
    [configured[0].email, configured[1].email],
  );
  return result.rows.map((row) => ({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    state: row.state,
    enrolledAt: row.enrolled_at ? new Date(row.enrolled_at).toISOString() : undefined,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : undefined,
  }));
}

async function recentFailureCount(email: string, request: Request) {
  const identity = identityHash(email);
  const network = networkHash(request);
  const cutoff = new Date(Date.now() - ATTEMPT_WINDOW_MS).toISOString();
  const result = await adminQuery<{ count: string }>(
    `SELECT count(*)::STRING AS count FROM admin_login_attempts
     WHERE (identity_hash = $1 OR network_hash = $2) AND outcome = 'failure' AND attempted_at >= $3`,
    [identity, network, cutoff],
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function recordAttempt(email: string, request: Request, outcome: LoginOutcome) {
  await adminQuery(
    "INSERT INTO admin_login_attempts (identity_hash, network_hash, outcome) VALUES ($1, $2, $3)",
    [identityHash(email), networkHash(request), outcome],
  );
}

async function recordSecurityAudit({
  user,
  action,
  entityId,
  metadata,
  reason,
}: {
  user?: AdminUser;
  action: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  reason?: string;
}) {
  await adminQuery(
    `INSERT INTO admin_audit_events (actor_user_id, actor_label, action, entity_type, entity_id, reason, metadata)
     VALUES ($1, $2, $3, 'admin_security', $4, $5, $6)`,
    [user?.id ?? null, user?.displayName ?? "Unknown identity", action, entityId ?? null, reason ?? null, metadata ? JSON.stringify(metadata) : null],
  );
}

async function markTotpStep(user: AdminUser, step: number, secret: string) {
  const secretHash = hmac(secret, codePepper());
  // Each secret keeps its own replay-tracking row, keyed by its hash.
  const result = await adminQuery<{ id: string; last_used_step: string | null }>(
    `SELECT id, last_used_step FROM admin_authenticators
     WHERE user_id = $1 AND authenticator_type = 'totp' AND disabled_at IS NULL AND secret_hash = $2
     ORDER BY created_at DESC LIMIT 1`,
    [user.id, secretHash],
  );
  const previous = result.rows[0]?.last_used_step;
  if (previous !== null && previous !== undefined && step <= Number(previous)) return false;
  const authenticatorId = result.rows[0]?.id;
  if (authenticatorId) {
    const updated = await adminQuery<{ id: string }>(
      `UPDATE admin_authenticators SET last_used_step = $2, secret_hash = $3
       WHERE id = $1 AND (last_used_step IS NULL OR last_used_step < $2)
       RETURNING id`,
      [authenticatorId, step, secretHash],
    );
    return updated.rowCount === 1;
  } else {
    try {
      await adminQuery(
        `INSERT INTO admin_authenticators (user_id, authenticator_type, secret_hash, last_used_step)
         VALUES ($1, 'totp', $2, $3)`,
        [user.id, secretHash, step],
      );
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code === "23505") return false;
      throw error;
    }
  }
  return true;
}

async function verifyRecoveryCode(user: AdminUser, code: string) {
  const candidateHash = hmac(code, codePepper());
  if (!configuredRecoveryHashes(user.role).some((hash) => safeEqual(hash, candidateHash))) return false;
  const result = await adminQuery<{ id: string }>(
    `UPDATE admin_authenticators SET disabled_at = now()
     WHERE user_id = $1 AND authenticator_type = 'recovery' AND secret_hash = $2 AND disabled_at IS NULL
     RETURNING id`,
    [user.id, candidateHash],
  );
  return result.rowCount === 1;
}

/**
 * Confirmed, self-enrolled authenticator secrets for a user, newest first.
 * Returns an empty list when the enrollment migration has not been applied so
 * env-provisioned login keeps working during rollout.
 */
async function enrolledTotpSecrets(user: AdminUser) {
  try {
    const result = await adminQuery<{ id: string; secret_ciphertext: string }>(
      `SELECT id, secret_ciphertext FROM admin_authenticators
       WHERE user_id = $1 AND authenticator_type = 'totp' AND disabled_at IS NULL
         AND confirmed_at IS NOT NULL AND secret_ciphertext IS NOT NULL
       ORDER BY created_at DESC LIMIT 3`,
      [user.id],
    );
    return result.rows
      .map((row) => decryptTotpSecret(row.secret_ciphertext))
      .filter((secret): secret is string => Boolean(secret));
  } catch {
    return [];
  }
}

async function verifyUserCode(user: AdminUser, code: string) {
  if (!/^\d{6}$/.test(code)) return false;
  // Self-enrolled authenticators take precedence; the env-provisioned secret
  // only applies while a user has not yet enrolled via the registration flow.
  const enrolled = await enrolledTotpSecrets(user);
  const envSecret = configuredTotpSecret(user.role);
  const candidates = enrolled.length > 0 ? enrolled : envSecret ? [envSecret] : [];
  if (candidates.length > 0) {
    const currentStep = Math.floor(Date.now() / 30_000);
    for (const secret of candidates) {
      for (const step of [currentStep - 1, currentStep, currentStep + 1]) {
        if (safeEqual(generateTotp(secret, step), code)) return markTotpStep(user, step, secret);
      }
    }
    if (await verifyRecoveryCode(user, code)) return true;
  }
  const bootstrap = configuredBootstrapCode(user.role);
  const bootstrapAllowed = process.env.ADMIN_ALLOW_BOOTSTRAP === "true";
  return bootstrapAllowed && Boolean(bootstrap) && safeEqual(bootstrap, code);
}

export async function authenticateAdmin(email: string, code: string, request: Request) {
  requireAdminRuntimeConfiguration();
  const normalizedEmail = email.trim().toLowerCase();
  if ((await recentFailureCount(normalizedEmail, request)) >= MAX_ATTEMPTS) {
    await recordAttempt(normalizedEmail, request, "locked");
    await recordSecurityAudit({ action: "admin.login.locked", metadata: { identityHash: identityHash(normalizedEmail) } });
    return { ok: false as const, reason: "locked" as const };
  }

  const users = await syncConfiguredAdminUsers();
  const user = users.find((candidate) => candidate.email === normalizedEmail && candidate.state === "active");
  const valid = user ? await verifyUserCode(user, code) : false;
  if (!user || !valid) {
    await recordAttempt(normalizedEmail, request, "failure");
    await recordSecurityAudit({ user, action: "admin.login.failed", metadata: { identityHash: identityHash(normalizedEmail) } });
    return { ok: false as const, reason: "invalid" as const };
  }

  await recordAttempt(normalizedEmail, request, "success");
  await adminQuery("UPDATE admin_users SET last_login_at = now(), updated_at = now() WHERE id = $1", [user.id]);
  return { ok: true as const, user };
}

/**
 * Step 1 of authenticator enrollment: a pre-authorized admin email plus the
 * secret registration code produce a fresh pending TOTP secret. The secret is
 * stored encrypted and stays unusable for login until confirmed.
 */
export async function beginTotpEnrollment(email: string, registrationCode: string, request: Request) {
  requireAdminRuntimeConfiguration();
  const normalizedEmail = email.trim().toLowerCase();
  if ((await recentFailureCount(normalizedEmail, request)) >= MAX_ATTEMPTS) {
    await recordAttempt(normalizedEmail, request, "locked");
    await recordSecurityAudit({ action: "admin.enrollment.locked", metadata: { identityHash: identityHash(normalizedEmail) } });
    return { ok: false as const, reason: "locked" as const };
  }

  const configuredCode = process.env.ADMIN_REGISTRATION_CODE ?? "";
  const users = await syncConfiguredAdminUsers();
  const user = users.find((candidate) => candidate.email === normalizedEmail && candidate.state === "active");
  const codeValid = Boolean(configuredCode) && Boolean(registrationCode) && safeEqual(configuredCode, registrationCode);
  if (!user || !codeValid) {
    await recordAttempt(normalizedEmail, request, "failure");
    await recordSecurityAudit({
      user,
      action: "admin.enrollment.rejected",
      metadata: { identityHash: identityHash(normalizedEmail) },
    });
    return { ok: false as const, reason: "invalid" as const };
  }

  const secret = generateTotpSecret();
  await adminQuery(
    `INSERT INTO admin_authenticators (user_id, authenticator_type, secret_ciphertext, secret_hash)
     VALUES ($1, 'totp', $2, $3)`,
    [user.id, encryptTotpSecret(secret), hmac(secret, codePepper())],
  );
  await recordSecurityAudit({ user, action: "admin.enrollment.started" });
  return {
    ok: true as const,
    user,
    secret,
    otpauthUri: totpProvisioningUri(user.email, secret),
  };
}

/**
 * Step 2 of authenticator enrollment: the first valid code from the newly
 * scanned authenticator confirms the pending secret, retires every other
 * authenticator for the user, and marks the identity enrolled.
 */
export async function confirmTotpEnrollment(email: string, code: string, request: Request) {
  requireAdminRuntimeConfiguration();
  const normalizedEmail = email.trim().toLowerCase();
  if ((await recentFailureCount(normalizedEmail, request)) >= MAX_ATTEMPTS) {
    await recordAttempt(normalizedEmail, request, "locked");
    return { ok: false as const, reason: "locked" as const };
  }

  const users = await syncConfiguredAdminUsers();
  const user = users.find((candidate) => candidate.email === normalizedEmail && candidate.state === "active");
  if (!user || !/^\d{6}$/.test(code)) {
    await recordAttempt(normalizedEmail, request, "failure");
    return { ok: false as const, reason: "invalid" as const };
  }

  const pending = await adminQuery<{ id: string; secret_ciphertext: string }>(
    `SELECT id, secret_ciphertext FROM admin_authenticators
     WHERE user_id = $1 AND authenticator_type = 'totp' AND disabled_at IS NULL
       AND confirmed_at IS NULL AND secret_ciphertext IS NOT NULL
       AND created_at >= now() - INTERVAL '15 minutes'
     ORDER BY created_at DESC LIMIT 1`,
    [user.id],
  );
  const row = pending.rows[0];
  const secret = row ? decryptTotpSecret(row.secret_ciphertext) : null;

  let matchedStep: number | null = null;
  if (secret) {
    const currentStep = Math.floor(Date.now() / 30_000);
    for (const step of [currentStep - 1, currentStep, currentStep + 1]) {
      if (safeEqual(generateTotp(secret, step), code)) {
        matchedStep = step;
        break;
      }
    }
  }

  if (!row || !secret || matchedStep === null) {
    await recordAttempt(normalizedEmail, request, "failure");
    await recordSecurityAudit({ user, action: "admin.enrollment.confirm_failed" });
    return { ok: false as const, reason: "invalid" as const };
  }

  await adminQuery(
    "UPDATE admin_authenticators SET confirmed_at = now(), last_used_step = $2 WHERE id = $1",
    [row.id, matchedStep],
  );
  await adminQuery(
    `UPDATE admin_authenticators SET disabled_at = now()
     WHERE user_id = $1 AND authenticator_type = 'totp' AND id != $2 AND disabled_at IS NULL`,
    [user.id, row.id],
  );
  await adminQuery(
    "UPDATE admin_users SET enrolled_at = COALESCE(enrolled_at, now()), updated_at = now() WHERE id = $1",
    [user.id],
  );
  await recordAttempt(normalizedEmail, request, "success");
  await recordSecurityAudit({ user, action: "admin.enrollment.confirmed", entityId: row.id });
  return { ok: true as const, user };
}

export async function createAdminSession(user: AdminUser, request: Request) {
  const now = new Date();
  const sessionId = randomUUID();
  const token = encodeSession(sessionId);
  const session: PersistedSession = {
    id: sessionId,
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    createdAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ABSOLUTE_TIMEOUT_MS).toISOString(),
    tokenHash: tokenHash(token),
    networkHash: networkHash(request),
    userAgent: request.headers.get("user-agent")?.slice(0, 240) ?? "unknown",
  };
  await adminQuery(
    `INSERT INTO admin_sessions (id, user_id, token_hash, expires_at, network_hash, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [session.id, user.id, session.tokenHash, session.expiresAt, session.networkHash, session.userAgent],
  );
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: ABSOLUTE_TIMEOUT_MS / 1000,
  });
  await recordSecurityAudit({ user, action: "admin.session.created", entityId: session.id });
  return session;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const decoded = decodeSession(cookieStore.get(COOKIE_NAME)?.value);
  if (!decoded) return null;
  const now = Date.now();
  const result = await adminQuery<{
    id: string;
    user_id: string;
    email: string;
    display_name: string;
    role: AdminRole;
    created_at: Date;
    last_seen_at: Date;
    expires_at: Date;
    revoked_at: Date | null;
  }>(
    `SELECT s.id, s.user_id, u.email, u.display_name, u.role, s.created_at, s.last_seen_at, s.expires_at, s.revoked_at
     FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.token_hash = $2 AND s.revoked_at IS NULL AND u.state = 'active'`,
    [decoded.sessionId, decoded.tokenHash],
  );
  const row = result.rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= now || new Date(row.last_seen_at).getTime() + IDLE_TIMEOUT_MS <= now) {
    await adminQuery("UPDATE admin_sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE id = $1", [row.id]);
    await recordSecurityAudit({
      user: { id: row.user_id, email: row.email, displayName: row.display_name, role: row.role, state: "active" },
      action: "admin.session.expired",
      entityId: row.id,
    });
    return null;
  }
  await adminQuery("UPDATE admin_sessions SET last_seen_at = now() WHERE id = $1", [row.id]);
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    createdAt: new Date(row.created_at).toISOString(),
    lastSeenAt: new Date().toISOString(),
    expiresAt: new Date(row.expires_at).toISOString(),
  };
}

export async function revokeAdminSession(sessionId: string, actor?: AdminSession, reason?: string) {
  await adminQuery("UPDATE admin_sessions SET revoked_at = now() WHERE id = $1", [sessionId]);
  if (actor) {
    await recordSecurityAudit({
      user: { id: actor.userId, email: actor.email, displayName: actor.displayName, role: actor.role, state: "active" },
      action: "admin.session.revoked",
      entityId: sessionId,
      reason,
    });
  }
}

export async function clearAdminSession() {
  const session = await getAdminSession();
  if (session) await revokeAdminSession(session.id, session);
  (await cookies()).delete(COOKIE_NAME);
}

export async function listAdminSessions(userId?: string) {
  const result = await adminQuery<{
    id: string;
    user_id: string;
    email: string;
    display_name: string;
    role: AdminRole;
    created_at: Date;
    last_seen_at: Date;
    expires_at: Date;
    revoked_at: Date | null;
  }>(
    `SELECT s.id, s.user_id, u.email, u.display_name, u.role, s.created_at, s.last_seen_at, s.expires_at, s.revoked_at
     FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
     WHERE ($1::UUID IS NULL OR s.user_id = $1) ORDER BY s.last_seen_at DESC LIMIT 50`,
    [userId ?? null],
  );
  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    createdAt: new Date(row.created_at).toISOString(),
    lastSeenAt: new Date(row.last_seen_at).toISOString(),
    expiresAt: new Date(row.expires_at).toISOString(),
    revokedAt: row.revoked_at ? new Date(row.revoked_at).toISOString() : undefined,
  } satisfies AdminSession));
}

export async function applyAdminSecurityRetention() {
  await adminQuery("DELETE FROM admin_login_attempts WHERE attempted_at < now() - INTERVAL '90 days'");
  await adminQuery("DELETE FROM contact_submission_attempts WHERE attempted_at < now() - INTERVAL '7 days'");
  await adminQuery("DELETE FROM admin_sessions WHERE (revoked_at IS NOT NULL OR expires_at < now()) AND created_at < now() - INTERVAL '90 days'");
}
