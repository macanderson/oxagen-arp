// The result every read returns, in the shape macanderson/oxagen apps/app uses (ARCHITECTURE.md §3.3):
// a value, a denial, a pending approval, or an error, each a value a page renders. A page never
// throws on a failed read; it shows the failure fixture for that reason.
import type { InvokeResult } from "@oxagen-arp/kernel";

export type Read<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "denied"; permission: string }
  | { ok: false; reason: "pending_approval"; accessRequestId: string }
  | { ok: false; reason: "error"; code: string; status: number };

export const readOk = <T>(value: T): Read<T> => ({ ok: true, value });
export const readError = (code: string, status: number): Read<never> => ({ ok: false, reason: "error", code, status });

/** Turn a kernel result into a page read. Contract failures are errors a page can name. */
export function fromInvoke<T>(r: InvokeResult<T>): Read<T> {
  if (r.ok) return { ok: true, value: r.value };
  switch (r.reason) {
    case "denied": return { ok: false, reason: "denied", permission: r.permission };
    case "error": return readError(r.code, r.status);
    case "unknown_capability": return readError("unknown_capability", 404);
    case "surface_not_allowed": return readError("surface_not_allowed", 405);
    case "invalid_input": return readError("invalid_input", 422);
    case "invalid_output": return readError("invalid_output", 500);
    case "no_handler": return readError("not_wired", 501);
  }
}
