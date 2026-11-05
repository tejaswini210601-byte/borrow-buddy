import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Your dashboard" };

// Placeholder until Phase 5 (dashboard).
export default function Page() {
  return (
    <ComingSoon
      title="Your dashboard isn't open yet"
      description="Soon you'll see your listings, requests and active loans here."
    />
  );
}
