// The one registry every surface enumerates. Registering a capability is the only way to add one;
// a binder never lists names by hand, so parity between API, MCP, CLI, agent and app follows from
// how bindings are built, and the parity gate only has to prove the binders cover the registry.
import type { CapabilityDeclaration, CapabilitySurface } from "./types.ts";

const registry = new Map<string, CapabilityDeclaration>();
const NAME = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;

export function registerCapability<C extends CapabilityDeclaration>(cap: C): C {
  if (!NAME.test(cap.name)) throw new Error(`Capability name must be dotted lowercase: ${cap.name}`);
  if (registry.has(cap.name)) throw new Error(`Capability already registered: ${cap.name}`);
  if (cap.surfaces.length === 0) throw new Error(`Capability declares no surface: ${cap.name}`);
  if (new Set(cap.surfaces).size !== cap.surfaces.length) throw new Error(`Duplicate surface on ${cap.name}`);
  registry.set(cap.name, cap);
  return cap;
}

export function getCapability(name: string): CapabilityDeclaration | undefined {
  return registry.get(name);
}

export function allCapabilities(): readonly CapabilityDeclaration[] {
  return [...registry.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function capabilitiesForSurface(surface: CapabilitySurface): readonly CapabilityDeclaration[] {
  return allCapabilities().filter((c) => c.surfaces.includes(surface));
}

/** Test seam only: a test that registers a throwaway contract removes it again. */
export function unregisterCapabilityForTest(name: string): void {
  registry.delete(name);
}
