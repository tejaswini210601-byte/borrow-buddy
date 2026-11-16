import { supabaseUrl } from "./supabase/env";

/**
 * Photos live in Supabase Storage "buckets". Both buckets are public, so a
 * photo's address can be built from its path without asking the server.
 */
export const ITEM_BUCKET = "item-images";
export const AVATAR_BUCKET = "avatars";

export const MAX_ITEM_PHOTOS = 6;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_ITEM_PHOTO_BYTES = 5 * 1024 * 1024; // matches the bucket limit
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function publicImageUrl(bucket: string, path: string | null | undefined) {
  if (!path || !supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
