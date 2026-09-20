// invoke() is the one execution path. Every surface calls it with the surface it verified; the
// kernel checks the registry, the surface allowlist, the input, the handler, and the output, in that
// order, and reports one typed result. Handlers are injected so the same contracts run against the
// fixture handlers in Storybook and the mockup app, and against live handlers in production.
import type { z } from "zod";
import { getCapability } from "./registry.ts";
import type {
  CapabilityContext,
  CapabilityDeclaration,
  CapabilityHandler,
  CapabilitySurface,
  InvokeResult,
} from "./types.ts";

const handlers = new Map<string, CapabilityHandler<unknown, unknown>>();

export class HandlerError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, status: number, message?: string) {
    super(message ?? code);
    this.code = code;
    this.status = status;
  }
}

export class DeniedError extends Error {
  readonly permission: string;
  constructor(permission: string) {
    super(`denied: ${permission}`);
    this.permission = permission;
  }
}

export function setHandler<C extends CapabilityDeclaration>(
  cap: C,
  handler: CapabilityHandler<z.infer<C["input"]>, z.infer<C["output"]>>,
): void {
  handlers.set(cap.name, handler as CapabilityHandler<unknown, unknown>);
}

export function clearHandlers(): void {
  handlers.clear();
}

export function hasHandler(name: string): boolean {
  return handlers.has(name);
}

function issues(error: z.ZodError): string[] {
  return error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`);
}

export async function invoke<T = unknown>(
  name: string,
  input: unknown,
  ctx: Omit<CapabilityContext, "surface">,
  options: { surface: CapabilitySurface },
): Promise<InvokeResult<T>> {
  const cap = getCapability(name);
  if (!cap) return { ok: false, reason: "unknown_capability", name };
  if (!cap.surfaces.includes(options.surface)) {
    return { ok: false, reason: "surface_not_allowed", name, surface: options.surface };
  }
  if (cap.scoped !== false && !ctx.workspaceId) {
    return { ok: false, reason: "invalid_input", name, issues: ["workspaceId: required for a scoped capability"] };
  }
  const parsed = cap.input.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid_input", name, issues: issues(parsed.error) };
  const handler = handlers.get(name);
  if (!handler) return { ok: false, reason: "no_handler", name };
  let raw: unknown;
  try {
    raw = await handler(parsed.data, { ...ctx, surface: options.surface });
  } catch (error) {
    if (error instanceof DeniedError) return { ok: false, reason: "denied", name, permission: error.permission };
    if (error instanceof HandlerError) return { ok: false, reason: "error", name, code: error.code, status: error.status };
    return { ok: false, reason: "error", name, code: "handler_threw", status: 500 };
  }
  const out = cap.output.safeParse(raw);
  if (!out.success) return { ok: false, reason: "invalid_output", name, issues: issues(out.error) };
  return { ok: true, value: out.data as T };
}
