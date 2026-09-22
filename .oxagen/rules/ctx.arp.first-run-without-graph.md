---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.first-run-without-graph
record_id: rec_arp_first_run_without_graph_547f29022bab
record_hash: sha256:4b266a6dd9ef46411e6cf2e3a3a60327d3f8bae3d02ce1634d8a4b99be4e87d9
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

The first governed run in a new workspace must succeed with an empty knowledge graph by resolving context from explicit source references; no gate may wait on graph freshness or deny because the graph is empty.
