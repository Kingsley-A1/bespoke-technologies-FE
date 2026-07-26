import { NextRequest, NextResponse } from "next/server";

const AUDIT_HOSTNAME = "audit.bespoketech.com.ng";
const TEAM_HOSTNAME = "team.bespoketech.com.ng";
const WEBSITE_HOSTNAME = "www.bespoketech.com.ng";

function requestedHostname(request: NextRequest) {
  return request.headers.get("host")?.split(":")[0]?.toLowerCase();
}

export function proxy(request: NextRequest) {
  const hostname = requestedHostname(request);
  if (hostname === TEAM_HOSTNAME) {
    if (request.nextUrl.pathname === "/") {
      return NextResponse.rewrite(new URL("/team", request.url));
    }
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.next();
    }
    const websiteUrl = request.nextUrl.clone();
    websiteUrl.hostname = WEBSITE_HOSTNAME;
    return NextResponse.redirect(websiteUrl, 308);
  }

  if (hostname !== AUDIT_HOSTNAME) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(
      new URL("/digital-readiness-audit", request.url),
    );
  }

  if (request.nextUrl.pathname.startsWith("/report/")) {
    return NextResponse.rewrite(
      new URL(
        `/digital-readiness-audit${request.nextUrl.pathname}`,
        request.url,
      ),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest).*)",
  ],
};
