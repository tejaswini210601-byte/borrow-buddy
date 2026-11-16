"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { ALLOWED_IMAGE_TYPES, ITEM_BUCKET, MAX_ITEM_PHOTO_BYTES, MAX_ITEM_PHOTOS } from "@/lib/storage";
import { cn } from "@/lib/utils";

type Existing = { id: string; url: string };
type Uploaded = { path: string; url: string };

/**
 * PhotoPicker — choose photos and upload them straight to Supabase Storage
 * from the browser (faster, and big files never pass through our server).
 *
 * It adds hidden <input>s to the surrounding form:
 *   photo=<path>        for each new photo
 *   removeImage=<id>    for each existing photo the person removed
 * The Server Action reads those when the form is saved.
 */
export function PhotoPicker({ userId, existing = [] }: { userId: string; existing?: Existing[] }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [kept, setKept] = useState(existing);
  const [removed, setRemoved] = useState<string[]>([]);
  const [uploaded, setUploaded] = useState<Uploaded[]>([]);
  const [uploading, setUploading] = useState(0);

  const total = kept.length + uploaded.length + uploading;
  const room = MAX_ITEM_PHOTOS - total;

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const chosen = [...files].slice(0, room);
    if (files.length > room) toast.info(`You can add up to ${MAX_ITEM_PHOTOS} photos.`);

    const supabase = createClient();
    setUploading((n) => n + chosen.length);
    await Promise.all(
      chosen.map(async (file) => {
        try {
          if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error(`${file.name}: use a JPG, PNG or WebP photo.`);
          if (file.size > MAX_ITEM_PHOTO_BYTES) throw new Error(`${file.name} is over 5 MB. Choose a smaller photo.`);
          const ext = file.type.split("/")[1].replace("jpeg", "jpg");
          const path = `${userId}/${crypto.randomUUID()}.${ext}`;
          const { error } = await supabase.storage.from(ITEM_BUCKET).upload(path, file, { contentType: file.type });
          if (error) throw new Error(`${file.name} didn't upload. Try again.`);
          setUploaded((u) => [...u, { path, url: URL.createObjectURL(file) }]);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "A photo didn't upload.");
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
    if (inputRef.current) inputRef.current.value = "";
  }

  // If someone chose photos before the page finished loading its
  // JavaScript, the change event was missed: pick those files up now.
  useEffect(() => {
    if (inputRef.current?.files?.length) void onFiles(inputRef.current.files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* What gets sent with the form */}
      {uploaded.map((u) => (
        <input key={u.path} type="hidden" name="photo" value={u.path} />
      ))}
      {removed.map((id) => (
        <input key={id} type="hidden" name="removeImage" value={id} />
      ))}

      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4" aria-label="Photos">
        {kept.map((img, i) => (
          <Thumb key={img.id} url={img.url} label={`Photo ${i + 1}`} cover={i === 0} onRemove={() => {
            setKept((k) => k.filter((x) => x.id !== img.id));
            setRemoved((r) => [...r, img.id]);
          }} />
        ))}
        {uploaded.map((img, i) => (
          <Thumb key={img.path} url={img.url} label={`Photo ${kept.length + i + 1}`} cover={kept.length + i === 0} onRemove={() =>
            setUploaded((u) => u.filter((x) => x.path !== img.path))
          } />
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <li key={`up-${i}`} className="flex aspect-square items-center justify-center rounded-lg bg-muted">
            <Loader2 className="size-5 animate-spin text-stone" aria-hidden />
            <span className="sr-only">Uploading…</span>
          </li>
        ))}
        {room > 0 && (
          <li>
            <label
              htmlFor={inputId}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-forest/25 bg-card text-center text-xs font-semibold text-forest transition-colors hover:border-forest hover:bg-fresh-soft focus-within:outline-2 focus-within:outline-forest"
            >
              <ImagePlus className="size-6" aria-hidden />
              Add photos
              <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                multiple
                className="sr-only"
                onChange={(e) => onFiles(e.target.files)}
              />
            </label>
          </li>
        )}
      </ul>
      <p className="text-xs text-muted-foreground">
        Up to {MAX_ITEM_PHOTOS} photos, JPG, PNG or WebP, 5 MB each. The first photo is the cover. No photos? A
        drawing of the category is shown instead.
      </p>
    </div>
  );
}

function Thumb({ url, label, cover, onRemove }: { url: string; label: string; cover: boolean; onRemove: () => void }) {
  return (
    <li className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={label} className="size-full object-cover" />
      {cover && (
        <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-forest px-1.5 py-0.5 text-[0.65rem] font-bold text-white">Cover</span>
      )}
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          "absolute top-1.5 right-1.5 flex size-7 cursor-pointer items-center justify-center rounded-full bg-charcoal/75 text-white hover:bg-destructive",
        )}
        aria-label={`Remove ${label.toLowerCase()}`}
      >
        <X className="size-4" aria-hidden />
      </button>
    </li>
  );
}
