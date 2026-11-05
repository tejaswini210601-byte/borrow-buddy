import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
// Self-hosted fonts: bundled with the app instead of fetched from Google.
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Borrow Buddy · Borrow more. Buy less. Share better.",
    template: "%s · Borrow Buddy",
  },
  description:
    "Borrow the things you need from people nearby, and lend the things you rarely use.",
};

export const viewport: Viewport = {
  themeColor: "#174B3A",
};

/**
 * The root layout wraps every page in the app.
 * Shared navigation and footer are added per section in Phase 2.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-forest focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        {children}
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
