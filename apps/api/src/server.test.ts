import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";
import { createServer, installHandlers } from "./server.ts";

async function withServer(fn: (base: string) => Promise<void>) {
  installHandlers();
  const server = createServer();
  await new Promise<void>((r) => server.listen(0, r));
  const { port } = server.address() as AddressInfo;
  try { await fn(`http://127.0.0.1:${port}`); } finally { server.close(); }
}

test("the generic route serves every api-surface capability and refuses the rest", async () => {
  await withServer(async (base) => {
    const list = await (await fetch(`${base}/v0.1/capabilities`)).json() as { items: { name: string }[] };
    assert.ok(list.items.some((c) => c.name === "run.pause"));
    const ok = await fetch(`${base}/v0.1/organizations/org_acme/workspaces/ws_support/cap/run.list`, { method: "POST", body: "{}" });
    assert.equal(ok.status, 200);
    const bad = await fetch(`${base}/v0.1/organizations/org_acme/workspaces/ws_support/cap/run.pause`, { method: "POST", body: JSON.stringify({ runId: "x" }) });
    assert.equal(bad.status, 422);
    const missing = await fetch(`${base}/v0.1/organizations/org_acme/workspaces/ws_support/cap/nope.nope`, { method: "POST", body: "{}" });
    assert.equal(missing.status, 404);
    const unscoped = await fetch(`${base}/v0.1/organizations/org_acme/cap/run.list`, { method: "POST", body: "{}" });
    assert.equal(unscoped.status, 422);
    const orgLevel = await fetch(`${base}/v0.1/organizations/org_acme/cap/workspace.list`, { method: "POST", body: "{}" });
    assert.equal(orgLevel.status, 200);
  });
});
