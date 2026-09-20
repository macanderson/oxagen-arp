import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { allCapabilities, capabilitiesForSurface, registerCapability, unregisterCapabilityForTest } from "./registry.ts";
import { DeniedError, HandlerError, clearHandlers, invoke, setHandler } from "./kernel.ts";
import { runPause, workspaceList } from "./contracts/index.ts";

const ctx = { orgId: "org_a", workspaceId: "ws_a", principalId: "usr_a", requestId: "req_1" };

test("every registered contract declares a surface, a domain, and dotted lowercase name", () => {
  for (const c of allCapabilities()) {
    assert.match(c.name, /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/);
    assert.ok(c.surfaces.length > 0, c.name);
    assert.ok(c.domain.length > 0, c.name);
  }
});

test("surface allowlist is enforced at the kernel, not the binder", async () => {
  clearHandlers();
  setHandler(runPause, async (input) => ({
    operationId: "op_1",
    run: {
      id: input.runId, workRequestId: "wrq_1", title: "t", agent: { personaId: "agp_1", name: "a", version: 1 },
      target: { id: "tgt_1", harness: "codex", presence: "online" }, state: "pause_requested", stateReason: null,
      spend: { settled: { currency: "USD", minor: 0 }, held: { currency: "USD", minor: 0 }, remaining: { currency: "USD", minor: 0 }, bindingScope: "agent" },
      startedAt: null, updatedAt: "2026-09-20T00:00:00Z",
    },
  }) as const);
  const ok = await invoke("run.pause", { runId: "run_1", idempotencyKey: "k" }, ctx, { surface: "cli" });
  assert.equal(ok.ok, true);
  const denied = await invoke("run.pause", { runId: "run_1", idempotencyKey: "k" }, ctx, { surface: "app" });
  assert.equal(denied.ok, true, "app is a declared surface");
  unregisterCapabilityForTest("test.only_api");
  registerCapability({ name: "test.only_api", domain: "test", description: "d", mode: "sync", surfaces: ["api"], mutates: false, input: z.object({}), output: z.object({}) });
  const wrong = await invoke("test.only_api", {}, ctx, { surface: "mcp" });
  assert.deepEqual(wrong, { ok: false, reason: "surface_not_allowed", name: "test.only_api", surface: "mcp" });
  unregisterCapabilityForTest("test.only_api");
});

test("input and output are validated and handler errors become typed results", async () => {
  clearHandlers();
  const bad = await invoke("run.pause", { runId: "nope" }, ctx, { surface: "api" });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.equal(bad.reason, "invalid_input");
  const none = await invoke("workspace.list", {}, { ...ctx, workspaceId: undefined }, { surface: "api" });
  assert.deepEqual(none, { ok: false, reason: "no_handler", name: "workspace.list" });
  setHandler(workspaceList, async () => ({ items: [{ id: "bad id" }] }) as never);
  const out = await invoke("workspace.list", {}, ctx, { surface: "api" });
  if (!out.ok) assert.equal(out.reason, "invalid_output");
  setHandler(workspaceList, async () => { throw new DeniedError("workspace.read"); });
  const denied = await invoke("workspace.list", {}, ctx, { surface: "api" });
  assert.deepEqual(denied, { ok: false, reason: "denied", name: "workspace.list", permission: "workspace.read" });
  setHandler(workspaceList, async () => { throw new HandlerError("store_down", 503); });
  const err = await invoke("workspace.list", {}, ctx, { surface: "api" });
  assert.deepEqual(err, { ok: false, reason: "error", name: "workspace.list", code: "store_down", status: 503 });
  const unknown = await invoke("nope.nope", {}, ctx, { surface: "api" });
  assert.deepEqual(unknown, { ok: false, reason: "unknown_capability", name: "nope.nope" });
});

test("a scoped capability refuses a context without a workspace", async () => {
  const r = await invoke("run.list", {}, { ...ctx, workspaceId: undefined }, { surface: "api" });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.reason, "invalid_input");
});

test("surface enumeration is derived, never listed", () => {
  const api = capabilitiesForSurface("api").map((c) => c.name);
  assert.ok(api.includes("run.pause"));
  assert.ok(!capabilitiesForSurface("mcp").map((c) => c.name).includes("device.revoke"));
});
