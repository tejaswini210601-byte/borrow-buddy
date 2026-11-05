"use server";

import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { contactSchema, type ContactState } from "@/lib/validation/contact";

/**
 * Server Action: runs on the server when the contact form is submitted.
 * 1. Validates the input with Zod.
 * 2. Saves the message (connected to the database in Phase 3).
 */
export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    topic: String(formData.get("topic") ?? ""),
    reference: String(formData.get("reference") ?? "") || undefined,
    message: String(formData.get("message") ?? ""),
  };

  const result = contactSchema.safeParse(raw);
  if (!result.success) {
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: z.flattenError(result.error).fieldErrors,
      values: raw,
    };
  }

  // TODO(Phase 3): when isSupabaseConfigured, insert into the `reports`
  // table and return { status: "success" }. Until then we fail honestly
  // instead of pretending the message was sent.
  void isSupabaseConfigured;
  return {
    status: "error",
    message: "Messages can't be sent yet because the database isn't connected. Please try again later.",
    values: raw,
  };
}
