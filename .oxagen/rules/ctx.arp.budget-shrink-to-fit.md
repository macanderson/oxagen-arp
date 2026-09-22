---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.budget-shrink-to-fit
record_id: rec_arp_budget_shrink_to_fit_ee93ee4ce953
record_hash: sha256:cbcd061d98bc261ba93bef43c22757353d22019a6d7b7a0db125ff875b47d2a8
kind: rule
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: ARP-design.md
steering:
  force: should
---

When the remaining budget cannot cover the default output limit, the model gateway lowers the provider output limit to what the budget covers and records that limit in the hold, but never below the work order's floor and never by raising a cap.
