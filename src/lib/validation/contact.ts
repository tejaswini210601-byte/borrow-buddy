import { z } from "zod";

/**
 * Validation rules for the contact form, written with Zod.
 * The same schema is checked on the server, so even if someone bypasses
 * the browser form, bad data can't get through.
 */
export const CONTACT_TOPICS = [
  { value: "question", label: "A general question" },
  { value: "item", label: "Report a listing" },
  { value: "user", label: "Report a member" },
  { value: "bug", label: "Something isn't working" },
  { value: "safety", label: "A safety concern" },
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Enter your name.").max(80, "Use 80 characters or fewer."),
  email: z.email("Enter an email address like name@example.com.").max(200),
  topic: z.enum(CONTACT_TOPICS.map((t) => t.value) as [string, ...string[]], {
    error: "Choose what your message is about.",
  }),
  reference: z.string().trim().max(120).optional(),
  message: z
    .string()
    .trim()
    .min(10, "Write at least 10 characters so we can help.")
    .max(2000, "Keep your message under 2,000 characters."),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<keyof ContactInput, string[]>>;
  values?: Partial<Record<keyof ContactInput, string>>;
};
