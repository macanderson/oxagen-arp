import assert from "node:assert/strict";
import test from "node:test";
import { allCapabilities } from "@oxagen-arp/kernel";
import { fixtureSource } from "./fixtures.ts";
import { portCapabilities } from "./ports.ts";

const ctx = { orgId: "org_acme", workspaceId: "ws_support", principalId: "usr_maya" };

test("every port names a registered app-surface capability, and every app capability has a port", () => {
  const app = new Set(allCapabilities().filter((c) => c.surfaces.includes("app")).map((c) => c.name));
  for (const cap of Object.values(portCapabilities)) assert.ok(app.has(cap), cap);
  for (const cap of app) assert.ok(Object.values(portCapabilities).includes(cap as never), `${cap} has no port`);
});

test("the fixture source answers every read with a value a page can render", async () => {
  const s = fixtureSource();
  for (const r of [await s.workspaces(ctx), await s.modelRoutes(ctx), await s.runs(ctx), await s.budget(ctx), await s.devices(ctx), await s.run(ctx, { runId: "run_firstdocs" })]) {
    assert.equal(r.ok, true, JSON.stringify(r));
  }
  const bad = await s.run(ctx, { runId: "run_missing" });
  assert.equal(bad.ok, false);
  const stop = await s.stopRun(ctx, { runId: "run_firstdocs", idempotencyKey: "k" });
  assert.ok(stop.ok && stop.value.run.state === "stopping");
});
