---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.build-batches-cannot-edit-ci
record_id: rec_arp_build_batches_cannot_edit_ci_ac2dd37e426a
record_hash: sha256:837c89f075afd7a09e54b3e73f9c5fa2bdc22ce9be680025e75e95d6656f232a
kind: rule
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: build-system/examples/plan.json
steering:
  force: must
---

Product build batches may not edit .github; a workflow change needs a separate reviewed control run so an implementer cannot rewrite the check that gates its own merge.
