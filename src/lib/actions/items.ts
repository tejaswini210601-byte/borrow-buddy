"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import type { Category, Condition } from "@/lib/constants";
import { ITEM_BUCKET, MAX_ITEM_PHOTOS } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { readForm, type FormState } from "@/lib/validation/form-state";
import { ITEM_FIELDS, itemSchema } from "@/lib/validation/item";

/**
 * Server Actions for listings.
 *
 * Photos are uploaded straight from the browser to Supabase Storage (into a
 * folder named after the member's id, which the storage rules enforce).
 * The form then sends us only the photo PATHS, and we link them to the item.
 * We double-check every path starts with the member's own folder.
 */

const LOGIN_NEEDED: FormState = { status: "error", message: "Your login has expired. Log in again and retry." };

/** Photo paths from the form that really belong to this member. */
function ownPhotoPaths(formData: FormData, userId: string) {
  const re = new RegExp(`^${userId}/[A-Za-z0-9._-]+$`);
  return formData
    .getAll("photo")
    .filter((p): p is string => typeof p === "string" && re.test(p))
    .slice(0, MAX_ITEM_PHOTOS);
}

function friendly(message: string) {
  // Messages we raise ourselves in the database are written for people.
  if (/violates|constraint|permission denied|row-level/i.test(message)) {
    return "That didn't save because of a problem on our side. Please try again.";
  }
  return message;
}

export async function createItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_NEEDED;

  const values = readForm(formData, ITEM_FIELDS);
  const parsed = itemSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const d = parsed.data;
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from("items")
    .insert({
      lender_id: user.id,
      title: d.title,
      description: d.description,
      category: d.category as Category,
      condition: d.condition as Condition,
      area: d.area,
      max_days: d.maxDays,
      instructions: d.instructions,
    })
    .select("id")
    .single();
  if (error || !item) return { status: "error", message: friendly(error?.message ?? "Unknown error"), values };

  const photos = ownPhotoPaths(formData, user.id);
  if (photos.length) {
    await supabase.from("item_images").insert(photos.map((path, position) => ({ item_id: item.id, storage_path: path, position })));
  }

  updateTag("items");
  redirect(`/items/${item.id}?listed=1`);
}

export async function updateItem(itemId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_NEEDED;

  const values = readForm(formData, ITEM_FIELDS);
  const parsed = itemSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const d = parsed.data;
  const supabase = await createClient();

  // .eq("lender_id") makes sure people only edit their own listings
  // (the database's security rules check this too).
  const { data: updated, error } = await supabase
    .from("items")
    .update({
      title: d.title,
      description: d.description,
      category: d.category as Category,
      condition: d.condition as Condition,
      area: d.area,
      max_days: d.maxDays,
      instructions: d.instructions,
    })
    .eq("id", itemId)
    .eq("lender_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) return { status: "error", message: friendly(error.message), values };
  if (!updated) return { status: "error", message: "This listing wasn't found, or it isn't yours.", values };

  // Photos: remove the ones the person took out, then add new ones at the end.
  const removeIds = formData.getAll("removeImage").filter((v): v is string => typeof v === "string");
  if (removeIds.length) {
    const { data: removed } = await supabase.from("item_images").delete().eq("item_id", itemId).in("id", removeIds).select("storage_path");
    const paths = (removed ?? []).map((r) => r.storage_path);
    if (paths.length) await supabase.storage.from(ITEM_BUCKET).remove(paths);
  }
  const { data: remaining } = await supabase.from("item_images").select("id, position").eq("item_id", itemId).order("position");
  const photos = ownPhotoPaths(formData, user.id).slice(0, MAX_ITEM_PHOTOS - (remaining?.length ?? 0));
  // Renumber the kept photos 0, 1, 2… so there are no gaps.
  await Promise.all((remaining ?? []).map((img, i) => (img.position === i ? null : supabase.from("item_images").update({ position: i }).eq("id", img.id))));
  if (photos.length) {
    const start = remaining?.length ?? 0;
    await supabase.from("item_images").insert(photos.map((path, i) => ({ item_id: itemId, storage_path: path, position: start + i })));
  }

  updateTag("items");
  updateTag(`item:${itemId}`);
  redirect(`/items/${itemId}?saved=1`);
}

/** Pause a listing (hide it from Explore) or make it active again. */
export async function setItemStatus(itemId: string, status: "active" | "paused"): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_NEEDED;
  const supabase = await createClient();
  const { error } = await supabase.from("items").update({ status }).eq("id", itemId).eq("lender_id", user.id);
  if (error) return { status: "error", message: friendly(error.message) };
  updateTag("items");
  updateTag(`item:${itemId}`);
  refresh();
  return {
    status: "success",
    message: status === "paused" ? "Listing paused. It's hidden from Explore until you resume it." : "Listing is live again.",
  };
}

export async function deleteItem(itemId: string): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_NEEDED;
  const supabase = await createClient();

  const { data: images } = await supabase.from("item_images").select("storage_path").eq("item_id", itemId);
  const { data: deleted, error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId)
    .eq("lender_id", user.id)
    .select("id")
    .maybeSingle();
  // The database refuses to delete an item that's on loan, with a clear message.
  if (error) return { status: "error", message: friendly(error.message) };
  if (!deleted) return { status: "error", message: "This listing wasn't found, or it isn't yours." };

  const paths = (images ?? []).map((i) => i.storage_path);
  if (paths.length) await supabase.storage.from(ITEM_BUCKET).remove(paths);

  updateTag("items");
  updateTag(`item:${itemId}`);
  redirect("/dashboard/listings?deleted=1");
}
