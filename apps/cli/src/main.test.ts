import assert from "node:assert/strict";
import test from "node:test";
import { capabilitiesForSurface } from "@oxagen-arp/kernel";
import { registerFixtureHandlers } from "@oxagen-arp/fixtures";
import { DEFAULT_SCOPE, commandFor, doctor, help, quickstart, run } from "./main.ts";

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

test("doctor reports one line per check and --json returns the same list", async () => {
  registerFixtureHandlers();
  const checks = await doctor();
  assert.ok(checks.length >= 8);
  for (const c of checks) {
    assert.ok(["pass", "warn", "fail"].includes(c.state), c.name);
    assert.ok(c.detail.length > 0, c.name);
    // A check that is not passing must say what to do about it.
    if (c.state !== "pass") assert.ok(c.fix.length > 0, c.name);
  }
  const text = await run(["doctor"]);
  assert.equal(text.code, 0);
  for (const c of checks) assert.ok(text.out.includes(c.name), c.name);
  const json = await run(["doctor", "--json"]);
  assert.deepEqual(JSON.parse(json.out).checks.map((c: { name: string }) => c.name), checks.map((c) => c.name));
});

test("doctor fails when the bound workspace is not one the caller may see", async () => {
  registerFixtureHandlers();
  const r = await run(["doctor"], { ...DEFAULT_SCOPE, workspaceId: "ws_nope" });
  assert.equal(r.code, 5, "a failing check exits 5, not 0");
  assert.ok(r.out.includes("fail  workspace binding"));
});

test("quickstart runs the steps it can and names what continues the rest", async () => {
  registerFixtureHandlers();
  const steps = await quickstart();
  assert.ok(steps.every((s) => s.state !== "stopped"), "fixtures satisfy every step this binder runs");
  assert.equal(steps.at(-1)?.state, "remaining");
  assert.ok(steps.at(-1)?.next.length ?? 0 > 0, "a remaining step names what continues it");
  assert.equal((await run(["quickstart"])).code, 0);
});

test("quickstart stops at the first step it cannot complete and names the command that continues", async () => {
  registerFixtureHandlers();
  const steps = await quickstart({ ...DEFAULT_SCOPE, workspaceId: "ws_nope" });
  const stopped = steps.find((s) => s.state === "stopped");
  assert.ok(stopped, "a broken environment must stop the flow");
  assert.equal(stopped.name, "environment");
  assert.equal(stopped.next, "oxagen doctor");
  const r = await run(["quickstart"], { ...DEFAULT_SCOPE, workspaceId: "ws_nope" });
  assert.equal(r.code, 5);
  assert.ok(r.out.includes("Stopped at environment."));
});

test("the help advertises no command the CLI does not know", async () => {
  registerFixtureHandlers();
  // Exit 2 covers both an unknown command and missing input, so match on the unknown wording.
  let checked = 0;
  for (const line of help().split("\n")) {
    const m = /^ {2}(\S+(?: \S+)?)\s{2,}\S/.exec(line);
    if (!m) continue;
    checked++;
    const r = await run(m[1]!.split(" "));
    assert.ok(!r.out.startsWith("Unknown command"), `help advertises ${m[1]}, which the CLI does not know`);
  }
  assert.ok(checked >= capabilitiesForSurface("cli").length + 2, "every advertised command was checked");
});
