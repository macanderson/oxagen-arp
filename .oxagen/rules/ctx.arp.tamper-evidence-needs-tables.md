---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.tamper-evidence-needs-tables
record_id: rec_arp_tamper_evidence_needs_tables_6d8de67aef10
record_hash: sha256:89dea170eb1503227bfaa9f3de9fa41a268c3d2308239d56c47df773c0e34e51
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

Do not claim tamper-evident history unless audit_log_leaves, audit_log_checkpoints, audit.inclusion_proof, and audit.consistency_proof exist; without them say signed records.
