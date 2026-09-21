#!/usr/bin/env node
// The CLI binder. `oxagen <group> <verb> [--key value ...] [--json]` maps to the capability
// `<group>.<verb>` for the `cli` surface. Commands are derived from the registry; there is no
// per-command file. Exit codes follow the CLI spec: 0 reached, 2 invalid input, 3 denied or policy,
// 4 pending, 5 unavailable or unsupported, 6 unknown external outcome.
import { randomUUID } from "node:crypto";
import { capabilitiesForSurface, hasHandler, invoke, type CapabilityDeclaration, type InvokeResult } from "@oxagen-arp/kernel";
import { registerFixtureHandlers } from "@oxagen-arp/fixtures";

export function commandFor(cap: CapabilityDeclaration): string {
  const [group, ...rest] = cap.name.split(".");
  return `${group} ${rest.join("-").replaceAll("_", "-")}`;
}

export function parseArgs(argv: string[]): { command: string[]; flags: Record<string, string | boolean> } {
  const command: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) { flags[key] = next; i++; } else flags[key] = true;
    } else command.push(a);
  }
  return { command, flags };
}

export function exitCodeFor(r: InvokeResult<unknown>): number {
  if (r.ok) return 0;
  switch (r.reason) {
    case "invalid_input": case "unknown_capability": case "surface_not_allowed": return 2;
    case "denied": return 3;
    case "no_handler": case "invalid_output": return 5;
    case "error": return r.status === 409 ? 6 : 5;
  }
}

export type Check = { name: string; state: "pass" | "warn" | "fail"; detail: string; fix: string };
export type Step = { name: string; state: "done" | "stopped" | "remaining"; detail: string; next: string };

export const DEFAULT_SCOPE = { orgId: "org_acme", workspaceId: "ws_support", principalId: "usr_maya" };
type Scope = typeof DEFAULT_SCOPE;

const ask = (name: string, scope: Scope) => invoke(name, {}, { ...scope, requestId: randomUUID() }, { surface: "cli" });
const pass = (name: string, detail: string): Check => ({ name, state: "pass", detail, fix: "" });
const items = <T,>(r: InvokeResult<unknown>): T[] => ((r.ok ? r.value : { items: [] }) as { items: T[] }).items;

