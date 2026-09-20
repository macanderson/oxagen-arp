import { AlertTriangle, Check, CircleDashed, Clock, OctagonX, Pause, Receipt, UserCheck, XCircle } from "lucide-react";
import type { RunState } from "@oxagen-arp/kernel";
import { cn } from "@/lib/cn";

// Every state needs a word and a shape; color is the second cue (brand spec). The vocabulary is the
// one list the brand spec fixes; the label map is the only place a state becomes words.
type Tone = "allowed" | "approval" | "denied" | "failed" | "urgent" | "verified" | "pending" | "held";

const runLabel: Record<RunState, { label: string; tone: Tone }> = {
  queued: { label: "Queued", tone: "pending" },
  waiting_for_device: { label: "Waiting for a device", tone: "pending" },
  waiting_for_capacity: { label: "Waiting for capacity", tone: "pending" },
  starting: { label: "Starting", tone: "pending" },
  running: { label: "Running", tone: "allowed" },
  pause_requested: { label: "Pause requested", tone: "held" },
  pausing: { label: "Pausing", tone: "held" },
  paused: { label: "Paused", tone: "held" },
  resuming: { label: "Resuming", tone: "pending" },
  stopping: { label: "Stopping", tone: "held" },
  stopped: { label: "Stopped", tone: "denied" },
  blocked: { label: "Blocked", tone: "denied" },
  expired: { label: "Expired", tone: "pending" },
  cancelled: { label: "Cancelled", tone: "pending" },
  completed: { label: "Completed", tone: "verified" },
  outcome_unknown: { label: "Outcome unknown", tone: "urgent" },
};

const toneClass: Record<Tone, string> = {
  allowed: "text-allowed", approval: "text-approval", denied: "text-denied", failed: "text-failed",
  urgent: "text-urgent", verified: "text-verified", pending: "text-pending border-dashed", held: "text-ink border-double border-4",
};
const toneIcon: Record<Tone, typeof Check> = {
  allowed: Check, approval: UserCheck, denied: OctagonX, failed: XCircle, urgent: AlertTriangle, verified: Receipt, pending: CircleDashed, held: Pause,
};

export function StatusPill({ tone, label, className }: { tone: Tone; label: string; className?: string }) {
  const Icon = toneIcon[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-sm font-medium", toneClass[tone], className)}>
      <Icon aria-hidden className="size-3.5" />
      {label}
    </span>
  );
}

export function RunStatePill({ state, className }: { state: RunState; className?: string }) {
  const { label, tone } = runLabel[state];
  return <StatusPill tone={tone} label={label} className={className} />;
}

export function PresencePill({ presence }: { presence: "online" | "stale" | "offline" }) {
  const map = { online: { tone: "allowed" as Tone, label: "Online" }, stale: { tone: "pending" as Tone, label: "Stale" }, offline: { tone: "pending" as Tone, label: "Offline" } };
  const { tone, label } = map[presence];
  return <StatusPill tone={tone} label={label} />;
}

export { Clock as ClockIcon };
