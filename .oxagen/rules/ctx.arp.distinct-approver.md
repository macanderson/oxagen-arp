---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.distinct-approver
record_id: rec_arp_distinct_approver_9722e730fce4
record_hash: sha256:c8fbf8f90970119553159d6e95a1c7db377920cc3165150af3c2159650f0d36b
kind: rule
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: ARP-Schema-spec.md
steering:
  force: must
---

An exception grant is rejected when the approver is the requester or the action's accountable operator, or when its amount exceeds the governing hard cap in the same policy revision.
