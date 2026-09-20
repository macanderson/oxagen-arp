#!/usr/bin/env node
// Surface parity gate, in the spirit of macanderson/oxagen's check_ui_parity.mjs. Parity is
// structural here: each surface is a binder over the registry, not a set of files. So the gate
// proves three things instead of counting files:
//   1. Every registered capability declares at least one surface and every surface it declares has
//      a binder that serves it (api, mcp, cli) or a page binding (app).
//   2. No surface carries a per-capability wrapper file. A file named after a capability under a
//      surface's routes/, tools/, or commands/ is duplicate code the kernel already provides.
//   3. Every `app` capability has a page in apps/web/capability-ui-map.json and that page exists.
// Default: warn. --strict: exit 1 on any failure.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");
const { allCapabilities } = await import(path.join(root, "packages/kernel/src/index.ts"));

const binders = {
  api: "apps/api/src/server.ts",
  mcp: "apps/mcp/src/server.ts",
  cli: "apps/cli/src/main.ts",
  agent: "packages/kernel/src/kernel.ts",
};
const failures = [];
const caps = allCapabilities();
if (caps.length === 0) failures.push("registry is empty");

for (const [surface, file] of Object.entries(binders)) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`binder missing for ${surface}: ${file}`);
}

const uiMapPath = path.join(root, "apps/web/capability-ui-map.json");
const uiMap = fs.existsSync(uiMapPath) ? JSON.parse(fs.readFileSync(uiMapPath, "utf8")) : {};
for (const cap of caps) {
  if (cap.surfaces.length === 0) failures.push(`${cap.name} declares no surface`);
  if (cap.surfaces.includes("app")) {
    const binding = uiMap[cap.name];
    if (!binding) failures.push(`${cap.name} declares app but has no binding in apps/web/capability-ui-map.json`);
    else for (const page of [binding.page, ...(binding.also ?? [])]) {
      if (!fs.existsSync(path.join(root, "apps/web", page))) failures.push(`${cap.name}: page ${page} does not exist`);
    }
  }
}
for (const name of Object.keys(uiMap)) {
  if (!caps.some((c) => c.name === name)) failures.push(`capability-ui-map.json binds unknown capability ${name}`);
}

const wrapperDirs = ["apps/api/src/routes", "apps/mcp/src/tools", "apps/cli/src/commands"];
for (const dir of wrapperDirs) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) continue;
  for (const f of fs.readdirSync(abs)) {
    const stem = f.replace(/\.(ts|mjs|js)$/, "");
    if (caps.some((c) => c.name === stem || c.name.replaceAll(".", "_") === stem || c.name.replaceAll(".", "-") === stem)) {
      failures.push(`${dir}/${f} is a per-capability wrapper; the ${dir.split("/")[1]} binder already serves ${stem}`);
    }
  }
}

const summary = `${caps.length} capabilities; surfaces: ${["api", "mcp", "cli", "agent", "app"].map((s) => `${s}=${caps.filter((c) => c.surfaces.includes(s)).length}`).join(" ")}`;
if (failures.length === 0) {
  console.log(`surface parity ok: ${summary}`);
} else {
  for (const f of failures) console.log(`${strict ? "::error::" : "::warning::"}${f}`);
  console.log(`surface parity: ${failures.length} problem(s); ${summary}`);
  if (strict) process.exit(1);
}
