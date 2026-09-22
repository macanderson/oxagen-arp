---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.rls-is-a-floor
record_id: rec_arp_rls_is_a_floor_8af5612ba3bb
record_hash: sha256:5f0517b4c1b20699d5f106176a921de6e5f1e14a035298040ff9d266f5591be3
kind: rule
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: ARP-design.md
steering:
  force: must
---

Row-level security is an org floor, not authorization; every read and write still passes the per-record IAM check, and files, search, graph, queues, caches, and exports need the same check because RLS does not cover them.
