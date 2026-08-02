import "server-only";

import { cookies } from "next/headers";
import { adminQuery, isAdminDatabaseConfigured } from "@/features/admin/db";
import { EMAIL_ADDRESSES } from "@/lib/email/addresses";
import { sendEmail } from "@/lib/email/client";
import { learnerSignInCodeEmail } from "@/lib/email/templates/learn";
import {
  decodeLearnerSession,
  learnerCookieName,
  learnerSessionCookieOptions,
  type LearnerSecuritySecrets,
} from "./auth-security";
import { createLearnerAuthRepository } from "./learner-auth-repository";
import { createLearnerAuthService } from "./learner-auth-service";

const SESSION_LIFETIME_SECONDS = 30 * 24 * 60 * 60;

export function learnerRuntimeSecrets(environment: Record<string, string | undefined> = process.env): LearnerSecuritySecrets {
  const sessionSecret = environment.LEARN_SESSION_SECRET?.trim();
  const codePepper = environment.LEARN_CODE_PEPPER?.trim();
  const isProduction = environment.NODE_ENV === "production";
  const missing = [!sessionSecret && "LEARN_SESSION_SECRET", !codePepper && "LEARN_CODE_PEPPER"].filter(Boolean);
  if (missing.length > 0 && isProduction) throw new Error(`Missing learner authentication configuration: ${missing.join(", ")}`);
  if ((sessionSecret && sessionSecret.length < 32) || (codePepper && codePepper.length < 32)) throw new Error("Learner authentication secrets must be at least 32 characters.");
  return {
    sessionSecret: sessionSecret ?? "bespoke-learn-local-development-session-secret",
    codePepper: codePepper ?? "bespoke-learn-local-development-code-pepper",
  };
}

function requestNetwork(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "local";
}

function requireLearnerDatabase() {
  if (!isAdminDatabaseConfigured()) throw new Error("Learner database is not configured.");
}

function service() {
  const secrets = learnerRuntimeSecrets();
  return createLearnerAuthService({
    repository: createLearnerAuthRepository({ query: adminQuery }),
    secrets,
    deliverCode: async ({ email, code, expiresAt }) => {
      const emailMessage = learnerSignInCodeEmail({ code, expiresAt });
      const delivery = await sendEmail({
        from: { address: EMAIL_ADDRESSES.noReply, name: "Bespoke Learn" },
        to: email,
        subject: emailMessage.subject,
        html: emailMessage.html,
        text: emailMessage.text,
        replyTo: EMAIL_ADDRESSES.support,
      });
      if (!delivery.ok) throw new Error(delivery.error);
    },
  });
}

export async function requestLearnerSignInCode(input: { email: string; request: Request }) {
  requireLearnerDatabase();
  return service().requestCode({ email: input.email, network: requestNetwork(input.request) });
}

export async function verifyLearnerSignInCode(input: { email: string; code: string; request: Request }) {
  requireLearnerDatabase();
  const result = await service().verifyCode({
    email: input.email,
    code: input.code,
    network: requestNetwork(input.request),
    userAgent: input.request.headers.get("user-agent") ?? undefined,
  });
  if (result.ok) {
    (await cookies()).set(learnerCookieName(), result.session.token, {
      ...learnerSessionCookieOptions(),
      maxAge: SESSION_LIFETIME_SECONDS,
    });
  }
  return result;
}

export type LearnerSession = { id: string; learnerId: string; email: string; expiresAt: string };

export async function getLearnerSession(): Promise<LearnerSession | null> {
  if (!isAdminDatabaseConfigured()) return null;
  const decoded = decodeLearnerSession((await cookies()).get(learnerCookieName())?.value, learnerRuntimeSecrets());
  if (!decoded) return null;
  const result = await adminQuery<{ id: string; learner_id: string; email: string; expires_at: Date; revoked_at: Date | null }>(
    `SELECT s.id, s.learner_id, l.email, s.expires_at, s.revoked_at
     FROM learn_sessions s JOIN learn_learners l ON l.id = s.learner_id
     WHERE s.id = $1 AND s.token_hash = $2 AND s.revoked_at IS NULL AND l.state = 'active'`,
    [decoded.sessionId, decoded.tokenHash],
  );
  const session = result.rows[0];
  if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
    if (session) await adminQuery("UPDATE learn_sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE id = $1", [session.id]);
    return null;
  }
  await adminQuery("UPDATE learn_sessions SET last_seen_at = now() WHERE id = $1", [session.id]);
  return { id: session.id, learnerId: session.learner_id, email: session.email, expiresAt: new Date(session.expires_at).toISOString() };
}

export async function clearLearnerSession() {
  const decoded = decodeLearnerSession((await cookies()).get(learnerCookieName())?.value, learnerRuntimeSecrets());
  if (decoded && isAdminDatabaseConfigured()) await adminQuery("UPDATE learn_sessions SET revoked_at = COALESCE(revoked_at, now()) WHERE id = $1 AND token_hash = $2", [decoded.sessionId, decoded.tokenHash]);
  (await cookies()).delete(learnerCookieName());
}
