// Fixture data and fixture handlers. This is the only place fake data lives. The mockup app, the
// Storybook stories, and the kernel's fixture mode all read it through the same contracts, so wiring
// the product means replacing `registerFixtureHandlers()` with live handlers and nothing else.
// Every value validates against its contract's output schema (see index.test.ts), so a fixture can
// never drift from the wire shape the live handler must return.
import {
  budgetStatus, deviceList, deviceRevoke, findingList, findingRespond, modelRouteList, runGet, runList, runPause, runResume,
  runSteer, runStop, setHandler, usageQuery, workCancel, workSubmit, workspaceList,
  type BudgetScope, type DeviceSummary, type Finding, type ModelRoute, type RunEvent, type RunSummary, type UsageBucket, type WorkspaceSummary,
} from "@oxagen-arp/kernel";

const usd = (minor: number) => ({ currency: "USD" as const, minor });
const T0 = "2026-09-20T14:00:00Z";

export const workspaces: WorkspaceSummary[] = [
  { id: "ws_support", slug: "support", name: "Support", state: "active", defaultBranch: "main", modelRouteCount: 1 },
  { id: "ws_platform", slug: "platform", name: "Platform", state: "active", defaultBranch: "main", modelRouteCount: 0 },
];

export const modelRoutes: ModelRoute[] = [
  { id: "mr_anthropic1", provider: "anthropic", model: "claude-sonnet-4-6", placement: "saas", status: "active" },
];

export const devices: DeviceSummary[] = [
  { id: "dev_mayambp", name: "Maya's MacBook Pro", platform: "macos", status: "enrolled", presence: "online", lastSeenAt: T0,
    targets: [{ id: "tgt_localcodex", harness: "codex", controlLevel: "strict" }, { id: "tgt_localclaude", harness: "claude_code", controlLevel: "strict" }] },
  { id: "dev_cirunner1", name: "ci-runner-1", platform: "linux", status: "enrolled", presence: "stale", lastSeenAt: "2026-09-20T13:41:00Z",
    targets: [{ id: "tgt_runnercodex", harness: "codex", controlLevel: "observed" }] },
  { id: "dev_oldlaptop", name: "Old laptop", platform: "macos", status: "revoked", presence: "offline", lastSeenAt: "2026-09-19T09:12:00Z", targets: [] },
];

const spend = (settled: number, held: number, cap: number, bindingScope = "agent") => ({
  settled: usd(settled), held: usd(held), remaining: usd(Math.max(0, cap - settled - held)), bindingScope,
});

export const runs: RunSummary[] = [
  { id: "run_firstdocs", workRequestId: "wrq_1", title: "First docs check", agent: { personaId: "agp_supportbuilder", name: "Support builder", version: 12 },
    target: { id: "tgt_localcodex", harness: "codex", presence: "online" }, state: "running", stateReason: null,
    spend: spend(130, 610, 2000), startedAt: "2026-09-20T13:58:10Z", updatedAt: T0 },
  { id: "run_loginbug", workRequestId: "wrq_2", title: "Fix the login bug", agent: { personaId: "agp_supportbuilder", name: "Support builder", version: 12 },
    target: { id: "tgt_localclaude", harness: "claude_code", presence: "online" }, state: "pausing", stateReason: "One tool is still running.",
    spend: spend(940, 300, 2000), startedAt: "2026-09-20T13:20:00Z", updatedAt: "2026-09-20T13:59:30Z" },
  { id: "run_refundreview", workRequestId: "wrq_3", title: "Review refund policy change", agent: { personaId: "agp_reviewer", name: "Reviewer", version: 3 },
    target: { id: "tgt_runnercodex", harness: "codex", presence: "stale" }, state: "waiting_for_device", stateReason: "Delivered when device reconnects.",
    spend: spend(0, 0, 500, "work_order"), startedAt: null, updatedAt: "2026-09-20T13:41:00Z" },
  { id: "run_budgetblock", workRequestId: "wrq_4", title: "Regenerate API docs", agent: { personaId: "agp_docs", name: "Docs writer", version: 2 },
    target: { id: "tgt_localcodex", harness: "codex", presence: "online" }, state: "blocked", stateReason: "Budget blocked. This call could cost up to $6.10. $4.70 remains for Docs writer today.",
    spend: spend(1530, 0, 2000), startedAt: "2026-09-20T12:02:00Z", updatedAt: "2026-09-20T13:30:00Z" },
  { id: "run_done", workRequestId: "wrq_5", title: "Add retry to webhook client", agent: { personaId: "agp_supportbuilder", name: "Support builder", version: 11 },
    target: { id: "tgt_localclaude", harness: "claude_code", presence: "online" }, state: "completed", stateReason: null,
    spend: spend(1180, 0, 2000), startedAt: "2026-09-19T16:00:00Z", updatedAt: "2026-09-19T16:48:00Z" },
];

