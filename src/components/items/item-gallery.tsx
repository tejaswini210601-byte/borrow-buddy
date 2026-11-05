"use client";

import { useState } from "react";
import type { Category } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ItemImage } from "./item-image";

/** Photo gallery: one large photo plus clickable thumbnails. */
export function ItemGallery({
  images,
  title,
  category,
  children,
}: {
  images: string[];
  title: string;
  category: Category;
  children?: React.ReactNode; // overlay, e.g. the availability tag
}) {
  const [active, setActive] = useState(0);
  return (
    <div className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border bg-card">
        <ItemImage src={images[active]} alt={`${title}, photo ${active + 1} of ${Math.max(images.length, 1)}`} category={category} />
        {children}
      </div>
      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-pressed={active === i}
                className={cn(
                  "aspect-square w-full overflow-hidden rounded-lg border-2 transition-colors",
                  active === i ? "border-forest" : "border-transparent hover:border-forest/30",
                )}
              >
                <ItemImage src={src} alt="" category={category} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
