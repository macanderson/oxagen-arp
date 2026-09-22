---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.app-capability-needs-ui-map
record_id: rec_arp_app_capability_needs_ui_map_8ac315fb6e3c
record_hash: sha256:86c6a226c7bf7403028241667f500f423136a771ed44d6561f68eb81d33c4943
kind: rule
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: apps/web/capability-ui-map.json
steering:
  force: must
---

A capability that declares the app surface must have a page binding in apps/web/capability-ui-map.json whose page file exists, and a port in ports.ts; the parity gate and the data-seam test both check this.
