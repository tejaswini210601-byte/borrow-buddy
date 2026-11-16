"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { FormMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitReview } from "@/lib/actions/borrowing";
import { cn } from "@/lib/utils";
import { idle } from "@/lib/validation/form-state";

/**
 * Leave a 1–5 star review after a completed loan.
 * The stars are real radio buttons, so they work with a keyboard
 * (arrow keys) and screen readers.
 */
export function ReviewForm({ borrowingId, name }: { borrowingId: string; name: string }) {
  const [state, action, pending] = useActionState(submitReview.bind(null, borrowingId), idle);
  const [rating, setRating] = useState(Number(state.values?.rating) || 0);
  const [hover, setHover] = useState(0);

  if (state.status === "success") return <FormMessage state={state} />;

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg bg-muted/60 p-4">
      <FormMessage state={state} />
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-charcoal">How was it, lending or borrowing with {name}?</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" />
              <Star
                aria-hidden
                className={cn(
                  "size-7 rounded-sm text-tangerine transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-forest",
                  (hover || rating) >= n ? "fill-tangerine" : "fill-transparent text-stone/50",
                )}
              />
              <span className="sr-only">
                {n} {n === 1 ? "star" : "stars"}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`comment-${borrowingId}`}>A few words (optional)</Label>
        <Textarea id={`comment-${borrowingId}`} name="comment" rows={2} maxLength={1000} defaultValue={state.values?.comment} />
      </div>
      <Button type="submit" size="sm" disabled={pending || rating === 0} className="self-start">
        {pending ? "Sending…" : "Send review"}
      </Button>
    </form>
  );
}
