---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.budget-hold-before-spend
record_id: rec_arp_budget_hold_before_spend_296cc31bb577
record_hash: sha256:49f9aef7a06313d9e765fb34ac9f2d565d3fd996277db09cefe5f03ee1c62050
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

Reserve the defensible maximum cost in every applicable budget inside one transaction before any paid call is dispatched, settle only from a trusted usage receipt, and never release a hold because of a timeout, cancel, or lost device.
