"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { errorFor, Field, fieldProps, FormMessage } from "@/components/forms/field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions/account";
import { initials } from "@/lib/format";
import { ALLOWED_IMAGE_TYPES, AVATAR_BUCKET, MAX_AVATAR_BYTES } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { idle } from "@/lib/validation/form-state";

/**
 * Edit your name, area, bio and photo. The photo uploads straight from the
 * browser into your own folder in Storage; saving the form links it.
 */
export function ProfileForm({
  userId,
  initial,
  avatarUrl,
}: {
  userId: string;
  initial: { displayName: string; area: string; bio: string };
  avatarUrl: string | null;
}) {
  const [state, action, pending] = useActionState(updateProfile, idle);
  const [preview, setPreview] = useState(avatarUrl);
  const [avatar, setAvatar] = useState(""); // "" keep · "remove" · new path
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const v = state.values ?? initial;
  const err = (f: string) => errorFor(state, f);

  // Once saved, the new photo is the current one: don't send it twice.
  useEffect(() => {
    if (state.status === "success") setAvatar(""); // eslint-disable-line react-hooks/set-state-in-effect
  }, [state]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return toast.error("Use a JPG, PNG or WebP photo.");
    if (file.size > MAX_AVATAR_BYTES) return toast.error("Choose a photo under 2 MB.");
    setUploading(true);
    const path = `${userId}/avatar-${crypto.randomUUID()}.${file.type.split("/")[1].replace("jpeg", "jpg")}`;
    const { error } = await createClient().storage.from(AVATAR_BUCKET).upload(path, file, { contentType: file.type });
    setUploading(false);
    if (error) return toast.error("The photo didn't upload. Try again.");
    setAvatar(path);
    setPreview(URL.createObjectURL(file));
    toast.info("Photo ready. Save to update your profile.");
  }

  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      <FormMessage state={state} />
      <input type="hidden" name="avatar" value={avatar} />

      <div className="flex items-center gap-4">
        <Avatar className="size-20">
          {preview && <AvatarImage src={preview} alt="Your profile photo" />}
          <AvatarFallback className="text-xl">{initials(v.displayName || "?")}</AvatarFallback>
        </Avatar>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="animate-spin" aria-hidden /> : <Camera aria-hidden />}
            {uploading ? "Uploading…" : preview ? "Change photo" : "Add a photo"}
          </Button>
          {preview && (
            <Button type="button" variant="ghost" size="sm" onClick={() => { setPreview(null); setAvatar("remove"); }}>
              Remove
            </Button>
          )}
          <input ref={fileRef} type="file" accept={ALLOWED_IMAGE_TYPES.join(",")} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </div>
      </div>

      <Field id="displayName" label="Name" hint="Shown on your listings and reviews." error={err("displayName")}>
        <Input {...fieldProps("displayName", err("displayName"), true)} name="displayName" maxLength={60} defaultValue={v.displayName} required />
      </Field>
      <Field id="area" label="Area" hint="A neighbourhood only, e.g. Niinivaara." error={err("area")}>
        <Input {...fieldProps("area", err("area"), true)} name="area" maxLength={60} defaultValue={v.area} />
      </Field>
      <Field id="bio" label="About you (optional)" hint="A sentence or two helps people trust you." error={err("bio")}>
        <Textarea {...fieldProps("bio", err("bio"), true)} name="bio" rows={3} maxLength={500} defaultValue={v.bio} />
      </Field>
      <Button type="submit" disabled={pending || uploading} className="self-start">
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
