import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-xl border border-line bg-panel p-4", className)} {...props} />;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("mb-3 text-xl font-semibold", className)}>{children}</h2>;
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-raised p-3">
      <div className="text-sm text-muted">{label}</div>
      <div className="tabular text-2xl font-semibold text-ink">{value}</div>
      {hint ? <div className="text-sm text-muted">{hint}</div> : null}
    </div>
  );
}

/** Money in minor units, aligned at the decimal by the tabular class. */
export function usd(minor: number): string {
  return `$${(minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
