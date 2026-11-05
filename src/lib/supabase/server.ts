import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "./env";

/**
 * Supabase client for code that runs on the SERVER
 * (Server Components, Server Actions, Route Handlers).
 *
 * It reads the logged-in user's session from cookies, so database queries
 * run "as that user" and Row Level Security applies to them.
 * Create a new one per request — never share it between users.
 */
export async function createClient() {
  const { url, key } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components can't set cookies. That's fine: the proxy
          // (src/proxy.ts) refreshes the session cookie on every request.
        }
      },
    },
  });
}
