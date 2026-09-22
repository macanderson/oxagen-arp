---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.org-naming
record_id: rec_arp_org_naming_f5e670c5e897
record_hash: sha256:926043b82e80016613807aa856a4d4f1b4ae59eeda75bf94196ca03ada241e4d
kind: rule
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: ARP-core-schema.sql
steering:
  force: must
---

The customer account is an org: the noun is org, the schema is org, the table is org.organizations, membership is org.org_users joined to auth.users, workspaces live in workspace.workspaces, and every identifier uses org_id; no other word for the customer account appears anywhere in this repository.
