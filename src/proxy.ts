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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Expose the request path to layouts/server components. The (dashboard)
  // layout uses it to avoid redirecting /dashboard/onboarding to itself
  // (which would cause an infinite redirect loop).
  request.headers.set("x-kivaro-pathname", pathname);
  const response = NextResponse.next({ request });

  // --- CSRF Protection ---
  // Block non-GET/HEAD requests without proper origin
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");

    if (origin && host) {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return new NextResponse("Forbidden", { status: 403 });
      }
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
