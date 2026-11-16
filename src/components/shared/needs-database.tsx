import { DatabaseZap } from "lucide-react";
import { EmptyState } from "./states";

/**
 * Shown on member pages before Supabase is connected (no keys in the
 * environment yet), so the site explains itself instead of crashing.
 */
export function NeedsDatabase() {
  return (
    <EmptyState
      icon={DatabaseZap}
      title="Accounts aren't switched on yet"
      description="This page needs the database. Once Supabase is connected (see the README), logging in, listing and borrowing all work here."
    />
  );
}
