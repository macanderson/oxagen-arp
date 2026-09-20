#!/usr/bin/env node
// The CLI binder. `oxagen <group> <verb> [--key value ...] [--json]` maps to the capability
// `<group>.<verb>` for the `cli` surface. Commands are derived from the registry; there is no
// per-command file. Exit codes follow the CLI spec: 0 reached, 2 invalid input, 3 denied or policy,
// 4 pending, 5 unavailable or unsupported, 6 unknown external outcome.
import { randomUUID } from "node:crypto";
import { capabilitiesForSurface, invoke, type CapabilityDeclaration, type InvokeResult } from "@oxagen-arp/kernel";
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

export function help(): string {
  const lines = ["Usage: oxagen <group> <verb> [--flag value] [--json]", "", "Commands (derived from the capability registry):"];
  for (const cap of capabilitiesForSurface("cli")) lines.push(`  ${commandFor(cap).padEnd(24)} ${cap.description}`);
  lines.push("", "First run: oxagen quickstart  ·  Diagnose: oxagen doctor");
  return lines.join("\n");
}

export async function run(argv: string[], scope = { orgId: "org_acme", workspaceId: "ws_support", principalId: "usr_maya" }): Promise<{ code: number; out: string }> {
  const { command, flags } = parseArgs(argv);
  if (command.length === 0 || flags.help) return { code: 0, out: help() };
  const cap = capabilitiesForSurface("cli").find((c) => commandFor(c) === command.join(" "));
  if (!cap) return { code: 2, out: `Unknown command: ${command.join(" ")}\n\n${help()}` };
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
