---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.repo-files-grant-nothing
record_id: rec_arp_repo_files_grant_nothing_1648e034cdd6
record_hash: sha256:f2fc9c5db6c26d9cbd6209ba3945a15026ac551bea4afc89e5124ae909c46905
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

Files under .oxagen request a workspace, context, and steering; they cannot raise a budget, weaken a deny, pick an endpoint, install a tool, or switch orgs, and an edited Git remote never changes the workspace binding.
