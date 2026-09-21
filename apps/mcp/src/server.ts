// The MCP binder: a programmatic tool provider over stdio JSON-RPC. tools/list is derived from the
// registry for the `mcp` surface; tools/call goes through invoke() with surface "mcp". No tool file
// exists per capability, so a capability added to the registry appears here on the next list.
import { createInterface } from "node:readline";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { capabilitiesForSurface, invoke, type CapabilityDeclaration } from "@oxagen-arp/kernel";
import { registerFixtureHandlers } from "@oxagen-arp/fixtures";

export const PROTOCOL_VERSION = "2026-07-28";

export function toolName(cap: CapabilityDeclaration): string {
  return cap.name.replaceAll(".", "_");
}

export function listTools() {
  return capabilitiesForSurface("mcp").map((cap) => ({
    name: toolName(cap),
    description: cap.agent?.toolDescription ?? cap.description,
    inputSchema: z.toJSONSchema(cap.input),
    annotations: {
      readOnlyHint: !cap.mutates,
      destructiveHint: cap.agent?.destructive ?? false,
      idempotentHint: !cap.mutates,
    },
  }));
}

export async function callTool(name: string, args: unknown, scope: { orgId: string; workspaceId: string; principalId: string }) {
  const cap = capabilitiesForSurface("mcp").find((c) => toolName(c) === name);
  if (!cap) return { isError: true, content: [{ type: "text", text: `unknown tool ${name}` }] };
  const r = await invoke(cap.name, args ?? {}, { ...scope, requestId: randomUUID() }, { surface: "mcp" });
  if (r.ok) return { content: [{ type: "text", text: JSON.stringify(r.value) }], structuredContent: r.value };
  return { isError: true, content: [{ type: "text", text: JSON.stringify(r) }] };
}

type Rpc = { jsonrpc: "2.0"; id?: number | string; method: string; params?: Record<string, unknown> };

export async function handle(msg: Rpc, scope: { orgId: string; workspaceId: string; principalId: string }) {
  // A JSON-RPC notification carries no id and must never receive a response. The method still runs;
  // only the reply is dropped, so a notification that asks for work still gets the work done.
  const reply = (result: unknown) => (msg.id === undefined ? null : { jsonrpc: "2.0", id: msg.id, result });
  switch (msg.method) {
    case "initialize":
      return reply({ protocolVersion: PROTOCOL_VERSION, capabilities: { tools: { listChanged: true } }, serverInfo: { name: "oxagen-arp", version: "0.1.0" } });
    case "tools/list":
      return reply({ tools: listTools() });
    case "tools/call": {
      const p = (msg.params ?? {}) as { name?: string; arguments?: unknown };
      return reply(await callTool(p.name ?? "", p.arguments, scope));
    }
    case "notifications/initialized":
      return null;
    default:
      // An unknown notification, such as notifications/cancelled, is dropped rather than answered
      // with an idless "method not found", which a client may read as a malformed response.
      if (msg.id === undefined) return null;
      return { jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `method not found: ${msg.method}` } };
  }
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file://").href) {
  if ((process.env.OXAGEN_DATA_SOURCE ?? "fixtures") === "fixtures") registerFixtureHandlers();
  // The scope comes from the API key the product verifies; the mockup binder reads it from the environment.
  const scope = { orgId: process.env.OXAGEN_ORG ?? "org_acme", workspaceId: process.env.OXAGEN_WORKSPACE ?? "ws_support", principalId: "usr_maya" };
  const rl = createInterface({ input: process.stdin });
  rl.on("line", async (line) => {
    if (!line.trim()) return;
    try {
      const out = await handle(JSON.parse(line) as Rpc, scope);
      if (out) process.stdout.write(`${JSON.stringify(out)}\n`);
    } catch (error) {
      process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: String(error) } })}\n`);
    }
  });
}
