---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.no-global-cross-org-poller
record_id: rec_arp_no_global_cross_org_poller_1d3dd088e8e4
record_hash: sha256:f6bbf80dfdcd8885c69274b66fd94588691c37b6186f794348dd6c3cab1f8845
kind: rule
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: ARP-core-schema.sql
steering:
  force: must
---

Background relays such as the outbox publisher run once per org under that org's database scope; do not add a service role or query that reads every org's rows in one pass.
