---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.budget-leases-not-one-row
record_id: rec_arp_budget_leases_not_one_row_93e3f96f976d
record_hash: sha256:9c6eb11d21947c4e790c66b7abbb231cbcce30c656c299c700373c7df480d161
kind: rule
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: ARP-design.md
steering:
  force: should
---

A model proxy leases a bounded block from a parent budget period and sub-allocates locally, so an organization-wide budget is not one row that every model call locks twice; the lease is itself a hold on the parent.
