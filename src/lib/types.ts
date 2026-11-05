import type { Category, Condition } from "./constants";

/**
 * The shape of the data the pages work with.
 * These mirror the database tables we create in Phase 3, so swapping
 * sample data for real data later won't change the page code.
 */
export type PublicProfile = {
  id: string;
  displayName: string;
  bio: string | null;
  area: string; // general area only — never a street address
  avatarUrl: string | null;
  memberSince: string; // ISO date
};

export type Availability = "available" | "on_loan" | "paused";

export type Item = {
  id: string;
  title: string;
  description: string;
  category: Category;
  condition: Condition;
  area: string;
  availability: Availability;
  dueBack: string | null; // ISO date, when on loan
  maxDays: number | null; // optional borrowing limit
  instructions: string | null;
  images: string[]; // public image URLs (empty = illustrated placeholder)
  lender: PublicProfile;
  createdAt: string;
  isSample: boolean; // sample listings are always labelled in the UI
};
