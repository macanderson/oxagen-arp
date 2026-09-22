---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.keys-outside-agent-process
record_id: rec_arp_keys_outside_agent_process_d8a21e2c4b4e
record_hash: sha256:b12f58f0542e5588edfb4b2528342e3be6bafc4ac5569dd9a1705d5e42be0257
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

Provider keys, refresh tokens, device keys, and connector secrets live only in the protected local service or trusted gateway; agent code, repo files, CLI arguments, environment variables the agent can read, and run records never hold them.
