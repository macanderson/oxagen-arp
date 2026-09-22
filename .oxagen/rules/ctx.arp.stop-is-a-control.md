---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.stop-is-a-control
record_id: rec_arp_stop_is_a_control_c050b26f345b
record_hash: sha256:702cc6f317caadb16817108d57f32f9b389ab6e0b71664a172fdb3631d9509f7
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

Every surface has a Stop control distinct from Pause and a Cancel for work requests; a stopped run cannot resume and the copy says so.
