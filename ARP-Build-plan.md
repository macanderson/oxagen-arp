# Oxagen build plan

The package now includes clickable product mockups, a proposed HTTP API contract, typed schema designs, and a runnable build controller. They are review candidates. **The user has not certified them, and the product build has not started.** No live agent build, PR, merge, or deployment ran in this task.

The package now includes concrete local Codex/Claude execution, a local model budget broker, isolated test commands, and GitHub PR/CI/merge operations. They use a supported Linux Docker profile. No separate execution or Git service must be built. Live qualification is still required. **The chosen release target is AWS ECS with Fargate in separate staging and production accounts.** The package now includes its artifact builder, deployment adapter and infrastructure templates. Setup, certification and live qualification are still required.

The [review packet](certification/REVIEW-PACKET.md) links the concrete files, validation evidence, known gaps and unsigned file manifest.

## Review the material already built

Open the [web product mockups](certification/Oxagen-web-mockups.html), with 19 screens, and the [desktop product mockups](certification/Oxagen-desktop-mockups.html), with 15 screens. The [complete screen and flow description](certification/Mockups.md) records the entry points, actions, fields, example records, and recovery rules.

The candidates include light and dark themes, screen navigation, primary flow links, and ready, empty, loading, denied, error, and stale fixtures. These are presentation fixtures. They do not sign in, issue grants, send messages, run agents, move money, or prove backend behavior. A specialist still needs to review platform behavior, keyboard and screen-reader access, narrow layouts, and every required recovery path.

The API pack contains the [OpenAPI 3.1 document](api/oxagen-openapi-0.1.json), [full HTTP reference](api/API-REFERENCE.md), [endpoint inventory](api/endpoint-inventory.json), [examples](api/examples.json), [validation results](api/validation-report.json), and [certification blockers](api/CERTIFICATION-BLOCKERS.md). It defines proposed paths and typed payloads. It does not certify running endpoints. The inventory is the current list of operations.

Use the [Schemas specification](ARP-Schema-spec.md), [Brand specification](ARP-Brand-spec.md), [Design](ARP-design.md), and all surface specifications with that pack. OpenAPI covers HTTP. It does not replace provider-native model requests, MCP, CGP, local IPC, native tool guards, or the ARP event and state rules. Their exact wire profiles, signatures, race behavior, and tests must also be frozen before certification.

## What the runner actually contains

The deliverables include [the Node controller](build-system/runner.mjs), [Bash entry point](build-system/run.sh), [bootstrap](build-system/bootstrap.mjs), [22-batch plan](build-system/examples/plan.json), and [local setup guide](build-system/LOCAL-SETUP.md). The [configuration](build-system/examples/config.json) selects the supplied local adapter. Its zero budget and placeholder images and repository prevent accidental live work.

The local adapter runs pinned Codex and Claude CLIs in separate Docker containers. Each container has no network interface, no host credentials, no Docker socket, and a fresh home. Only the current worktree and read-only approved inputs are mounted. Reviewers get a separate read-only checkout. A local socket broker is their only model route. It scans its supported text/JSON fields and reserves a conservative dollar bound before each request.

The controller owns the protected bare repository and commits. It uses host-side GitHub authentication to publish reviewed candidates. Local tests run on a fresh copy of the exact commit, with configured commands and no credentials or network. The adapter accepts squash or merge commits only after proving their actual tree and parents, then requires CI on the actual merged commit.

These are operational modules, not requests to an unimplemented execution service. Their live Linux and provider behavior has not been qualified here. The local scanner uses literal rules and narrow text profiles; it is not the full future Oxagen data-protection engine.

## Bootstrap without starting work

The supported host is Linux with Docker Engine, Node 22+, `/usr/bin/git`, and GitHub CLI. A local Linux VM may be used; direct macOS/Windows operation and remote Docker daemons are outside this profile. The Node controller has no npm dependencies.

```sh
cd build-system
node --test test/*.test.mjs
./run.sh plan --manifest examples/plan.json
./run.sh dry-run --manifest examples/plan.json
node bootstrap.mjs /srv/oxagen-control /srv/oxagen-agent-work \
  /srv/oxagen-readonly-inputs /path/to/reviewed-source-pack
```

These commands make no paid model call or remote write. Bootstrap copies the reviewed architecture, specs, brand, schemas, mockups, API and acceptance material into a checked source pack. Do not include secrets. Agents receive its file list and digest through a read-only mount.

