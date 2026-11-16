import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { AVATAR_BUCKET, publicImageUrl } from "./storage";
import { isSupabaseConfigured } from "./supabase/env";
import { createClient } from "./supabase/server";

/**
 * Who is logged in? This is the one place the app asks that question
 * (a "Data Access Layer"). Pages, layouts and actions all call it.
 *
 * `cache()` means: within ONE page request, the answer is worked out once
 * and reused, even if ten components ask.
 */
export type CurrentUser = {
  id: string;
  email: string | null;
  displayName: string;
  area: string | null;
  bio: string | null;
  avatarPath: string | null;
  avatarUrl: string | null;
  isModerator: boolean;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();

  // getUser() asks Supabase to confirm the login is real (not just trusting the cookie).
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, area, bio, avatar_path, is_moderator")
    .eq("id", data.user.id)
    .maybeSingle();

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    displayName: profile?.display_name ?? data.user.email?.split("@")[0] ?? "Member",
    area: profile?.area ?? null,
    bio: profile?.bio ?? null,
    avatarPath: profile?.avatar_path ?? null,
    avatarUrl: publicImageUrl(AVATAR_BUCKET, profile?.avatar_path),
    isModerator: profile?.is_moderator ?? false,
  };
});

/**
 * For pages that need a login. Visitors are sent to /login, and come back
 * to `next` afterwards.
 */
export async function requireUser(next: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Only allow redirects to our own pages (stops "open redirect" tricks). */
export function safeNext(next: unknown, fallback = "/dashboard") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
