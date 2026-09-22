---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.quickstart-same-gates
record_id: rec_arp_quickstart_same_gates_05d806d30548
record_hash: sha256:115b9ce7aa6fbb4cc9cbfb48f7fc68ebcaaa0545523a03df17f8020e6effc238
kind: rule
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: ARP-CLI-spec.md
steering:
  force: must
---

oxagen quickstart composes the existing login, enroll, link, init, sync, validate, and submit steps with safe defaults; it must not add a bypass flag, skip the scanner, create a write-capable work order, or raise a cap above the org default.
