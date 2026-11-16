import { Suspense } from "react";
import { NeedsDatabase } from "@/components/shared/needs-database";
import { Skeleton } from "@/components/ui/skeleton";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * MemberSection — the part of a dashboard page that needs the logged-in
 * member. It streams in behind <Suspense> (the page title shows at once),
 * sends visitors to log in, and explains itself if the database isn't
 * connected yet. `children` is a function that receives the member.
 */
export function MemberSection({
  path,
  children,
}: {
  path: string;
  children: (user: CurrentUser) => Promise<React.ReactNode> | React.ReactNode;
}) {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <Inner path={path}>{children}</Inner>
    </Suspense>
  );
}

async function Inner({ path, children }: { path: string; children: (user: CurrentUser) => Promise<React.ReactNode> | React.ReactNode }) {
  if (!isSupabaseConfigured) return <NeedsDatabase />;
  const user = await requireUser(path);
  return <>{await children(user)}</>;
}

export function ListSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-36 rounded-xl" />
    </div>
  );
}

/** Today's date as YYYY-MM-DD (call only after reading the login). */
export const todayIso = () => new Date().toISOString().slice(0, 10);