Follow [the one-time setup](build-system/LOCAL-SETUP.md): pin the CLI and quality images; supply private host-only provider and GitHub credentials; choose the exact repository/default branch and CI producers; configure real checks for every batch; review the supported pricing and data rules; and set finite money/time limits. Choose a model separately for each harness and role from the local broker's supported profiles. The current profiles are deliberately narrow and reject unsupported models or wire formats.

The unpaid `preflight` command checks the actual container restrictions, pinned CLI versions and two-request synthetic model/tool loops. It reads GitHub identity and fetches the existing branch. It creates no PR or paid model request. A successful fixture is not a substitute for approved live-provider testing.

The hosting choice is settled: ECS with Fargate, Aurora PostgreSQL Serverless v2 and S3. Fill in real account, region, network and secret-reference settings using the [release setup](build-system/RELEASE-SETUP.md). The supplied example keeps release disabled. Docker Compose is only for local development; Kubernetes is deferred.

## Certification is an exact gate

The first four batches refine and check the supplied review candidates. They stay local, with no PR or merge, and may edit only `phase0/`. They may produce prototypes, screens, contracts, and review evidence; they may not implement the product.

The required entry files are `phase0/desktop.html`, `phase0/web.html`, `phase0/openapi.json`, `phase0/schema.sql`, and `phase0/certification-pack.md`. The complete tree must also include every local asset and linked contract needed to review those files. The trusted quality gate must reject missing flows, unresolved contract gaps, broken references, and external assets outside the certified set.

Certification binds the plan digest, approved source-pack digest, SHA-256 of **every file under phase0**, the local launcher/settings/images/models/limits, and an explicit expiry. It is signed by an operator-selected Ed25519 certifier whose private key is unavailable to agents. The controller pins one exact certificate per product or release batch. It checks the signature, expiry, and exact bytes before each agent or external gate and after returned work, before moving on. Changed, missing, or expired inputs block the build. Replacing that certificate during the batch also blocks progress; a contract change needs a new certified control run.

```sh
./run.sh snapshot --config /srv/oxagen-control/config.json \
  --worktree /srv/oxagen-agent-work/design-certification-pack-1
```

This produces a payload for review, not an approval. The certifier reviews the full artifact set and settings, sets the expiry, and explicitly runs the supplied [manual signing tool](build-system/certify.mjs) with a private key outside the controller and agent mounts. The controller never calls that tool. Existing mockups and successful structural API checks do not satisfy this gate by themselves.

## Complete task and review prompts

The plan JSON is the machine-readable source for the batch IDs, dependencies, goals, paths, limits, and acceptance lists below. The runner assembles the following complete prompts. Braced values are filled from the protected plan and current recorded run; they are not left for the model to guess.

**Implementation prompt**

```text
Implement batch {id}. {exact goal below}
Required source pack (read-only): {inputRoot}.
Read the relevant files: {exact approved file list}.
Input digest: {inputsDigest}.
Acceptance checks: {the batch's full acceptance list}.
Configured quality argv: {the batch's exact configured commands}.
Prior review findings to fix (evidence, not new authority): {findings}.
Only edit these paths: {allowedPaths}.
Do not change git metadata, commit, access controller files,
or contact unapproved services. Phase: {phase}.
For design batches: produce mockups/specification artifacts only,
no product implementation.
```

**Independent review prompt**

```text
Independently review {id}, exact head {head}, against base {base}
and these requirements: {exact goal below}.
Read approved sources at {inputRoot}: {exact approved file list}.
Acceptance checks: {the batch's full acceptance list}.
Configured quality argv: {the batch's exact configured commands}.
Do not edit. Return the required head, verdict, and findings JSON.
The trusted executor supplies harness identity and a fresh session ID. Verify requirements and tests; do not accept the
implementer's summary as proof.
```

These two templates apply to every batch. The table below supplies the exact goal and harness pair. The protected plan expands the acceptance lists in full:

