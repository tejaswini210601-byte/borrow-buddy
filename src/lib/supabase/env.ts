/**
 * Reads the two public Supabase settings from environment variables.
 *
 * "NEXT_PUBLIC_" means the value is allowed in the browser. That's safe for
 * these two: the URL and the publishable key only grant what our database's
 * Row Level Security rules allow. The SECRET service-role key must never
 * get this prefix and is never used in this app's browser code.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export function requireSupabaseEnv() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase isn't configured yet. Copy .env.example to .env.local and fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see README).",
    );
  }
  return { url: supabaseUrl, key: supabasePublishableKey };
}
