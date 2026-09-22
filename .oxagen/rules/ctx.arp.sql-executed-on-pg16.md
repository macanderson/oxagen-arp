---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.sql-executed-on-pg16
record_id: rec_arp_sql_executed_on_pg16_c3f260f1f181
record_hash: sha256:33f884122b2bd62f1dbf3a1ecff18d12cc96242e313a4b7f7ceebcff0e2fc68e
kind: fact
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: AUDIT.md
steering:
  force: info
---

ARP-core-schema.sql loads cleanly on PostgreSQL 16 and passes org, workspace, cross-org, and concurrent-hold tests as of 2026-09-20; it is still a representative subset and not the production migration.