export const runEvents: Record<string, RunEvent[]> = {
  run_firstdocs: [
    { seq: 1, at: "2026-09-20T13:58:10Z", kind: "model_request", summary: "Model request 184 sent (cleaned, 2.1k tokens).", redacted: false },
    { seq: 2, at: "2026-09-20T13:58:31Z", kind: "tool_call", summary: "Read docs/start.md", redacted: false },
    { seq: 3, at: "2026-09-20T13:58:32Z", kind: "tool_result", summary: "412 bytes, 1 value replaced by data protection.", redacted: true },
    { seq: 4, at: "2026-09-20T13:59:02Z", kind: "budget", summary: "Held $6.10 for model request 185 (Support builder, daily).", redacted: false },
  ],
  run_loginbug: [
    { seq: 41, at: "2026-09-20T13:59:12Z", kind: "steering", summary: "Steering delivered to model request 203: focus on the login bug.", redacted: false },
    { seq: 42, at: "2026-09-20T13:59:30Z", kind: "pause", summary: "Pause requested. Rules locked before pause (version 7). 1 of 2 workers stopped.", redacted: false },
  ],
};

export const budgets: BudgetScope[] = [
  { scope: "org", label: "Acme", cap: usd(500000), settled: usd(183210), held: usd(910), remaining: usd(315880), period: "September 2026" },
  { scope: "workspace", label: "Support", cap: usd(100000), settled: usd(41220), held: usd(910), remaining: usd(57870), period: "September 2026" },
  { scope: "operator", label: "Maya", cap: usd(20000), settled: usd(3780), held: usd(910), remaining: usd(15310), period: "Today" },
  { scope: "agent", label: "Support builder", cap: usd(2000), settled: usd(1070), held: usd(610), remaining: usd(320), period: "Today" },
];

// Usage buckets and coaching findings. The trace-file example follows ARP-Performance-spec.md: the
// dollar range is for the affected calls at the stated price basis, and the two overlapping findings
// share an overlap group so their savings are never summed.
export const usageBuckets: UsageBucket[] = [
  { key: "agp_supportbuilder", label: "Support builder", requests: 42, requestsWithUnknownUsage: 0, inputTokens: 1_840_000, cacheReadTokens: 1_210_000, cacheWriteTokens: 96_000, outputTokens: 61_000, tokenReuseRate: 0.66, settled: usd(1070), held: usd(610), estimated: usd(0), basis: "provider_reported", asOf: T0 },
  { key: "agp_reviewer", label: "Reviewer", requests: 9, requestsWithUnknownUsage: 0, inputTokens: 310_000, cacheReadTokens: 40_000, cacheWriteTokens: 12_000, outputTokens: 8_400, tokenReuseRate: 0.13, settled: usd(210), held: usd(0), estimated: usd(0), basis: "provider_reported", asOf: T0 },
  { key: "agp_docs", label: "Docs writer", requests: 17, requestsWithUnknownUsage: 3, inputTokens: 2_460_000, cacheReadTokens: null, cacheWriteTokens: null, outputTokens: 22_000, tokenReuseRate: null, settled: usd(1530), held: usd(0), estimated: usd(0), basis: "gateway_measured", asOf: T0 },
];

