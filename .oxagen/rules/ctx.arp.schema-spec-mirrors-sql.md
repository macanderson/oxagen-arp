---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.schema-spec-mirrors-sql
record_id: rec_arp_schema_spec_mirrors_sql_704a12fcd27a
record_hash: sha256:cda6fb588e4331a06f42eacd1776d81c314a68ac35a1f4997af1163df9c6fe96
kind: procedure
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: ARP-Schema-spec.md
steering:
  force: must
---

When ARP-core-schema.sql changes, replace the sql code block in ARP-Schema-spec.md with the full file and regenerate SHA256SUMS.txt in the same commit so the two never drift.
