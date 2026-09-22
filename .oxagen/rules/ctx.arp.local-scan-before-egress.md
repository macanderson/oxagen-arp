---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.local-scan-before-egress
record_id: rec_arp_local_scan_before_egress_8e61b8914b09
record_hash: sha256:89564fc426a15deeae6bf6819cd2d63be72fe1de32fe9bdc599edd1e60fc1a63
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

No prompt, file, history, tool result, header, log line, report, or telemetry leaves the device before the local scanner has produced a ScanReceipt for those exact bytes, and no raw match, raw hash, or replacement map is ever uploaded.
