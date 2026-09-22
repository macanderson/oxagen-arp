---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.node-env-for-builds
record_id: rec_arp_node_env_for_builds_a1d62ba1fbd9
record_hash: sha256:3a88bfe639575fafd98d67861ed3e3cbb099bc3f42134963b2972871bf23d734
kind: fact
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: apps/web/package.json
steering:
  force: should
---

next build fails prerendering with a null useContext when the shell exports a non-standard NODE_ENV; run builds with NODE_ENV=production or unset, as the Surfaces workflow does.
