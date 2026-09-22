---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.enrollment-challenge-single-use
record_id: rec_arp_enrollment_challenge_single_use_a77073615d4f
record_hash: sha256:a55b279a2176c86a73e930901f939724e1bb393a682aa7996d7a65bb5ca35917
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

Device enrollment consumes a persisted single-use challenge bound to the device public key in the same transaction as device.enroll, and the attestation transcript signs over the nonce and that key.
