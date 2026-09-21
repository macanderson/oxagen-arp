// The live DataSource: every port POSTs its capability to the API binder's generic dispatch route.
// Same interface as the fixture source; the only difference is where the kernel runs. Set
// OXAGEN_DATA_SOURCE=live and OXAGEN_API_URL to use it. Identity headers come from the session in
// the product; the mockup passes the viewer context as headers the binder will verify.
import { fromInvoke } from "./read.ts";
import { portCapabilities, type DataSource, type ViewerCtx } from "./ports.ts";
import type { InvokeResult } from "@oxagen-arp/kernel";

export function liveSource(baseUrl = process.env.OXAGEN_API_URL ?? "http://127.0.0.1:4010"): DataSource {
  const source: Partial<Record<keyof DataSource, unknown>> = {};
  for (const [port, capability] of Object.entries(portCapabilities) as [keyof DataSource, string][]) {
    source[port] = async (ctx: ViewerCtx, input: unknown = {}) => {
      const scoped = capability === "workspace.list" ? "" : `/workspaces/${ctx.workspaceId}`;
      const res = await fetch(`${baseUrl}/v0.1/organizations/${ctx.orgId}${scoped}/cap/${capability}`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-oxagen-principal": ctx.principalId },
        body: JSON.stringify(input),
        cache: "no-store",
      });
      const body = (await res.json()) as unknown;
      if (res.ok) return fromInvoke({ ok: true, value: body } as InvokeResult<unknown>);
      return fromInvoke(body as InvokeResult<unknown>);
    };
  }
  return source as DataSource;
}
