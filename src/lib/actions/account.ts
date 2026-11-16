"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { AVATAR_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { readForm, type FormState } from "@/lib/validation/form-state";

/** Server Actions for a member's profile and notifications. */

const LOGIN_NEEDED: FormState = { status: "error", message: "Your login has expired. Log in again and retry." };

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Enter at least 2 characters.").max(60, "Use 60 characters or fewer."),
  area: z.string().trim().max(60, "Use 60 characters or fewer."),
  bio: z.string().trim().max(500, "Keep your bio under 500 characters."),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_NEEDED;
  const values = readForm(formData, ["displayName", "area", "bio", "avatar"]);
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  // Avatar: "" = keep, "remove" = delete, or a new path in the member's own folder.
  let avatarPath: string | null | undefined = undefined;
  if (values.avatar === "remove") avatarPath = null;
  else if (new RegExp(`^${user.id}/avatar-[A-Za-z0-9._-]+$`).test(values.avatar)) avatarPath = values.avatar;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      area: parsed.data.area || null,
      bio: parsed.data.bio || null,
      ...(avatarPath !== undefined ? { avatar_path: avatarPath } : {}),
    })
    .eq("id", user.id);
  if (error) return { status: "error", message: "Your profile didn't save. Please try again.", values };

  // Tidy up: delete the old photo file if it was replaced or removed.
  if (avatarPath !== undefined && user.avatarPath && user.avatarPath !== avatarPath) {
    await supabase.storage.from(AVATAR_BUCKET).remove([user.avatarPath]);
  }

  updateTag("items"); // listings show the lender's name and photo
  refresh();
  return { status: "success", message: "Profile saved." };
}

/** Opening a notification marks it read, then goes where it points. */
export async function openNotification(id: string, link: string | null) {
  const user = await getCurrentUser();
  if (user) {
    const supabase = await createClient();
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id).is("read_at", null);
  }
  redirect(link && link.startsWith("/") && !link.startsWith("//") ? link : "/dashboard/notifications");
}

export async function markAllRead(): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_NEEDED;
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  refresh();
  return { status: "success", message: "All notifications marked as read." };
}
