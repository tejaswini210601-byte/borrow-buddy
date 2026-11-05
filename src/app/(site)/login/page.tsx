import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Log in" };

// Placeholder until Phase 4 (authentication).
export default function Page() {
  return (
    <ComingSoon
      title="Log in isn't open yet"
      description="Accounts are being built. Soon you'll log in here to request items and manage your listings."
    />
  );
}
