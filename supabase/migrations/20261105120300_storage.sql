-- =====================================================================
-- Borrow Buddy · Migration 4 of 4 · Photo storage
-- ---------------------------------------------------------------------
-- Two "buckets" (folders in Supabase Storage):
--   item-images  photos of listed items
--   avatars      profile photos
-- Both are publicly readable (so <img> tags just work), but people can
-- only upload into, change or delete files in a folder named after their
-- own user id: "<user id>/…". Size and file type are limited too.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('item-images', 'item-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars',     'avatars',     true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- (storage.foldername(name))[1] is the first folder in the file's path.
create policy "Members upload to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('item-images', 'avatars')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Members replace their own files"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('item-images', 'avatars')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id in ('item-images', 'avatars')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Members delete their own files"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('item-images', 'avatars')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