// `oxagen doctor`. Every check reads; none changes local state. A check the binder cannot answer
// reports warn with the command or spec section that answers it, never pass.
export async function doctor(scope: Scope = DEFAULT_SCOPE): Promise<Check[]> {
  const checks: Check[] = [];
  const major = Number(process.versions.node.split(".")[0]);
  checks.push(major >= 24
    ? pass("node", `Node ${process.versions.node}.`)
    : { name: "node", state: "fail", detail: `Node ${process.versions.node} is below the required 24.`, fix: "Install Node 24 or newer." });

  const caps = capabilitiesForSurface("cli");
  checks.push(caps.length > 0
    ? pass("capability registry", `${caps.length} commands.`)
    : { name: "capability registry", state: "fail", detail: "No capability declares the cli surface.", fix: "Reinstall the CLI." });

  const unhandled = caps.filter((c) => !hasHandler(c.name)).map((c) => c.name);
  checks.push(unhandled.length === 0 && caps.length > 0
    ? pass("handlers", "Every command has a handler.")
    : { name: "handlers", state: "fail", detail: `No handler for ${unhandled.join(", ")}.`, fix: "Unset OXAGEN_DATA_SOURCE to use the bundled fixtures." });

  const source = process.env.OXAGEN_DATA_SOURCE ?? "fixtures";
  checks.push(source === "fixtures"
    ? { name: "local service", state: "warn", detail: "Answers come from bundled fixtures, not a service.", fix: "Start the local service and set OXAGEN_DATA_SOURCE=live." }
    : pass("local service", `OXAGEN_DATA_SOURCE=${source}.`));

  const workspaces = await ask("workspace.list", scope);
  const bound = items<{ id: string; name: string; modelRouteCount: number }>(workspaces).find((w) => w.id === scope.workspaceId);
  checks.push(!workspaces.ok
    ? { name: "workspace binding", state: "fail", detail: `workspace.list answered ${workspaces.reason}.`, fix: "Run oxagen workspace list to read the error in full." }
    : bound
      ? pass("workspace binding", `${bound.name} (${bound.id}).`)
      : { name: "workspace binding", state: "fail", detail: `${scope.workspaceId} is not a workspace this caller may see.`, fix: "Run oxagen workspace list and bind one of those." });

  const routes = await ask("model_route.list", scope);
  const active = items<{ id: string; status: string }>(routes).filter((r) => r.status === "active");
  checks.push(active.length > 0
    ? pass("model route", `${active.length} active.`)
    : { name: "model route", state: "fail", detail: "No active model route. Send work is disabled without one.", fix: "Add a route on the model routes page, then run oxagen model_route list." });

  const devices = await ask("device.list", scope);
  const enrolled = items<{ status: string; targets: unknown[] }>(devices).filter((d) => d.status === "enrolled");
  checks.push(enrolled.length > 0
    ? pass("device enrollment", `${enrolled.length} enrolled.`)
    : { name: "device enrollment", state: "fail", detail: "No enrolled device, so no run can start.", fix: "Install the desktop app and run oxagen device enroll." });
  const targets = enrolled.flatMap((d) => d.targets).length;
  checks.push(targets > 0
    ? pass("harness adapter", `${targets} target(s) registered.`)
    : { name: "harness adapter", state: "fail", detail: "No enrolled device hosts a harness target.", fix: "Register one with oxagen harness register, then run oxagen device list." });

  for (const [name, detail] of [
    ["scanner coverage", "No capability reports scanner coverage yet."],
    ["policy freshness", "No capability reports the loaded policy revision yet."],
    ["clock skew", "Skew needs a server clock to compare against."],
  ] as const) {
    checks.push({ name, state: "warn", detail, fix: "ARP-CLI-spec.md specifies this check; the binder answers it once a service serves it." });
  }
  return checks;
}

// `oxagen quickstart`. It composes commands that already exist with safe defaults and stops at the
// first step it cannot complete, naming that step and the command that continues it. It reads only,
// so it can neither weaken a control nor raise a limit.
export async function quickstart(scope: Scope = DEFAULT_SCOPE): Promise<Step[]> {
  const steps: Step[] = [];
  const stop = (name: string, detail: string, next: string): Step[] => [...steps, { name, state: "stopped", detail, next }];

  const checks = await doctor(scope);
  const failed = checks.filter((c) => c.state === "fail");
  if (failed.length > 0) return stop("environment", `${failed[0]!.name}: ${failed[0]!.detail}`, `oxagen doctor`);
  steps.push({ name: "environment", state: "done", detail: `${checks.length} checks, none failing.`, next: "" });

  const workspaces = await ask("workspace.list", scope);
  const ws = items<{ id: string; name: string }>(workspaces).find((w) => w.id === scope.workspaceId);
  if (!ws) return stop("workspace", `${scope.workspaceId} is not a workspace this caller may see.`, "oxagen workspace list");
  steps.push({ name: "workspace", state: "done", detail: `${ws.name} (${ws.id}).`, next: "" });

  const devices = await ask("device.list", scope);
  const target = items<{ status: string; targets: { id: string; harness: string }[] }>(devices)
    .filter((d) => d.status === "enrolled").flatMap((d) => d.targets)[0];
  if (!target) return stop("harness target", "No enrolled device hosts a target.", "oxagen device list");
  steps.push({ name: "harness target", state: "done", detail: `${target.harness} (${target.id}).`, next: "" });

  const smoke = await ask("run.list", scope);
  if (!smoke.ok) return stop("smoke task", `run.list answered ${smoke.reason}.`, "oxagen run list");
  steps.push({ name: "smoke task", state: "done", detail: `run.list returned ${items(smoke).length} run(s).`, next: "" });

  steps.push({
    name: "checkout link",
    state: "remaining",
    detail: "Linking a checkout, exporting .oxagen files, and validating them need a service this binder does not carry.",
    next: "ARP-CLI-spec.md, repository setup commands",
  });
  return steps;
}

