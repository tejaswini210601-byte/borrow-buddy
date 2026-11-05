"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "./env";

/**
 * Supabase client for code that runs in the BROWSER
 * (Client Components, e.g. an image-upload widget).
 */
export function createClient() {
  const { url, key } = requireSupabaseEnv();
  return createBrowserClient(url, key);
}
