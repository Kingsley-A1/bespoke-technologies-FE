import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { assertAdminPermission, assertRecentAdminPermission, isSameOrigin } from "@/features/admin/access";
import { NewsContentError } from "./content";
import { NewsImageError } from "./images.server";
import { NewsConflictError, NewsNotFoundError, NewsSlugTakenError } from "./repository";
import { NewsTransitionError } from "./status";

type Access = Awaited<ReturnType<typeof assertAdminPermission>>;

/** Authorizes a News Admin API request: permission, optional recent sign-in, and same origin. */
export async function authorizeNewsRequest(
  request: Request,
  permission: "news.manage" | "news.publish",
  options: { recent?: boolean } = {},
): Promise<{ ok: true; session: Extract<Access, { ok: true }>["session"] } | { ok: false; response: NextResponse }> {
  const access = options.recent ? await assertRecentAdminPermission(permission) : await assertAdminPermission(permission);
  if (!access.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            access.error === "Reauthentication required"
              ? "For security, confirm your identity before publishing. Your changes are saved."
              : access.error,
          code: access.error === "Reauthentication required" ? "reauth_required" : undefined,
        },
        { status: access.status },
      ),
    };
  }
  if (!isSameOrigin(request)) {
    return { ok: false, response: NextResponse.json({ error: "Invalid origin" }, { status: 403 }) };
  }
  return { ok: true, session: access.session };
}

/** Maps domain errors to truthful HTTP responses; unknown errors stay 500 and are logged. */
export function newsErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: error.issues[0]?.message ?? "Check the form fields." }, { status: 400 });
  }
  if (error instanceof NewsContentError || error instanceof NewsImageError || error instanceof NewsTransitionError) {
    return NextResponse.json({ error: error.message }, { status: error instanceof NewsTransitionError ? 409 : 400 });
  }
  if (error instanceof NewsConflictError) {
    return NextResponse.json({ error: error.message, code: "version_conflict" }, { status: 409 });
  }
  if (error instanceof NewsSlugTakenError) return NextResponse.json({ error: error.message }, { status: 409 });
  if (error instanceof NewsNotFoundError) return NextResponse.json({ error: error.message }, { status: 404 });
  console.error("[news] request failed", error);
  return NextResponse.json({ error: "Something went wrong on our side and the change was not saved. Please try again." }, { status: 500 });
}

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    throw new ZodError([{ code: "custom", path: [], message: "Expected a JSON request body.", input: undefined }]);
  }
}
