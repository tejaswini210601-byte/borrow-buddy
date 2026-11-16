"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { safeNext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { forgotSchema, logInSchema, newPasswordSchema, signUpSchema } from "@/lib/validation/auth";
import { readForm, type FormState } from "@/lib/validation/form-state";

/**
 * Server Actions for accounts. Each one runs on the server when a form is
 * submitted: it validates the input with Zod, then asks Supabase Auth to do
 * the real work (Supabase stores passwords safely, hashed, never in our tables).
 */

const NOT_CONNECTED: FormState = {
  status: "error",
  message: "Accounts aren't available yet because the database isn't connected. Please try again later.",
};

/** The site's address, used in the links inside sign-up and reset emails. */
async function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData, ["displayName", "area", "email", "password", "next"]);
  const parsed = signUpSchema.safeParse(values);
  // Never send a password back to the browser.
  const safeValues = { displayName: values.displayName, area: values.area, email: values.email, next: values.next };
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values: safeValues };
  }
  if (!isSupabaseConfigured) return { ...NOT_CONNECTED, values: safeValues };

  const supabase = await createClient();
  const next = safeNext(values.next);
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Saved with the account; the database copies them into the profile.
      data: { display_name: parsed.data.displayName, area: parsed.data.area },
      emailRedirectTo: `${await siteUrl()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    const taken = /registered|exists/i.test(error.message);
    return {
      status: "error",
      message: taken ? "An account with this email already exists. Log in instead." : error.message,
      values: safeValues,
    };
  }

  // If email confirmation is switched on in Supabase, there's no session yet:
  // the person must click the link in their email first.
  if (!data.session) {
    return {
      status: "success",
      message: `We sent a confirmation link to ${parsed.data.email}. Open it to finish creating your account.`,
    };
  }
  redirect(next);
}

export async function logIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData, ["email", "password", "next"]);
  const parsed = logInSchema.safeParse(values);
  const safeValues = { email: values.email, next: values.next };
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values: safeValues };
  }
  if (!isSupabaseConfigured) return { ...NOT_CONNECTED, values: safeValues };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const unconfirmed = /confirm/i.test(error.message);
    return {
      status: "error",
      // Same message for "no such email" and "wrong password", so nobody can
      // use this form to find out who has an account.
      message: unconfirmed
        ? "Confirm your email first. Open the link we sent when you signed up."
        : "That email and password don't match. Try again or reset your password.",
      values: safeValues,
    };
  }
  redirect(safeNext(values.next));
}

export async function logOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData, ["email"]);
  const parsed = forgotSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted field.", fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }
  if (!isSupabaseConfigured) return { ...NOT_CONNECTED, values };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteUrl()}/auth/confirm?next=/reset-password`,
  });
  // Always the same answer, whether or not the email has an account.
  return {
    status: "success",
    message: `If ${parsed.data.email} has an account, we've sent it a link to choose a new password.`,
  };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = readForm(formData, ["password", "confirm"]);
  const parsed = newPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  if (!isSupabaseConfigured) return NOT_CONNECTED;

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return {
      status: "error",
      message: /session/i.test(error.message)
        ? "This reset link has expired. Ask for a new one."
        : error.message,
    };
  }
  redirect("/dashboard?updated=password");
}
