import assert from "node:assert/strict";
import test from "node:test";
import { capabilitiesForSurface } from "@oxagen-arp/kernel";
import { registerFixtureHandlers } from "@oxagen-arp/fixtures";
import { handle, listTools } from "./server.ts";

const scope = { orgId: "org_acme", workspaceId: "ws_support", principalId: "usr_maya" };

test("tools/list is exactly the mcp surface of the registry", () => {
  const names = listTools().map((t) => t.name).sort();
  assert.deepEqual(names, capabilitiesForSurface("mcp").map((c) => c.name.replaceAll(".", "_")).sort());
  assert.ok(!names.includes("device_revoke"), "device.revoke does not declare mcp");
  for (const t of listTools()) assert.equal(typeof t.inputSchema, "object");
});

test("tools/call goes through the kernel with the mcp surface", async () => {
  registerFixtureHandlers();
  const ok = await handle({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "run_list", arguments: {} } }, scope) as { result: { isError?: boolean } };
  assert.equal(ok.result.isError, undefined);
  const bad = await handle({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "run_pause", arguments: { runId: "x" } } }, scope) as { result: { isError?: boolean } };
  assert.equal(bad.result.isError, true);
  const unknown = await handle({ jsonrpc: "2.0", id: 3, method: "nope" }, scope) as { error: { code: number } };
  assert.equal(unknown.error.code, -32601);
});

test("no notification receives a response", async () => {
  registerFixtureHandlers();
  assert.equal(await handle({ jsonrpc: "2.0", method: "notifications/initialized" }, scope), null);
  assert.equal(await handle({ jsonrpc: "2.0", method: "notifications/cancelled", params: { requestId: 1 } }, scope), null);
  assert.equal(await handle({ jsonrpc: "2.0", method: "nope" }, scope), null);
  // The work still runs; only the reply is dropped.
  assert.equal(await handle({ jsonrpc: "2.0", method: "tools/call", params: { name: "run_list", arguments: {} } }, scope), null);
  // A request, which carries an id, still gets its error.
  const answered = await handle({ jsonrpc: "2.0", id: 9, method: "nope" }, scope) as { error: { code: number } };
  assert.equal(answered.error.code, -32601);
});