- **Every batch:** trace each delivered behavior to the approved source pack; report and resolve missing or conflicting requirements before claiming completion. Run and retain the batch-specific positive, denial, concurrency, timeout, and recovery checks. No required check may be missing or silently skipped.
- **Design batches:** render and inspect every screen and state on narrow and wide layouts, or validate every API/schema example and reference, as applicable. Publish a coverage map naming all required workflows, operations, data fields, security decisions, and open gaps. Gaps block certification.
- **Product batches:** honor the certified OpenAPI and schema contract. Prove current identity, org/workspace isolation, record access, and clean-data constraints for every new request path.
- **Release batch:** pin one exact artifact digest and source head through staging, migration rehearsal, backup restore, health, authorization, production, and rollback proof.

The plan carries no practical spending cap. Each batch's `maxCostCents` is set to the arithmetic ceiling the broker's nano-cent ledger can represent as a safe integer, about $9,000,000 per batch and $4,500,000 per invocation, so no batch is denied for money. Every stage has the four-hour maximum the controller allows, and five attempts. The owner chose this on 2026-09-20; the controller still records every settled cost and keeps every unknown liability, so spend is visible even though it is not bounded. Set `runBudgetCents` in the run configuration to the same ceiling before a live run.

## The actual 22 batches

The plan is a dependency graph, not a chain. Each batch names only the batches whose output it needs, which yields thirteen waves for twenty-two batches:

| Wave | Batches that can run together |
|---|---|
| 1 | desktop-mockups, web-mockups |
| 2 | api-contracts |
| 3 | design-certification-pack |
| 4 | storage-iam |
| 5 | control-records, private-deployment |
| 6 | desktop-enrollment, tools-business-policies, context-graph, required-reporting |
| 7 | local-data-gateway |
| 8 | model-gateway |
| 9 | steering-pause |
| 10 | fork-portability, plugin-capability-stub, agent-adapters-sdks |
| 11 | web-product, desktop-product, cli-administration |
| 12 | system-qualification |
| 13 | staging-release |

A partial or unreviewed result still cannot become another batch's base, because a dependency must be `done` before a dependent starts. The controller today walks the list in order and runs one operation at a time, so the graph is not yet executed concurrently. Making it so is the next controller change: the journal must hold several active operations, implement and review and local quality stages of one wave run concurrently in their own worktrees, and the pull-request, CI, and merge stages serialize through one lane that rebases each later candidate onto the moved base and takes a fresh opposite-harness review before it merges. That lane exists because the plan's own rule forbids merging a candidate whose base moved. Product batches may not edit `.github/`, so an implementer cannot rewrite the CI check that gates its own merge; workflow changes need a separate reviewed control run.

### 1. desktop-mockups

Phase: **design**. Depends on `approved source pack and configured phase-zero execution`. Implementer: **Codex**. Fresh reviewer: **Claude Code**.

Produce complete clickable desktop-app mockups covering enrollment, workspace/repo binding, gateway health, local scan block/redact/replace, offline limits, steering, pause proof, credential requests, policy explanations, and errors. Include light/dark states, accessibility notes, and review evidence. Only phase0 design artifacts.

### 2. web-mockups

Phase: **design**. Depends on `desktop-mockups`. Implementer: **Claude Code**. Fresh reviewer: **Codex**.

Produce complete clickable web-app mockups for organization/workspace setup, identities and RBAC, agent Permissions & limits, policies and business-rule forms, work orders, dispatch, steering, cost reports, records, graph search, and private deployment setup. Include all empty/error/loading and narrow-screen states. Only phase0 design artifacts.

### 3. api-contracts

Phase: **design**. Depends on `web-mockups`. Implementer: **Codex**. Fresh reviewer: **Claude Code**.

Write the full OpenAPI 3.1 API contract and JSON Schemas for every proposed web, desktop, CLI, MCP control, ARP event, run action, policy, context, report, IAM, and plugin-stub operation. Define request/response/error/security/idempotency/cursor/version fields and cross-surface traceability. Validate all references and examples; no placeholder paths.

### 4. design-certification-pack

Phase: **design**. Depends on `api-contracts`. Implementer: **Claude Code**. Fresh reviewer: **Codex**.

Consolidate desktop and web mockups, the full OpenAPI contract, typed database schema design, threat model, source requirements map, test plan, migration plan, deployment topology, and unresolved decisions into the phase-zero certification pack. Independent cross-surface review must find no missing flow. Do not implement product code.

### 5. storage-iam

Phase: **product**. Depends on `design-certification-pack`. Implementer: **Codex**. Fresh reviewer: **Claude Code**.

