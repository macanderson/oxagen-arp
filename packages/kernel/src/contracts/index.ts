// The first ARP capabilities. Each file registers its contracts on import; importing this module
// populates the registry every binder reads. Names follow the API spec's operation ids.
import { z } from "zod";
import { registerCapability } from "../registry.ts";

export const instant = z.string().datetime({ offset: true });
export const publicId = (prefix: string) => z.string().regex(new RegExp(`^${prefix}_[0-9a-z]+$`));

// Run and target states are the one vocabulary the brand spec fixes; no surface adds a synonym.
export const runState = z.enum([
  "queued", "waiting_for_device", "waiting_for_capacity", "starting", "running", "pause_requested",
  "pausing", "paused", "resuming", "stopping", "stopped", "blocked", "expired", "cancelled",
  "completed", "outcome_unknown",
]);
export type RunState = z.infer<typeof runState>;

export const money = z.object({ currency: z.literal("USD"), minor: z.number().int().nonnegative() });

export const workspaceSummary = z.object({
  id: publicId("ws"),
  slug: z.string().min(1),
  name: z.string().min(1),
  state: z.enum(["active", "suspended", "revoked"]),
  defaultBranch: z.string().min(1),
  modelRouteCount: z.number().int().nonnegative(),
});

export const workspaceList = registerCapability({
  name: "workspace.list",
  domain: "workspace",
  description: "List the workspaces the caller may see in the org.",
  mode: "sync",
  surfaces: ["api", "mcp", "cli", "app"],
  mutates: false,
  scoped: false,
  input: z.object({}),
  output: z.object({ items: z.array(workspaceSummary) }),
});

export const runSummary = z.object({
  id: publicId("run"),
  workRequestId: publicId("wrq"),
  title: z.string().min(1),
  agent: z.object({ personaId: publicId("agp"), name: z.string(), version: z.number().int().positive() }),
  target: z.object({ id: publicId("tgt"), harness: z.enum(["codex", "claude_code", "custom"]), presence: z.enum(["online", "stale", "offline"]) }),
  state: runState,
  stateReason: z.string().nullable(),
  spend: z.object({ settled: money, held: money, remaining: money, bindingScope: z.string() }),
  startedAt: instant.nullable(),
  updatedAt: instant,
});

export const runList = registerCapability({
  name: "run.list",
  domain: "run",
  description: "List runs in the workspace, most recently updated first.",
  mode: "sync",
  surfaces: ["api", "mcp", "cli", "app"],
  mutates: false,
  input: z.object({ state: runState.optional(), limit: z.number().int().min(1).max(200).default(50) }),
  output: z.object({ items: z.array(runSummary), nextCursor: z.string().nullable() }),
});

export const runEvent = z.object({
  seq: z.number().int().nonnegative(),
  at: instant,
  kind: z.enum(["model_request", "tool_call", "tool_result", "steering", "pause", "resume", "budget", "report"]),
  summary: z.string(),
  redacted: z.boolean(),
});

export const runGet = registerCapability({
  name: "run.get",
  domain: "run",
  description: "One run with its recent events and receipts.",
  mode: "sync",
  surfaces: ["api", "mcp", "cli", "app"],
  mutates: false,
  input: z.object({ runId: publicId("run") }),
  output: z.object({ run: runSummary, events: z.array(runEvent), pauseBoundaryId: publicId("pse").nullable() }),
});

const runCommandOutput = z.object({ operationId: publicId("op"), run: runSummary });

export const runPause = registerCapability({
  name: "run.pause",
  domain: "run",
  description: "Ask a run to pause. The run shows pause requested until the desktop guard proves the stop.",
  mode: "async",
  surfaces: ["api", "mcp", "cli", "app", "agent"],
  mutates: true,
  agent: { toolDescription: "Request a pause; returns an operation id, not proof of a stop." },
  input: z.object({ runId: publicId("run"), idempotencyKey: z.string().min(1).max(200) }),
  output: runCommandOutput,
});

export const runResume = registerCapability({
  name: "run.resume",
  domain: "run",
  description: "Resume a confirmed pause from its boundary with fresh checks.",
  mode: "async",
  surfaces: ["api", "mcp", "cli", "app"],
  mutates: true,
  input: z.object({ runId: publicId("run"), pauseBoundaryId: publicId("pse"), idempotencyKey: z.string().min(1).max(200) }),
  output: runCommandOutput,
});

export const runStop = registerCapability({
  name: "run.stop",
  domain: "run",
  description: "Stop a run. A stopped run cannot resume; send new work to continue.",
  mode: "async",
  surfaces: ["api", "mcp", "cli", "app"],
  mutates: true,
  agent: { destructive: true },
  input: z.object({ runId: publicId("run"), idempotencyKey: z.string().min(1).max(200) }),
  output: runCommandOutput,
});

