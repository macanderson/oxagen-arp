---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.abandon-stuck-pause
record_id: rec_arp_abandon_stuck_pause_a4c25a5023e1
record_hash: sha256:c212edddd11de7f047e664d43630a3418de8ffcb44427cc0847bb6e1f2cef1c8
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

A pause that cannot be confirmed is exited only by an authorized abandon that records unresolved effects as unknown, keeps every hold, revokes the run's credentials, moves the run to outcome unknown, and releases its concurrency slot.
