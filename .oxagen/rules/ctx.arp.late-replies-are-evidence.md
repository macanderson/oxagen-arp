---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.late-replies-are-evidence
record_id: rec_arp_late_replies_are_evidence_20b23b9466b1
record_hash: sha256:2650f50dd2e0ad711ad9688196ce26d9afc84d9ccf53661d44acfaf023d9c37a
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

A reply accepted or released after a run's gate closed is evidence only; it enters a resumed run, memory, tool queue, or completion check only through a separately recorded adoption decision with fresh rights.
