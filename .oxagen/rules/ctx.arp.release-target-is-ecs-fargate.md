---
schema: context-record/v0.2
set_id: macanderson.oxagen-arp
lineage_id: ctx.arp.release-target-is-ecs-fargate
record_id: rec_arp_release_target_is_ecs_fargate_52ca71712a7b
record_hash: sha256:da96b3a25acaadcb2d3275c9d893869ede4b88ce78d60754c570c6a3edf218ef
kind: fact
origin: user
sharing_scope: repository
status: active
provenance:
  source_kind: document
  source_uri: build-system/RELEASE-SETUP.md
steering:
  force: must
---

The release target is AWS ECS with Fargate in separate staging and production accounts, with Aurora PostgreSQL Serverless v2 and S3; the adapters and templates live under build-system/adapters/local-release.mjs and build-system/infrastructure/aws, and release stays disabled until RELEASE-SETUP.md is completed.
