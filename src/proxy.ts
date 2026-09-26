import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// =============================================================================
// KIVARO — Security Middleware
// =============================================================================
// Handles: route protection, rate limiting headers, CSRF defense
// =============================================================================

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard"];

// Neon Auth session cookie (must match the SDK's cookie name, NOT better-auth's).
// The __Secure- prefix variant is used over HTTPS; browsers silently drop such
// cookies on plain HTTP (local dev), where Neon Auth still sets the plain name.
const NEON_AUTH_SESSION_COOKIE_NAMES = [
  "__Secure-neon-auth.session_token",
  "neon-auth.session_token",
];

// Endpoints invoked by machines rather than browsers. They authenticate by
// secret (or are handled by the auth SDK) and legitimately carry neither Origin
// nor Referer, so the CSRF comparison is skipped for them. Everything else that
// mutates state is cookie-authenticated and must prove same-origin.
const CSRF_EXEMPT_PATHS = ["/api/webhooks/", "/api/auth/"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Expose the request path to layouts/server components. The (dashboard)
  // layout uses it to avoid redirecting /dashboard/onboarding to itself
  // (which would cause an infinite redirect loop).
  request.headers.set("x-kivaro-pathname", pathname);
  const response = NextResponse.next({ request });

  // --- CSRF Protection ---
  // A browser sets Origin on every cross-origin state change, and Referer on
  // same-origin navigations. Previously the check ran only when Origin was
  // already present, so an attacker could omit the header and skip the
  // comparison entirely — the exact requests CSRF defence exists to stop.
  // Require one of the two, and compare it.
  if (
    !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
    !CSRF_EXEMPT_PATHS.some((p) => pathname.startsWith(p))
  ) {
    const host = request.headers.get("host");
    const source = request.headers.get("origin") || request.headers.get("referer");

    if (!host || !source) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    try {
      if (new URL(source).host !== host) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    } catch {
      // Unparseable Origin/Referer — treat as untrusted.
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // --- Route Protection ---
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Presence check as a cheap fast-path. The actual session is verified
    // server-side via auth.getSession() in the dashboard layout and actions.
    const hasSessionCookie = request.cookies
      .getAll()
      .some((cookie) => NEON_AUTH_SESSION_COOKIE_NAMES.includes(cookie.name));

    if (!hasSessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // --- Prevent Open Redirects ---
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
  if (callbackUrl) {
    try {
      const url = new URL(callbackUrl, request.url);
      if (url.origin !== request.nextUrl.origin) {
        // Strip malicious external redirect
        const cleanUrl = new URL(request.url);
        cleanUrl.searchParams.delete("callbackUrl");
        return NextResponse.redirect(cleanUrl);
      }
    } catch {
      // Invalid URL, strip it
      const cleanUrl = new URL(request.url);
      cleanUrl.searchParams.delete("callbackUrl");
      return NextResponse.redirect(cleanUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
