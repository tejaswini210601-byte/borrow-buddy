"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { errorFor, fieldProps, FormMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestToBorrow } from "@/lib/actions/borrowing";
import { formatDayMonth } from "@/lib/format";
import { idle } from "@/lib/validation/form-state";

/**
 * The "request to borrow" form on an item page (for logged-in members).
 * It warns about already-booked dates before sending, but the database
 * makes the final check, so two people can never book the same days.
 */
export function RequestForm({
  itemId,
  lenderName,
  maxDays,
  today,
  booked,
}: {
  itemId: string;
  lenderName: string;
  maxDays: number | null;
  today: string;
  booked: { start_date: string; end_date: string }[];
}) {
  const [state, action, pending] = useActionState(requestToBorrow.bind(null, itemId), idle);
  const [start, setStart] = useState(state.values?.startDate ?? "");
  const [end, setEnd] = useState(state.values?.endDate ?? "");

  const days = start && end && end >= start ? Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1 : null;
  const tooLong = days !== null && maxDays !== null && days > maxDays;
  const clash = start && end && booked.some((b) => start <= b.end_date && end >= b.start_date);

  if (state.status === "success") {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-xl bg-white/10 p-4">
        <p className="flex gap-2 font-semibold">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-fresh" aria-hidden />
          {state.message}
        </p>
        <Button asChild variant="secondary" className="self-start">
          <Link href="/dashboard/requests">See your requests</Link>
        </Button>
      </div>
    );
  }

  const err = (f: string) => errorFor(state, f);
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <div className="[&_[role=alert]]:bg-white [&_[role=alert]]:text-destructive">
        <FormMessage state={state} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate" className="text-white">
            From
          </Label>
          <Input {...fieldProps("startDate", err("startDate"))} name="startDate" type="date" min={today} value={start} onChange={(e) => setStart(e.target.value)} required />
          {err("startDate") && <p id="startDate-err" className="text-xs text-tangerine">{err("startDate")}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endDate" className="text-white">
            Until
          </Label>
          <Input {...fieldProps("endDate", err("endDate"))} name="endDate" type="date" min={start || today} value={end} onChange={(e) => setEnd(e.target.value)} required />
          {err("endDate") && <p id="endDate-err" className="text-xs text-tangerine">{err("endDate")}</p>}
        </div>
      </div>

      <p aria-live="polite" className="text-sm text-white/85">
        {days !== null && (
          <>
            {days} {days === 1 ? "day" : "days"}
            {tooLong && <span className="font-semibold text-tangerine"> · the lender allows up to {maxDays}</span>}
            {clash && <span className="font-semibold text-tangerine"> · overlaps a booking</span>}
          </>
        )}
      </p>

      {booked.length > 0 && (
        <p className="text-xs text-white/75">
          Already booked:{" "}
          {booked.map((b) => `${formatDayMonth(b.start_date)} – ${formatDayMonth(b.end_date)}`).join(", ")}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message" className="text-white">
          Message to {lenderName} (optional)
        </Label>
        <Textarea
          {...fieldProps("message", err("message"))}
          name="message"
          rows={3}
          maxLength={1000}
          defaultValue={state.values?.message}
          placeholder="Say hello and what you need it for."
        />
      </div>

      <Button type="submit" size="lg" disabled={pending || tooLong || Boolean(clash)} className="w-full bg-tangerine text-charcoal hover:bg-[#f5b878]">
        {pending ? "Sending request…" : "Send request"}
      </Button>
    </form>
  );
}
