"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

/**
 * A GET <form> that:
 * - re-submits itself whenever a dropdown changes, so filters apply instantly
 * - leaves empty fields out of the URL (/explore?category=tools, not ?q=&area=…)
 * Without JavaScript it still works as a normal form via the Search button.
 */
export function AutoSubmitForm({ children, action, ...props }: React.ComponentProps<"form"> & { action: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const submit = () => {
    if (!ref.current) return;
    const params = new URLSearchParams();
    const data = new FormData(ref.current);
    // Sorting defaults to "best match" when searching, otherwise "newest".
    const defaultSort = String(data.get("q") ?? "").trim() ? "relevance" : "newest";
    data.forEach((value, key) => {
      if (typeof value === "string" && value.trim() && !(key === "sort" && value === defaultSort)) {
        params.set(key, value.trim());
      }
    });
    const qs = params.toString();
    router.push(qs ? `${action}?${qs}` : action, { scroll: false });
  };

  return (
    <form
      ref={ref}
      action={action}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onChange={(e) => {
        if ((e.target as HTMLElement).tagName === "SELECT") submit();
      }}
      {...props}
    >
      {children}
    </form>
  );
}
