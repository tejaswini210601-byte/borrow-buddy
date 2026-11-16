import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { safeNext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Route Handler for the links in Supabase's emails (confirm sign-up,
 * reset password). It turns the one-time code in the link into a login
 * session, then sends the person on to `next`.
 *
 * Supabase can send either `?code=` (the default) or `?token_hash=&type=`
 * (if you customise the email template), so we handle both.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && type
        ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        : { error: new Error("missing code") };

    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  const failed = new URL("/login", url.origin);
  failed.searchParams.set("error", "link");
  return NextResponse.redirect(failed);
}
