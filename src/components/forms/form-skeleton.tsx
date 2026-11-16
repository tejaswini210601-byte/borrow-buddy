import { Skeleton } from "@/components/ui/skeleton";

/** Grey placeholder shown while a form's per-request part loads. */
export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading form">
      {Array.from({ length: fields }, (_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
      <Skeleton className="h-13 rounded-full" />
    </div>
  );
}
