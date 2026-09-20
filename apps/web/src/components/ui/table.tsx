import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

// Tables name their columns and explain freshness. Rows are raised surfaces, so status text on them
// uses the corrected contrast values from the brand tokens.
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}
export function Th({ className, ...props }: ComponentProps<"th">) {
  return <th scope="col" className={cn("bg-raised px-3 py-2 text-left font-medium text-muted", className)} {...props} />;
}
export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("border-t border-line px-3 py-2 align-top text-body", className)} {...props} />;
}
export function Freshness({ at }: { at: string }) {
  return <p className="mt-2 text-sm text-muted">Last checked {new Date(at).toUTCString().replace(" GMT", " UTC")}.</p>;
}
