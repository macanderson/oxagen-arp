---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.story-per-named-state
record_id: rec_arp_story_per_named_state_b41e98fd11ff
record_hash: sha256:2247754276decee5105ad566c7495dd1e68938bfe98ec6b17eb7c52ea414871f
kind: rule
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: apps/web/src/features/run-detail.stories.tsx
steering:
  force: must
---

Every screen has a story for each state the specs name, including empty, denied, error, unpaired, and outcome unknown, and the story reads the same fixtures the page reads.
