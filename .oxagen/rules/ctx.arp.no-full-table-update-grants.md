---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.no-full-table-update-grants
record_id: rec_arp_no_full_table_update_grants_4bf6e3153dd6
record_hash: sha256:c1234438b267b47cf5964b01273468da4307eefea83686270afab8ad6df8034f
kind: rule
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: ARP-core-schema.sql
steering:
  force: must
---

Never grant the runtime role UPDATE on a whole protected table; grant the exact columns a transition may touch and add a one-way trigger so epochs only advance, revocations are final, idempotency digests are immutable, and objects never change org or workspace.
