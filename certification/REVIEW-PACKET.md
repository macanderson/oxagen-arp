# Oxagen review packet

**Status: review candidate. Not certified.** This packet contains concrete designs and contracts to inspect before a product build. No live product implementation, merge or deployment has been started.

## Open the candidates

| Candidate | Entry point | What is present |
|---|---|---|
| Web product | [Web mockups](Oxagen-web-mockups.html) | 19 linked screens for workspace setup, operators, agents, policy, tools, context, spend, run control and reports. |
| Desktop product | [Desktop mockups](Oxagen-desktop-mockups.html) | 15 linked screens for enrollment, repo binding, loaded setup, local scanning, tools, pause proof and recovery. |
| Full mockup description | [Screen and flow inventory](Mockups.md) | Markdown for every screen's fields, sample records, actions and recovery meaning. |
| Architecture reader | [Oxagen ARP](../Oxagen-ARP.html) | Design, Short guide, Drawings and Specs. Each view exports full Markdown. |
| API | [HTTP reference](../api/API-REFERENCE.md) and [OpenAPI](../api/oxagen-openapi-0.1.json) | 369 proposed operations, 288 paths and 342 typed schemas. |
| Data schema | [Schema spec](../ARP-Schema-spec.md) and [core SQL](../ARP-core-schema.sql) | Typed table catalog, constraints, IAM/RLS, accounting and setup records; a representative SQL subset. |
| Repo setup | [Sample guide](../workspace-samples/README.md) | Six exact JSON schemas, `.oxagen` examples, and illustrative receipts. |
| Build system | [Runner documentation](../build-system/README.md) | Concrete Linux Docker execution, local model budget broker, exact-head checks, GitHub PR/CI/squash-or-merge support, 22 batches and recovery tests. |
| Build plan | [Build plan](../ARP-Build-plan.md) | Exact batch prompts, dependencies, certification, review and release gates. |

All mockup records are fictional. Their buttons change design fixtures, not real accounts, rules, jobs or money. Each screen has ready, empty, loading, denied, error and stale examples. These fixtures show presentation; they do not implement asynchronous services. The product still needs platform-specific interaction and accessibility review.

## What was checked here

The reader's four navigation items and all eight spec choices were exercised. The dropdown was checked at 390px width, in light and dark modes, with keyboard focus controls. Search reaches individual API operations. Markdown exports were compared with packaged files; relative links and checksums were checked.

Every web and desktop screen was opened. Desktop data protection was inspected at 390px without page overflow. The mockups have no network actions or real input upload. Runtime states such as paused are separate fixtures; clicking a design link does not create proof of a real pause.

The [API validation report](../api/validation-report.json) records structural checks, including local references, the official OpenAPI structural schema, component schemas and sample payloads. It does not prove that the APIs are implemented or secure. The runner README records its actual local tests separately from live integration. The representative SQL was executed on PostgreSQL 16 during the 2026-09-20 review with org, workspace and concurrent-hold tests; the full schema and production settlement procedures remain untested.

## What still blocks product certification

The reviewer must approve the actual designs, scope and behavior. Freeze the open contract decisions in the [API certification gates](../api/CERTIFICATION-BLOCKERS.md), including exact signature bytes, provider-native and local IPC profiles, bootstrap trust, legal state transitions and error rules. Convert the full schema catalog into tested migrations; the example SQL is not that complete migration set.

Confirm the production stack, approved model/harness combinations, platform support, data placement, limits, source connectors, CI requirements and recovery targets. Real OS isolation, local scans, model cost bounds, service credentials, repository-host integration and deployment gates need implementation and live qualification. The supplied local runner now implements harness execution and GitHub operations. Squash and merge results require exact tree/parent proof and CI on the actual merged commit; rebase merge is unsupported. Linux host and live provider qualification remain open. The hosting target is now AWS ECS with Fargate in separate staging and production accounts, backed by Aurora PostgreSQL Serverless v2 and S3. The package includes its concrete artifact, deployment and rollback modules and infrastructure templates. Read [release setup](../build-system/RELEASE-SETUP.md) for one-time inputs and live qualification gates. Docker Compose is local-development only; Kubernetes is deferred. No AWS resource was provisioned and no product certification was granted.

These are explicit build and certification gates. They must not be replaced by a checkbox that says tests passed. No completed or charged operation with a lost response may be retried blindly. The local runner can adopt a bound receipt from its protected store or reconcile a proved GitHub result. Unknown provider liability remains blocked.

## Bind approval to exact bytes

[manifest.json](manifest.json) lists the review files and SHA-256 values. It is a file inventory made by this task, not an approval or signature. Review those bytes, then use the protected runner's certification workflow. That workflow binds the complete phase-zero tree, approved source pack, build plan, certifier and expiry. A material change invalidates the affected approval and dependent work.

The runner keeps role, harness and model separate. Codex can implement while Claude Code reviews, or the reverse, with a separately chosen supported model for each role. Every candidate needs a fresh independent review of its exact commit. A new commit cannot inherit a pass from an older one.