Build organization/workspace storage (`org`, `auth`, `workspace`, and `oxagen` schemas), canonical human and agent identities, RBAC and per-record grants, SQL RLS with the two scope shapes, protected object registry, signed storage access, organization encryption keys with `encryption_key_versions` and a re-wrap migration path, and audit migrations. Prove cross-organization and forbidden-record denial, and prove that a revoked principal, a decremented epoch, and a workspace move are rejected at the database.

### 6. control-records

Phase: **product**. Depends on `storage-iam`. Implementer: **Claude Code**. Fresh reviewer: **Codex**.

Build durable commands, events, transactional outbox with a per-organization relay, run/turn/action state machines, authority epochs and the run-control epoch fence, the scan-receipt and composition-receipt records that later batches fill, idempotency and reconciliation. Prove crash recovery and late-event handling. Run a synthetic load gate on event and ledger volume against the stated writes-per-turn budget before certification freezes the schema; a hot-row finding discovered in batch 21 would otherwise restart sixteen batches. Batches 8, 11, and 12 then supply the scanner engine, graph traversal, and steering delivery on top of records that already exist, so each can be tested on its own.

### 7. desktop-enrollment

Phase: **product**. Depends on `control-records`. Implementer: **Codex**. Fresh reviewer: **Claude Code**.

Build desktop installation, device identity, enrolled repositories and paths, protected service setup, operator UI, and workspace-bound grants. Verify supported OS isolation and fail closed elsewhere.

### 8. local-data-gateway

Phase: **product**. Depends on `desktop-enrollment`. Implementer: **Claude Code**. Fresh reviewer: **Codex**.

Build full-request local scanning, attachment handling, block/redact/replace, ScanReceipt binding, safe telemetry, and egress controls. Prove no raw-content bypass or unscanned replay.

### 9. model-gateway

Phase: **product**. Depends on `local-data-gateway`. Implementer: **Codex**. Fresh reviewer: **Claude Code**.

Build mandatory provider proxy, isolated credential mediation, exact model-request evidence, token/cost holds, streaming, cancellation, and unknown-charge reconciliation.

### 10. tools-business-policies

Phase: **product**. Depends on `model-gateway`. Implementer: **Claude Code**. Fresh reviewer: **Codex**.

Build reviewed tool bindings, one authenticated dynamic MCP catalog, native/MCP tool guard paths, exact request checks, business policy evaluation, atomic shared limits and trusted connector receipts.

### 11. context-graph

Phase: **product**. Depends on `tools-business-policies`. Implementer: **Codex**. Fresh reviewer: **Claude Code**.

Build source registry, versioned knowledge graph, provenance, protected retrieval/composition receipts, CGP provider exchange, memory views, skills references, and access-filtered search.

### 12. steering-pause

Phase: **product**. Depends on `context-graph`. Implementer: **Claude Code**. Fresh reviewer: **Codex**.

Build dispatch, broadcast steering, supported next-boundary application, interrupt requests, confirmed pause proof, and quarantined late responses. Prove unknown writes prevent false paused state.

### 13. fork-portability

Phase: **product**. Depends on `steering-pause`. Implementer: **Codex**. Fresh reviewer: **Claude Code**.

Build safe checkpoints, capability manifests, allowed cleaned continuation snapshots, declared losses, new grants and fork/move semantics across supported harnesses.

### 14. required-reporting

Phase: **product**. Depends on `fork-portability`. Implementer: **Claude Code**. Fresh reviewer: **Codex**.

Build required trusted reports for branches/diffs, personas, tool counts, PRs, per-job CI commit binding, freshness, and record statuses in the selected org data service.

### 15. agent-adapters-sdks

Phase: **product**. Depends on `required-reporting`. Implementer: **Codex**. Fresh reviewer: **Claude Code**.

Build and certify Codex and Claude Code adapters plus custom-agent SDK contracts; generate supported language clients from the certified API and prove profile compatibility and strict-mode limits.

### 16. web-product

Phase: **product**. Depends on `agent-adapters-sdks`. Implementer: **Claude Code**. Fresh reviewer: **Codex**.

Implement the certified web screens against real gated APIs, accessible controls, agent administration, policy editing, dispatch/steer, report inspection, graph views, and complete failure states.

### 17. desktop-product

Phase: **product**. Depends on `web-product`. Implementer: **Codex**. Fresh reviewer: **Claude Code**.

