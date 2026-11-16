import { z } from "zod";

/** Validation rules for the account forms (checked again on the server). */
const email = z.email("Enter an email address like name@example.com.").max(200);
const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.");

export const signUpSchema = z.object({
  displayName: z.string().trim().min(2, "Enter at least 2 characters.").max(60, "Use 60 characters or fewer."),
  area: z.string().trim().max(60, "Use 60 characters or fewer."),
  email,
  password,
});

export const logInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const forgotSchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "The passwords don't match." });
