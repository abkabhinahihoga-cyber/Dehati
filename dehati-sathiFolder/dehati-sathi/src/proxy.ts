import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// --- i18n configuration (mirrors src/i18n/routing.ts) ---
const locales = ["en", "hi"] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = "en";

/**
 * Extract the locale prefix from a pathname.
 * Returns the locale if the first segment is a valid locale, otherwise null.
 */
function extractLocaleFromPathname(pathname: string): Locale | null {
  const segments = pathname.split("/");
  // segments[0] is "" (before the leading /), segments[1] is the first real segment
  const candidate = segments[1];
  if (candidate && locales.includes(candidate as Locale)) {
    return candidate as Locale;
  }
  return null;
}

/**
 * Strip the locale prefix from a pathname so auth logic can work
 * on the "bare" route. e.g. "/hi/seller/dashboard" -> "/seller/dashboard"
 */
function stripLocalePrefix(pathname: string, locale: Locale | null): string {
  if (!locale) return pathname;
  // Remove the leading /<locale> segment
  const stripped = pathname.replace(new RegExp(`^/${locale}(/|$)`), "/");
  return stripped || "/";
}

/**
 * Build a URL that preserves the user's current locale prefix.
 * For default locale ('en') with 'as-needed' mode, we don't add a prefix.
 * For 'hi', we prepend /hi.
 */
function localizedUrl(path: string, locale: Locale | null, baseUrl: string): URL {
  const effectiveLocale = locale ?? defaultLocale;
  let localizedPath = path;
  if (effectiveLocale !== defaultLocale) {
    // Avoid double-prefixing
    if (!path.startsWith(`/${effectiveLocale}`)) {
      localizedPath = `/${effectiveLocale}${path === "/" ? "" : path}`;
    }
  }
  return new URL(localizedPath, baseUrl);
}

/**
 * Detect preferred locale from Accept-Language header.
 * Returns 'hi' if Hindi is preferred, otherwise falls back to default.
 */
function detectLocaleFromHeaders(req: NextRequest): Locale {
  const acceptLang = req.headers.get("accept-language") || "";
  // Check if Hindi is in the Accept-Language header
  if (acceptLang.includes("hi")) {
    return "hi";
  }
  return defaultLocale;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- LOCALE EXTRACTION ---
  const pathLocale = extractLocaleFromPathname(pathname);
  // The "bare" pathname without locale prefix, used for all auth checks
  const barePath = stripLocalePrefix(pathname, pathLocale);

  // Determine the user's active locale (path > cookie > Accept-Language > default)
  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value as Locale | undefined;
  const activeLocale: Locale =
    pathLocale ??
    (cookieLocale && locales.includes(cookieLocale) ? cookieLocale : null) ??
    detectLocaleFromHeaders(req);

  // --- HANDLE LOCALE REDIRECT (for 'as-needed' prefix mode) ---
  // If someone visits /en/something, redirect to /something (default locale needs no prefix)
  if (pathLocale === defaultLocale) {
    const cleanPath = stripLocalePrefix(pathname, defaultLocale);
    const cleanUrl = new URL(cleanPath, req.url);
    cleanUrl.search = req.nextUrl.search;
    const response = NextResponse.redirect(cleanUrl, 308);
    // Explicitly set the cookie to the default locale so we don't fall back to the old language
    response.cookies.set("NEXT_LOCALE", defaultLocale, { path: "/", sameSite: "lax" });
    return response;
  }

  // Helper to create the correct pass-through or rewrite response
  function createFinalResponse() {
    if (!pathLocale && !pathname.startsWith("/api") && !pathname.startsWith("/_next")) {
      // Rewrite to /en/... so the [locale] folder catches it, without changing the URL bar
      const rewriteUrl = new URL(`/${activeLocale}${pathname === "/" ? "" : pathname}`, req.url);
      rewriteUrl.search = req.nextUrl.search;
      return NextResponse.rewrite(rewriteUrl);
    }
    return NextResponse.next();
  }

  // --- 1. Allow public routes (checked on bare path) ---
  const publicRoutes = ["/login", "/register", "/api/auth", "/landing"];
  if (publicRoutes.some((path) => barePath.startsWith(path))) {
    const response = createFinalResponse();
    // Set locale cookie for next-intl to pick up
    response.cookies.set("NEXT_LOCALE", activeLocale, { path: "/", sameSite: "lax" });
    return response;
  }

  // --- 2. Fetch Token ---
  const isProduction = process.env.NODE_ENV === "production" || req.nextUrl.protocol === "https:";
  const token = await getToken({ 
    req, 
    secret: process.env.AUTH_SECRET,
    secureCookie: isProduction,
    cookieName: isProduction ? "__Secure-authjs.session-token" : "authjs.session-token",
  });

  // --- 3. If Not Logged In -> Show Landing Page ---
  if (!token) {
    return NextResponse.redirect(localizedUrl("/landing", pathLocale, req.url));
  }

  // --- 4. ONBOARDING CHECK ---
  if (token.isNewUser && !barePath.startsWith("/welcome") && !barePath.startsWith("/api")) {
    return NextResponse.redirect(localizedUrl("/welcome", pathLocale, req.url));
  }
  if (!token.isNewUser && barePath.startsWith("/welcome")) {
    return NextResponse.redirect(localizedUrl("/", pathLocale, req.url));
  }

  const role = token.role as string;

  // --- 5. SPECIAL REDIRECTS ---
  // If a Hub Manager logs in (landing on home '/'), send them straight to Hub Dashboard
  if (role === "hub" && barePath === "/") {
    return NextResponse.redirect(localizedUrl("/hub/dashboard", pathLocale, req.url));
  }

  // --- 6. ROLE PROTECTION (all checks on barePath) ---
  if (barePath.startsWith("/seller") && role !== "seller" && role !== "admin") {
    return NextResponse.redirect(localizedUrl("/unauthorized", pathLocale, req.url));
  }
  if (barePath.startsWith("/delivery") && role !== "deliveryBoy" && role !== "admin") {
    return NextResponse.redirect(localizedUrl("/unauthorized", pathLocale, req.url));
  }
  if (barePath.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(localizedUrl("/unauthorized", pathLocale, req.url));
  }
  if (barePath.startsWith("/hub") && role !== "hub" && role !== "admin") {
    return NextResponse.redirect(localizedUrl("/unauthorized", pathLocale, req.url));
  }

  // --- PASS THROUGH with locale cookie ---
  const response = createFinalResponse();
  response.cookies.set("NEXT_LOCALE", activeLocale, { path: "/", sameSite: "lax" });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};