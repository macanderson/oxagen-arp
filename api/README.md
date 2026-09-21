# Oxagen API contract bundle

This bundle defines a **proposed API**, not a running service. It contains 369 operations on 288 paths and 342 payload schemas. Fourteen future plugin and business-correlation operations are reserved and disabled.

- [Full API reference](API-REFERENCE.md): every proposed HTTP operation and model field, with shared rules for identity, local scanning, retries, events, pause boundaries, setup and bootstrap.
- [OpenAPI 3.1 JSON](oxagen-openapi-0.1.json): the machine-readable contract. Its `.invalid` server address is intentional.
- [Endpoint inventory](endpoint-inventory.json): a compact list for tooling and coverage reviews.
- [Examples](examples.json): representative typed requests and values.
- [Validation report](validation-report.json): actual structural checks and their limits.
- [Certification blockers](CERTIFICATION-BLOCKERS.md): contracts and runtime tests still required before support can be claimed.
- [Repo file schema](repo-schemas/workspace.schema.json), [context schema](repo-schemas/context.schema.json), [steering schema](repo-schemas/steering.schema.json), [sync receipt schema](repo-schemas/sync-lock.schema.json) and [run-start receipt schema](repo-schemas/run-start-receipt.schema.json): the separate `.oxagen` file contract.

The HTTP control API, protected service envelopes and bootstrap operations are specified here. Provider-native model wires, MCP, CGP, native hooks and local IPC need their own pinned profiles. A successful API schema check does not prove tool interception, budget enforcement, local data protection, org isolation or safe interruption.

Count-account and counter-settlement fields are reserved and return `FEATURE_DISABLED` before any effect until their storage and evidence profile is certified. Monetary budgets use the current proposed contract.
