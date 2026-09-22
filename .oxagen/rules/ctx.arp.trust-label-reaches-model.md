---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.trust-label-reaches-model
record_id: rec_arp_trust_label_reaches_model_4ea366d42db4
record_hash: sha256:413e3998d63c1d6d6ead6d2d28036c5d05f302d7f4903cad2694c2e3a59d6701
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

Context and memory revisions carry trust_state and origin, and composition items keep both, so untrusted text is still labeled untrusted at the point it enters the model request.
