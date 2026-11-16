import { z } from "zod";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";

/**
 * Rules for a listing. They match the database's own checks (migration 1),
 * so people see a friendly message here before the database would refuse.
 */
export const itemSchema = z.object({
  title: z.string().trim().min(3, "Use at least 3 characters.").max(100, "Use 100 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(10, "Describe it in at least 10 characters: what it is, what's included, any quirks.")
    .max(2000, "Keep it under 2,000 characters."),
  category: z.enum(CATEGORIES.map((c) => c.value) as [string, ...string[]], { error: "Choose a category." }),
  condition: z.enum(CONDITIONS.map((c) => c.value) as [string, ...string[]], { error: "Choose the condition." }),
  area: z.string().trim().min(2, "Enter your neighbourhood, e.g. Niinivaara.").max(60, "Use 60 characters or fewer."),
  maxDays: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 365), "Enter a number of days from 1 to 365, or leave it empty.")
    .transform((v) => (v === "" ? null : Number(v))),
  instructions: z
    .string()
    .trim()
    .max(1000, "Keep it under 1,000 characters.")
    .transform((v) => v || null),
});

export const ITEM_FIELDS = ["title", "description", "category", "condition", "area", "maxDays", "instructions"] as const;
