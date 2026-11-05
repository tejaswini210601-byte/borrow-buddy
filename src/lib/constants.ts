/**
 * Shared lists used across the app (forms, filters, badges).
 * The `value` is what's stored in the database; the `label` is what people see.
 * These must match the enum types in the database migration.
 */
import {
  Armchair,
  BookOpen,
  Bike,
  Blocks,
  CookingPot,
  Laptop,
  Package,
  Shirt,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const CATEGORIES = [
  { value: "electronics", label: "Electronics", icon: Laptop },
  { value: "books", label: "Books", icon: BookOpen },
  { value: "tools", label: "Tools", icon: Wrench },
  { value: "sports_outdoors", label: "Sports and outdoors", icon: Bike },
  { value: "kitchen", label: "Kitchen appliances", icon: CookingPot },
  { value: "home_garden", label: "Home and garden", icon: Armchair },
  { value: "clothing", label: "Clothing and accessories", icon: Shirt },
  { value: "toys_games", label: "Toys and games", icon: Blocks },
  { value: "other", label: "Other", icon: Package },
] as const satisfies readonly { value: string; label: string; icon: LucideIcon }[];

export type Category = (typeof CATEGORIES)[number]["value"];

export const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
] as const;

export type Condition = (typeof CONDITIONS)[number]["value"];

/** Borrowing request lifecycle (see the brief, section G). */
export const REQUEST_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
  { value: "active", label: "Active" },
  { value: "returned", label: "Returned" },
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number]["value"];

export const labelFor = <T extends { value: string; label: string }>(
  list: readonly T[],
  value: string,
) => list.find((x) => x.value === value)?.label ?? value;
