---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.local-peer-auth
record_id: rec_arp_local_peer_auth_435dbb45a8f5
record_hash: sha256:d3fb9204011a11beef55d585e74fcc8fcaa20683bb1fa1b02c1e3cb87494ad09
kind: rule
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: ARP-Desktop-app-spec.md
steering:
  force: must
---

The desktop guard authenticates every local caller with OS peer credentials and a code-signature check, refuses peers inside the agent sandbox, validates Host and Origin on the pairing endpoint, and never accepts a shared secret the agent could read.
