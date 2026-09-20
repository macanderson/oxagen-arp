import assert from "node:assert/strict";
import test from "node:test";
import { capabilitiesForSurface } from "@oxagen-arp/kernel";
import { registerFixtureHandlers } from "@oxagen-arp/fixtures";
import { commandFor, help, run } from "./main.ts";

test("every cli-surface capability is a command and the help lists it", () => {
  const h = help();
  for (const cap of capabilitiesForSurface("cli")) assert.ok(h.includes(commandFor(cap)), cap.name);
  assert.ok(!h.includes("run resume-nope"));
});

test("commands dispatch through the kernel with the cli surface and spec exit codes", async () => {
  registerFixtureHandlers();
  assert.equal((await run(["run", "list", "--json"])).code, 0);
  const bad = await run(["run", "pause", "--run-id", "x"]);
  assert.equal(bad.code, 2);
  const ok = await run(["run", "pause", "--run-id", "run_firstdocs", "--json"]);
  assert.equal(ok.code, 0);
  assert.ok(ok.out.includes("pause_requested"));
  assert.equal((await run(["nope", "nope"])).code, 2);
  assert.equal((await run([])).code, 0);
});