Implement the certified desktop screens against the protected service, with clear local states, setup walkthrough, scan decisions, request controls, and offline behavior.

### 18. cli-administration

Phase: **product**. Depends on `desktop-product`. Implementer: **Claude Code**. Fresh reviewer: **Codex**.

Build the operator CLI with consistent IAM, dry-run modes, stable machine output, per-workspace targeting, credentials through approved broker, and predictable errors.

### 19. plugin-capability-stub

Phase: **product**. Depends on `cli-administration`. Implementer: **Codex**. Fresh reviewer: **Claude Code**.

Build only the checked plugin capability interface seam, reserved schemas, mock peers, scoped controls, immutable completion rounds, required seats, and named waivers. Do not implement partner plugins or a marketplace.

### 20. private-deployment

Phase: **product**. Depends on `plugin-capability-stub`. Implementer: **Claude Code**. Fresh reviewer: **Codex**.

Build reproducible SaaS and customer-private placement, org keys, rotation, data retention/export, restore, regional controls, network policy, and auditable operational configuration.

### 21. system-qualification

Phase: **product**. Depends on `private-deployment`. Implementer: **Codex**. Fresh reviewer: **Claude Code**.

Run all four hard requirement scenarios and multi-org load, recovery, bypass, budget, auth, accessibility, portability, privacy, and storage consistency checks. Close all findings with fresh independent reviews.

### 22. staging-release

Phase: **release**. Depends on `system-qualification`. Implementer: **Claude Code**. Fresh reviewer: **Codex**.

Produce a pinned deployable artifact and rehearse staging migration, backup restore, smoke/health tests, rollback, and operational response. Production requires configured targets and trusted exact-artifact authorization after staging health.

Product and release batches are limited to the app, service, package, schema, test, infrastructure, documentation, CI, and root build files named in the plan. They cannot rewrite phase zero. A needed contract change stops dependent work for a new reviewed plan and certificate.

## Independent review and repair

Every implementation gets a fresh review by the other harness in a separate read-only container. The reviewer sees the exact head, the current remote base, the full diff, approved inputs, and the configured checks. The first product review also covers the approved local design commits that have not been published.

A passing review must have the exact head and no findings. The executor supplies the real harness/session identity; model text cannot grant approval. The controller rechecks the worktrees and certificate after return.

A known review, local-check, or terminal CI failure may enter bounded repair. The recorded failed batch is the only retry target. A fresh worktree and session preserve the candidate and findings, then require a new independent review. Repairs after a known merge start from the actual merged commit. A changed remote base that is not an ancestor blocks before another paid attempt. Time, attempt, and spend caps still apply. Unknown charges and uncertain writes never enter an automatic retry loop.

## Trusted services, PRs, and release

The default path is the concrete [local adapter](build-system/adapters/local-host.mjs). The [GitHub module](build-system/adapters/local-github.mjs) uses installed `gh` and Git, not a new Git service. It pins the repository's numeric ID, default branch, authentication location, expected head/base and required CI producer identities. Missing, pending, skipped, failed or wrong-producer checks are not passes.

Squash and merge are supported; rebase merge is not. GitHub may create a new commit ID. The adapter fetches that result, proves its parent relationship and tree against the reviewed candidate/base, and waits for required CI on that actual commit. The controller uses that commit for a future release checkout. It never substitutes the old candidate's green CI for the new commit's checks.

Live merges require measured classic branch protection: up-to-date checks pinned to exact CI apps, checks enforced for admins, no force/delete/bypass allowances, and a standard non-admin write account. An optional read-only policy credential lets the adapter inspect those settings without raising the writer's rights. The server rules reject an outdated candidate.

GitHub's merge request itself does not expose an expected-base compare-and-swap. The adapter still verifies parents and tree after the write. Changed or unproved policy and merge results stop all later work; a possibly completed merge is never reported as no effect.

The concrete target is **AWS ECS with Fargate**, with three services: app/API, gateway and workers. Staging and production use separate accounts, roles, keys, databases and object stores. The [AWS templates](build-system/infrastructure/aws/README.md) separate initial registry setup from environment setup, so no fake baseline app is needed. Initial product installation still needs certified code and schema, reviewed settings and a qualified baseline.

