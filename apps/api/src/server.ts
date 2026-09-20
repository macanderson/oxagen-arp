// The REST binder. One generic dispatch route serves every capability the registry declares for the
// `api` surface: POST /v0.1/organizations/:org/workspaces/:ws/cap/:name. There is no per-capability
// route file; the route table is derived at boot, which is what makes surface parity structural.
import http from "node:http";
import { randomUUID } from "node:crypto";
import { capabilitiesForSurface, invoke, type InvokeResult } from "@oxagen-arp/kernel";
import { registerFixtureHandlers } from "@oxagen-arp/fixtures";

const ROUTE = /^\/v0\.1\/organizations\/([a-z0-9_]+)(?:\/workspaces\/([a-z0-9_]+))?\/cap\/([a-z0-9_.]+)$/;

export function statusFor(r: InvokeResult<unknown>): number {
  if (r.ok) return 200;
  switch (r.reason) {
    case "unknown_capability": return 404;
    case "surface_not_allowed": return 405;
    case "invalid_input": return 422;
    case "invalid_output": return 500;
    case "no_handler": return 501;
    case "denied": return 403;
    case "error": return r.status;
  }
}

export function installHandlers(): void {
  if ((process.env.OXAGEN_DATA_SOURCE ?? "fixtures") === "fixtures") registerFixtureHandlers();
  else throw new Error("OXAGEN_DATA_SOURCE=live: install the live handlers here; nothing is wired yet");
}

export function createServer(): http.Server {
  const served = new Set(capabilitiesForSurface("api").map((c) => c.name));
  return http.createServer(async (req, res) => {
    const requestId = randomUUID();
    res.setHeader("content-type", "application/json");
    res.setHeader("x-request-id", requestId);
    if (req.method === "GET" && req.url === "/v0.1/capabilities") {
      res.end(JSON.stringify({ items: capabilitiesForSurface("api").map((c) => ({ name: c.name, domain: c.domain, mode: c.mode, mutates: c.mutates, description: c.description })) }));
      return;
    }
    const m = req.method === "POST" ? ROUTE.exec(req.url ?? "") : null;
    if (!m) { res.statusCode = 404; res.end(JSON.stringify({ code: "not_found", requestId })); return; }
    const [, orgId, workspaceId, name] = m;
    if (!name || !served.has(name)) { res.statusCode = 404; res.end(JSON.stringify({ code: "unknown_capability", requestId })); return; }
    let body = "";
    for await (const chunk of req) { body += chunk; if (body.length > 1_000_000) { res.statusCode = 413; res.end(); return; } }
    let input: unknown = {};
    try { input = body ? JSON.parse(body) : {}; } catch { res.statusCode = 400; res.end(JSON.stringify({ code: "invalid_json", requestId })); return; }
    // Identity comes from the verified bearer token in the product; the mockup binder uses a fixed principal.
    const ctx = { orgId: orgId ?? "", workspaceId, principalId: "usr_maya", requestId };
    const result = await invoke(name, input, ctx, { surface: "api" });
    res.statusCode = statusFor(result);
    if (result.ok && result.value && typeof result.value === "object") res.end(JSON.stringify(result.value));
    else res.end(JSON.stringify({ ...result, requestId }));
  });
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file://").href) {
  installHandlers();
  const port = Number(process.env.PORT ?? 4010);
  createServer().listen(port, () => console.log(`api listening on :${port} (${process.env.OXAGEN_DATA_SOURCE ?? "fixtures"})`));
}
