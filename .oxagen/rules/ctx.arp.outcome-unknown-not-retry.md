---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.outcome-unknown-not-retry
record_id: rec_arp_outcome_unknown_not_retry_ae25f1c9ae91
record_hash: sha256:d3815013ef31f4b221dacbc4de37aa4e3190e0926bccf465e7dca5044dff97f2
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

A timeout or lost reply after a write means outcome unknown; reconcile through the connector's lookup path before any retry, keep the hold, and never create a second action with a new idempotency key.
