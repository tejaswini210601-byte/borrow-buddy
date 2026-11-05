"use server";

import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { contactSchema, type ContactInput, type ContactState } from "@/lib/validation/contact";

/**
 * Server Action: runs on the server when the contact form is submitted.
 * 1. Validates the input with Zod (never trust the browser).
 * 2. Saves it to the `reports` table. The database's security rules allow
 *    anyone to add a report, but not to read other people's reports.
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

  if (!isSupabaseConfigured) {
    return {
      status: "error",
      message: "Messages can't be sent yet because the database isn't connected. Please try again later.",
      values: raw,
    };
  }

  const input: ContactInput = result.data;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  const { error } = await supabase.from("reports").insert({
    reporter_id: claims?.claims?.sub ?? null,
    reporter_name: input.name,
    reporter_email: input.email,
    kind: input.topic as "question" | "item" | "user" | "bug" | "safety",
    reference: input.reference ?? null,
    message: input.message,
  });

  if (error) {
    console.error("contact form insert failed", error);
    return {
      status: "error",
      message: "Your message wasn't sent because of a problem on our side. Please try again in a few minutes.",
      values: raw,
    };
  }

  return {
    status: "success",
    message: "Message sent. We'll reply to the email address you gave, usually within two working days.",
  };
}
