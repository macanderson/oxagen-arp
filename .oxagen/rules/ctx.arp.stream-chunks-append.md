---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.stream-chunks-append
record_id: rec_arp_stream_chunks_append_6d4995394f38
record_hash: sha256:7821c3b715d383c3c312082c956e8a5e8694a0c3447c527b5276ee236de0276e
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

Stream chunks append to one evidence object per attempt in groups of at least 16 KB or two seconds; never write one durable object per chunk.
