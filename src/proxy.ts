import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n";

/**
 * Next 16 renamed the `middleware` convention to `proxy`.
 * Sends every unprefixed path to the Arabic version: / -> /ar, /works -> /ar/works
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip _next internals, API routes, /admin (which is not localised), and
  // anything with a file extension.
  matcher: ["/((?!_next|api|admin|.*\\.).*)"],
};
