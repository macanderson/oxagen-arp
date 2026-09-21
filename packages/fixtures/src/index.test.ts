import assert from "node:assert/strict";
import test from "node:test";
import { allCapabilities, capabilitiesForSurface, hasHandler, invoke } from "@oxagen-arp/kernel";
import { registerFixtureHandlers } from "./index.ts";

const ctx = { orgId: "org_acme", workspaceId: "ws_support", principalId: "usr_maya", requestId: "req_fixture" };

test("every registered capability has a fixture handler, so no surface can hit no_handler in fixture mode", () => {
  registerFixtureHandlers();
  for (const c of allCapabilities()) assert.ok(hasHandler(c.name), c.name);
});

test("every fixture read validates against its contract output on every surface that allows it", async () => {
  registerFixtureHandlers();
  const inputs: Record<string, unknown> = {
    "run.get": { runId: "run_firstdocs" },
  };
  for (const c of allCapabilities().filter((x) => !x.mutates)) {
    for (const surface of c.surfaces) {
      const r = await invoke(c.name, inputs[c.name] ?? {}, ctx, { surface });
      assert.equal(r.ok, true, `${c.name} on ${surface}: ${JSON.stringify(r)}`);
    }
  }
  assert.ok(capabilitiesForSurface("app").length >= 8);
});

test("fixture commands return the shared state vocabulary", async () => {
  registerFixtureHandlers();
  const pause = await invoke<{ run: { state: string } }>("run.pause", { runId: "run_firstdocs", idempotencyKey: "k1" }, ctx, { surface: "app" });
  assert.equal(pause.ok && pause.value.run.state, "pause_requested");
  const steer = await invoke<{ delivery: string }>("run.steer", { runId: "run_refundreview", message: "focus", idempotencyKey: "k2" }, ctx, { surface: "mcp" });
  assert.equal(steer.ok && steer.value.delivery, "queued_for_reconnect");
});