export const runSteer = registerCapability({
  name: "run.steer",
  domain: "run",
  description: "Deliver steering to a run at its next boundary, or interrupt and apply it after a confirmed pause.",
  mode: "async",
  surfaces: ["api", "mcp", "cli", "app", "agent"],
  mutates: true,
  input: z.object({ runId: publicId("run"), message: z.string().min(1).max(20000), interrupt: z.boolean().default(false), idempotencyKey: z.string().min(1).max(200) }),
  output: z.object({ steeringId: publicId("str"), delivery: z.enum(["accepted", "delivered", "boundary_reached", "applied", "queued_for_reconnect"]) }),
});

export const workSubmit = registerCapability({
  name: "work.submit",
  domain: "work",
  description: "Submit a work request for a work order to one or more targets. Acceptance is not a start.",
  mode: "async",
  surfaces: ["api", "mcp", "cli", "app"],
  mutates: true,
  input: z.object({
    workOrderId: publicId("wo"),
    targetIds: z.array(publicId("tgt")).min(1),
    prompt: z.string().min(1).max(50000),
    idempotencyKey: z.string().min(1).max(200),
  }),
  output: z.object({
    workRequestId: publicId("wrq"),
    targets: z.array(z.object({ targetId: publicId("tgt"), state: z.enum(["queued", "waiting_for_device", "waiting_for_capacity", "starting", "started", "blocked", "expired", "cancelled"]) })),
  }),
});

export const workCancel = registerCapability({
  name: "work.cancel",
  domain: "work",
  description: "Withdraw a work request that has not started; started runs receive a stop request.",
  mode: "async",
  surfaces: ["api", "mcp", "cli", "app"],
  mutates: true,
  input: z.object({ workRequestId: publicId("wrq"), idempotencyKey: z.string().min(1).max(200) }),
  output: z.object({ workRequestId: publicId("wrq"), cancelled: z.number().int().nonnegative(), stopRequested: z.number().int().nonnegative() }),
});

export const budgetScope = z.object({
  scope: z.enum(["org", "workspace", "operator", "agent", "work_order"]),
  label: z.string(),
  cap: money,
  settled: money,
  held: money,
  remaining: money,
  period: z.string(),
});

export const budgetStatus = registerCapability({
  name: "budget.status",
  domain: "budget",
  description: "Spent, held, and remaining funds for every scope that binds the caller.",
  mode: "sync",
  surfaces: ["api", "mcp", "cli", "app"],
  mutates: false,
  input: z.object({ agentId: publicId("agp").optional() }),
  output: z.object({ scopes: z.array(budgetScope), tightest: z.string() }),
});

export const deviceSummary = z.object({
  id: publicId("dev"),
  name: z.string(),
  platform: z.enum(["macos", "windows", "linux", "remote"]),
  status: z.enum(["enrolled", "suspended", "revoked"]),
  presence: z.enum(["online", "stale", "offline"]),
  lastSeenAt: instant.nullable(),
  targets: z.array(z.object({ id: publicId("tgt"), harness: z.enum(["codex", "claude_code", "custom"]), controlLevel: z.enum(["strict", "observed", "unsupported"]) })),
});

export const deviceList = registerCapability({
  name: "device.list",
  domain: "device",
  description: "Enrolled devices and the harness targets each one hosts.",
  mode: "sync",
  surfaces: ["api", "mcp", "cli", "app"],
  mutates: false,
  input: z.object({}),
  output: z.object({ items: z.array(deviceSummary) }),
});

export const deviceRevoke = registerCapability({
  name: "device.revoke",
  domain: "device",
  description: "Revoke a device. Its runs stop at their next gate; enrolling again creates a new device.",
  mode: "sync",
  surfaces: ["api", "cli", "app"],
  mutates: true,
  agent: { destructive: true },
  input: z.object({ deviceId: publicId("dev"), idempotencyKey: z.string().min(1).max(200) }),
  output: z.object({ device: deviceSummary, authorityEpoch: z.number().int().positive() }),
});

export const modelRoute = z.object({
  id: publicId("mr"),
  provider: z.enum(["anthropic", "openai", "oxagen_managed"]),
  model: z.string(),
  placement: z.enum(["saas", "private", "local"]),
  status: z.enum(["active", "disabled", "unhealthy"]),
});

export const modelRouteList = registerCapability({
  name: "model_route.list",
  domain: "policy",
  description: "Model routes the workspace may send work through. Send work is disabled until one exists.",
  mode: "sync",
  surfaces: ["api", "mcp", "cli", "app"],
  mutates: false,
  input: z.object({}),
  output: z.object({ items: z.array(modelRoute) }),
});

// Usage, coaching, and cost savings (ARP-Performance-spec.md, ARP-SDK-spec.md). Counts are integers or
// null: unknown is not zero. Every finding carries its basis, coverage, and a savings range that may be
// negative, and a finding never grants a right or changes a policy on its own.
const tokenCount = z.number().int().nonnegative().nullable();
export const usageBasis = z.enum(["provider_reported", "gateway_measured", "client_reported", "estimated"]);

