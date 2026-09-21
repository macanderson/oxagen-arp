// The capability model every surface derives from, in the shape macanderson/oxagen uses
// (packages/oxagen/src/types.ts). One declaration per capability; the API, MCP, CLI, agent and app
// surfaces are binders over the registry, never hand-written wrappers.
import type { z } from "zod";

export type CapabilitySurface = "api" | "mcp" | "cli" | "agent" | "app";
export type ExecutionMode = "sync" | "async";

export interface CapabilityAgentMetadata {
  /** Shown to a model as the tool description; the contract description is for people. */
  toolDescription?: string;
  readOnly?: boolean;
  destructive?: boolean;
  requiresApproval?: boolean;
}

export interface CapabilityDeclaration<
  TInput extends z.ZodTypeAny = z.ZodTypeAny,
  TOutput extends z.ZodTypeAny = z.ZodTypeAny,
> {
  /** Dotted, stable, lowercase: `work.submit`. The MCP tool name and CLI command derive from it. */
  name: string;
  domain: string;
  description: string;
  mode: ExecutionMode;
  /** Every surface that may invoke this capability. A surface not listed is refused at the kernel. */
  surfaces: readonly CapabilitySurface[];
  input: TInput;
  output: TOutput;
  /** False for reads, so a console page may call it through a read-only seam. */
  mutates: boolean;
  /** True when a workspace must be resolved from the context and enforced. Default true. */
  scoped?: boolean;
  agent?: CapabilityAgentMetadata;
}

export interface CapabilityContext {
  orgId: string;
  workspaceId?: string | undefined;
  principalId: string;
  /** The verified surface the call arrived on; set by the binder, never by the caller's body. */
  surface: CapabilitySurface;
  /** Correlation id for audit and tracing. */
  requestId: string;
}

export type CapabilityHandler<TInput, TOutput> = (
  input: TInput,
  ctx: CapabilityContext,
) => Promise<TOutput>;

export type InvokeResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "unknown_capability"; name: string }
  | { ok: false; reason: "surface_not_allowed"; name: string; surface: CapabilitySurface }
  | { ok: false; reason: "invalid_input"; name: string; issues: string[] }
  | { ok: false; reason: "invalid_output"; name: string; issues: string[] }
  | { ok: false; reason: "no_handler"; name: string }
  | { ok: false; reason: "denied"; name: string; permission: string }
  | { ok: false; reason: "error"; name: string; code: string; status: number };