function renderChecks(checks: Check[], json: boolean): { code: number; out: string } {
  const code = checks.some((c) => c.state === "fail") ? 5 : 0;
  if (json) return { code, out: JSON.stringify({ checks }) };
  const width = Math.max(...checks.map((c) => c.name.length));
  const lines = checks.flatMap((c) => [`${c.state.padEnd(4)}  ${c.name.padEnd(width)}  ${c.detail}`, ...(c.fix ? [`${" ".repeat(width + 6)}  fix: ${c.fix}`] : [])]);
  return { code, out: lines.join("\n") };
}

function renderSteps(steps: Step[], json: boolean): { code: number; out: string } {
  const stopped = steps.find((s) => s.state === "stopped");
  if (json) return { code: stopped ? 5 : 0, out: JSON.stringify({ steps }) };
  const lines = steps.map((s) => `${s.state.padEnd(9)} ${s.name}: ${s.detail}${s.next ? `\n          continue with ${s.next}` : ""}`);
  lines.push("", stopped ? `Stopped at ${stopped.name}.` : "Setup reached as far as this binder goes.");
  return { code: stopped ? 5 : 0, out: lines.join("\n") };
}

export function help(): string {
  const lines = ["Usage: oxagen <group> <verb> [--flag value] [--json]", "", "Commands (derived from the capability registry):"];
  for (const cap of capabilitiesForSurface("cli")) lines.push(`  ${commandFor(cap).padEnd(24)} ${cap.description}`);
  lines.push("", "Local commands (they read only, and compose the commands above):");
  lines.push(`  ${"quickstart".padEnd(24)} Set up with safe defaults, stopping at the first step this binder cannot complete.`);
  lines.push(`  ${"doctor".padEnd(24)} One line per check with the fix. --json returns the same list.`);
  return lines.join("\n");
}

export async function run(argv: string[], scope = DEFAULT_SCOPE): Promise<{ code: number; out: string }> {
  const { command, flags } = parseArgs(argv);
  if (command.length === 0 || flags.help) return { code: 0, out: help() };
  const verb = command.join(" ");
  if (verb === "doctor") return renderChecks(await doctor(scope), Boolean(flags.json));
  if (verb === "quickstart") return renderSteps(await quickstart(scope), Boolean(flags.json));
  const cap = capabilitiesForSurface("cli").find((c) => commandFor(c) === verb);
  if (!cap) return { code: 2, out: `Unknown command: ${verb}\n\n${help()}` };
  const { json, ...rest } = flags;
  const input: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rest)) {
    const key = k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    input[key] = typeof v === "string" && /^\d+$/.test(v) ? Number(v) : typeof v === "string" && v.includes(",") ? v.split(",") : v;
  }
  if (cap.mutates && input.idempotencyKey === undefined) input.idempotencyKey = randomUUID();
  const r = await invoke(cap.name, input, { ...scope, requestId: randomUUID() }, { surface: "cli" });
  const out = json ? JSON.stringify(r.ok ? { state: "ok", ...r.value as object } : { state: r.reason, ...r }) : r.ok ? JSON.stringify(r.value, null, 2) : `${r.reason}: ${JSON.stringify(r)}`;
  return { code: exitCodeFor(r), out };
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file://").href) {
  if ((process.env.OXAGEN_DATA_SOURCE ?? "fixtures") === "fixtures") registerFixtureHandlers();
  const { code, out } = await run(process.argv.slice(2));
  process.stdout.write(`${out}\n`);
  process.exitCode = code;
}
