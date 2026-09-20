// The one composition point. Routes hand this to a feature, and a feature reads only through the
// DataSource it is given. OXAGEN_DATA_SOURCE=fixtures (default) or live.
import "server-only";
import { fixtureSource } from "./fixtures.ts";
import { liveSource } from "./live.ts";
import type { DataSource, ViewerCtx } from "./ports.ts";

export function dataSource(): DataSource {
  return (process.env.OXAGEN_DATA_SOURCE ?? "fixtures") === "live" ? liveSource() : fixtureSource();
}

/** The signed-in viewer. The product resolves this from the session; the mockup has one org and workspace. */
export function viewer(): ViewerCtx {
  return { orgId: "org_acme", workspaceId: "ws_support", principalId: "usr_maya" };
}
