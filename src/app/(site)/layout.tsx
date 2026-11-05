import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Layout for public pages. The "(site)" folder is a route group: the
 * brackets mean it doesn't appear in the URL, it just lets these pages
 * share a header and footer. The dashboard gets a different layout later.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
