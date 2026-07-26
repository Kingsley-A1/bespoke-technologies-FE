import { NextRequest, NextResponse } from "next/server";

const AUDIT_HOSTNAME = "audit.bespoketech.com.ng";

function requestedHostname(request: NextRequest) {
  return request.headers.get("host")?.split(":")[0]?.toLowerCase();
}

export function proxy(request: NextRequest) {
  if (requestedHostname(request) !== AUDIT_HOSTNAME) {
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
  matcher: ["/", "/report/:path*"],
};