export const usageBucket = z.object({
  key: z.string(),
  label: z.string(),
  requests: z.number().int().nonnegative(),
  requestsWithUnknownUsage: z.number().int().nonnegative(),
  inputTokens: tokenCount,
  cacheReadTokens: tokenCount,
  cacheWriteTokens: tokenCount,
  outputTokens: tokenCount,
  /** Known cache-read tokens over matching known total-input tokens; null when the denominator is zero. */
  tokenReuseRate: z.number().min(0).max(1).nullable(),
  settled: money,
  held: money,
  estimated: money,
  basis: usageBasis,
  asOf: instant,
});

export const usageQuery = registerCapability({
  name: "usage.query",
  domain: "usage",
  description: "Token, cache, and cost usage grouped by operator, agent, harness, model, run, or turn. Unknown counts stay unknown.",
  mode: "sync",
  surfaces: ["api", "mcp", "cli", "app"],
  mutates: false,
  input: z.object({
    groupBy: z.enum(["operator", "agent", "harness", "model", "run", "turn"]).default("agent"),
    from: instant.optional(),
    to: instant.optional(),
    basis: z.array(usageBasis).optional(),
  }),
  output: z.object({ buckets: z.array(usageBucket), excludedRequests: z.number().int().nonnegative(), asOf: instant }),
});

export const findingKind = z.enum([
  "repeated_file_read", "full_log_every_turn", "unstable_prefix", "unused_tool_schema", "oversized_output",
  "duplicate_paid_retry", "call_after_stop", "tool_result_never_consumed", "wrong_call_id", "result_consumed_twice",
  "retry_of_unknown_write", "stale_context", "batch_closed_early", "no_progress",
]);

export const finding = z.object({
  id: publicId("fnd"),
  runId: publicId("run"),
  kind: findingKind,
  classification: z.enum(["observed", "inferred", "incomplete"]),
  severity: z.enum(["info", "advice", "warning", "violation"]),
  title: z.string(),
  observed: z.string(),
  proposedChange: z.string(),
  tradeoff: z.string().nullable(),
  evidence: z.array(z.object({ kind: z.enum(["model_request", "tool_call", "tool_result", "composition"]), ref: z.string(), readable: z.boolean() })),
  detectorVersion: z.string(),
  coverage: z.enum(["complete", "partial", "unsupported"]),
  confidence: z.number().min(0).max(1).nullable(),
  /** Estimated saving for the affected calls, in minor units; either bound may be negative. Null when there is too little evidence. */
  estimatedSavingMinor: z.object({ low: z.number().int(), high: z.number().int(), currency: z.literal("USD") }).nullable(),
  priceBasis: z.string(),
  assumptions: z.array(z.string()),
  /** Findings that remove the same tokens or calls; their savings are never summed. */
  overlapGroup: z.string().nullable(),
  status: z.enum(["open", "accepted", "dismissed", "proposed_change"]),
});

export const findingList = registerCapability({
  name: "finding.list",
  domain: "coaching",
  description: "Operator coaching findings with their evidence, coverage, and an estimated savings range that stays separate from measured savings.",
  mode: "sync",
  surfaces: ["api", "mcp", "cli", "app"],
  mutates: false,
  input: z.object({ runId: publicId("run").optional(), status: z.enum(["open", "accepted", "dismissed", "proposed_change"]).optional() }),
  output: z.object({ items: z.array(finding), measuredReductions: z.array(z.object({ comparisonId: publicId("cmp"), label: z.string(), sampleSize: z.number().int(), reduction: money })) }),
});

export const findingRespond = registerCapability({
  name: "finding.respond",
  domain: "coaching",
  description: "Accept advice, dismiss it with a reason, or propose a change for review. Grants no tool, policy, or run permission.",
  mode: "sync",
  surfaces: ["api", "cli", "app"],
  mutates: true,
  input: z.object({
    findingId: publicId("fnd"),
    disposition: z.enum(["accepted", "dismissed", "proposed_change"]),
    reason: z.string().max(2000).optional(),
    idempotencyKey: z.string().min(1).max(200),
  }),
  output: z.object({ finding, responseId: publicId("fnr") }),
});

export type UsageBucket = z.infer<typeof usageBucket>;
export type Finding = z.infer<typeof finding>;
export type WorkspaceSummary = z.infer<typeof workspaceSummary>;
export type RunSummary = z.infer<typeof runSummary>;
export type RunEvent = z.infer<typeof runEvent>;
export type BudgetScope = z.infer<typeof budgetScope>;
export type DeviceSummary = z.infer<typeof deviceSummary>;
export type ModelRoute = z.infer<typeof modelRoute>;
