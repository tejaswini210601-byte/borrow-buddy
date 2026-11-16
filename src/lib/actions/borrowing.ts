"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { readForm, type FormState } from "@/lib/validation/form-state";

/**
 * Server Actions for the borrowing workflow. Each one calls a database
 * function from migration 3 (supabase.rpc). Those functions check who is
 * asking and whether the step is allowed, then send the notifications,
 * so these actions stay short. Their error messages are written for
 * people, so we show them as they are.
 */

const LOGIN_NEEDED: FormState = { status: "error", message: "Your login has expired. Log in again and retry." };

function fail(message: string): FormState {
  if (/violates|constraint|permission denied|row-level|function/i.test(message)) {
    return { status: "error", message: "That didn't work because of a problem on our side. Please try again." };
  }
  return { status: "error", message };
}

/** After a step that changes whether an item is on loan, refresh the public pages. */
function done(message: string, availabilityChanged = false): FormState {
  if (availabilityChanged) updateTag("items");
  refresh();
  return { status: "success", message };
}

const isoDate = z.iso.date("Choose a date.");
const requestSchema = z
  .object({
    startDate: isoDate,
    endDate: isoDate,
    message: z.string().trim().max(1000, "Keep your message under 1,000 characters."),
  })
  .refine((d) => d.endDate >= d.startDate, { path: ["endDate"], message: "Choose a return date on or after the start date." });

// ---------------------------------------------------------------------
// Borrower
// ---------------------------------------------------------------------
export async function requestToBorrow(itemId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return LOGIN_NEEDED;
  const values = readForm(formData, ["startDate", "endDate", "message"]);
  const parsed = requestSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_borrow_request", {
    p_item_id: itemId,
    p_start_date: parsed.data.startDate,
    p_end_date: parsed.data.endDate,
    p_message: parsed.data.message || null,
  });
  if (error) return { ...fail(error.message), values };
  return done("Request sent! You'll get a notification when the lender replies.");
}

export async function cancelRequest(requestId: string): Promise<FormState> {
  if (!(await getCurrentUser())) return LOGIN_NEEDED;
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_request", { p_request_id: requestId });
  return error ? fail(error.message) : done("Request cancelled.");
}

// ---------------------------------------------------------------------
// Lender
// ---------------------------------------------------------------------
export async function approveRequest(requestId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getCurrentUser())) return LOGIN_NEEDED;
  const pickup = String(formData.get("pickup") ?? "").trim();
  if (pickup.length > 1000) return { status: "error", message: "Keep the pickup details under 1,000 characters." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_request", { p_request_id: requestId, p_pickup_details: pickup || null });
  return error ? fail(error.message) : done("Approved! The borrower has been told, and the loan is in your Lending tab.", true);
}

export async function rejectRequest(requestId: string): Promise<FormState> {
  if (!(await getCurrentUser())) return LOGIN_NEEDED;
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_request", { p_request_id: requestId });
  return error ? fail(error.message) : done("Request declined. The borrower has been told.");
}

// ---------------------------------------------------------------------
// Either side of a loan
// ---------------------------------------------------------------------
export async function cancelLoan(borrowingId: string): Promise<FormState> {
  if (!(await getCurrentUser())) return LOGIN_NEEDED;
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_borrowing", { p_borrowing_id: borrowingId });
  return error ? fail(error.message) : done("Loan cancelled. The other person has been told.", true);
}

export async function confirmReturn(borrowingId: string): Promise<FormState> {
  if (!(await getCurrentUser())) return LOGIN_NEEDED;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("confirm_return", { p_borrowing_id: borrowingId });
  if (error) return fail(error.message);
  return done(
    data === "completed"
      ? "Loan completed! You can now leave a review in your History."
      : "Return confirmed. We've asked the other person to confirm too.",
    true,
  );
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Choose a rating from 1 to 5 stars.").max(5),
  comment: z.string().trim().max(1000, "Keep your review under 1,000 characters."),
});

export async function submitReview(borrowingId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getCurrentUser())) return LOGIN_NEEDED;
  const values = readForm(formData, ["rating", "comment"]);
  const parsed = reviewSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Choose a star rating first.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_review", {
    p_borrowing_id: borrowingId,
    p_rating: parsed.data.rating,
    p_comment: parsed.data.comment || null,
  });
  return error ? { ...fail(error.message), values } : done("Thanks for your review!");
}
