---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.governed-action-single-use
record_id: rec_arp_governed_action_single_use_daac150d7994
record_hash: sha256:b6aee4295b35faa58cb297190834835ea969d2e1e5aa50b34eae6bdc309b4b0f
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

Every model call, tool call, context fetch, and external write is one governed action with a single-use authorization bound to the exact cleaned request digest, caller, run, authority epoch, and expiry; a changed request or a reused authorization is denied.
