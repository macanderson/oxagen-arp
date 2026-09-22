---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.rls-scope-per-transaction
record_id: rec_arp_rls_scope_per_transaction_641e0d735455
record_hash: sha256:57c66262882b77f186533e4e97aba5df2a5163a28ea0dd66d172a9e6c17781c3
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

Set oxagen.org_id and either oxagen.workspace_id or oxagen.scope_kind='org' with set_config(..., true) at the start of every database transaction, pool connections in transaction mode only, and never issue a plain SET for scope.
