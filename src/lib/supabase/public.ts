import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { requireSupabaseEnv } from "./env";

/**
 * Supabase client WITHOUT a logged-in user ("anonymous visitor").
 *
 * We use it for public data that looks the same for everyone, like the
 * Explore page. Because it never reads cookies, its results can be cached
 * and shared between visitors, which makes public pages fast.
 * Row Level Security still applies: it only sees what a visitor may see.
 */
export function createPublicClient() {
  const { url, key } = requireSupabaseEnv();
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