The [artifact builder](build-system/adapters/local-artifacts.md) takes the actual CI-checked merged commit, builds three images once, and copies their exact digests to each account. The [release adapter](build-system/adapters/local-release.md) uses real AWS CLI operations. It creates and restores snapshots, checks a source-bound set of added schema changes, runs old/new image compatibility checks, updates ECS services, and checks tasks, load balancer targets and HTTPS readiness. These are implemented code paths, not calls to a service that someone still has to build.

![After design certification, the exact merged commit must pass CI. A protected builder makes API, gateway and worker images once and checks their digests in separate staging and production registries. Each environment restores a database snapshot into a private test copy, applies the supported migration and tests old and new app compatibility. Staging deploys those images and must pass health checks. A human signs approval for the exact source, artifact and production target. Production deploys the same digests. Failed health keeps release stopped; the old app may return only if compatible with the current data. Unknown writes keep their records and locks until reconciled. The live database is not automatically rewound.](diagrams/aws_release.svg)

*The selected AWS release path uses separate accounts, exact images, restored database tests, health checks and signed approval. Unknown results remain blocked. This drawing describes the implemented release controls; cloud qualification and product certification are still required.*

Signed production approval binds that release's commit, images and target. The private approval key stays away from agents and the controller. Production writes recheck that approval. Application rollback keeps the current database and requires compatibility proof. Unsupported schema changes need a separate reviewed plan. Partial or unknown writes retain their records and locks for recovery. See [release setup](build-system/RELEASE-SETUP.md) for exact inputs and remaining cloud qualification.

The cloud bill is separate from model-call limits. Fixed resource bounds and deadlines constrain work; AWS budget alerts do not impose a hard spend cap. No cloud provisioning, product build or live deployment ran here.

The controller preserves the required release contract: bind one immutable artifact and actual checked source commit through staging, health, production approval, deployment and rollback. Failed health stops release. Unknown deployment effects require reconciliation. The existing mTLS client remains optional for organizations with compatible services. The supplied AWS path uses the concrete local modules.

## Checkpoints, cancellation, and unknown effects

Every operation is journaled before dispatch. The append-only journal has sequence numbers and a hash chain; writes are synced. The controller takes its exclusive lock before loading mutable state. Installation hashes include executable adapters and helper code. Signed settings bind the selected launcher and profiles.

The protected local adapter saves its own receipt before returning. If the wrapper loses that reply, reconciliation can adopt the stored result after checking its operation and settings. A saved paid result is charged once. GitHub reconciliation reads the original PR/merge state without repeating an uncertain write. Orphan container cleanup must confirm that the containers are absent. An unknown provider charge keeps its hold.

```sh
./run.sh preflight --config /srv/oxagen-control/config.json
./run.sh run --config /srv/oxagen-control/config.json
./run.sh status --config /srv/oxagen-control/config.json
./run.sh cancel --config /srv/oxagen-control/config.json
./run.sh reconcile --config /srv/oxagen-control/config.json
./run.sh retry --config /srv/oxagen-control/config.json --batch storage-iam
```

A cancellation request is not a confirmed pause. It blocks new steps and signals the process group; container/remote evidence must confirm what stopped. An unproved result stays blocked. Do not clear holds or edit journals to force progress.

The release state machine retains failed-health evidence across an interrupted rollback. The AWS adapter records write intent and exact resource IDs, then uses observed state for recovery. A completed rollback can be adopted after a lost reply, but the run stays stopped for a new reviewed release plan.

## What the tests check

The [validation report](build-system/VALIDATION.md) records the final 125 passing tests and their scope. Both AWS templates pass static validation. The suite includes real local Git worktrees and merge objects, HTTP over a Unix socket with a fake provider, money reservation/settlement, exact profile certificates, bounded repair, saved-result adoption, lock races, and container argv checks. GitHub command fixtures cover pagination, check producers, changed bases, actual merge trees, lost replies and reconciliation.

The quality tests check exact-head snapshots, actual launcher result shapes, failed checks, cleanups and configured commands. The Linux preflight is implemented but was not run on this macOS host. No paid model, live GitHub write, cloud deployment or production restore was tested.

Certification, live host/provider qualification, real migrations, org-isolation tests, budget races and staging/production drills remain release gates. The local runner and AWS release code are concrete within their documented profiles. Fixture and static checks do not prove real AWS behavior, image compatibility or customer readiness.
