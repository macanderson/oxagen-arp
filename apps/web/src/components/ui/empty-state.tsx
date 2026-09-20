import type { ReactNode } from "react";
import type { Read } from "@/data/read";

// Every screen has its own empty state with one next action, and one of the shared failure fixtures
// for a read that did not return a value. A failed read never becomes a blank page or a stack trace.
export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line p-8 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-1 max-w-prose text-muted">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ReadFailure({ read, permissionOwner = "the workspace owner" }: { read: Exclude<Read<unknown>, { ok: true }>; permissionOwner?: string }) {
  if (read.reason === "denied") {
    return <EmptyState title="You don’t have access to this view" body={`This needs the ${read.permission} right. Ask ${permissionOwner}.`} />;
  }
  if (read.reason === "pending_approval") {
    return <EmptyState title="Access requested" body={`Request ${read.accessRequestId} is waiting for an approver. Nothing was sent.`} />;
  }
  if (read.code === "not_wired") {
    return <EmptyState title="Not wired yet" body="This read has no live handler. Set OXAGEN_DATA_SOURCE=fixtures to see the fixture." />;
  }
  return <EmptyState title="This view could not be loaded" body={`The request failed with ${read.code} (${read.status}). Read the same operation receipt before retrying.`} />;
}
