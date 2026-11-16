import { DashboardNav } from "@/components/dashboard/dashboard-nav";

/**
 * Layout for every /dashboard page: the tabs on the left (top on phones)
 * and the page itself on the right. Nested layouts like this one sit
 * inside the (site) layout, so the header and footer still show.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[13rem_1fr] lg:gap-12">
      <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <DashboardNav />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
