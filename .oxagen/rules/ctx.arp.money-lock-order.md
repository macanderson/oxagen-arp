---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.money-lock-order
record_id: rec_arp_money_lock_order_36f74faea9fa
record_hash: sha256:af3cc5fa88b6e091ba937a6e0652e0b89b4a03efafc202c26dbbcf1749129ee7
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

Every writer that touches money locks the governed action row, then limit accounts one row at a time in id order, then periods one row at a time in id order, then holds, then effect state; do not rely on ORDER BY with FOR UPDATE as a lock order.
