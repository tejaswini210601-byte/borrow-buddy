import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "./env";

/** Pages that need a logged-in user. Visitors get sent to /login. */
const PROTECTED_PREFIXES = ["/dashboard", "/items/new"];

/**
 * Runs before every page request (called from src/proxy.ts).
 * 1. Refreshes the user's login session so it doesn't silently expire.
 * 2. Redirects logged-out visitors away from protected pages.
 *
 * This is a quick first check only. Every page and server action ALSO checks
 * the user itself, and the database's security rules are the final guard.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Before Supabase keys are added, let the public pages work normally.
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(supabaseUrl!, supabasePublishableKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Stop CDNs from caching a response that carries someone's session.
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // getClaims() verifies the login token — don't run code between
  // createServerClient and this call.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const path = request.nextUrl.pathname;
  if (!isLoggedIn && PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}
