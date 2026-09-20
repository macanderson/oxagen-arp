// The typed list of reads and commands a page may make. Every method is one kernel capability, so the
// fixture source and the live source implement the same interface: the fixture source runs the
// capability in-process against fixture handlers, the live source calls the API binder. Wiring the
// product is switching OXAGEN_DATA_SOURCE, nothing else in a page changes.
import type { z } from "zod";
import type {
  budgetStatus, deviceList, deviceRevoke, modelRouteList, runGet, runList, runPause, runResume, runSteer, runStop,
  workCancel, workSubmit, workspaceList,
} from "@oxagen-arp/kernel";
import type { Read } from "./read.ts";

export interface ViewerCtx {
  orgId: string;
  workspaceId: string;
  principalId: string;
}

type In<C extends { input: z.ZodTypeAny }> = z.infer<C["input"]>;
type Out<C extends { output: z.ZodTypeAny }> = z.infer<C["output"]>;

export interface DataSource {
  workspaces(ctx: ViewerCtx): Promise<Read<Out<typeof workspaceList>>>;
  modelRoutes(ctx: ViewerCtx): Promise<Read<Out<typeof modelRouteList>>>;
  runs(ctx: ViewerCtx, input?: In<typeof runList>): Promise<Read<Out<typeof runList>>>;
  run(ctx: ViewerCtx, input: In<typeof runGet>): Promise<Read<Out<typeof runGet>>>;
  budget(ctx: ViewerCtx, input?: In<typeof budgetStatus>): Promise<Read<Out<typeof budgetStatus>>>;
  devices(ctx: ViewerCtx): Promise<Read<Out<typeof deviceList>>>;
  // Commands. Each takes an idempotency key the page mints once per intent.
  pauseRun(ctx: ViewerCtx, input: In<typeof runPause>): Promise<Read<Out<typeof runPause>>>;
  resumeRun(ctx: ViewerCtx, input: In<typeof runResume>): Promise<Read<Out<typeof runResume>>>;
  stopRun(ctx: ViewerCtx, input: In<typeof runStop>): Promise<Read<Out<typeof runStop>>>;
  steerRun(ctx: ViewerCtx, input: In<typeof runSteer>): Promise<Read<Out<typeof runSteer>>>;
  submitWork(ctx: ViewerCtx, input: In<typeof workSubmit>): Promise<Read<Out<typeof workSubmit>>>;
  cancelWork(ctx: ViewerCtx, input: In<typeof workCancel>): Promise<Read<Out<typeof workCancel>>>;
  revokeDevice(ctx: ViewerCtx, input: In<typeof deviceRevoke>): Promise<Read<Out<typeof deviceRevoke>>>;
}

/** Method name to capability name. The parity gate and both sources read this one table. */
export const portCapabilities = {
  workspaces: "workspace.list",
  modelRoutes: "model_route.list",
  runs: "run.list",
  run: "run.get",
  budget: "budget.status",
  devices: "device.list",
  pauseRun: "run.pause",
  resumeRun: "run.resume",
  stopRun: "run.stop",
  steerRun: "run.steer",
  submitWork: "work.submit",
  cancelWork: "work.cancel",
  revokeDevice: "device.revoke",
} as const satisfies Record<keyof DataSource, string>;