export const findings: Finding[] = [
  { id: "fnd_tracepaste", runId: "run_budgetblock", kind: "full_log_every_turn", classification: "observed", severity: "advice",
    title: "A 120,000-token trace was pasted on every turn",
    observed: "Requests 12 to 19 each carried the same trace file as fresh input. The provider reported no cache read for those blocks.",
    proposedChange: "Give the agent the local path to the trace and ask it to read the 2,000-token error section first. The file exists on the target and Read is in the agent's tool belt.",
    tradeoff: "One extra tool call per turn. If the agent reads the whole file, the saving is zero or negative.",
    evidence: [{ kind: "composition", ref: "compose_184", readable: true }, { kind: "model_request", ref: "req_12", readable: true }, { kind: "model_request", ref: "req_19", readable: true }],
    detectorVersion: "repeat-block/2026.09", coverage: "complete", confidence: 0.8,
    estimatedSavingMinor: { low: 4, high: 35, currency: "USD" }, priceBasis: "Fresh input at $3 per million tokens, price version 2026-09-01",
    assumptions: ["The excerpt stays under 2,000 tokens", "Cache state of the remaining prefix does not change"], overlapGroup: "trace-input", status: "open" },
  { id: "fnd_prefixchange", runId: "run_budgetblock", kind: "unstable_prefix", classification: "inferred", severity: "advice",
    title: "The workspace instructions moved after the trace, breaking the cache prefix",
    observed: "Block order changed between requests 11 and 12; cache reads dropped from 94,000 to 0 tokens.",
    proposedChange: "Keep stable instructions before per-turn content so the prefix can be reused.",
    tradeoff: null,
    evidence: [{ kind: "composition", ref: "compose_183", readable: true }, { kind: "composition", ref: "compose_184", readable: true }],
    detectorVersion: "prefix-diff/2026.09", coverage: "partial", confidence: 0.55,
    estimatedSavingMinor: { low: -2, high: 28, currency: "USD" }, priceBasis: "Cache read at $0.30 per million tokens, price version 2026-09-01",
    assumptions: ["The provider would have served the prefix from cache", "Cache had not expired"], overlapGroup: "trace-input", status: "open" },
  { id: "fnd_resultunused", runId: "run_loginbug", kind: "tool_result_never_consumed", classification: "observed", severity: "warning",
    title: "A tool result never reached the next request",
    observed: "Tool call tc_41 returned 3.2 KB; the next composition contains no block from it and no redaction record.",
    proposedChange: "Check the custom loop's consume step; the result may be dropped before the next model request.",
    tradeoff: null,
    evidence: [{ kind: "tool_result", ref: "tr_41", readable: true }, { kind: "composition", ref: "compose_203", readable: false }],
    detectorVersion: "loop-pairing/2026.09", coverage: "complete", confidence: null,
    estimatedSavingMinor: null, priceBasis: "n/a", assumptions: [], overlapGroup: null, status: "open" },
];

function run(id: string): RunSummary {
  const r = runs.find((x) => x.id === id);
  if (!r) throw new Error(`fixture run missing: ${id}`);
  return r;
}

/** Install the fixture handlers on the kernel. Production installs live handlers instead. */
export function registerFixtureHandlers(): void {
  setHandler(workspaceList, async () => ({ items: workspaces }));
  setHandler(modelRouteList, async () => ({ items: modelRoutes }));
  setHandler(deviceList, async () => ({ items: devices }));
  setHandler(deviceRevoke, async ({ deviceId }) => {
    const d = devices.find((x) => x.id === deviceId);
    if (!d) throw new Error(`no device ${deviceId}`);
    return { device: { ...d, status: "revoked" as const, presence: "offline" as const, targets: [] }, authorityEpoch: 8 };
  });
  setHandler(runList, async ({ state, limit }) => ({
    items: runs.filter((r) => !state || r.state === state).slice(0, limit), nextCursor: null,
  }));
  setHandler(runGet, async ({ runId }) => ({
    run: run(runId), events: runEvents[runId] ?? [], pauseBoundaryId: run(runId).state === "paused" ? "pse_42" : null,
  }));
  setHandler(runPause, async ({ runId }) => ({ operationId: "op_pause1", run: { ...run(runId), state: "pause_requested" as const, stateReason: null } }));
  setHandler(runResume, async ({ runId }) => ({ operationId: "op_resume1", run: { ...run(runId), state: "resuming" as const, stateReason: null } }));
  setHandler(runStop, async ({ runId }) => ({ operationId: "op_stop1", run: { ...run(runId), state: "stopping" as const, stateReason: "Stopped. This run cannot resume. Send new work to continue." } }));
  setHandler(runSteer, async ({ runId }) => ({ steeringId: "str_1", delivery: run(runId).target.presence === "online" ? ("delivered" as const) : ("queued_for_reconnect" as const) }));
  setHandler(workSubmit, async ({ targetIds }) => ({
    workRequestId: "wrq_new", targets: targetIds.map((targetId) => ({ targetId, state: targetId === "tgt_runnercodex" ? ("waiting_for_device" as const) : ("queued" as const) })),
  }));
  setHandler(workCancel, async ({ workRequestId }) => ({ workRequestId, cancelled: 1, stopRequested: 0 }));
  setHandler(budgetStatus, async () => ({ scopes: budgets, tightest: "agent" }));
  setHandler(usageQuery, async () => ({ buckets: usageBuckets, excludedRequests: 3, asOf: T0 }));
  setHandler(findingList, async ({ runId, status }) => ({
    items: findings.filter((f) => (!runId || f.runId === runId) && (!status || f.status === status)),
    measuredReductions: [{ comparisonId: "cmp_1", label: "Trace excerpt vs pasted trace, 6 matched runs", sampleSize: 6, reduction: usd(1260) }],
  }));
  setHandler(findingRespond, async ({ findingId, disposition }) => {
    const f = findings.find((x) => x.id === findingId);
    if (!f) throw new Error(`no finding ${findingId}`);
    return { finding: { ...f, status: disposition }, responseId: "fnr_1" };
  });
}
