import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Listing items" };

// Placeholder until Phase 4 (item listings).
export default function Page() {
  return (
    <ComingSoon
      title="Listing items isn't open yet"
      description="Soon you'll list an item here with photos, its condition and your borrowing rules."
    />
  );
}
