import { NextRequest, NextResponse } from "next/server";
import {
  AUDIT_HOSTNAME,
  TEAM_HOSTNAME,
  VERIFY_HOSTNAME,
  WEBSITE_HOSTNAME,
  hostnameFromHeader,
} from "@/lib/subdomain-seo";

function requestedHostname(request: NextRequest) {
  return hostnameFromHeader(request.headers.get("host"));
}

export function proxy(request: NextRequest) {
  const hostname = requestedHostname(request);
  if (hostname === VERIFY_HOSTNAME) {
    if (request.nextUrl.pathname === "/") {
      return NextResponse.rewrite(new URL("/document-verification", request.url));
    }
    if (
      request.nextUrl.pathname === "/robots.txt"
      || request.nextUrl.pathname === "/sitemap.xml"
    ) {
      return NextResponse.next();
    }
    if (request.nextUrl.pathname === "/document-verification") {
      const verificationUrl = request.nextUrl.clone();
      verificationUrl.pathname = "/";
      return NextResponse.redirect(verificationUrl, 308);
    }
    const documentId = request.nextUrl.pathname.slice(1);
    if (/^BT-[A-Z]+-\d{4}-\d{4,}$/i.test(documentId)) {
      return NextResponse.rewrite(
        new URL(`/document-verification/${encodeURIComponent(documentId)}`, request.url),
      );
    }
    return NextResponse.next();
  }

  if (hostname === TEAM_HOSTNAME) {
    if (request.nextUrl.pathname === "/") {
      return NextResponse.rewrite(new URL("/team", request.url));
    }
    if (
      request.nextUrl.pathname.startsWith("/api/") ||
      request.nextUrl.pathname === "/robots.txt" ||
      request.nextUrl.pathname === "/sitemap.xml"
    ) {
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

  if (request.nextUrl.pathname === "/digital-readiness-audit") {
    const auditUrl = request.nextUrl.clone();
    auditUrl.pathname = "/";
    return NextResponse.redirect(auditUrl, 308);
  }

  if (
    request.nextUrl.pathname === "/robots.txt" ||
    request.nextUrl.pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
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
