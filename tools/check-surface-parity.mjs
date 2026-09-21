#!/usr/bin/env node
// Surface parity gate, in the spirit of macanderson/oxagen's check_ui_parity.mjs. Parity is
// structural here: each surface is a binder over the registry, not a set of files. So the gate
// proves three things instead of counting files:
//   1. Every registered capability declares at least one surface and every surface it declares has
//      a binder that serves it (api, mcp, cli) or a page binding (app).
//   2. No surface carries a per-capability wrapper file. A file named after a capability under a
//      surface's routes/, tools/, or commands/ is duplicate code the kernel already provides.
//   3. Every `app` capability has a page in apps/web/capability-ui-map.json, that page exists, and
//      the page reaches the capability's DataSource port. A binding nobody calls is not parity.
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

const webRoot = path.join(root, "apps/web");
const { portCapabilities } = await import(path.join(webRoot, "src/data/ports.ts"));
// The data layer implements every port, so finding a call there proves nothing.
const dataLayer = ["src/data/ports.ts", "src/data/fixtures.ts", "src/data/live.ts", "src/data/source.ts"]
  .map((f) => path.join(webRoot, f));

function resolveImport(spec, fromFile) {
  const base = spec.startsWith("@/") ? path.join(webRoot, "src", spec.slice(2))
    : spec.startsWith(".") ? path.resolve(path.dirname(fromFile), spec)
    : null;
  if (base === null) return null;
  for (const c of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), path.join(base, "index.tsx")]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

/** True when `entry`, or anything it imports, calls `DataSource.<method>()` outside the data layer. */
function reachesPort(entry, method) {
  const call = new RegExp(`\\.${method}\\s*\\(`);
  const seen = new Set();
  const stack = [entry];
  while (stack.length > 0) {
    const file = stack.pop();
    if (seen.has(file) || !fs.existsSync(file)) continue;
    seen.add(file);
    const text = fs.readFileSync(file, "utf8");
    if (!dataLayer.includes(file) && call.test(text)) return true;
    for (const m of text.matchAll(/from\s+"([^"]+)"/g)) {
      const next = resolveImport(m[1], file);
      if (next !== null) stack.push(next);
    }
  }
  return false;
}

const uiMapPath = path.join(root, "apps/web/capability-ui-map.json");
const uiMap = fs.existsSync(uiMapPath) ? JSON.parse(fs.readFileSync(uiMapPath, "utf8")) : {};
for (const cap of caps) {
  if (cap.surfaces.length === 0) failures.push(`${cap.name} declares no surface`);
  if (cap.surfaces.includes("app")) {
    const binding = uiMap[cap.name];
    if (!binding) failures.push(`${cap.name} declares app but has no binding in apps/web/capability-ui-map.json`);
    else {
      const pages = [binding.page, ...(binding.also ?? [])];
      for (const page of pages) {
        if (!fs.existsSync(path.join(webRoot, page))) failures.push(`${cap.name}: page ${page} does not exist`);
      }
      const method = Object.keys(portCapabilities).find((k) => portCapabilities[k] === cap.name);
      if (method === undefined) failures.push(`${cap.name} declares app but apps/web/src/data/ports.ts has no port for it`);
      else if (!pages.some((page) => reachesPort(path.join(webRoot, page), method))) {
        failures.push(`${cap.name}: no bound page reaches DataSource.${method}(); the capability-ui-map.json binding is a claim nothing backs`);
      }
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
