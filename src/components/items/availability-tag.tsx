import { LendingTag } from "@/components/brand/lending-tag";
import { formatDayMonth } from "@/lib/format";
import type { Item } from "@/lib/types";

/** The lending tag that hangs on every item: available, or due back on a date. */
export function AvailabilityTag({ item, className }: { item: Item; className?: string }) {
  if (item.availability === "on_loan") {
    return (
      <LendingTag tone="tangerine" className={className}>
        {item.dueBack ? `On loan · back ${formatDayMonth(item.dueBack)}` : "On loan"}
      </LendingTag>
    );
  }
  if (item.availability === "paused") {
    return (
      <LendingTag tone="cream" className={className}>
        Not lending right now
      </LendingTag>
    );
  }
  return (
    <LendingTag tone="fresh" className={className}>
      Available
    </LendingTag>
  );
}
