// The fixture DataSource: every port runs its capability in-process through the kernel with the
// fixture handlers installed. It is generic over the port table, so adding a port is one line in
// ports.ts and no code here. Storybook and `next dev` use this source.
import { randomUUID } from "node:crypto";
import { invoke } from "@oxagen-arp/kernel";
import { registerFixtureHandlers } from "@oxagen-arp/fixtures";
import { fromInvoke } from "./read.ts";
import { portCapabilities, type DataSource, type ViewerCtx } from "./ports.ts";

let installed = false;

export function fixtureSource(): DataSource {
  if (!installed) { registerFixtureHandlers(); installed = true; }
  const source: Partial<Record<keyof DataSource, unknown>> = {};
  for (const [port, capability] of Object.entries(portCapabilities) as [keyof DataSource, string][]) {
    source[port] = async (ctx: ViewerCtx, input: unknown = {}) =>
      fromInvoke(await invoke(capability, input, { ...ctx, requestId: randomUUID() }, { surface: "app" }));
  }
  return source as DataSource;
}
