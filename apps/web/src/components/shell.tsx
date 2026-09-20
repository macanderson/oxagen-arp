import Link from "next/link";
import type { ReactNode } from "react";

const nav = [
  { href: "/", label: "Home" },
  { href: "/send", label: "Send work" },
  { href: "/runs", label: "Runs" },
  { href: "/policies/model-routes", label: "Policies" },
  { href: "/spend", label: "Spend" },
  { href: "/devices", label: "Devices" },
] as const;

// Skip link, landmarks, and one polite live region for run state and steering receipts
// (certification/Mockups.md accessibility contract). Urgent uses an assertive region on its own.
export function Shell({ children, workspace = "Support" }: { children: ReactNode; workspace?: string }) {
  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-xl focus:bg-panel focus:px-3 focus:py-2">Skip to content</a>
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-[1120px] items-center gap-6 px-4 py-3">
          <Link href="/" className="font-display text-lg font-bold text-ink">oxagen</Link>
          <span className="rounded-full bg-raised px-2.5 py-0.5 text-sm text-muted">{workspace}</span>
          <nav aria-label="Primary" className="ml-auto flex gap-1">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-xl px-3 py-2 text-sm text-body hover:bg-raised">{n.label}</Link>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[1120px] px-4 py-6">{children}</main>
      <div id="live-polite" aria-live="polite" className="sr-only" />
      <div id="live-urgent" aria-live="assertive" className="sr-only" />
    </div>
  );
}
